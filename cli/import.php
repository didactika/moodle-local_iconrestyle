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
 * Imports icon customisations from a file, reading it one line at a time, so its size does not matter.
 *
 * Usage: php local/iconrestyle/cli/import.php --file=customisations.iconrestyle [--mode=merge|replace] [--dry-run]
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');

[$options, $unrecognised] = cli_get_params(
    ['file' => '', 'mode' => 'merge', 'dry-run' => false, 'help' => false],
    ['h' => 'help']
);

if ($options['help'] || $options['file'] === '') {
    cli_writeln("Imports icon customisations from a file.\n\nOptions:\n  --file=PATH      File to read\n" .
        "  --mode=MODE      merge keeps the other rules of the site, replace removes them (default merge)\n" .
        "  --dry-run        Say what would be done and change nothing\n  -h, --help       This help");
    exit($options['help'] ? 0 : 1);
}
if (!is_readable($options['file'])) {
    cli_error('The file cannot be read.');
}

\core\session\manager::set_user(get_admin());
$lines = (function (string $path): \Generator {
    $handle = fopen($path, 'rb');
    while (($line = fgets($handle)) !== false) {
        yield rtrim($line, "\r\n");
    }
    fclose($handle);
})($options['file']);

try {
    $report = \local_iconrestyle\service_factory::instance()->importer()->run(
        $lines,
        $options['mode'],
        (bool)$options['dry-run'],
        (int)get_admin()->id
    );
} catch (\moodle_exception $exception) {
    cli_error($exception->getMessage());
}
$prefix = $options['dry-run'] ? 'Would be: ' : '';
cli_writeln($prefix . $report->get('created') . ' created, ' . $report->get('updated') . ' updated, ' .
    $report->get('deleted') . ' deleted, ' . $report->get('skipped') . ' left out, ' . $report->get('assets') . ' artwork files.');
foreach ($report->issues() as $issue) {
    cli_writeln('Left out: ' . $issue);
}
