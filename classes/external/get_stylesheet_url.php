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

use core_external\external_api as api;
use core_external\external_function_parameters as parameters;
use core_external\external_value as value;
use local_iconrestyle\hook\head_callbacks;
use local_iconrestyle\service_factory;

defined('MOODLE_INTERNAL') || die();

/**
 * The designer asks for it after saving, so every icon on its own page shows what was just saved without a reload.
 */
class get_stylesheet_url extends api {
    /**
     * Parameters.
     *
     * @return parameters Description.
     */
    public static function execute_parameters(): parameters {
        return new parameters([]);
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
     * @return value Description.
     */
    public static function execute_returns(): value {
        return new value(PARAM_RAW, 'Address of the stylesheet, empty when no rule applies');
    }
}
