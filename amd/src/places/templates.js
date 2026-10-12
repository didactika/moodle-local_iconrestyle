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
 * Renders the chips of the places tab and the form of the modal that adds places.
 *
 * @module     local_iconrestyle/places/templates
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Templates from 'core/templates';

/**
 * Show the variants of the selected icon as chips.
 *
 * @param {HTMLElement} target Element that holds the chips.
 * @param {Array<{key: string, label: string, active: boolean, changed: boolean}>} variants What to show.
 * @returns {Promise<void>} Resolves when the chips are in place.
 */
export const showVariants = async(target, variants) => {
    const {html, js} = await Templates.renderForPromise('local_iconrestyle/places/variant_chips', {variants});
    Templates.replaceNodeContents(target, html, js);
};

/**
 * The form of the modal that adds places.
 *
 * @param {Array} pages Pages a rule can be limited to, as checkbox options.
 * @param {Array} regions Regions a rule can be limited to, as checkbox options.
 * @param {Array<{value: string, label: string, checked: boolean}>} modes The colour modes of the site, none when it has no
 *     colour modes.
 * @returns {Promise<string>} Markup.
 */
export const renderForm = async(pages, regions, modes) => {
    const context = {pages, regions, hasmodes: modes.length > 0, modes};
    const {html} = await Templates.renderForPromise('local_iconrestyle/places/add_form', context);
    return html;
};
