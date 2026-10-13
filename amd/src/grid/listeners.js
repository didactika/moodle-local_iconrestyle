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
 * What the person does with the grid: scrolling, resizing the window, choosing a card and moving with the arrow keys.
 *
 * @module     local_iconrestyle/grid/listeners
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/grid/selectors';

const DIRECTIONS = {ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down'};

/**
 * Bind the grid.
 *
 * @param {object} elements viewport and windowEl, the scrolling area and the element that holds the cards.
 * @param {object} handlers schedule(force) to draw again, onSelect(key, range), where range says Shift was held, and
 *     onMove(direction).
 */
export const bindGridListeners = (elements, handlers) => {
    const {viewport, windowEl} = elements;
    const {schedule, onSelect, onMove} = handlers;

    viewport.addEventListener('scroll', () => schedule(false), {passive: true});
    window.addEventListener('resize', () => schedule(true));
    windowEl.addEventListener('click', (event) => {
        const card = event.target.closest(selectors.card);
        if (card) {
            onSelect(card.dataset.key, event.shiftKey);
        }
    });
    viewport.addEventListener('keydown', (event) => {
        const direction = DIRECTIONS[event.key];
        if (direction) {
            event.preventDefault();
            onMove(direction);
        }
    });
};
