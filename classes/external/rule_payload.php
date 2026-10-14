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

use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use local_iconrestyle\asset\asset_urls;
use local_iconrestyle\rule\design;
use local_iconrestyle\rule\rule;
use local_iconrestyle\rule\rule_conflict_exception;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

// The classes below use those of core_external, which Moodle 4.0 and 4.1 only have under their old names.
// phpcs:ignore moodle.Files.MoodleInternal.MoodleInternalGlobalState
\local_iconrestyle\compat\external_aliases::register();

/**
 * One place that describes and builds the rule structure, so every function agrees on it.
 */
class rule_payload {
    /**
     * Fields a client may send to create or change a rule.
     *
     * @return external_single_structure Description of the editable fields.
     */
    public static function input(): external_single_structure {
        return new external_single_structure([
            'slotkey' => new external_value(PARAM_RAW, 'Slot key such as core:a/setting'),
            'contextid' => new external_value(PARAM_INT, 'Where the rule applies: the site, a category, a course or an activity'),
            'pages' => new external_multiple_structure(
                new external_value(PARAM_ALPHA, 'Kind of page'),
                'Pages the rule is limited to',
                VALUE_DEFAULT,
                []
            ),
            'regions' => new external_multiple_structure(
                new external_value(PARAM_ALPHA, 'Region'),
                'Regions the rule is limited to',
                VALUE_DEFAULT,
                []
            ),
            'mode' => new external_value(PARAM_ALPHA, 'Colour mode: all, light or dark', VALUE_DEFAULT, 'all'),
            'painter' => new external_value(PARAM_ALPHA, 'color, mask, image or none', VALUE_DEFAULT, 'color'),
            'assetid' => new external_value(PARAM_INT, 'Artwork asset, zero for none', VALUE_DEFAULT, 0),
            'fg' => new external_value(PARAM_RAW, 'Foreground colour or token, empty for none', VALUE_DEFAULT, ''),
            'bg' => new external_value(PARAM_RAW, 'Background colour or token, empty for none', VALUE_DEFAULT, ''),
            'design' => new external_value(PARAM_RAW, 'Design properties as a JSON object, empty for none', VALUE_DEFAULT, ''),
            'enabled' => new external_value(PARAM_BOOL, 'Whether the rule is applied', VALUE_DEFAULT, true),
            'rev' => new external_value(PARAM_INT, 'Revision the editor read, zero for a new rule', VALUE_DEFAULT, 0),
        ]);
    }

