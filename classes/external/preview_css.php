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
 * Web service: the CSS of rules that have not been saved yet.
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
 * The preview uses the same compiler as the real pages, scoped to the preview area, so what is seen is what is saved.
 */
class preview_css extends api {
    /** @var string[] Preview areas the CSS can be scoped to, each with the class irs-preview-{scope}. */
    public const SCOPES = ['current', 'new'];

    /** @var int Most rules a preview request may carry. */
    private const MAX_RULES = 200;

    /**
     * Parameters.
     *
     * @return parameters Description.
     */
    public static function execute_parameters(): parameters {
        return new parameters([
            'rules' => new listof(rule_payload::input()),
            'scope' => new value(PARAM_ALPHA, 'Preview area: current or new', VALUE_DEFAULT, 'new'),
        ]);
    }

    /**
     * Compile unsaved rules.
     *
     * @param array $rules Rules to compile.
     * @param string $scope Preview area the CSS is scoped to: current or new.
     * @return string CSS.
     */
    public static function execute(array $rules, string $scope = 'new'): string {
        $params = self::validate_parameters(self::execute_parameters(), ['rules' => $rules, 'scope' => $scope]);
        if (!in_array($params['scope'], self::SCOPES, true)) {
            throw new \invalid_parameter_exception('Unknown preview area.');
        }
        self::validate_context(\context_system::instance());
        $factory = service_factory::instance();
        $factory->permissions()->require_manage();
        if (count($params['rules']) > self::MAX_RULES) {
            throw new \invalid_parameter_exception('Too many rules in one preview.');
        }
        $compiled = [];
        foreach ($params['rules'] as $rule) {
            $compiled[] = rule_payload::to_rule($rule, false);
        }
        return $factory->compiler()->compile($compiled, '.irs-preview-' . $params['scope'] . ' ', false);
    }

    /**
     * Returned structure.
     *
     * @return value Description.
     */
    public static function execute_returns(): value {
        return new value(PARAM_RAW, 'CSS scoped to the preview area');
    }
}
