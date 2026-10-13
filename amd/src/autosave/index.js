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
 * Saves the changes of the designer on its own, without ever sending two requests at once.
 *
 * A click, a choice or an undo is saved at once. What the person is still typing or dragging waits a third of a second
 * after the last step, so a slider makes one request and not one per step, and a save is forced after two seconds if the
 * person never stops. Everything that changed goes in a single request. While a request is in flight, new changes only wait:
 * they go in the next request, which starts the moment the first one ends.
 *
 * @module     local_iconrestyle/autosave/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {bindAutosaveListeners} from 'local_iconrestyle/autosave/listeners';

const QUIET_MS = 350;
const MAX_WAIT_MS = 2000;

/**
 * Create the autosave.
 *
 * @param {object} options What to save and what to do about it: flush() writes everything that is pending and resolves with
 *     the result, pendingCount() tells how many changes wait, onStatus(name) hears dirty, saving, saved and error,
 *     onSaved(result) hears each successful save and onFailure(error) is awaited when a save fails.
 * @returns {{schedule: Function, saveNow: Function, flushAll: Function, isBusy: Function}} Autosave API.
 */
export const createAutosave = (options) => {
    const {flush, pendingCount, onStatus, onSaved, onFailure} = options;
    let timer = 0;
    let dirtySince = 0;
    let saving = null;

    const run = async() => {
        let failed = false;
        onStatus('saving');
        try {
            onSaved(await flush());
        } catch (error) {
            failed = true;
            onStatus('error');
            await onFailure(error);
        } finally {
            saving = null;
        }
        if (pendingCount() > 0) {
            schedule(true);
        } else if (!failed) {
            onStatus('saved');
        }
    };

    /**
     * Save now what is pending, or wait for the request that is already in flight.
     *
     * @returns {Promise<void>} Resolves when that request has finished.
     */
    const saveNow = () => {
        window.clearTimeout(timer);
        if (saving) {
            return saving;
        }
        if (pendingCount() === 0) {
            // A change that changed nothing, such as asking for what is already there, leaves nothing to save and must not
            // leave the status waiting for a save that will never come.
            onStatus('saved');
            return Promise.resolve();
        }
        dirtySince = 0;
        saving = run();
        return saving;
    };

    /**
     * Note that something changed, so it is saved.
     *
     * @param {boolean} immediate True for a change that is complete, such as a click, which is saved at once. False for one that
     *     is still going, such as a slider being dragged, which is saved after the quiet moment, or sooner if it never stops.
     */
    function schedule(immediate = false) {
        if (!saving && pendingCount() > 0) {
            onStatus('dirty');
        }
        const now = Date.now();
        dirtySince = dirtySince || now;
        window.clearTimeout(timer);
        const wait = immediate ? 0 : Math.max(0, Math.min(QUIET_MS, dirtySince + MAX_WAIT_MS - now));
        timer = window.setTimeout(saveNow, wait);
    }

    /**
     * Save everything at once, including what changed while a request was in flight.
     *
     * @returns {Promise<void>} Resolves when nothing is left to save.
     */
    const flushAll = async() => {
        await saveNow();
        if (pendingCount() > 0) {
            await saveNow();
        }
    };

    const api = {schedule, saveNow, flushAll, isBusy: () => saving !== null || pendingCount() > 0};
    bindAutosaveListeners(api);
    return api;
};
