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
 * What the person does to export and import: choosing the entries of the actions menu and a file, and reviewing a package.
 *
 * @module     local_iconrestyle/exchange/listeners
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/exchange/selectors';

/**
 * Bind the export and import controls.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} handlers onExport(), onImport() and onFile(file).
 */
export const bindExchangeListeners = (root, handlers) => {
    root.addEventListener('click', (event) => {
        if (event.target.closest(selectors.exportButton)) {
            handlers.onExport();
        } else if (event.target.closest(selectors.importButton)) {
            handlers.onImport();
        }
    });
    root.querySelector(selectors.file).addEventListener('change', (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (file) {
            handlers.onFile(file);
        }
    });
};

/**
 * Bind the form that reviews a package.
 *
 * @param {HTMLElement} form The form.
 * @param {object} handlers onMode(mode), onSearch(query), onAll(), onNew(), onNone() and onToggle(slot, checked).
 */
export const bindReviewListeners = (form, handlers) => {
    let timer = 0;
    form.querySelectorAll(selectors.modes).forEach((radio) => {
        radio.addEventListener('change', () => handlers.onMode(radio.value));
    });
    form.querySelector(selectors.search).addEventListener('input', (event) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => handlers.onSearch(event.target.value), 120);
    });
    form.addEventListener('change', (event) => {
        const box = event.target.closest(selectors.row);
        if (box) {
            handlers.onToggle(box.value, box.checked);
        }
    });
    form.addEventListener('click', (event) => {
        if (event.target.closest(selectors.chooseAll)) {
            handlers.onAll();
        } else if (event.target.closest(selectors.chooseNew)) {
            handlers.onNew();
        } else if (event.target.closest(selectors.chooseNone)) {
            handlers.onNone();
        }
    });
};
