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
 * What the person does to choose icons: starting the choice, the quick buttons, the groups to copy, applying and leaving.
 *
 * @module     local_iconrestyle/selection/listeners
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/selection/selectors';

/**
 * Bind the buttons that start a choice and the controls of the bar.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} handlers onStart(mode), onAll(), onNone(), onModes(), onBack(), onApply(), onCancel() and onGroups().
 */
export const bindSelectionListeners = (root, handlers) => {
    root.addEventListener('click', (event) => {
        const target = event.target;
        if (target.closest(selectors.start)) {
            handlers.onStart('export');
        } else if (target.closest(selectors.copyStart)) {
            handlers.onStart('copy');
        } else if (target.closest(selectors.all)) {
            handlers.onAll();
        } else if (target.closest(selectors.none)) {
            handlers.onNone();
        } else if (target.closest(selectors.modes)) {
            handlers.onModes();
        } else if (target.closest(selectors.back)) {
            handlers.onBack();
        } else if (target.closest(selectors.apply)) {
            handlers.onApply();
        } else if (target.closest(selectors.cancel)) {
            handlers.onCancel();
        }
    });
    root.querySelector(selectors.bar).addEventListener('change', (event) => {
        if (event.target.matches(`${selectors.group}, ${selectors.from}, ${selectors.to}`)) {
            handlers.onGroups();
        }
    });
    root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            handlers.onCancel();
        }
    });
};
