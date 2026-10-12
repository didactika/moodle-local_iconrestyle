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
 * Client-side search and filtering of the icon catalogue.
 *
 * @module     local_iconrestyle/lib/filter
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Words of a search text, lower case.
 *
 * @param {string} text Search text.
 * @returns {string[]} Words.
 */
const words = (text) => String(text).toLowerCase().split(/[\s/:_-]+/).filter((word) => word !== '');

const NONE = new Set();

/**
 * Put icons in the order the person asked for.
 *
 * @param {Array} icons Icons, already filtered.
 * @param {string} sort catalogue, name, component or modified.
 * @param {Set<string>} modified Keys of the icons that have customisations.
 * @returns {Array} The same icons in a new array, in order. The catalogue order is the one they already have.
 */
export const sortIcons = (icons, sort, modified) => {
    if (sort === 'name') {
        return [...icons].sort((a, b) => a.name.localeCompare(b.name) || a.component.localeCompare(b.component));
    }
    if (sort === 'component') {
        return [...icons].sort((a, b) => a.component.localeCompare(b.component) || a.name.localeCompare(b.name));
    }
    if (sort === 'modified') {
        return [...icons].sort((a, b) => Number(modified.has(b.key)) - Number(modified.has(a.key)));
    }
    return icons;
};

/**
 * Filter icons.
 *
 * Every word must appear in the key, so "forum mono" finds mod_forum:monologo.
 *
 * @param {Array<{key: string, kind: string, group: number}>} icons Catalogue entries.
 * @param {object} options Filters: query, kind (all, font, image or container), state (all, modified or shared), modified (a set
 *     of keys), kinds, components, purposes, places and modes (any of them) and traits (all of them must be met, among
 *     them untouched, modified and shared) as arrays, and traitsOf(key), which gives the traits of a customised icon.
 * @returns {Array} Entries that pass every filter, in catalogue order.
 */
export const filterIcons = (icons, options = {}) => {
    const {
        query = '', kind = 'all', state = 'all', kinds = [], modified = new Set(), components = [], purposes = [], traits = [],
        places = [], modes = [], traitsOf = () => NONE,
    } = options;
    const wanted = words(query);
    const status = ['untouched', 'modified', 'shared'];
    const all = traits.filter((trait) => !status.includes(trait));
    const needTraits = all.length > 0 || places.length > 0 || modes.length > 0;
    return icons.filter((icon) => {
        if (kind !== 'all' && icon.kind !== kind) {
            return false;
        }
        if (state === 'modified' && !modified.has(icon.key)) {
            return false;
        }
        if (state === 'shared' && icon.group < 2) {
            return false;
        }
        if (kinds.length > 0 && !kinds.includes(icon.kind)) {
            return false;
        }
        if (components.length > 0 && !components.includes(icon.component)) {
            return false;
        }
        if (purposes.length > 0 && !purposes.includes(icon.purpose)) {
            return false;
        }
        if ((traits.includes('untouched') && modified.has(icon.key)) || (traits.includes('modified') && !modified.has(icon.key)) ||
            (traits.includes('shared') && icon.group < 2)) {
            return false;
        }
        if (needTraits) {
            const have = traitsOf(icon.key);
            const anyOf = (prefix, list) => list.length === 0 || list.some((name) => have.has(`${prefix}:${name}`));
            if (!all.every((trait) => have.has(trait)) || !anyOf('place', places) || !anyOf('mode', modes)) {
                return false;
            }
        }
        const haystack = icon.key.toLowerCase();
        return wanted.every((word) => haystack.includes(word));
    });
};

/**
 * Work out which rows of a fixed-height grid are visible.
 *
 * @param {number} scrollTop Scroll offset in pixels.
 * @param {number} viewportHeight Height of the visible area.
 * @param {number} rowHeight Height of one row.
 * @param {number} rowCount Number of rows.
 * @param {number} buffer Extra rows to render above and below.
 * @returns {{first: number, last: number}} First row and one past the last row to render.
 */
export const visibleRows = (scrollTop, viewportHeight, rowHeight, rowCount, buffer = 2) => {
    const first = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
    const last = Math.min(rowCount, Math.ceil((scrollTop + viewportHeight) / rowHeight) + buffer);
    return {first, last};
};
