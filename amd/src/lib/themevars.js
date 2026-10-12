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
 * Finds the colours the active theme declares as CSS custom properties, with no dependencies so it can be tested without a browser.
 *
 * @module     local_iconrestyle/lib/themevars
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const ROOT_SELECTOR = /(^|[\s,>+~(])(:root|html|body)(?![\w-])/;
const VARIABLE = /^--[A-Za-z0-9_-]{1,64}$/;
const KEYWORDS = /^(inherit|initial|unset|revert|revert-layer)$/i;
const PREFIX = 'var:';

/**
 * Add the custom properties that a list of rules declares on the root of the page.
 *
 * Rules that live inside media, supports or layer blocks are followed.
 *
 * @param {Iterable<object>} rules Rules of a stylesheet.
 * @param {Set<string>} names Names found so far.
 */
const collect = (rules, names) => {
    for (const rule of rules) {
        if (rule.selectorText === undefined) {
            if (rule.cssRules) {
                collect(rule.cssRules, names);
            }
            continue;
        }
        if (!ROOT_SELECTOR.test(rule.selectorText)) {
            continue;
        }
        for (const property of rule.style) {
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
 * @param {Iterable<object>} sheets Stylesheets, as in document.styleSheets.
 * @returns {string[]} Names, sorted.
 */
export const collectNames = (sheets) => {
    const names = new Set();
    for (const sheet of sheets) {
        let rules;
        try {
            rules = sheet.cssRules;
        } catch (error) {
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
 * @param {string[]} names Custom property names.
 * @param {function(string): string} read Returns the computed value of a custom property.
 * @param {function(string): boolean} supports Tells whether a value is a colour.
 * @returns {Array<{name: string, value: string}>} Colours, in the order of the names.
 */
export const resolveColours = (names, read, supports) => names
    .map((name) => ({name, value: read(name).trim()}))
    .filter(({value}) => value !== '' && !KEYWORDS.test(value) && supports(value));

/**
 * Colours that match what was typed, best matches first.
 *
 * Every word must appear in the name or in the value, ignoring case and the leading dashes of the name.
 *
 * @param {Array<{name: string, value: string}>} items Colours to look in.
 * @param {string} query Text typed.
 * @param {number} limit Most results to return.
 * @returns {{items: Array<{name: string, value: string}>, more: boolean}} Matches, and whether there were more than the limit.
 */
export const search = (items, query, limit) => {
    const words = String(query).toLowerCase().replace(/--/g, ' ').split(/\s+/).filter(Boolean);
    const matches = items.filter(({name, value}) => {
        const haystack = `${name.slice(2)} ${value}`.toLowerCase();
        return words.every((word) => haystack.includes(word));
    });
    if (words.length > 0) {
        const first = words[0];
        const rank = (item) => (item.name.slice(2).toLowerCase().startsWith(first) ? 0 : 1);
        matches.sort((one, two) => rank(one) - rank(two));
    }
    return {items: matches.slice(0, limit), more: matches.length > limit};
};

/**
 * Whether a text is a valid custom property name.
 *
 * @param {string} text Candidate name.
 * @returns {boolean} True for names such as --bs-primary.
 */
export const isVariableName = (text) => VARIABLE.test(text);

/**
 * Stored form of a custom property.
 *
 * @param {string} name Custom property name.
 * @returns {string} Value for the rule, such as var:--bs-primary.
 */
export const toStored = (name) => PREFIX + name;

/**
 * The custom property a stored colour points to.
 *
 * Colours stored by the first design, as token:primary, point to the property Bootstrap names after them.
 *
 * @param {string} stored Stored colour.
 * @returns {string} Custom property name, or an empty string when the colour is not a theme variable.
 */
export const nameOf = (stored) => {
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
 * @param {string} stored Stored colour, as var:--bs-primary or, from the first design, token:primary.
 * @returns {string} CSS value, such as var(--bs-primary).
 */
export const cssOf = (stored) => {
    const name = nameOf(stored);
    if (name === '') {
        return '';
    }
    if (stored.startsWith('token:') && !name.startsWith('--activity')) {
        return `var(${name}, var(--${name.slice(5)}))`;
    }
    return `var(${name})`;
};
