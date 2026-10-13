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
 * The icon grid. Only the rows that can be seen exist in the page, so thousands of icons cost the same as dozens.
 *
 * @module     local_iconrestyle/grid/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/grid/selectors';
import {bindGridListeners} from 'local_iconrestyle/grid/listeners';
import {cardOf, fitCards, renderCards, showCards} from 'local_iconrestyle/grid/templates';
import {visibleRows} from 'local_iconrestyle/lib/filter';

const BUFFER_ROWS = 6;
const CARD_REM = 6.5;
const GAP_REM = 0.5;

/**
 * Create the grid.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} options Callbacks: items() returns the filtered icons, isSelected(key), isModified(key), isPicking(),
 *     isPicked(key), isPickable(key), onSelect(key, range), onMove(direction) and onRender(), which is called after every
 *     render of the window.
 * @returns {{render: Function, scrollTo: Function, neighbour: Function, selectedCardIcon: Function,
 *     cardIconOf: Function}} Grid API.
 */
export const createGrid = (root, options) => {
    const {items, isSelected, isModified, isPicking, isPicked, isPickable, onSelect, onMove, onRender} = options;
    const viewport = root.querySelector(selectors.viewport);
    const spacer = root.querySelector(selectors.spacer);
    const windowEl = root.querySelector(selectors.window);
    let token = 0;
    let pending = false;
    let applied = {first: -1, last: -1, columns: 0, count: -1};

    const metrics = () => {
        const rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
        const card = CARD_REM * rem;
        const gap = GAP_REM * rem;
        const width = Math.max(card, viewport.clientWidth - 2 * gap);
        const columns = Math.max(1, Math.floor((width + gap) / (card + gap)));
        return {columns, rowHeight: card + gap, rem};
    };

    /**
     * Draw the cards that are in view and a few rows around them.
     *
     * The window moves together with its new content, never before, so scrolling never shows cards at the wrong place.
     * While scrolling, nothing is drawn again until the rows in view change.
     *
     * @param {boolean} force Draw even when the rows in view are the same, as when the icons or their state changed.
     */
    const render = async(force = true) => {
        const list = items();
        const {columns, rowHeight} = metrics();
        const rows = Math.ceil(list.length / columns);
        spacer.style.height = `${rows * rowHeight}px`;
        const {first, last} = visibleRows(viewport.scrollTop, viewport.clientHeight, rowHeight, rows, BUFFER_ROWS);
        const same = first === applied.first && last === applied.last && columns === applied.columns &&
            list.length === applied.count;
        if (!force && same) {
            return;
        }
        const picking = isPicking();
        const cards = list.slice(first * columns, last * columns).map((icon) => cardOf(icon, {
            modified: isModified(icon.key),
            selected: isSelected(icon.key),
            picking,
            picked: picking && isPicked(icon.key),
            pickable: picking && isPickable(icon.key),
        }));
        const mine = ++token;
        const rendered = await renderCards(cards);
        if (mine === token) {
            windowEl.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
            windowEl.style.transform = `translateY(${first * rowHeight}px)`;
            showCards(windowEl, rendered);
            applied = {first, last, columns, count: list.length};
            fitCards(windowEl);
            onRender();
        }
    };

    const schedule = (force) => {
        if (!pending) {
            pending = true;
            window.requestAnimationFrame(() => {
                pending = false;
                render(force);
            });
        }
    };

    bindGridListeners({viewport, windowEl}, {schedule, onSelect, onMove});

    return {
        render,
        /**
         * The icon area of the card of the selected icon, when that card is on screen.
         *
         * @returns {HTMLElement|null} Element, or null.
         */
        selectedCardIcon: () => root.querySelector(selectors.selectedCardIcon),
        /**
         * The icon area of the card of an icon, when that card is on screen.
         *
         * @param {string} key Slot key.
         * @returns {HTMLElement|null} Element, or null.
         */
        cardIconOf: (key) => root.querySelector(`${selectors.card}[data-key="${key}"] ${selectors.cardIcon}`),
        /**
         * Scroll so that an icon is in view.
         *
         * @param {string} key Slot key.
         */
        scrollTo: (key) => {
            const position = items().findIndex((icon) => icon.key === key);
            if (position < 0) {
                return;
            }
            const {columns, rowHeight} = metrics();
            const top = Math.floor(position / columns) * rowHeight;
            if (top < viewport.scrollTop || top + rowHeight > viewport.scrollTop + viewport.clientHeight) {
                viewport.scrollTop = Math.max(0, top - viewport.clientHeight / 2 + rowHeight / 2);
            }
        },
        /**
         * Move one step through the list with the arrow keys.
         *
         * @param {string} key Slot key currently selected.
         * @param {string} direction left, right, up or down.
         * @returns {string|null} Key of the icon to select, or null when there is none.
         */
        neighbour: (key, direction) => {
            const list = items();
            const position = list.findIndex((icon) => icon.key === key);
            if (position < 0) {
                return list.length ? list[0].key : null;
            }
            const {columns} = metrics();
            const step = {left: -1, right: 1, up: -columns, down: columns}[direction];
            const next = Math.min(list.length - 1, Math.max(0, position + step));
            return list[next].key;
        },
    };
};
