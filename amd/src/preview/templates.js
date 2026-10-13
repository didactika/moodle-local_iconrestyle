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
 * The markup of the preview: the shadow trees that show an icon and the cells inside them.
 *
 * It is built with the DOM and not with Mustache because it lives in a shadow tree of its own, which has to be filled
 * synchronously and again on every change.
 *
 * @module     local_iconrestyle/preview/templates
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const OWN_STYLESHEET = '/local/iconrestyle/styles.php';
const LAYOUT = '.irs-stage{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1.25rem;max-width:100%;' +
    'transition:opacity .12s ease}' +
    '.irs-stage.irs-wait{opacity:0}' +
    '.irs-cell{display:flex;flex:none;align-items:center;justify-content:center}' +
    '.irs-fit{display:flex;align-items:center;justify-content:center}' +
    '.irs-cell .icon,.irs-cell .activityiconcontainer{margin:0;flex:none}' +
    '.irs-cell i.icon{display:inline-flex;align-items:center;justify-content:center}';

/** Layout of the shadow tree that shows the draft on the card of the icon in the grid. */
export const CARD_LAYOUT = ':host{display:block;width:100%;height:100%;overflow:hidden}' +
    '.irs-stage{display:grid;place-items:center;width:100%;height:100%;overflow:hidden}';

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
 * Give an element an isolated tree: page styles, layout, a slot for compiled CSS and the stage the cells go in.
 *
 * @param {HTMLElement} host Element that holds the cells.
 * @param {string} area Area name, which scopes the compiled CSS.
 * @param {string} extra Layout rules specific to this kind of host.
 * @returns {{style: HTMLStyleElement, stage: HTMLElement}} Where the CSS and the cells go.
 */
export const isolate = (host, area, extra = '') => {
    const shadow = host.attachShadow({mode: 'open'});
    const layout = document.createElement('style');
    layout.textContent = LAYOUT + extra;
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
export const cell = (icon, size) => {
    const wrapper = document.createElement('span');
    wrapper.className = 'irs-cell';
    const fit = document.createElement('span');
    fit.className = 'irs-fit';
    wrapper.appendChild(fit);
    let element;
    if (icon.kind === 'container') {
        const scope = document.createElement('span');
        scope.className = icon.component === 'activity' ? `modtype_${icon.name}` : '';
        element = document.createElement('div');
        element.className = `${icon.classes} irs-box`;
        element.style.width = `${size * 1.6}px`;
        element.style.height = `${size * 1.6}px`;
        const glyph = document.createElement('img');
        glyph.className = 'activityicon';
        glyph.alt = '';
        glyph.src = icon.imageurl;
        element.appendChild(glyph);
        scope.appendChild(element);
        fit.appendChild(scope);
        return wrapper;
    }
    if (icon.kind === 'font') {
        element = document.createElement('i');
        element.className = icon.classes;
        element.setAttribute('aria-hidden', 'true');
        element.style.fontSize = `${size}px`;
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        element.style.lineHeight = `${size}px`;
    } else {
        element = document.createElement('img');
        element.className = 'icon';
        element.alt = '';
        element.src = icon.imageurl;
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
    }
    fit.appendChild(element);
    return wrapper;
};

/**
 * Shrink every cell of a stage whose icon has grown beyond the room it may take.
 *
 * Cells take the room of their content, so the gap between icons is the same whatever they look like. A zoom, unlike a
 * transform, also changes the room an icon takes, so a large look can never cover its neighbours.
 *
 * @param {HTMLElement} stage Stage that holds the cells.
 * @param {number} limit Largest size in pixels an icon may have.
 */
export const fitCells = (stage, limit) => {
    stage.querySelectorAll('.irs-cell').forEach((wrapper) => {
        const fit = wrapper.firstElementChild;
        fit.style.zoom = '';
        const target = fit.querySelector('.activityiconcontainer, .icon, img');
        if (!target) {
            return;
        }
        const rect = target.getBoundingClientRect();
        const longest = Math.max(rect.width, rect.height);
        if (longest > limit) {
            fit.style.zoom = (limit / longest).toFixed(3);
        }
    });
};
