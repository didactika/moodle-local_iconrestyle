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
 * The toolbar above the grid: search, filters, the count, the save status, undo and redo and the actions menu.
 *
 * @module     local_iconrestyle/toolbar/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/toolbar/selectors';
import {bindToolbarListeners} from 'local_iconrestyle/toolbar/listeners';

/**
 * Create the toolbar.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} options text(name, value) and the handlers onFilter(patch), onUndo(), onRedo() and onSave().
 * @returns {{setStatus: Function, setCount: Function, setHistory: Function, showLoaded: Function}} Toolbar API.
 */
export const createToolbar = (root, options) => {
    const {text} = options;
    const find = (selector) => root.querySelector(selector);

    const closeMenu = () => {
        root.querySelectorAll(selectors.menuList).forEach((list) => {
            list.hidden = true;
        });
        root.querySelectorAll(selectors.menuToggle).forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'));
    };

    bindToolbarListeners(root, {...options, closeMenu});

    return {
        /**
         * Show how the saving is going.
         *
         * @param {string} name dirty, saving, saved or error.
         * @param {string} label Text to show instead of the usual one.
         */
        setStatus: (name, label = '') => {
            find(selectors.status).dataset.state = name;
            find(selectors.statusText).textContent = label || text(`status${name}`);
        },
        /**
         * Show how many icons match the filters.
         *
         * @param {number} count Number of icons.
         */
        setCount: (count) => {
            find(selectors.count).textContent = text('iconcount', count);
            find(selectors.empty).hidden = count > 0;
        },
        /**
         * Enable undo and redo only when there is something to undo or redo.
         *
         * @param {{canUndo: boolean, canRedo: boolean}} available What can be done.
         */
        setHistory: ({canUndo, canRedo}) => {
            root.querySelectorAll(selectors.undo).forEach((button) => {
                button.disabled = !canUndo;
            });
            root.querySelectorAll(selectors.redo).forEach((button) => {
                button.disabled = !canRedo;
            });
        },
        /**
         * Hide the loading message once the icons are there.
         */
        showLoaded: () => {
            find(selectors.loading).hidden = true;
        },
    };
};
