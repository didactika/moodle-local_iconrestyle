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
 * Web service that finds the places a rule can be limited to.
 *
 * @module     local_iconrestyle/places/services
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {call} from 'local_iconrestyle/common/ajax';

/**
 * Find categories, courses or activities by name.
 *
 * @param {string} kind category, course or activity.
 * @param {string} query Text to look for.
 * @returns {Promise<{places: Array<{contextid: number, name: string, detail: string}>}>} Places.
 */
export const searchLocations = (kind, query) => call('local_iconrestyle_search_locations', {kind, query});
