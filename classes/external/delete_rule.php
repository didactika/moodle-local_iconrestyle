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
 * Web service: remove a rule so the icon inherits again.
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
 * Deleting a rule lets the rules that are less specific, or Moodle's own icon, show through again.
 */
class delete_rule extends api {
    /**
     * Parameters.
     *
     * @return parameters Description.
     */
    public static function execute_parameters(): parameters {
        return new parameters(['id' => new value(PARAM_INT, 'Rule id')]);
    }

    /**
     * Delete a rule.
     *
     * @param int $id Rule id.
     * @return bool True when a rule was deleted.
     */
    public static function execute(int $id): bool {
        $params = self::validate_parameters(self::execute_parameters(), ['id' => $id]);
        self::validate_context(\context_system::instance());
        $factory = service_factory::instance();
        $factory->permissions()->require_manage();
        return $factory->rule_service()->delete_by_id($params['id']);
    }

    /**
     * Returned structure.
     *
     * @return value Description.
     */
    public static function execute_returns(): value {
        return new value(PARAM_BOOL, 'Whether a rule was deleted');
    }
}
