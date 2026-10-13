// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * Finds the colours the active theme declares as CSS custom properties.
 *
 * @module     local_iconrestyle/lib/themevars
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

export interface ThemeColour {
    name: string;
    value: string;
}

const ROOT_SELECTOR = /(^|[\s,>+~(])(:root|html|body)(?![\w-])/;
const VARIABLE = /^--[A-Za-z0-9_-]{1,64}$/;
const KEYWORDS = /^(inherit|initial|unset|revert|revert-layer)$/i;
const PREFIX = 'var:';

/**
 * Add the custom properties that a list of rules declares on the root of the page.
 *
 * Rules that live inside media, supports or layer blocks are followed.
 *
 * @param rules Rules of a stylesheet.
 * @param names Names found so far.
 */
const collect = (rules: CSSRuleList, names: Set<string>): void => {
    for (const rule of Array.from(rules)) {
        const styled = rule as CSSStyleRule;
        if (styled.selectorText === undefined) {
            const grouping = rule as CSSGroupingRule;
            if (grouping.cssRules) {
                collect(grouping.cssRules, names);
            }
            continue;
        }
        if (!ROOT_SELECTOR.test(styled.selectorText)) {
            continue;
        }
        for (const property of Array.from(styled.style)) {
            if (property.startsWith('--') && VARIABLE.test(property)) {
                names.add(property);
            }
        }
    }
};

/**
 * Names of the custom properties that the stylesheets of the page declare on its root.
 *
 * Stylesheets that the browser does not let a script read are skipped.
 *
 * @param sheets Stylesheets, as in document.styleSheets.
 * @returns Names, sorted.
 */
export const collectNames = (sheets: Iterable<CSSStyleSheet>): string[] => {
    const names = new Set<string>();
    for (const sheet of sheets) {
        let rules: CSSRuleList | undefined;
        try {
            rules = sheet.cssRules;
        } catch {
            continue;
        }
        if (rules) {
            collect(rules, names);
        }
    }
    return [...names].sort();
};

/**
 * Keep the custom properties whose value, as the page computes it, is a colour.
 *
 * @param names Custom property names.
 * @param read Returns the computed value of a custom property.
 * @param supports Tells whether a value is a colour.
 * @returns Colours, in the order of the names.
 */
export const resolveColours = (
    names: string[],
    read: (name: string) => string,
    supports: (value: string) => boolean,
): ThemeColour[] => names
    .map((name) => ({name, value: read(name).trim()}))
    .filter(({value}) => value !== '' && !KEYWORDS.test(value) && supports(value));

/**
 * Colours that match what was typed, best matches first.
 *
 * Every word must appear in the name or in the value, ignoring case and the leading dashes of the name.
 *
 * @param items Colours to look in.
 * @param query Text typed.
 * @param limit Most results to return.
 * @returns Matches, and whether there were more than the limit.
 */
export const search = (items: ThemeColour[], query: string, limit: number): {items: ThemeColour[]; more: boolean} => {
    const words = String(query).toLowerCase().replace(/--/g, ' ').split(/\s+/).filter(Boolean);
    const matches = items.filter(({name, value}) => {
        const haystack = `${name.slice(2)} ${value}`.toLowerCase();
        return words.every((word) => haystack.includes(word));
    });
    if (words.length > 0) {
        const first = words[0];
        const rank = (item: ThemeColour): number => (item.name.slice(2).toLowerCase().startsWith(first) ? 0 : 1);
        matches.sort((one, two) => rank(one) - rank(two));
    }
    return {items: matches.slice(0, limit), more: matches.length > limit};
};

/**
 * Whether a text is a valid custom property name.
 *
 * @param text Candidate name.
 * @returns True for names such as --bs-primary.
 */
export const isVariableName = (text: string): boolean => VARIABLE.test(text);

/**
 * Stored form of a custom property.
 *
 * @param name Custom property name.
 * @returns Value for the rule, such as var:--bs-primary.
 */
export const toStored = (name: string): string => PREFIX + name;

/**
 * The custom property a stored colour points to.
 *
 * Colours stored by the first design, as token:primary, point to the property Bootstrap names after them.
 *
 * @param stored Stored colour.
 * @returns Custom property name, or an empty string when the colour is not a theme variable.
 */
export const nameOf = (stored: string): string => {
    if (stored.startsWith(PREFIX)) {
        return stored.slice(PREFIX.length);
    }
    if (stored.startsWith('token:')) {
        const token = stored.slice(6);
        return token.startsWith('activity') ? `--${token}` : `--bs-${token}`;
    }
    return '';
};

/**
 * The CSS value a stored theme colour has, as the server writes it into the stylesheet.
 *
 * @param stored Stored colour, as var:--bs-primary or, from the first design, token:primary.
 * @returns CSS value, such as var(--bs-primary).
 */
export const cssOf = (stored: string): string => {
    const name = nameOf(stored);
    if (name === '') {
        return '';
    }
    if (stored.startsWith('token:') && !name.startsWith('--activity')) {
        return `var(${name}, var(--${name.slice(5)}))`;
    }
    return `var(${name})`;
};
