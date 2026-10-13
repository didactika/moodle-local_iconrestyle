<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Compile storm: many web processes ask for the same stylesheets at the same moment after the caches were purged.
 *
 * It uses the real database, cache and lock of the site it runs on, with real operating system processes, which PHPUnit cannot
 * do. It creates a few rules for the test and removes them when it finishes. The stylesheets must be compiled once each, however
 * many processes ask.
 *
 * Usage: php local/iconrestyle/tests/performance/storm.php [--processes=20] [--contexts=3]
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../../config.php');
require_once($CFG->libdir . '/clilib.php');

// A site that is still being installed gets a lock that locks nothing, which would hide what this tool is meant to show.
if (during_initial_install()) {
    $CFG->rolesactive = 1;
}
if (!isset($CFG->lock_factory) || $CFG->lock_factory === 'auto') {
    $CFG->lock_factory = '\core\lock\file_lock_factory';
}
require_once(__DIR__ . '/../fixtures/counting_compiler_factory.php');

use local_iconrestyle\delivery\bundle_service;
use local_iconrestyle\performance\counting_compiler_factory;
use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

[$options, $unrecognised] = cli_get_params(
    ['processes' => 20, 'contexts' => 3, 'worker' => '', 'chain' => '', 'barrier' => '', 'help' => false],
    ['h' => 'help']
);

if ($options['worker'] !== '') {
    $chain = bundle_service::decode_chain($options['chain']);
    $counting = new counting_compiler_factory();
    $lock = null;
    if (getenv('STORM_DEBUG')) {
        $lock = new class extends \local_iconrestyle\delivery\compile_lock {
            /**
             * Run a callback under the lock and say how it went.
             *
             * @param string $key Lock name.
             * @param callable $callback Work to run.
             * @return mixed Result.
             */
            public function run(string $key, callable $callback) {
                $start = microtime(true);
                $factory = \core\lock\lock_config::get_lock_factory('local_iconrestyle');
                $lock = $factory->get_lock($key, 10);
                $waited = microtime(true) - $start;
                fwrite(STDERR, sprintf("%d %s lock=%s waited=%.3f\n", getmypid(), $key, $lock ? 'yes' : 'NO', $waited));
                try {
                    return $callback();
                } finally {
                    if ($lock) {
                        $lock->release();
                    }
                }
            }
        };
    }
    $bundles = new bundle_service(service_factory::instance()->revisions(), $counting->sheets(service_factory::instance(), $lock));
    while (!file_exists($options['barrier'])) {
        usleep(1000);
    }
    $start = hrtime(true);
    $result = $bundles->assemble($chain);
    echo json_encode([
        'compiles' => $counting->compiles(),
        'contexts' => $counting->compiled_contexts(),
        'bytes' => strlen($result['css']),
        'ms' => round((hrtime(true) - $start) / 1e6, 1),
    ]) . "\n";
    exit(0);
}

$factory = service_factory::instance();
$service = $factory->rule_service();
$created = [];
$chain = [];
$system = \context_system::instance()->id;
$ownsystem = $factory->revisions()->get_many([$system])[$system] === 0;
$courses = [];
require_once($CFG->dirroot . '/course/lib.php');
\core\session\manager::set_user(get_admin());
try {
    if ($ownsystem) {
        $created[] = $service->save(new rule(0, $system, slot_key::parse('core:a/setting'), ['fg' => '#112233']), 2);
    }
    $contexts = [$system];
    for ($i = 0; $i < (int)$options['contexts']; $i++) {
        $course = create_course((object)[
            'fullname' => 'Storm ' . $i, 'shortname' => 'storm' . time() . $i, 'category' => 1, 'format' => 'topics',
        ]);
        $courses[] = $course;
        $contexts[] = \context_course::instance($course->id)->id;
        $created[] = $service->save(new rule(
            0,
            end($contexts),
            slot_key::parse('core:a/setting'),
            ['fg' => '#223344', 'design' => ['shape' => 'rounded', 'pt' => 20]]
        ), 2);
    }
    $chain = array_filter($factory->revisions()->get_many($contexts));
    $encoded = bundle_service::encode_chain($chain);
    \cache::make('local_iconrestyle', 'compiled')->purge();

    $barrier = sys_get_temp_dir() . '/iconrestyle_storm_' . getmypid();
    @unlink($barrier);
    $processes = [];
    for ($i = 0; $i < (int)$options['processes']; $i++) {
        $command = [PHP_BINARY, __FILE__, '--worker=' . $i, '--chain=' . $encoded, '--barrier=' . $barrier];
        $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        $processes[] = [$process, $pipes];
    }
    sleep(6);
    touch($barrier);
    $compiles = 0;
    $slowest = 0.0;
    $answers = 0;
    foreach ($processes as [$process, $pipes]) {
        $output = stream_get_contents($pipes[1]);
        $errors = stream_get_contents($pipes[2]);
        proc_close($process);
        if (getenv('STORM_DEBUG') && trim($errors) !== '') {
            echo trim($errors) . "\n";
        }
        $lines = array_values(array_filter(array_map('trim', explode("\n", $output))));
        $answer = json_decode((string)end($lines), true);
        if (!is_array($answer)) {
            echo "A process failed: " . trim($errors . $output) . "\n";
            continue;
        }
        $answers++;
        $compiles += $answer['compiles'];
        if (getenv('STORM_DEBUG') && $answer['compiles'] > 0) {
            echo 'compiled ' . implode(',', $answer['contexts']) . "\n";
        }
        $slowest = max($slowest, $answer['ms']);
    }
    @unlink($barrier);
    echo count($chain) . " stylesheets, {$options['processes']} processes at the same moment: $answers answered, " .
        "$compiles compilations, slowest process $slowest ms\n";
    echo $compiles === count($chain) && $answers === (int)$options['processes'] ? "OK\n" : "FAILED\n";
} finally {
    foreach ($created as $rule) {
        $service->delete($rule->contextid(), $rule->slot());
    }
    foreach ($courses as $course) {
        delete_course($course, false);
    }
}
