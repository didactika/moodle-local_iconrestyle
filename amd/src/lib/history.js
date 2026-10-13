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
 * Undo and redo over immutable snapshots.
 *
 * @module     local_iconrestyle/lib/history
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Create a history that starts with one snapshot.
 *
 * @param {*} initial First snapshot.
 * @param {number} limit Most snapshots to keep.
 * @returns {{push: Function, undo: Function, redo: Function, current: Function, canUndo: Function, canRedo: Function,
 *     reset: Function}} History.
 */
export const createHistory = (initial, limit = 100) => {
    let stack = [initial];
    let index = 0;

    return {
        /**
         * Add a snapshot after the current one, dropping anything that could have been redone.
         *
         * @param {*} snapshot New snapshot.
         */
        push: (snapshot) => {
            stack = stack.slice(0, index + 1);
            stack.push(snapshot);
            if (stack.length > limit) {
                stack = stack.slice(stack.length - limit);
            }
            index = stack.length - 1;
        },
        undo: () => {
            index = Math.max(0, index - 1);
            return stack[index];
        },
        redo: () => {
            index = Math.min(stack.length - 1, index + 1);
            return stack[index];
        },
        current: () => stack[index],
        canUndo: () => index > 0,
        canRedo: () => index < stack.length - 1,
        reset: (snapshot) => {
            stack = [snapshot];
            index = 0;
        },
    };
};
