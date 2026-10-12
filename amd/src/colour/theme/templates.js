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
 * Renders the choices of the list of theme colours.
 *
 * @module     local_iconrestyle/colour/theme/templates
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Templates from 'core/templates';

/**
 * Render the choices.
 *
 * @param {object} context specials, items, more, custom and none, as the template describes them.
 * @returns {Promise<string>} Markup.
 */
export const renderResults = async(context) => {
    const {html} = await Templates.renderForPromise('local_iconrestyle/colour/theme_results', context);
    return html;
};
