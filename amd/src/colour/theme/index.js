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
 * A list of the colours the active theme declares, that looks and works like a select and can be searched by typing.
 *
 * The colours are read from the page: every custom property that the stylesheets declare on the root of the page and whose
 * value is a colour. They are not a fixed list, so a theme that adds its own colours offers them too.
 *
 * @module     local_iconrestyle/colour/theme/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/colour/theme/selectors';
import {bindThemeListeners} from 'local_iconrestyle/colour/theme/listeners';
import {renderResults} from 'local_iconrestyle/colour/theme/templates';
import Templates from 'core/templates';
import * as themevars from 'local_iconrestyle/lib/themevars';

const LIMIT = 80;
const GAP = 4;
const MARGIN = 12;

let catalogue = null;

/**
 * The colours the theme of this page declares, read once.
 *
 * @returns {Array<{name: string, value: string}>} Colours.
 */
const themeColours = () => {
    if (catalogue === null) {
        const style = window.getComputedStyle(document.documentElement);
        catalogue = themevars.resolveColours(
            themevars.collectNames(Array.from(document.styleSheets)),
            (name) => style.getPropertyValue(name),
            (value) => window.CSS.supports('color', value)
        );
    }
    return catalogue;
};

/**
 * Attach the list to a colour field.
 *
 * @param {HTMLElement} field The element of the colour field.
 * @param {string} name Name of the field, as fg or bg.
 * @param {{specials: Array<{value: string, label: string}>, onPick: function(string): void}} config Choices that are not
 *     theme variables, and what to do with a choice.
 * @returns {{setCurrent: function(string): void}} Controls.
 */
export const createThemeColours = (field, name, config) => {
    const find = (selector) => field.querySelector(selector);
    const input = find(selectors.input(name));
    const panel = find(selectors.panel(name));
    const list = find(selectors.list(name));
    const swatch = find(selectors.swatch(name));
    let rendering = 0;
    let typing = false;
    let shown = '';

    const place = () => {
        const rect = input.getBoundingClientRect();
        const width = Math.min(Math.max(rect.width, 260), window.innerWidth - 2 * MARGIN);
        const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - width - MARGIN));
        const below = window.innerHeight - rect.bottom - MARGIN;
        const above = rect.top - MARGIN;
        panel.style.left = `${left}px`;
        panel.style.width = `${width}px`;
        if (below >= 220 || below >= above) {
            panel.style.top = `${rect.bottom + GAP}px`;
            panel.style.bottom = '';
            list.style.maxHeight = `${Math.max(140, below - 16)}px`;
        } else {
            panel.style.top = '';
            panel.style.bottom = `${window.innerHeight - rect.top + GAP}px`;
            list.style.maxHeight = `${Math.max(140, above - 16)}px`;
        }
    };

    const render = async() => {
        const query = typing ? input.value.trim() : '';
        const mine = ++rendering;
        const found = themevars.search(themeColours(), query, LIMIT);
        const custom = themevars.isVariableName(query) && !themeColours().some((item) => item.name === query) ? query : '';
        const specials = config.specials.filter((special) => query === '' ||
            special.label.toLowerCase().includes(query.toLowerCase()));
        const html = await renderResults({
            specials,
            items: found.items.map((item) => ({name: item.name, value: themevars.toStored(item.name), shown: item.value})),
            more: found.more,
            custom: custom ? {name: custom, value: themevars.toStored(custom)} : null,
            none: found.items.length === 0 && specials.length === 0 && custom === '',
        });
        if (mine === rendering) {
            Templates.replaceNodeContents(list, html, '');
        }
    };

    const onOutside = (event) => {
        if (!panel.contains(event.target) && event.target !== input) {
            close();
        }
    };

    /**
     * Close the list, show the colour that is chosen again and stop listening for clicks outside it.
     */
    function close() {
        if (panel.hidden) {
            return;
        }
        panel.hidden = true;
        typing = false;
        input.value = shown;
        input.setAttribute('aria-expanded', 'false');
        document.removeEventListener('pointerdown', onOutside, true);
        window.removeEventListener('resize', close);
    }

    const open = async() => {
        if (!panel.hidden) {
            return;
        }
        typing = false;
        await render();
        panel.hidden = false;
        place();
        input.setAttribute('aria-expanded', 'true');
        input.select();
        document.addEventListener('pointerdown', onOutside, true);
        window.addEventListener('resize', close);
    };

    bindThemeListeners({input, panel, list}, {
        onOpen: open,
        onSearch: () => {
            typing = true;
            render();
        },
        onPick: (value) => {
            close();
            input.blur();
            config.onPick(value);
        },
        onClose: close,
    });

    /**
     * Show which theme colour the field has, or nothing when it has none.
     *
     * @param {string} stored Stored colour of the field.
     */
    const setCurrent = (stored) => {
        const variable = themevars.nameOf(stored);
        const special = config.specials.find((item) => item.value === stored);
        const specialLabel = special ? special.label : '';
        shown = variable !== '' ? variable : specialLabel;
        if (panel.hidden) {
            input.value = shown;
        }
        swatch.hidden = variable === '';
        if (variable !== '') {
            swatch.style.background = themevars.cssOf(stored);
        }
        field.classList.toggle('irs-themed', shown !== '');
    };

    return {setCurrent};
};
