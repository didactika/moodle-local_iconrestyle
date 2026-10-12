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
 * Web services that load and store the rules of the site.
 *
 * @module     local_iconrestyle/state/services
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {call, withTimeout} from 'local_iconrestyle/common/ajax';

const SAVE_TIMEOUT_MS = 30000;

/**
 * Every customisable icon.
 *
 * @returns {Promise<{version: string, icons: Array}>} Catalogue.
 */
export const getCatalogue = () => call('local_iconrestyle_get_catalogue', {});

/**
 * Every rule of the site, wherever it applies.
 *
 * @returns {Promise<{rules: Array}>} Rules.
 */
export const getRules = () => call('local_iconrestyle_get_rules', {});

/**
 * Create, change and delete rules in one request, in one transaction.
 *
 * @param {object[]} rules Rule inputs to create or change.
 * @param {number[]} deleteids Ids of the rules to delete.
 * @returns {Promise<{rules: Array, deleted: number[], stylesheeturl: string}>} The stored rules in the order they were sent,
 *     the ids that were deleted and the address of the stylesheet the site has afterwards.
 */
export const saveRules = (rules, deleteids) => withTimeout(
    call('local_iconrestyle_save_rules', {rules, deleteids}),
    SAVE_TIMEOUT_MS
);
