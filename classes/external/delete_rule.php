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

use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/compat.php');

/**
 * Deleting a rule at one scope lets the rule of a parent scope, or Moodle's own icon, show through again.
 */
class delete_rule extends api {
    /**
     * Parameters.
     *
     * @return parameters Description.
     */
    public static function execute_parameters(): parameters {
        return new parameters([
            'contextid' => new value(PARAM_INT, 'Context the rule belongs to'),
            'slotkey' => new value(PARAM_RAW, 'Slot key'),
        ]);
    }

    /**
     * Delete a rule.
     *
     * @param int $contextid Context the rule belongs to.
     * @param string $slotkey Slot key.
     * @return bool True when a rule was deleted.
     */
    public static function execute(int $contextid, string $slotkey): bool {
        $params = self::validate_parameters(self::execute_parameters(), ['contextid' => $contextid, 'slotkey' => $slotkey]);
        $context = \context::instance_by_id($params['contextid']);
        self::validate_context($context);
        $factory = service_factory::instance();
        $factory->permissions()->require_manage($context);
        try {
            $slot = slot_key::parse($params['slotkey']);
        } catch (\InvalidArgumentException $exception) {
            throw new \invalid_parameter_exception($exception->getMessage());
        }
        return $factory->rule_service()->delete($context->id, $slot, rule::TARGET_ICON);
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
