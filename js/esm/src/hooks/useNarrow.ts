// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * Whether the designer has little room, which is not the same as the window being small: a drawer of Moodle that is open takes room
 * from the page and leaves the window as it was.
 *
 * @module     local_iconrestyle/hooks/useNarrow
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useEffect, useState, type RefObject} from 'react';

/** Width, in rem, under which the list and the panel of an icon are one above the other. */
const NARROW = 62;

/**
 * Follow the width of an element.
 *
 * @param element The element that holds the designer.
 * @returns True while the element is narrower than the layout of two columns needs.
 */
export const useNarrow = (element: RefObject<HTMLElement | null>): boolean => {
    const [narrow, setNarrow] = useState(false);

    useEffect(() => {
        const target = element.current;
        if (!target || typeof ResizeObserver === 'undefined') {
            return undefined;
        }
        const measure = (): void => {
            const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
            setNarrow(target.getBoundingClientRect().width < NARROW * rem);
        };
        const observer = new ResizeObserver(measure);
        observer.observe(target);
        measure();
        return () => observer.disconnect();
    }, [element]);

    return narrow;
};
