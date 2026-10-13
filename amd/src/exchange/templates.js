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
 * Renders what the person sees when importing.
 *
 * @module     local_iconrestyle/exchange/templates
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Templates from 'core/templates';

/**
 * The body of the import modal: how to import, what is in the package and what importing would do.
 *
 * @param {object} context summary text and report, as the template describes them.
 * @returns {Promise<string>} Markup.
 */
export const renderImportBody = async(context) => {
    const {html} = await Templates.renderForPromise('local_iconrestyle/exchange/import_body', context);
    return html;
};

/**
 * The icons of the package, each with a box to choose it.
 *
 * @param {HTMLElement} target Element that holds the list.
 * @param {object} context rows, more and none, as the template describes them.
 * @returns {Promise<void>} Resolves when the list is in place.
 */
export const showRows = async(target, context) => {
    const {html, js} = await Templates.renderForPromise('local_iconrestyle/exchange/import_rows', context);
    Templates.replaceNodeContents(target, html, js);
};

/**
 * What importing would do.
 *
 * @param {HTMLElement} target Element that holds the report.
 * @param {object} report What importing would do.
 * @returns {Promise<void>} Resolves when the report is in place.
 */
export const showReport = async(target, report) => {
    const {html, js} = await Templates.renderForPromise('local_iconrestyle/exchange/report', report);
    Templates.replaceNodeContents(target, html, js);
};
