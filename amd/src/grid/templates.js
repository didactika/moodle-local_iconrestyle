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
 * Renders the cards of the grid.
 *
 * @module     local_iconrestyle/grid/templates
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Templates from 'core/templates';
import selectors from 'local_iconrestyle/grid/selectors';

/**
 * The data a card needs, from the catalogue entry of its icon.
 *
 * @param {object} icon Catalogue entry.
 * @param {{modified: boolean, selected: boolean, picking: boolean, picked: boolean, pickable: boolean}} flags Whether the
 *     icon has a variant, whether it is open, whether icons are being chosen, whether this one is chosen and whether it can be.
 * @returns {object} Template context of one card.
 */
export const cardOf = (icon, flags) => ({
    key: icon.key,
    label: icon.name,
    component: icon.component,
    font: icon.kind === 'font',
    image: icon.kind === 'image',
    container: icon.kind === 'container',
    modtype: icon.component === 'activity' ? `modtype_${icon.name}` : '',
    classes: icon.classes,
    imageurl: icon.imageurl,
    modified: flags.modified,
    shared: icon.group > 1,
    selected: flags.selected,
    picking: flags.picking,
    picked: flags.picked,
    pressed: flags.picking ? flags.picked : flags.selected,
    unpickable: flags.picking && !flags.pickable && !flags.selected,
});

/**
 * Render cards.
 *
 * @param {object[]} cards Template contexts of the cards.
 * @returns {Promise<{html: string, js: string}>} Markup and the script that goes with it.
 */
export const renderCards = (cards) => Templates.renderForPromise('local_iconrestyle/grid/icon_cards', {cards});

/**
 * Replace the cards of the window.
 *
 * @param {HTMLElement} windowEl Element that holds the cards.
 * @param {{html: string, js: string}} rendered What renderCards resolved with.
 */
export const showCards = (windowEl, rendered) => {
    Templates.replaceNodeContents(windowEl, rendered.html, rendered.js);
};

/**
 * Scale down the icon of every card whose customised look has grown beyond the room the card gives it.
 *
 * Customisations apply on this page too, so a large scale or padding would otherwise be cut off by the card.
 *
 * @param {HTMLElement} container Element that holds the cards.
 */
export const fitCards = (container) => {
    container.querySelectorAll(selectors.cardIcon).forEach((area) => {
        const fit = area.firstElementChild;
        fit.style.zoom = '';
        const target = fit.querySelector('.activityiconcontainer, .icon, img');
        if (!target) {
            return;
        }
        const rect = target.getBoundingClientRect();
        const room = Math.min(area.clientWidth, area.clientHeight) * 0.92;
        const longest = Math.max(rect.width, rect.height);
        if (longest > room) {
            fit.style.zoom = (room / longest).toFixed(3);
        }
    });
};
