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
 * What the person does in the filters panel: opening it, choosing, searching the components and clearing.
 *
 * @module     local_iconrestyle/filters/listeners
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/filters/selectors';

/**
 * Bind the panel.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} handlers onToggle(), onClose(), onChoose(group, value, checked), onSort(value), onSearch(query) and
 *     onClear().
 */
export const bindFilterListeners = (root, handlers) => {
    const wrapper = root.querySelector(selectors.wrapper);
    let timer = 0;
    root.addEventListener('click', (event) => {
        if (event.target.closest(selectors.toggle)) {
            handlers.onToggle();
        } else if (event.target.closest(selectors.clear)) {
            handlers.onClear();
        } else if (!event.target.closest(selectors.wrapper)) {
            handlers.onClose();
        }
    });
    wrapper.addEventListener('change', (event) => {
        const input = event.target.closest(selectors.inputs);
        if (input) {
            handlers.onChoose(input.dataset.filter, input.value, input.checked);
        } else if (event.target.matches(selectors.sort)) {
            handlers.onSort(event.target.value);
        }
    });
    wrapper.querySelector(selectors.componentSearch).addEventListener('input', (event) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => handlers.onSearch(event.target.value), 120);
    });
    wrapper.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            handlers.onClose();
        }
    });
};
