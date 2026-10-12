// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * Client-side search, filtering and sorting of the icon catalogue.
 *
 * @module     local_iconrestyle/lib/filter
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import type {Icon} from '../types';

/** The options of filterIcons. */
export interface FilterOptions {
    query?: string;
    kinds?: string[];
    modified?: Set<string>;
    components?: string[];
    purposes?: string[];
    traits?: string[];
    places?: string[];
    modes?: string[];
    traitsOf?: (key: string) => Set<string>;
}

const NONE = new Set<string>();
const STATUS = ['untouched', 'modified', 'shared'];

/**
 * Words of a search text, lower case.
 *
 * @param text Search text.
 * @returns Words.
 */
const words = (text: string): string[] => String(text).toLowerCase().split(/[\s/:_-]+/).filter((word) => word !== '');

/**
 * Put icons in the order the person asked for.
 *
 * @param icons Icons, already filtered.
 * @param sort catalogue, name, component or modified.
 * @param modified Keys of the icons that have customisations.
 * @returns The same icons in a new array, in order. The catalogue order is the one they already have.
 */
export const sortIcons = (icons: Icon[], sort: string, modified: Set<string>): Icon[] => {
    if (sort === 'name') {
        return [...icons].sort((a, b) => a.name.localeCompare(b.name) || a.component.localeCompare(b.component));
    }
    if (sort === 'component') {
        return [...icons].sort((a, b) => a.component.localeCompare(b.component) || a.name.localeCompare(b.name));
    }
    if (sort === 'modified') {
        return [...icons].sort((a, b) => Number(modified.has(b.key)) - Number(modified.has(a.key)));
    }
    return icons;
};

/**
 * Filter icons.
 *
 * Every word of the query must appear in the key, so "forum mono" finds mod_forum:monologo. The kinds, components, purposes,
 * places and modes are met when the icon is any of them, and the traits, among them untouched, modified and shared, when it has
 * all of them.
 *
 * @param icons Catalogue entries.
 * @param options Filters.
 * @returns Entries that pass every filter, in catalogue order.
 */
export const filterIcons = (icons: Icon[], options: FilterOptions = {}): Icon[] => {
    const {
        query = '', kinds = [], modified = NONE, components = [], purposes = [], traits = [], places = [], modes = [],
        traitsOf = () => NONE,
    } = options;
    const wanted = words(query);
    const all = traits.filter((trait) => !STATUS.includes(trait));
    const needTraits = all.length > 0 || places.length > 0 || modes.length > 0;
    return icons.filter((icon) => {
        if (kinds.length > 0 && !kinds.includes(icon.kind)) {
            return false;
        }
        if (components.length > 0 && !components.includes(icon.component)) {
            return false;
        }
        if (purposes.length > 0 && !purposes.includes(icon.purpose)) {
            return false;
        }
        if ((traits.includes('untouched') && modified.has(icon.key)) || (traits.includes('modified') && !modified.has(icon.key)) ||
            (traits.includes('shared') && icon.group < 2)) {
            return false;
        }
        if (needTraits) {
            const have = traitsOf(icon.key);
            const anyOf = (prefix: string, list: string[]): boolean => list.length === 0 ||
                list.some((name) => have.has(`${prefix}:${name}`));
            if (!all.every((trait) => have.has(trait)) || !anyOf('place', places) || !anyOf('mode', modes)) {
                return false;
            }
        }
        const haystack = icon.key.toLowerCase();
        return wanted.every((word) => haystack.includes(word));
    });
};

/**
 * Work out which rows of a fixed-height grid are visible.
 *
 * @param scrollTop Scroll offset in pixels.
 * @param viewportHeight Height of the visible area.
 * @param rowHeight Height of one row.
 * @param rowCount Number of rows.
 * @param buffer Extra rows to render above and below.
 * @returns First row and one past the last row to render.
 */
export const visibleRows = (
    scrollTop: number,
    viewportHeight: number,
    rowHeight: number,
    rowCount: number,
    buffer = 2,
): {first: number; last: number} => {
    const first = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
    const last = Math.min(rowCount, Math.ceil((scrollTop + viewportHeight) / rowHeight) + buffer);
    return {first, last};
};
