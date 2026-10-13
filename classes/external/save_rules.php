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
 * Web service: create, change and delete several rules in one step.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\external;

use local_iconrestyle\hook\head_callbacks;
use local_iconrestyle\rule\rule_conflict_exception;
use local_iconrestyle\service_factory;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/compat.php');

/**
 * The designer sends everything that changed since its last save in one request. All of it is stored in one transaction, so
 * either every change is kept or none is, and the stylesheet of each affected context gets one new revision however many of
 * its rules changed. The answer carries the address of the stylesheet the site has afterwards, so the designer needs no
 * second request to show what it just saved.
 */
class save_rules extends api {
    /** @var int Most changes one request may carry. */
    public const MAX_CHANGES = 100;

    /**
     * Parameters.
     *
     * @return parameters Description.
     */
    public static function execute_parameters(): parameters {
        return new parameters([
            'rules' => new listof(rule_payload::input(), 'Rules to create or change', VALUE_DEFAULT, []),
            'deleteids' => new listof(new value(PARAM_INT, 'Rule id'), 'Rules to delete', VALUE_DEFAULT, []),
        ]);
    }

    /**
     * Save and delete rules.
     *
     * @param array $rules Rules to create or change.
     * @param array $deleteids Ids of the rules to delete.
     * @return array The stored rules in the order they were sent, the ids that were deleted and the stylesheet address.
     * @throws \moodle_exception When a rule changed since the editor read it, in which case nothing is stored.
     */
    public static function execute(array $rules = [], array $deleteids = []): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['rules' => $rules, 'deleteids' => $deleteids]);
        self::validate_context(\context_system::instance());
        $factory = service_factory::instance();
        $factory->permissions()->require_manage();

        if (count($params['rules']) + count($params['deleteids']) > self::MAX_CHANGES) {
            throw new \invalid_parameter_exception('Too many changes in one request.');
        }
        try {
            $inputs = [];
            foreach ($params['rules'] as $input) {
                $inputs[] = rule_payload::to_rule($input);
            }
            $result = $factory->rule_service()->apply($inputs, $params['deleteids'], (int)$USER->id);
        } catch (rule_conflict_exception $exception) {
            throw new \moodle_exception('ruleconflict', 'local_iconrestyle');
        } catch (\InvalidArgumentException $exception) {
            throw new \invalid_parameter_exception($exception->getMessage());
        }
        $exported = [];
        foreach ($result['saved'] as $stored) {
            $exported[] = rule_payload::export($stored);
        }
        $url = head_callbacks::stylesheet_url(\context_system::instance());
        return [
            'rules' => $exported,
            'deleted' => $result['deleted'],
            'stylesheeturl' => $url === null ? '' : $url->out(false),
        ];
    }

    /**
     * Returned structure.
     *
     * @return structure Description.
     */
    public static function execute_returns(): structure {
        return new structure([
            'rules' => new listof(rule_payload::output(), 'Stored rules, in the order they were sent'),
            'deleted' => new listof(new value(PARAM_INT, 'Rule id'), 'Ids of the rules that were deleted'),
            'stylesheeturl' => new value(PARAM_RAW, 'Address of the stylesheet of the site, empty when no rule applies'),
        ]);
    }
}
