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
 * The address of the stylesheet that the pages of the site load.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_value;
use local_iconrestyle\hook\head_callbacks;
use local_iconrestyle\service_factory;

// The classes below use those of core_external, which Moodle 4.0 and 4.1 only have under their old names.
// phpcs:ignore moodle.Files.MoodleInternal.MoodleInternalGlobalState
\local_iconrestyle\compat\external_aliases::register();

/**
 * The designer asks for it after saving, so every icon on its own page shows what was just saved without a reload.
 */
class get_stylesheet_url extends external_api {
    /**
     * Parameters.
     *
     * @return external_function_parameters Description.
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([]);
    }

    /**
     * Address of the stylesheet of the site.
     *
     * @return string Address, empty when no rule applies.
     */
    public static function execute(): string {
        self::validate_parameters(self::execute_parameters(), []);
        self::validate_context(\context_system::instance());
        service_factory::instance()->permissions()->require_manage();
        $url = head_callbacks::stylesheet_url(\context_system::instance());
        return $url === null ? '' : $url->out(false);
    }

    /**
     * Returned structure.
     *
     * @return external_value Description.
     */
    public static function execute_returns(): external_value {
        return new external_value(PARAM_RAW, 'Address of the stylesheet, empty when no rule applies');
    }
}
