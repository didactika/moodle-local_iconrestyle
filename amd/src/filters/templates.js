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
 * Renders the lists of the filters panel.
 *
 * @module     local_iconrestyle/filters/templates
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Templates from 'core/templates';

/**
 * Show a template in an element.
 *
 * @param {HTMLElement} target Element.
 * @param {string} name Template name.
 * @param {object} context Template context.
 * @returns {Promise<void>} Resolves when it is in place.
 */
const show = async(target, name, context) => {
    const {html, js} = await Templates.renderForPromise(name, context);
    Templates.replaceNodeContents(target, html, js);
};

/**
 * The checkboxes of the components that match the search.
 *
 * @param {HTMLElement} target Element that holds the list.
 * @param {object} context rows (name, count, checked), more and none.
 * @returns {Promise<void>} Resolves when it is in place.
 */
export const showComponents = (target, context) => show(target, 'local_iconrestyle/filters/components', context);

/**
 * The chips of the purposes.
 *
 * @param {HTMLElement} target Element that holds the chips.
 * @param {object} context rows (value, label, count, checked).
 * @returns {Promise<void>} Resolves when they are in place.
 */
export const showPurposes = (target, context) => show(target, 'local_iconrestyle/filters/purposes', context);
