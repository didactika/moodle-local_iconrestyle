// This file is part of Moodle - http://moodle.org/
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
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Keep a floating list under the element that opened it while the page, or anything inside the page, scrolls or changes size.
 *
 * The lists are placed in the coordinates of the window, so they would stay where they were put while the element that opened
 * them moves away. While the list is open, its place is worked out again as often as the screen is drawn, and not more.
 *
 * @module     local_iconrestyle/lib/follow
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Work out the place of a list again whenever something scrolls or the window changes size.
 *
 * @param {function(): boolean} isOpen Whether the list is still open; the listening stops when it is not.
 * @param {function(): void} update Works out the place of the list.
 * @param {HTMLElement} [inside] The list itself, whose own scrolling does not move it.
 * @returns {function(): void} Stops following.
 */
export const follow = (isOpen, update, inside) => {
    let frame = 0;
    let timer = 0;
    let waiting = false;
    const stop = () => {
        waiting = false;
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timer);
        window.removeEventListener('scroll', run, true);
        window.removeEventListener('resize', run);
    };
    const go = () => {
        if (!waiting) {
            return;
        }
        waiting = false;
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timer);
        if (isOpen()) {
            update();
        } else {
            stop();
        }
    };
    /**
     * Schedule the new place, once for each time the screen is drawn.
     *
     * @param {Event} event The scroll or the resize.
     */
    function run(event) {
        if (waiting || (inside && event.target instanceof Node && inside.contains(event.target))) {
            return;
        }
        waiting = true;
        frame = window.requestAnimationFrame(go);
        // A page that is not being drawn, such as a hidden tab, does not run the frames, and the list must still move.
        timer = window.setTimeout(go, 50);
    }
    // Scrolling does not bubble, so it is heard in the capture phase to catch the scrolling of any container.
    window.addEventListener('scroll', run, true);
    window.addEventListener('resize', run);
    return stop;
};
