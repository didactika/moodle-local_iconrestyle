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
 * The colour fields of the designer: a picker, a hex box, a searchable list of the colours of the theme and a button to clear.
 *
 * @module     local_iconrestyle/colour/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/colour/selectors';
import {bindColourListeners} from 'local_iconrestyle/colour/listeners';
import {createThemeColours} from 'local_iconrestyle/colour/theme/index';
import * as themevars from 'local_iconrestyle/lib/themevars';
import {contrastRatio, parseHex, toHex} from 'local_iconrestyle/lib/color';

const SURFACES = {light: {r: 255, g: 255, b: 255}, dark: {r: 33, g: 37, b: 41}};
const NAMES = ['fg', 'bg', 'bg2', 'bc', 'oc', 'sc'];
const FOLLOWS_THEME = /^(var:|token:)|^(currentcolor|transparent)$/;

/**
 * The colour that CSS gives a value in this page, as hex.
 *
 * @param {string} css A CSS colour such as var(--bs-primary).
 * @returns {string} Hex, or an empty string when the browser does not give it a colour.
 */
const hexOf = (css) => {
    const probe = document.createElement('span');
    probe.style.color = css;
    document.body.appendChild(probe);
    const [red, green, blue, alpha] = (window.getComputedStyle(probe).color.match(/[0-9.]+/g) || []).map(Number);
    probe.remove();
    return red === undefined ? '' : toHex({r: red, g: green, b: blue, a: alpha === undefined ? 255 : Math.round(alpha * 255)});
};

/**
 * Create the colour fields.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} options text(name, value), the choices that are not theme variables per field as specials, and
 *     onChange(name, value, continuous), which hears every colour the person chooses and whether they are still choosing.
 * @returns {{render: Function, showContrast: Function}} Colour fields API.
 */
export const createColourFields = (root, options) => {
    const {text, specials, onChange} = options;
    const find = (selector) => root.querySelector(selector);
    const labelOf = (name) => find(selectors.label(name));
    const ownLabels = {fg: labelOf('fg').textContent, bg: labelOf('bg').textContent};
    const themes = {};

    const setValue = (name, value) => {
        const colour = value || '';
        const themed = FOLLOWS_THEME.test(colour);
        themes[name].setCurrent(colour);
        const hex = find(selectors.hex(name));
        const fromtheme = themevars.cssOf(colour);
        if (document.activeElement !== hex) {
            hex.value = themed ? (fromtheme === '' ? '' : hexOf(fromtheme)) : colour;
            hex.removeAttribute('aria-invalid');
        }
        hex.classList.toggle('irs-from-theme', fromtheme !== '');
        const hint = find(selectors.hint(name));
        hint.hidden = true;
        hint.classList.remove('irs-error');
        const parsed = parseHex(themed ? hex.value : colour);
        const pair = (channel) => channel.toString(16).padStart(2, '0');
        find(selectors.picker(name)).value = parsed ? `#${pair(parsed.r)}${pair(parsed.g)}${pair(parsed.b)}` : '#000000';
    };

    NAMES.forEach((name) => {
        themes[name] = createThemeColours(find(selectors.field(name)), name, {
            specials: specials[name] || [],
            onPick: (value) => onChange(name, value),
        });
        bindColourListeners(root, name, (value, continuous) => onChange(name, value, continuous));
    });

    return {
        /**
         * Show the colours of a draft.
         *
         * @param {object} draft Draft.
         * @param {boolean} box Whether the icon is a box, whose colours are of the icon and of the box.
         */
        render: (draft, box) => {
            labelOf('fg').textContent = box ? text('iconcolour') : ownLabels.fg;
            labelOf('bg').textContent = box ? text('boxcolour') : ownLabels.bg;
            NAMES.forEach((name) => setValue(name, draft[name]));
        },
        /**
         * Tell whether the colour of the icon can be read on the surface it is shown on.
         *
         * @param {object|null} draft Draft, or null when no icon is open.
         * @param {string} surface light or dark.
         */
        showContrast: (draft, surface) => {
            const target = find(selectors.contrast);
            const colour = parseHex(draft && draft.fg);
            if (!colour || colour.a < 255) {
                target.hidden = true;
                return;
            }
            const ratio = contrastRatio(colour, SURFACES[surface]);
            target.hidden = false;
            target.textContent = text(ratio >= 3 ? 'contrastgood' : 'contrastlow', ratio.toFixed(1));
        },
    };
};
