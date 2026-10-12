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
 * What the page does so that nothing is lost when the person leaves it.
 *
 * @module     local_iconrestyle/autosave/listeners
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Warn before the page closes with changes that are not saved, and save when the page is hidden.
 *
 * @param {{flushAll: Function, isBusy: Function}} autosave Autosave.
 */
export const bindAutosaveListeners = (autosave) => {
    window.addEventListener('beforeunload', (event) => {
        if (autosave.isBusy()) {
            event.preventDefault();
            event.returnValue = '';
        }
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && autosave.isBusy()) {
            autosave.flushAll();
        }
    });
};
