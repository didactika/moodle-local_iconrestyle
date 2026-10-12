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
 * Writes the icon customisations of the site to a file, without limit on how many there are.
 *
 * Usage: php local/iconrestyle/cli/export.php --file=customisations.iconrestyle
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');

[$options, $unrecognised] = cli_get_params(['file' => '', 'slots' => '', 'help' => false], ['h' => 'help']);

if ($options['help'] || $options['file'] === '') {
    cli_writeln("Writes the icon customisations of the site to a file.\n\nOptions:\n  --file=PATH    File to write\n" .
        "  --slots=LIST   Slot keys of the icons to export, separated by commas; all of them when it is not given\n" .
        "  -h, --help     This help");
    exit($options['help'] ? 0 : 1);
}

$exporter = \local_iconrestyle\service_factory::instance()->exporter();
$handle = fopen($options['file'], 'wb');
if (!$handle) {
    cli_error('The file cannot be written.');
}
$count = 0;
$only = trim((string)$options['slots']) === '' ? null : array_map('trim', explode(',', (string)$options['slots']));
foreach ($exporter->lines($only) as $line) {
    fwrite($handle, $line . "\n");
    $count++;
}
fclose($handle);
cli_writeln($count . ' lines written to ' . $options['file'] . '.');
foreach ($exporter->skipped() as $reason) {
    cli_writeln('Left out: ' . $reason);
}
