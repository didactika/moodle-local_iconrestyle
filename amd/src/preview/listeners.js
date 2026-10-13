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
 * The buttons that choose what the preview shows and the surface it shows it on.
 *
 * @module     local_iconrestyle/preview/listeners
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/preview/selectors';

/**
 * Bind the buttons of the preview.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} handlers onView(name) and onSurface(name).
 */
export const bindPreviewListeners = (root, handlers) => {
    root.addEventListener('click', (event) => {
        const view = event.target.closest(selectors.viewButton);
        if (view) {
            handlers.onView(view.dataset.view);
            return;
        }
        const surface = event.target.closest(selectors.surfaceButton);
        if (surface) {
            handlers.onSurface(surface.dataset.surface);
        }
    });
};
