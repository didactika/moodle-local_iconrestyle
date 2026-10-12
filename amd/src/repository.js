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
 * Create or change a rule.
 *
 * @param {object} rule Rule input.
 * @returns {Promise<object>} The stored rule.
 */
export const saveRule = (rule) => call('local_iconrestyle_save_rule', {rule});

/**
 * Delete a rule.
 *
 * @param {number} id Rule id.
 * @returns {Promise<boolean>} Whether a rule was deleted.
 */
export const deleteRule = (id) => call('local_iconrestyle_delete_rule', {id});

/**
 * Upload artwork.
 *
 * @param {string} content The file, base64 encoded.
 * @returns {Promise<object>} The stored asset.
 */
export const addAsset = (content) => call('local_iconrestyle_add_asset', {content});

/**
 * Compile rules that are not saved yet.
 *
 * @param {Array} rules Rule inputs.
 * @param {string} scope Preview area, current or new.
 * @returns {Promise<string>} CSS scoped to the area.
 */
export const previewCss = (rules, scope) => call('local_iconrestyle_preview_css', {rules, scope});

/**
 * Find categories, courses or activities by name.
 *
 * @param {string} kind category, course or activity.
 * @param {string} query Text to look for.
 * @returns {Promise<{places: Array<{contextid: number, name: string, detail: string}>}>} Places.
 */
export const searchLocations = (kind, query) => call('local_iconrestyle_search_locations', {kind, query});
