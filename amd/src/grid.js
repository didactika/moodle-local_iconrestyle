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
 * @module     local_iconrestyle/grid
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Templates from 'core/templates';
import selectors from 'local_iconrestyle/selectors';
import {visibleRows} from 'local_iconrestyle/lib/filter';

const CARD_REM = 6.5;
const GAP_REM = 0.5;

/**
 * Create the grid.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} options Callbacks: items() returns the filtered icons, isSelected(key), isModified(key), onSelect(key).
 * @returns {{render: Function, scrollTo: Function, neighbour: Function}} Grid API.
 */
export const createGrid = (root, options) => {
    const {items, isSelected, isModified, onSelect} = options;
    const viewport = root.querySelector(selectors.grid);
    const spacer = root.querySelector(selectors.gridSpacer);
    const windowEl = root.querySelector(selectors.gridWindow);
    let token = 0;
    let pending = false;

    const metrics = () => {
        const rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
        const card = CARD_REM * rem;
        const gap = GAP_REM * rem;
        const width = Math.max(card, viewport.clientWidth - 2 * gap);
        const columns = Math.max(1, Math.floor((width + gap) / (card + gap)));
        return {columns, rowHeight: card + gap, rem};
    };

    const render = async() => {
        const list = items();
        const {columns, rowHeight} = metrics();
        const rows = Math.ceil(list.length / columns);
        spacer.style.height = `${rows * rowHeight}px`;
        windowEl.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
        const {first, last} = visibleRows(viewport.scrollTop, viewport.clientHeight, rowHeight, rows);
        windowEl.style.transform = `translateY(${first * rowHeight}px)`;
        const cards = list.slice(first * columns, last * columns).map((icon) => ({
            key: icon.key,
            label: icon.name,
            component: icon.component,
            font: icon.kind === 'font',
            classes: icon.classes,
            imageurl: icon.imageurl,
            modified: isModified(icon.key),
            shared: icon.group > 1,
            selected: isSelected(icon.key),
        }));
        const mine = ++token;
        const {html, js} = await Templates.renderForPromise('local_iconrestyle/icon_cards', {cards});
        if (mine === token) {
            Templates.replaceNodeContents(windowEl, html, js);
        }
    };

    const schedule = () => {
        if (!pending) {
            pending = true;
            window.requestAnimationFrame(() => {
                pending = false;
                render();
            });
        }
    };

    viewport.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule);
    windowEl.addEventListener('click', (event) => {
        const card = event.target.closest(selectors.card);
        if (card) {
            onSelect(card.dataset.key);
        }
    });

    return {
        render,
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
