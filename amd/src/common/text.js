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
 * Text of the page, which the server sends once with the configuration of the designer.
 *
 * @module     local_iconrestyle/common/text
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Create the function that looks a text up.
 *
 * @param {Object<string, string>} strings Texts by name, where {n} marks the place of a value, or {name} the place of each
 *     value when there are several.
 * @returns {function(string, (string|number|object)=): string} Function that returns the text, with the values in place.
 */
export const createText = (strings) => (name, n = '') => {
    const text = strings[name] || '';
    if (n !== null && typeof n === 'object') {
        return Object.keys(n).reduce((result, key) => result.split(`{${key}}`).join(n[key]), text);
    }
    return text.replace('{n}', n);
};
