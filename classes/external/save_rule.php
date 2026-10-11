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
 * Web service: create or change a rule.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\external;

use local_iconrestyle\rule\rule_conflict_exception;
use local_iconrestyle\service_factory;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/compat.php');

/**
 * Validates every value, checks the capability of the context and stores the rule in one transaction.
 */
class save_rule extends api {
    /**
     * Parameters.
     *
     * @return parameters Description.
     */
    public static function execute_parameters(): parameters {
        return new parameters([
            'contextid' => new value(PARAM_INT, 'Context the rule belongs to'),
            'rule' => rule_payload::input(),
        ]);
    }

    /**
     * Save a rule.
     *
     * @param int $contextid Context the rule belongs to.
     * @param array $rule Rule fields.
     * @return array The stored rule.
     * @throws \moodle_exception When the rule changed since the editor read it.
     */
    public static function execute(int $contextid, array $rule): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['contextid' => $contextid, 'rule' => $rule]);
        $context = \context::instance_by_id($params['contextid']);
        self::validate_context($context);
        $factory = service_factory::instance();
        $factory->permissions()->require_manage($context);

        try {
            $stored = $factory->rule_service()->save(rule_payload::to_rule($context->id, $params['rule']), (int)$USER->id);
        } catch (rule_conflict_exception $exception) {
            throw new \moodle_exception('ruleconflict', 'local_iconrestyle');
        } catch (\InvalidArgumentException $exception) {
            throw new \invalid_parameter_exception($exception->getMessage());
        }
        return rule_payload::export($stored, true);
    }

    /**
     * Returned structure.
     *
     * @return structure Description.
     */
    public static function execute_returns(): structure {
        return rule_payload::output();
    }
}