    /**
     * Fields returned for a rule.
     *
     * @return external_single_structure Description of the returned fields.
     */
    public static function output(): external_single_structure {
        return new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Rule id'),
            'slotkey' => new external_value(PARAM_RAW, 'Slot key'),
            'contextid' => new external_value(PARAM_INT, 'Context where the rule applies'),
            'contextname' => new external_value(PARAM_RAW, 'Name of that context'),
            'contextkind' => new external_value(PARAM_ALPHA, 'site, category, course or activity'),
            'pages' => new external_multiple_structure(
                new external_value(PARAM_ALPHA, 'Kind of page'),
                'Pages the rule is limited to'
            ),
            'regions' => new external_multiple_structure(
                new external_value(PARAM_ALPHA, 'Region'),
                'Regions the rule is limited to'
            ),
            'mode' => new external_value(PARAM_ALPHA, 'Colour mode: all, light or dark'),
            'painter' => new external_value(PARAM_ALPHA, 'Painter'),
            'assetid' => new external_value(PARAM_INT, 'Artwork asset, zero for none'),
            'asseturl' => new external_value(PARAM_RAW, 'Address of the artwork, empty for none'),
            'assetkind' => new external_value(PARAM_ALPHA, 'svg, png or webp, empty for none'),
            'fg' => new external_value(PARAM_RAW, 'Foreground, empty for none'),
            'bg' => new external_value(PARAM_RAW, 'Background, empty for none'),
            'design' => new external_value(PARAM_RAW, 'Design properties as a JSON object, empty for none'),
            'enabled' => new external_value(PARAM_BOOL, 'Whether the rule is applied'),
            'rev' => new external_value(PARAM_INT, 'Revision for optimistic locking'),
        ]);
    }

    /**
     * Build a rule from client input.
     *
     * @param array $input Validated input following input().
     * @param bool $lock Whether a stored rule with another revision is a conflict, which an unsaved preview ignores.
     * @return rule Rule.
     * @throws \invalid_parameter_exception When a value is not accepted.
     */
    public static function to_rule(array $input, bool $lock = true): rule {
        try {
            $factory = service_factory::instance();
            $context = \context::instance_by_id($input['contextid'], IGNORE_MISSING);
            if (!$context || !$factory->permissions()->supports($context)) {
                throw new \InvalidArgumentException('Rules cannot apply in this context.');
            }
            $entry = $factory->catalogue()->find($input['slotkey']);
            if (!$entry) {
                throw new \InvalidArgumentException('Unknown icon.');
            }
            if ($entry['kind'] === 'container') {
                $own = in_array($input['painter'], [rule::PAINTER_MASK, rule::PAINTER_IMAGE], true);
                $input['painter'] = $input['assetid'] > 0 ? ($own ? $input['painter'] : rule::PAINTER_MASK) : rule::PAINTER_NONE;
            }
            if ($input['assetid'] > 0 && !$factory->asset_store()->find($input['assetid'])) {
                throw new \InvalidArgumentException('Unknown artwork.');
            }
            $options = [
                'painter' => $input['painter'],
                'assetid' => $input['assetid'] > 0 ? $input['assetid'] : null,
                'fg' => $input['fg'],
                'bg' => $input['bg'],
                'design' => design::from_json($input['design']),
                'enabled' => $input['enabled'],
                'rev' => $input['rev'],
                'pages' => $input['pages'],
                'regions' => $input['regions'],
                'mode' => $input['mode'],
            ];
            $slot = slot_key::parse($input['slotkey']);
            $audience = ['pages' => $input['pages'], 'regions' => $input['regions'], 'mode' => $input['mode']];
            $variant = (new rule(0, $context->id, $slot, $audience))->variant();
            $existing = $factory->rules()->find($context->id, $input['slotkey'], rule::TARGET_ICON, $variant);
            if ($lock && $existing && $existing->rev() !== (int)$input['rev']) {
                throw new rule_conflict_exception('The rule changed since it was read.');
            }
            return new rule($existing ? $existing->id() : 0, $context->id, $slot, $options);
        } catch (\InvalidArgumentException $exception) {
            throw new \invalid_parameter_exception($exception->getMessage());
        }
    }

    /**
     * Describe a stored rule for a client.
     *
     * @param rule $rule Rule.
     * @return array Fields following output().
     */
    public static function export(rule $rule): array {
        $store = service_factory::instance()->asset_store();
        $asset = $rule->assetid() === null ? null : $store->find($rule->assetid());
        $context = \context::instance_by_id($rule->contextid(), IGNORE_MISSING);
        return [
            'id' => $rule->id(),
            'slotkey' => (string)$rule->slot(),
            'contextid' => $rule->contextid(),
            'contextname' => $context ? $context->get_context_name(false) : '',
            'contextkind' => self::kind_of($context),
            'pages' => $rule->pages(),
            'regions' => $rule->regions(),
            'mode' => $rule->mode(),
            'painter' => $rule->painter(),
            'assetid' => $asset ? $asset->id() : 0,
            'asseturl' => $asset ? asset_urls::public_url($asset) : '',
            'assetkind' => $asset ? $asset->kind() : '',
            'fg' => $rule->fg() ? $rule->fg()->stored() : '',
            'bg' => $rule->bg() ? $rule->bg()->stored() : '',
            'design' => $rule->design()->json() ?? '',
            'enabled' => $rule->enabled(),
            'rev' => $rule->rev(),
        ];
    }

    /**
     * Name the kind of place a context is.
     *
     * @param \context|false $context Context.
     * @return string site, category, course or activity, empty when the context is gone.
     */
    public static function kind_of($context): string {
        if (!$context) {
            return '';
        }
        $kinds = [
            CONTEXT_SYSTEM => 'site',
            CONTEXT_COURSECAT => 'category',
            CONTEXT_COURSE => 'course',
            CONTEXT_MODULE => 'activity',
        ];
        return $kinds[$context->contextlevel] ?? '';
    }
}
