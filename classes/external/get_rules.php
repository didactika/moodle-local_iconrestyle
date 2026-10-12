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

use local_iconrestyle\service_factory;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/compat.php');

/**
 * Returns every rule of the site, each saying where it applies.
 */
class get_rules extends api {
    /**
     * Parameters.
     *
     * @return parameters Description.
     */
    public static function execute_parameters(): parameters {
        return new parameters([]);
    }

    /**
     * List every rule of the site, wherever it applies.
     *
     * @return array Rules.
     */
    public static function execute(): array {
        self::validate_parameters(self::execute_parameters(), []);
        self::validate_context(\context_system::instance());
        $factory = service_factory::instance();
        $factory->permissions()->require_manage();

        return ['rules' => array_map([rule_payload::class, 'export'], $factory->rules()->find_all())];
    }

    /**
     * Returned structure.
     *
     * @return structure Description.
     */
    public static function execute_returns(): structure {
        return new structure(['rules' => new listof(rule_payload::output())]);
    }
}
