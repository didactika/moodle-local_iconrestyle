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
 * The colour mode this page is shown in, when Moodle has colour modes.
 *
 * Boost writes the mode that is applied in the data-bs-theme attribute of the html element, and the mode the person chose,
 * which can also be to follow the device, in data-colourmode. A site where colour modes are not enabled writes neither, and
 * then nothing is shown and nothing is preselected.
 *
 * @module     local_iconrestyle/preview/colourmode
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * The mode of the page.
 *
 * @returns {{applied: string, followsDevice: boolean}|null} The mode that is applied, light or dark, and whether the person
 *     chose to follow the device; or null when the page has no colour mode.
 */
export const detect = () => {
    const html = document.documentElement;
    const applied = html.getAttribute('data-bs-theme');
    if (applied !== 'light' && applied !== 'dark') {
        return null;
    }
    return {applied, followsDevice: html.getAttribute('data-colourmode') === 'auto'};
};

/**
 * Call a function now and whenever the page changes its colour mode, as when the person picks another one in the menu of Boost.
 *
 * @param {function(({applied: string, followsDevice: boolean}|null)): void} onChange Called with the mode of the page.
 */
export const watch = (onChange) => {
    onChange(detect());
    new window.MutationObserver(() => onChange(detect())).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-bs-theme', 'data-colourmode'],
    });
};
