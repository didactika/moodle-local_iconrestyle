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
 * What the person does with the places: choosing a variant, opening the modal and the kind of place inside it.
 *
 * @module     local_iconrestyle/places/listeners
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/places/selectors';

/**
 * Bind the places tab.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} handlers onPick(key), onRemove(key), onOpen() and onCopyMode().
 */
export const bindPlacesListeners = (root, handlers) => {
    root.querySelector(selectors.variants).addEventListener('click', (event) => {
        const remove = event.target.closest(selectors.removeChip);
        if (remove) {
            handlers.onRemove(remove.dataset.key);
            return;
        }
        const chip = event.target.closest(selectors.pickVariant);
        if (chip) {
            handlers.onPick(chip.dataset.key);
        }
    });
    root.addEventListener('click', (event) => {
        if (event.target.closest(selectors.addPlaces)) {
            handlers.onOpen();
        }
        if (event.target.closest(selectors.copyMode)) {
            handlers.onCopyMode();
        }
    });
};

/**
 * Bind the form of the modal.
 *
 * @param {HTMLElement} form The form.
 * @param {Function} onKind Called when the person chooses another kind of place.
 */
export const bindFormListeners = (form, onKind) => {
    form.querySelectorAll(selectors.kindRadios).forEach((radio) => radio.addEventListener('change', onKind));
};
