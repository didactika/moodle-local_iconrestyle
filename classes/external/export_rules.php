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
 * Web service: export the customisations of the site.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use local_iconrestyle\service_factory;

// The classes below use those of core_external, which Moodle 4.0 and 4.1 only have under their old names.
// phpcs:ignore moodle.Files.MoodleInternal.MoodleInternalGlobalState
\local_iconrestyle\compat\external_aliases::register();

/**
 * Gives the package as text, for the designer to save as a file. A site with very many rules uses the command line instead,
 * because a web request is not the place to build a file of that size.
 */
class export_rules extends external_api {
    /**
     * Parameters.
     *
     * @return external_function_parameters Description.
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'slots' => new external_multiple_structure(
                new external_value(PARAM_RAW, 'Slot key of an icon'),
                'Icons to export, none for all',
                VALUE_DEFAULT,
                []
            ),
        ]);
    }

    /**
     * Export the rules of some icons, or of all.
     *
     * @param string[] $slots Slot keys of the icons to export, none for all.
     * @return array The package, how many rules it holds and the ones that were left out.
     */
    public static function execute(array $slots = []): array {
        $params = self::validate_parameters(self::execute_parameters(), ['slots' => $slots]);
        $context = \context_system::instance();
        self::validate_context($context);
        $factory = service_factory::instance();
        require_capability('local/iconrestyle:exchange', $context);
        $exporter = $factory->exporter();
        $lines = [];
        foreach ($exporter->lines(self::valid_slots($params['slots'])) as $line) {
            $lines[] = $line;
        }
        return [
            'filename' => 'icon-customisations-' . date('Ymd-His') . '.iconrestyle',
            'content' => implode("\n", $lines) . "\n",
            'skipped' => $exporter->skipped(),
        ];
    }

    /**
     * The slot keys that were asked for, checked.
     *
     * @param string[] $slots Slot keys.
     * @return string[]|null Slot keys, or null when none were asked for and every icon is wanted.
     * @throws \invalid_parameter_exception When one is not a slot key.
     */
    public static function valid_slots(array $slots): ?array {
        foreach ($slots as $slot) {
            if (!\local_iconrestyle\slot\slot_key::is_valid((string)$slot)) {
                throw new \invalid_parameter_exception('Not an icon: ' . s((string)$slot));
            }
        }
        return $slots === [] ? null : array_values(array_unique($slots));
    }

    /**
     * Returned structure.
     *
     * @return external_single_structure Description.
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'filename' => new external_value(PARAM_FILE, 'Name to save the package under'),
            'content' => new external_value(PARAM_RAW, 'The package, one JSON object on each line'),
            'skipped' => new external_multiple_structure(
                new external_value(PARAM_RAW, 'Reason'),
                'Rules that were left out and why'
            ),
        ]);
    }
}
