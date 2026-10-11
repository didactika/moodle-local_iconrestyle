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
 * The shape of a rule in web service requests and responses.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\external;

use local_iconrestyle\asset\asset_urls;
use local_iconrestyle\rule\rule;
use local_iconrestyle\rule\rule_conflict_exception;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/compat.php');

/**
 * One place that describes and builds the rule structure, so every function agrees on it.
 */
class rule_payload {
    /**
     * Fields a client may send to create or change a rule.
     *
     * @return structure Description of the editable fields.
     */
    public static function input(): structure {
        return new structure([
            'slotkey' => new value(PARAM_RAW, 'Slot key such as core:a/setting'),
            'painter' => new value(PARAM_ALPHA, 'color, mask, image or none', VALUE_DEFAULT, 'color'),
            'assetid' => new value(PARAM_INT, 'Artwork asset, zero for none', VALUE_DEFAULT, 0),
            'fg' => new value(PARAM_RAW, 'Foreground colour or token, empty for none', VALUE_DEFAULT, ''),
            'bg' => new value(PARAM_RAW, 'Background colour or token, empty for none', VALUE_DEFAULT, ''),
            'shape' => new value(PARAM_ALPHA, 'none, square, rounded or circle, empty for none', VALUE_DEFAULT, ''),
            'padding' => new value(PARAM_INT, 'Padding in hundredths of an em, -1 for none', VALUE_DEFAULT, -1),
            'opacity' => new value(PARAM_INT, 'Opacity percentage, -1 for none', VALUE_DEFAULT, -1),
            'enabled' => new value(PARAM_BOOL, 'Whether the rule is applied', VALUE_DEFAULT, true),
            'rev' => new value(PARAM_INT, 'Revision the editor read, zero for a new rule', VALUE_DEFAULT, 0),
        ]);
    }

    /**
     * Fields returned for a rule.
     *
     * @return structure Description of the returned fields.
     */
    public static function output(): structure {
        return new structure([
            'slotkey' => new value(PARAM_RAW, 'Slot key'),
            'painter' => new value(PARAM_ALPHA, 'Painter'),
            'assetid' => new value(PARAM_INT, 'Artwork asset, zero for none'),
            'asseturl' => new value(PARAM_RAW, 'Address of the artwork, empty for none'),
            'assetkind' => new value(PARAM_ALPHA, 'svg, png or webp, empty for none'),
            'fg' => new value(PARAM_RAW, 'Foreground, empty for none'),
            'bg' => new value(PARAM_RAW, 'Background, empty for none'),
            'shape' => new value(PARAM_ALPHA, 'Shape, empty for none'),
            'padding' => new value(PARAM_INT, 'Padding, -1 for none'),
            'opacity' => new value(PARAM_INT, 'Opacity, -1 for none'),
            'enabled' => new value(PARAM_BOOL, 'Whether the rule is applied'),
            'rev' => new value(PARAM_INT, 'Revision for optimistic locking'),
            'contextid' => new value(PARAM_INT, 'Context the rule belongs to'),
            'contextname' => new value(PARAM_RAW, 'Name of that context'),
            'own' => new value(PARAM_BOOL, 'Whether the rule belongs to the context being edited'),
        ]);
    }

    /**
     * Build a rule from client input.
     *
     * @param int $contextid Context the rule belongs to.
     * @param array $input Validated input following input().
     * @return rule Rule.
     * @throws \invalid_parameter_exception When a value is not accepted.
     */
    public static function to_rule(int $contextid, array $input): rule {
        try {
            $factory = service_factory::instance();
            if (!$factory->catalogue()->find($input['slotkey'])) {
                throw new \InvalidArgumentException('Unknown icon.');
            }
            if ($input['assetid'] > 0 && !$factory->asset_store()->find($input['assetid'])) {
                throw new \InvalidArgumentException('Unknown artwork.');
            }
            $existing = $factory->rules()->find($contextid, $input['slotkey'], rule::TARGET_ICON);
            if ($existing && $existing->rev() !== (int)$input['rev']) {
                throw new rule_conflict_exception('The rule changed since it was read.');
            }
            return new rule($existing ? $existing->id() : 0, $contextid, slot_key::parse($input['slotkey']), [
                'painter' => $input['painter'],
                'assetid' => $input['assetid'] > 0 ? $input['assetid'] : null,
                'fg' => $input['fg'],
                'bg' => $input['bg'],
                'shape' => $input['shape'] === '' ? null : $input['shape'],
                'padding' => $input['padding'] >= 0 ? $input['padding'] : null,
                'opacity' => $input['opacity'] >= 0 ? $input['opacity'] : null,
                'enabled' => $input['enabled'],
                'rev' => $input['rev'],
            ]);
        } catch (\InvalidArgumentException $exception) {
            throw new \invalid_parameter_exception($exception->getMessage());
        }
    }

    /**
     * Describe a stored rule for a client.
     *
     * @param rule $rule Rule.
     * @param bool $own Whether it belongs to the context being edited.
     * @return array Fields following output().
     */
    public static function export(rule $rule, bool $own): array {
        $store = service_factory::instance()->asset_store();
        $asset = $rule->assetid() === null ? null : $store->find($rule->assetid());
        $context = \context::instance_by_id($rule->contextid(), IGNORE_MISSING);
        return [
            'slotkey' => (string)$rule->slot(),
            'painter' => $rule->painter(),
            'assetid' => $asset ? $asset->id() : 0,
            'asseturl' => $asset ? asset_urls::public_url($asset) : '',
            'assetkind' => $asset ? $asset->kind() : '',
            'fg' => $rule->fg() ? $rule->fg()->stored() : '',
            'bg' => $rule->bg() ? $rule->bg()->stored() : '',
            'shape' => (string)$rule->shape(),
            'padding' => $rule->padding() ?? -1,
            'opacity' => $rule->opacity() ?? -1,
            'enabled' => $rule->enabled(),
            'rev' => $rule->rev(),
            'contextid' => $rule->contextid(),
            'contextname' => $context ? $context->get_context_name(false) : '',
            'own' => $own,
        ];
    }
}
