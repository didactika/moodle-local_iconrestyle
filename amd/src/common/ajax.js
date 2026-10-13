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
 * The one way every service module of the designer calls a web service of the plugin.
 *
 * @module     local_iconrestyle/common/ajax
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {call as fetchMany} from 'core/ajax';

/**
 * Call one web service.
 *
 * @param {string} methodname Name of the web service function.
 * @param {object} args Arguments.
 * @returns {Promise<*>} What the function returns.
 */
export const call = (methodname, args) => fetchMany([{methodname, args}])[0];

/**
 * Give a promise a time to finish, so that nothing waits for ever for a server that does not answer.
 *
 * @param {Promise<*>} promise What is waited for.
 * @param {number} milliseconds Longest time to wait.
 * @returns {Promise<*>} The promise, or one that is rejected with an error that has timedout set when time ran out.
 */
export const withTimeout = (promise, milliseconds) => new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
        const error = new Error('The server did not answer in time.');
        error.timedout = true;
        reject(error);
    }, milliseconds);
    promise.then((value) => {
        window.clearTimeout(timer);
        resolve(value);
        return null;
    }).catch((error) => {
        window.clearTimeout(timer);
        reject(error);
    });
});
