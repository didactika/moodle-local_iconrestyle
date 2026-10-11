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
 * Calls to the plugin's web services. Nothing else in the designer talks to the server.
 *
 * @module     local_iconrestyle/repository
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {call as fetchMany} from 'core/ajax';

const call = (methodname, args) => fetchMany([{methodname, args}])[0];

/**
 * Every customisable icon.
 *
 * @param {number} contextid Context being edited.
 * @returns {Promise<{version: string, icons: Array}>} Catalogue.
 */
export const getCatalogue = (contextid) => call('local_iconrestyle_get_catalogue', {contextid});

/**
 * Rules that apply in a context.
 *
 * @param {number} contextid Context being edited.
 * @returns {Promise<{contextname: string, rules: Array}>} Rules.
 */
export const getRules = (contextid) => call('local_iconrestyle_get_rules', {contextid});

/**
 * Create or change a rule.
 *
 * @param {number} contextid Context the rule belongs to.
 * @param {object} rule Rule input.
 * @returns {Promise<object>} The stored rule.
 */
export const saveRule = (contextid, rule) => call('local_iconrestyle_save_rule', {contextid, rule});

/**
 * Delete a rule.
 *
 * @param {number} contextid Context the rule belongs to.
 * @param {string} slotkey Slot key.
 * @returns {Promise<boolean>} Whether a rule was deleted.
 */
export const deleteRule = (contextid, slotkey) => call('local_iconrestyle_delete_rule', {contextid, slotkey});

/**
 * Upload artwork.
 *
 * @param {number} contextid Context the artwork will be used in.
 * @param {string} content The file, base64 encoded.
 * @returns {Promise<object>} The stored asset.
 */
export const addAsset = (contextid, content) => call('local_iconrestyle_add_asset', {contextid, content});

/**
 * Compile rules that are not saved yet.
 *
 * @param {number} contextid Context being edited.
 * @param {Array} rules Rule inputs.
 * @param {string} scope Preview area, current or new.
 * @returns {Promise<string>} CSS scoped to the area.
 */
export const previewCss = (contextid, rules, scope) => call('local_iconrestyle_preview_css', {contextid, rules, scope});
