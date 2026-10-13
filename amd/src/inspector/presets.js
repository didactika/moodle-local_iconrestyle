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
 * The quick looks, the groups of properties that can be linked and what it takes to clear a design.
 *
 * @module     local_iconrestyle/inspector/presets
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {DESIGN_PROPS} from 'local_iconrestyle/lib/draft';

/** The four sides of the properties that have one value per side. */
export const SIDE_GROUPS = {padding: ['pt', 'pr', 'pb', 'pl'], margin: ['mt', 'mr', 'mb', 'ml']};

/** Patch that leaves the artwork of a draft empty. */
export const NO_ARTWORK = {assetid: 0, asseturl: '', assetkind: '', assetmono: false, autoartwork: false};

/** Patch that clears every design property. */
export const CLEAR_DESIGN = Object.fromEntries(DESIGN_PROPS.map((name) => [name, null]));

const around = (value) => ({pt: value, pr: value, pb: value, pl: value});

/**
 * The quick looks, by name.
 *
 * A look gives the shape, the spacing, the border and the shadow. It keeps the colours the person has already chosen and only
 * gives a colour to what has none, so choosing a look never undoes a colour. The exception is the one look that exists to take
 * a colour away, which does that and nothing else.
 */
export const LOOKS = {
    flat: {keepDesign: true, force: {bg: 'transparent'}},
    box: {design: {shape: 'rounded', ...around(20)}},
    pill: {design: {shape: 'pill', pt: 15, pr: 35, pb: 15, pl: 35, shadow: 'soft'}},
    tile: {design: {shape: 'rounded', ...around(25)}, colours: {bg: 'token:light'}},
    badge: {design: {shape: 'circle', ...around(30)}, colours: {bg: 'token:primary', fg: '#ffffff'}},
    outline: {design: {shape: 'circle', ...around(25), bw: 2, bs: 'solid'}},
};

/**
 * The group of sides a property belongs to.
 *
 * @param {string} prop Design property.
 * @returns {string|undefined} padding or margin, or undefined when the property has no sides.
 */
export const groupOf = (prop) => Object.keys(SIDE_GROUPS).find((group) => SIDE_GROUPS[group].includes(prop));

/**
 * A patch that sets every side of a group to one value.
 *
 * @param {string} group padding or margin.
 * @param {number|null} value Value, or null to clear.
 * @returns {object} Patch.
 */
export const sidesOf = (group, value) => Object.fromEntries(SIDE_GROUPS[group].map((side) => [side, value]));
