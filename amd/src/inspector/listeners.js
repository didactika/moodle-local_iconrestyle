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
 * What the person does in the editing panel, turned into what it means: a property got a value, a look was chosen, a tab
 * was opened.
 *
 * @module     local_iconrestyle/inspector/listeners
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/inspector/selectors';

/**
 * The value a control gives its property.
 *
 * @param {HTMLElement} element Slider, number box or select.
 * @returns {number|string|null} Value, null when the control is empty.
 */
const valueOf = (element) => {
    if (element.matches('input[type="range"]')) {
        return parseInt(element.value, 10);
    }
    if (element.matches('input[type="number"]')) {
        return element.value === '' ? null : Math.round(parseFloat(element.value) * 100);
    }
    return element.value === '' ? null : element.value;
};

/**
 * The value typed in the number box that sits next to a slider, kept within the range of the slider.
 *
 * @param {HTMLInputElement} number Number box.
 * @returns {number|null} Value, or null when the box is empty.
 */
const typedValue = (number) => {
    if (number.value === '') {
        return null;
    }
    const typed = Math.min(parseInt(number.max, 10), Math.max(parseInt(number.min, 10), parseInt(number.value, 10)));
    return Number.isNaN(typed) ? null : typed;
};

/**
 * Bind the panel.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} handlers onProp(prop, value, continuous), onStage(patch), onLook(name), onResetSides(group),
 *     onToggleLink(group, button), onTab(name), onClose(), onDismissNotice(), onRemoveVariant() and onUpload(file).
 */
export const bindInspectorListeners = (root, handlers) => {
    root.addEventListener('input', (event) => {
        const number = event.target.closest(selectors.numberInputs);
        if (number) {
            handlers.onProp(number.dataset.propNum, typedValue(number), true);
            return;
        }
        const element = event.target.closest(selectors.rangeInputs);
        if (element) {
            handlers.onProp(element.dataset.prop, valueOf(element), true);
        }
    });
    root.addEventListener('change', (event) => {
        const element = event.target.closest(selectors.selects);
        if (element) {
            handlers.onProp(element.dataset.prop, valueOf(element));
        }
    });
    root.addEventListener('click', (event) => {
        const shape = event.target.closest(selectors.shape);
        if (shape) {
            handlers.onProp('shape', shape.dataset.value === '' ? null : shape.dataset.value);
            return;
        }
        const flip = event.target.closest(selectors.flipButtons);
        if (flip) {
            handlers.onStage({[flip.dataset.flip]: flip.getAttribute('aria-pressed') === 'true' ? null : 1});
            return;
        }
        const button = event.target.closest(selectors.buttons);
        if (!button || button.disabled) {
            return;
        }
        switch (button.dataset.action) {
            case 'tab':
                handlers.onTab(button.dataset.tab);
                break;
            case 'dismiss-notice':
                handlers.onDismissNotice();
                break;
            case 'close-panel':
                handlers.onClose();
                break;
            case 'look':
                handlers.onLook(button.dataset.look);
                break;
            case 'reset-prop':
                handlers.onStage({[button.dataset.prop]: null});
                break;
            case 'reset-sides':
                handlers.onResetSides(button.dataset.group);
                break;
            case 'toggle-link':
                handlers.onToggleLink(button.dataset.group, button);
                break;
            case 'remove-artwork':
                handlers.onRemoveArtwork();
                break;
            case 'remove-variant':
                handlers.onRemoveVariant();
                break;
            default:
                break;
        }
    });
    root.querySelector(selectors.panel).addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !event.target.closest('.modal')) {
            handlers.onClose();
        }
    });
    root.querySelector(selectors.upload).addEventListener('change', (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (file) {
            handlers.onUpload(file);
        }
    });
};
