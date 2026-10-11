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
 * Returns the winning rule for each icon, saying which context it comes from.
 */
class get_rules extends api {
    /**
     * Parameters.
     *
     * @return parameters Description.
     */
    public static function execute_parameters(): parameters {
        return new parameters(['contextid' => new value(PARAM_INT, 'Context being edited')]);
    }

    /**
     * List the rules that apply in a context.
     *
     * @param int $contextid Context being edited.
     * @return array Rules.
     */
    public static function execute(int $contextid): array {
        $params = self::validate_parameters(self::execute_parameters(), ['contextid' => $contextid]);
        $context = \context::instance_by_id($params['contextid']);
        self::validate_context($context);
        $factory = service_factory::instance();
        $factory->permissions()->require_manage($context);

        $rules = [];
        foreach ($factory->effective_rules()->for_context($context) as $entry) {
            $rules[] = rule_payload::export($entry['rule'], $entry['own']);
        }
        return ['contextname' => $context->get_context_name(false), 'rules' => $rules];
    }

    /**
     * Returned structure.
     *
     * @return structure Description.
     */
    public static function execute_returns(): structure {
        return new structure([
            'contextname' => new value(PARAM_RAW, 'Name of the context being edited'),
            'rules' => new listof(rule_payload::output()),
        ]);
    }
}
