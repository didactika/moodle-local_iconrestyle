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
 * What the person does with the list of theme colours, which works like a select that can be searched: opening it by clicking
 * or typing, moving through it with the arrows, and choosing.
 *
 * @module     local_iconrestyle/colour/theme/listeners
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/colour/theme/selectors';

/**
 * Bind the list.
 *
 * @param {object} elements input, panel and list.
 * @param {object} handlers onOpen(), onSearch(), onPick(value) and onClose().
 */
export const bindThemeListeners = (elements, handlers) => {
    const {input, panel, list} = elements;
    const items = () => Array.from(list.querySelectorAll(selectors.item));

    input.addEventListener('focus', handlers.onOpen);
    input.addEventListener('click', handlers.onOpen);
    input.addEventListener('input', handlers.onSearch);
    input.addEventListener('keydown', (event) => {
        const first = items()[0];
        if (event.key === 'Enter') {
            event.preventDefault();
            if (!panel.hidden && first) {
                handlers.onPick(first.dataset.value);
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (panel.hidden) {
                handlers.onOpen();
            } else if (first) {
                first.focus();
            }
        } else if (event.key === 'Escape' && !panel.hidden) {
            event.stopPropagation();
            handlers.onClose();
        }
    });
    panel.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.stopPropagation();
            handlers.onClose();
            input.focus();
            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return;
        }
        const all = items();
        const index = all.indexOf(document.activeElement);
        if (index < 0) {
            return;
        }
        event.preventDefault();
        if (event.key === 'ArrowUp' && index === 0) {
            input.focus();
            return;
        }
        const next = all[index + (event.key === 'ArrowDown' ? 1 : -1)];
        if (next) {
            next.focus();
        }
    });
    list.addEventListener('click', (event) => {
        const target = event.target.closest(selectors.item);
        if (target) {
            handlers.onPick(target.dataset.value);
        }
    });
};
