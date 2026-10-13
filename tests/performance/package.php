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
 * Writes a very large package of customisations, to time importing it.
 *
 * It creates the courses the rules are for (named BENCH0, BENCH1 and so on) and writes the package one line at a time, so the
 * size it can write does not depend on memory. Import it with cli/import.php under a memory limit to prove the import does not
 * depend on the size of the package either.
 *
 * Usage: php local/iconrestyle/tests/performance/package.php --file=big.iconrestyle [--rules=50000] [--courses=200]
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../../config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/course/lib.php');

use local_iconrestyle\rule\audience;

[$options, $unrecognised] = cli_get_params(['file' => '', 'rules' => 50000, 'courses' => 200, 'help' => false], ['h' => 'help']);
if ($options['help'] || $options['file'] === '') {
    cli_writeln('Usage: php local/iconrestyle/tests/performance/package.php --file=PATH [--rules=50000] [--courses=200]');
    exit($options['help'] ? 0 : 1);
}

\core\session\manager::set_user(get_admin());
$slots = [];
foreach (\local_iconrestyle\service_factory::instance()->catalogue()->all() as $entry) {
    if ($entry['kind'] === 'font') {
        $slots[] = $entry['key'];
    }
}
sort($slots);

$courses = (int)$options['courses'];
for ($i = 0; $i < $courses; $i++) {
    if (!$DB->record_exists('course', ['shortname' => 'BENCH' . $i])) {
        create_course((object)['fullname' => 'Bench ' . $i, 'shortname' => 'BENCH' . $i, 'category' => 1, 'format' => 'topics']);
    }
}

$handle = fopen($options['file'], 'wb');
fwrite($handle, json_encode(['type' => 'header', 'format' => 'local_iconrestyle', 'version' => 1, 'exported' => time()]) . "\n");
$total = (int)$options['rules'];
$modes = ['all', 'light', 'dark'];
$written = 0;
for ($i = 0; $written < $total; $i++) {
    // Rules are spread over the courses, and over the icons and the ways of limiting a rule, so that none repeats.
    $course = $i % $courses;
    $slot = $slots[intdiv($i, $courses) % count($slots)];
    $variant = intdiv($i, $courses * count($slots));
    $line = [
        'type' => 'rule',
        'place' => 'course:shortname=BENCH' . $course,
        'slot' => $slot,
        'painter' => 'color',
        'asset' => null,
        'fg' => sprintf('#%06x', ($i * 2654435761) & 0xffffff),
        'bg' => null,
        'design' => ['shape' => 'rounded', 'pt' => 20, 'pr' => 20, 'pb' => 20, 'pl' => 20],
        'pages' => $variant === 0 ? [] : [audience::PAGES[$variant % count(audience::PAGES)]],
        'regions' => [],
        'mode' => $modes[$variant % 3],
        'enabled' => true,
    ];
    fwrite($handle, json_encode($line) . "\n");
    $written++;
}
fclose($handle);
$megabytes = round(filesize($options['file']) / 1048576, 1);
cli_writeln($written . ' rules for ' . $courses . ' courses written to ' . $options['file'] . ' (' . $megabytes . ' MB).');
