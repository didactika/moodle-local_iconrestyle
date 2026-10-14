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
 * Web service: the rules that apply in a context.
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
use local_iconrestyle\service_factory;

// The classes below use those of core_external, which Moodle 4.0 and 4.1 only have under their old names.
// phpcs:ignore moodle.Files.MoodleInternal.MoodleInternalGlobalState
\local_iconrestyle\compat\external_aliases::register();

/**
 * Returns every rule of the site, each saying where it applies.
 */
class get_rules extends external_api {
    /**
     * Parameters.
     *
     * @return external_function_parameters Description.
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([]);
    }

    /**
     * List every rule of the site, wherever it applies.
     *
     * @return array Rules.
     */
    public static function execute(): array {
        self::validate_parameters(self::execute_parameters(), []);
        $context = \context_system::instance();
        self::validate_context($context);
        $factory = service_factory::instance();
        require_capability('local/iconrestyle:manage', $context);

        return ['rules' => array_map([rule_payload::class, 'export'], $factory->rules()->find_all())];
    }

    /**
     * Returned structure.
     *
     * @return external_single_structure Description.
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure(['rules' => new external_multiple_structure(rule_payload::output())]);
    }
}
