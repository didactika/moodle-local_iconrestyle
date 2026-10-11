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

/**
 * Filter icons.
 *
 * Every word must appear in the key, so "forum mono" finds mod_forum:monologo.
 *
 * @param {Array<{key: string, kind: string, group: number}>} icons Catalogue entries.
 * @param {{query: string, kind: string, state: string, modified: Set<string>}} options Filters. Kind is all, font or image.
 *     State is all, modified or shared.
 * @returns {Array} Entries that pass every filter, in catalogue order.
 */
export const filterIcons = (icons, {query = '', kind = 'all', state = 'all', modified = new Set()} = {}) => {
    const wanted = words(query);
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
