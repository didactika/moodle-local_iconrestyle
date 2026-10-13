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
 * Keeps the stylesheet of the site, which this page also loads, in step with what was just saved.
 *
 * @module     local_iconrestyle/designer/stylesheet
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/designer/selectors';

/**
 * Load the stylesheet the site now has, so the icons of this page show what was just saved.
 *
 * The address changes with every save, so the old stylesheet is replaced rather than reloaded, and only once the new one
 * has loaded, so the icons never flash.
 *
 * @param {string} url Address of the stylesheet, empty when no rule applies any more.
 * @param {Function} onApplied Called when the page shows the new stylesheet.
 */
export const applyStylesheet = (url, onApplied) => {
    const current = document.querySelector(selectors.siteStylesheet);
    if (url === '') {
        if (current) {
            current.remove();
        }
        onApplied();
        return;
    }
    if (current && current.href === url) {
        onApplied();
        return;
    }
    const next = document.createElement('link');
    next.rel = 'stylesheet';
    next.href = url;
    next.addEventListener('load', () => {
        if (current) {
            current.remove();
        }
        onApplied();
    });
    if (current) {
        current.after(next);
    } else {
        document.head.appendChild(next);
    }
};
