/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Keep a floating list under the element that opened it while the page, or anything inside the page, scrolls or changes size.
 *
 * The lists are placed in the coordinates of the window, so they would stay where they were put while the element that opened
 * them moves away. While the list is open, the place is worked out again as often as the screen is drawn, and not more.
 *
 * @module     local_iconrestyle/hooks/useFollowAnchor
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useEffect, useRef} from 'react';

/**
 * Work out the place of a list again whenever something scrolls or the window changes size.
 *
 * @param active Whether the list is open.
 * @param update Works out the place; it gets the element that scrolled, which is not the list itself when it is inside it.
 * @param ignore Element whose own scrolling does not move the list, such as the list itself.
 */
export const useFollowAnchor = (active: boolean, update: () => void, ignore?: () => HTMLElement | null): void => {
    const latest = useRef(update);
    const skipped = useRef(ignore);
    latest.current = update;
    skipped.current = ignore;

    useEffect(() => {
        if (!active) {
            return undefined;
        }
        let frame = 0;
        let timer = 0;
        let waiting = false;
        const go = (): void => {
            if (!waiting) {
                return;
            }
            waiting = false;
            window.cancelAnimationFrame(frame);
            window.clearTimeout(timer);
            latest.current();
        };
        const run = (event: Event): void => {
            const inside = skipped.current?.();
            if (waiting || (inside && event.target instanceof Node && inside.contains(event.target))) {
                return;
            }
            waiting = true;
            frame = window.requestAnimationFrame(go);
            // A page that is not being drawn, such as a hidden tab, does not run the frames, and the list must still move.
            timer = window.setTimeout(go, 50);
        };
        // Scrolling does not bubble, so it is heard in the capture phase to catch the scrolling of any container.
        window.addEventListener('scroll', run, true);
        window.addEventListener('resize', run);
        return () => {
            waiting = false;
            window.cancelAnimationFrame(frame);
            window.clearTimeout(timer);
            window.removeEventListener('scroll', run, true);
            window.removeEventListener('resize', run);
        };
    }, [active]);
};
