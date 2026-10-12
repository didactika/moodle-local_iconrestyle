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
 * What the person does with a colour field: the colour picker, the hex box and the button that clears it.
 *
 * @module     local_iconrestyle/colour/listeners
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/colour/selectors';
import {normalise} from 'local_iconrestyle/lib/color';

/**
 * Bind one colour field.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {string} name Name of the field.
 * @param {function(string, boolean): void} onChange Called with the colour the person chose, or an empty string to clear it, and
 *     whether the person is still choosing, as when dragging in the picker or typing.
 */
export const bindColourListeners = (root, name, onChange) => {
    const find = (selector) => root.querySelector(selector);
    find(selectors.picker(name)).addEventListener('input', (event) => onChange(normalise(event.target.value), true));
    const hex = find(selectors.hex(name));
    hex.addEventListener('input', (event) => {
        const value = event.target.value.trim();
        if (value === '') {
            event.target.removeAttribute('aria-invalid');
            onChange('', true);
        } else if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)) {
            event.target.removeAttribute('aria-invalid');
            onChange(normalise(value), true);
        } else if (/[^#0-9a-f]/i.test(value) || value.length > 9) {
            event.target.setAttribute('aria-invalid', 'true');
        }
    });
    hex.addEventListener('change', (event) => {
        const value = event.target.value.trim();
        const valid = value === '' ? '' : normalise(value);
        if (valid === null) {
            event.target.setAttribute('aria-invalid', 'true');
        } else {
            event.target.removeAttribute('aria-invalid');
            onChange(valid);
        }
    });
    find(selectors.clear(name)).addEventListener('click', () => onChange(''));
};
