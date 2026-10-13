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
 * Web services that export and import the customisations of the site.
 *
 * @module     local_iconrestyle/exchange/services
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {call} from 'local_iconrestyle/common/ajax';

/**
 * The customisations of the site as a package.
 *
 * @param {string[]} slots Keys of the icons to export, none for all of them.
 * @returns {Promise<{filename: string, content: string, skipped: string[]}>} The package and the rules that were left out.
 */
export const exportRules = (slots = []) => call('local_iconrestyle_export_rules', {slots});

/**
 * Import a package, or say what importing it would do.
 *
 * @param {string} content The package.
 * @param {string} mode merge or replace.
 * @param {boolean} dryrun True to change nothing.
 * @param {string[]} slots Keys of the icons to take from the package, none for all of them.
 * @returns {Promise<{created: number, updated: number, deleted: number, skipped: number, assets: number, issues: string[],
 *     entries: Array<{slot: string, created: number, updated: number, skipped: number}>, stylesheeturl: string}>} What was
 *     done, or what would be, and what happens to each icon.
 */
export const importRules = (content, mode, dryrun, slots = []) => call('local_iconrestyle_import_rules', {
    content, mode, dryrun, slots,
});
