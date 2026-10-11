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
 * The live preview: the same icon as Moodle draws it, as it is today and as it would be after saving.
 *
 * The CSS comes from the server's own compiler, so what is seen is what will be saved. Each column lives in its own
 * shadow tree that copies the page's stylesheets except the plugin's own, so the customisations that now apply to the
 * whole page, designer included, cannot leak into a column that must show something else.
 *
 * @module     local_iconrestyle/preview
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/selectors';
import * as repository from 'local_iconrestyle/repository';
import {toInput} from 'local_iconrestyle/lib/draft';

const SIZES = [16, 24, 32, 48];
const DEBOUNCE_MS = 120;
const OWN_STYLESHEET = '/local/iconrestyle/styles.php';
const LAYOUT = '.irs-stage{display:flex;flex-direction:column;align-items:center;gap:.625rem}' +
    '.irs-cell{display:flex;align-items:center;justify-content:center;min-height:3rem}' +
    '.irs-cell .icon{margin:0}';

/**
 * Copy of every stylesheet the page loads, except the one this plugin delivers.
 *
 * @returns {HTMLLinkElement[]} Link elements for a shadow tree.
 */
const pageStylesheets = () => Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .filter((link) => !link.href.includes(OWN_STYLESHEET))
    .map((link) => {
        const copy = document.createElement('link');
        copy.rel = 'stylesheet';
        copy.href = link.href;
        return copy;
    });

/**
 * Give a column an isolated tree: page styles, layout, a slot for compiled CSS and the stage the cells go in.
 *
 * @param {HTMLElement} host Element that holds the cells.
 * @param {string} area Area name, which scopes the compiled CSS.
 * @returns {{style: HTMLStyleElement, stage: HTMLElement}} Where the CSS and the cells go.
 */
const isolate = (host, area) => {
    const shadow = host.attachShadow({mode: 'open'});
    const layout = document.createElement('style');
    layout.textContent = LAYOUT;
    const style = document.createElement('style');
    const stage = document.createElement('div');
    stage.className = `irs-stage irs-preview-${area}`;
    shadow.append(...pageStylesheets(), layout, style, stage);
    return {style, stage};
};

/**
 * One cell: the icon at one size.
 *
 * @param {object} icon Catalogue entry.
 * @param {number} size Size in pixels.
 * @returns {HTMLElement} Cell.
 */
const cell = (icon, size) => {
    const wrapper = document.createElement('span');
    wrapper.className = 'irs-cell';
    wrapper.style.fontSize = `${size}px`;
    let element;
    if (icon.kind === 'font') {
        element = document.createElement('i');
        element.className = icon.classes;
        element.setAttribute('aria-hidden', 'true');
    } else {
        element = document.createElement('img');
        element.className = 'icon';
        element.alt = '';
        element.src = icon.imageurl;
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
    }
    wrapper.appendChild(element);
    return wrapper;
};

/**
 * Create the preview.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {number} contextid Context being edited.
 * @returns {{show: Function, hide: Function, update: Function, setSurface: Function}} Preview API.
 */
export const createPreview = (root, contextid) => {
    const panel = root.querySelector(selectors.preview);
    const surface = root.querySelector(selectors.previewSurface);
    const timers = {};
    const tokens = {current: 0, new: 0};
    const areas = {};
    ['default', 'current', 'new'].forEach((area) => {
        areas[area] = isolate(root.querySelector(selectors.previewCells(area)), area);
    });

    const fill = (area, icon) => {
        areas[area].stage.replaceChildren(...SIZES.map((size) => cell(icon, size)));
    };

    const compile = (area, icon, draft) => {
        const style = areas[area].style;
        window.clearTimeout(timers[area]);
        if (!draft) {
            tokens[area]++;
            style.textContent = '';
            return Promise.resolve();
        }
        const mine = ++tokens[area];
        return new Promise((resolve) => {
            timers[area] = window.setTimeout(async() => {
                try {
                    const css = await repository.previewCss(contextid, [toInput(draft, icon.kind)], area);
                    if (mine === tokens[area]) {
                        style.textContent = css;
                    }
                } catch (error) {
                    style.textContent = '';
                }
                resolve();
            }, DEBOUNCE_MS);
        });
    };

    return {
        /**
         * Show the preview for an icon.
         *
         * @param {object} icon Catalogue entry.
         */
        show: (icon) => {
            panel.hidden = false;
            ['default', 'current', 'new'].forEach((area) => fill(area, icon));
        },
        hide: () => {
            panel.hidden = true;
        },
        /**
         * Recompile the two areas that show customisations.
         *
         * @param {object} icon Catalogue entry.
         * @param {object|null} current Draft that applies today, or null for Moodle's default.
         * @param {object|null} next Draft that would apply after saving, or null for Moodle's default.
         * @returns {Promise<void>} Resolves when both areas are up to date.
         */
        update: (icon, current, next) => Promise.all([compile('current', icon, current), compile('new', icon, next)]),
        /**
         * Switch the surface the icons are shown on.
         *
         * @param {string} name light or dark.
         */
        setSurface: (name) => {
            surface.classList.toggle('irs-dark', name === 'dark');
        },
    };
};
