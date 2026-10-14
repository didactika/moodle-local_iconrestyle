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
 * What the page itself reacts to, as opposed to its components.
 *
 * @module     local_iconrestyle/designer/listeners
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/** Width, in rem, under which the list and the panel of an icon are one above the other. */
const NARROW = 62;

/**
 * Keep the designer as tall as the room under the navigation bar of Moodle, whatever the size of the window, and say when it has
 * little room, which is not the same as the window being small: a drawer of Moodle that is open takes room from the page.
 *
 * @param {HTMLElement} root Designer root element.
 */
export const bindLayout = (root) => {
    const fit = () => {
        root.style.setProperty('--irs-top', `${root.getBoundingClientRect().top + window.pageYOffset}px`);
    };
    const measure = () => {
        const rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
        root.classList.toggle('irs-narrow', root.getBoundingClientRect().width < NARROW * rem);
    };
    fit();
    measure();
    window.addEventListener('resize', fit);
    if (typeof window.ResizeObserver === 'function') {
        new window.ResizeObserver(measure).observe(root);
    }
};
