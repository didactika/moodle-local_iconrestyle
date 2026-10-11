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
 * Data generator for local_iconrestyle.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

/**
 * Creates icon rules for tests.
 */
class local_iconrestyle_generator extends component_generator_base {
    /**
     * Create a rule, by default for the whole site.
     *
     * @param array $record Slot key plus optional contextid, painter, fg, bg, shape, padding, opacity, target, enabled
     *     and svg, the name of a file in tests/fixtures that becomes the rule's artwork and defaults the painter to mask.
     * @return rule Stored rule.
     */
    public function create_rule(array $record): rule {
        $contextid = (int)($record['contextid'] ?? context_system::instance()->id);
        $options = array_intersect_key($record, array_flip(['painter', 'fg', 'bg', 'shape', 'padding', 'opacity', 'target']));
        $options = array_filter($options, function ($value): bool {
            return $value !== '';
        });
        if (isset($record['enabled'])) {
            $options['enabled'] = (bool)$record['enabled'];
        }
        if (!empty($record['svg'])) {
            $file = __DIR__ . '/../fixtures/' . clean_param($record['svg'], PARAM_ALPHANUMEXT) . '.svg';
            $options['assetid'] = service_factory::instance()->assets()->add(file_get_contents($file), (int)get_admin()->id)->id();
            $options['painter'] = $options['painter'] ?? rule::PAINTER_MASK;
        }
        return service_factory::instance()->rule_service()->save(
            new rule(0, $contextid, slot_key::parse($record['slot']), $options),
            (int)get_admin()->id
        );
    }
}
