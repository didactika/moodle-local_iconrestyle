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
 * Feeds Moodle's autocomplete with the categories, courses and activities a rule can be limited to.
 *
 * Moodle's autocomplete loads this module by name and calls transport() and processResults().
 *
 * @module     local_iconrestyle/places/locations
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import * as services from 'local_iconrestyle/places/services';

const names = new Map();

/**
 * Look for places, as the autocomplete asks.
 *
 * The kind of place is read from the select the autocomplete belongs to.
 *
 * @param {string} selector Selector of the select element.
 * @param {string} query Text typed so far.
 * @param {Function} found Receives the places found.
 * @param {Function} failed Receives the error.
 */
export const transport = (selector, query, found, failed) => {
    const kind = document.querySelector(selector).dataset.kind;
    services.searchLocations(kind, query).then((result) => {
        found(result.places);
        return null;
    }).catch(failed);
};

/**
 * Turn the places into options of the autocomplete.
 *
 * @param {string} selector Selector of the select element.
 * @param {Array<{contextid: number, name: string, detail: string}>} results Places found.
 * @returns {Array<{value: number, label: string}>} Options.
 */
export const processResults = (selector, results) => results.map((place) => {
    names.set(place.contextid, place.name);
    return {value: place.contextid, label: place.detail ? `${place.name} (${place.detail})` : place.name};
});

/**
 * The name of a place that was shown in a result list.
 *
 * @param {number} contextid Context id.
 * @returns {string} Name, empty when it was never shown.
 */
export const nameOf = (contextid) => names.get(contextid) || '';
