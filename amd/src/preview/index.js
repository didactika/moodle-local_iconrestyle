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
 * The live preview: the icon as Moodle draws it and as it looks with the draft, in the panel and on its card in the grid.
 *
 * The CSS comes from the server's own compiler, so what is seen is what will be saved. Every place that shows the draft
 * is a shadow tree that copies the page's stylesheets except the plugin's own, so the customisations that apply to the
 * whole page cannot leak into a view that must show something else.
 *
 * Compiling needs the server, so it is kept cheap: nothing is asked while the draft is still changing, one request is in
 * flight at a time, and a look that was compiled before is not asked for again.
 *
 * @module     local_iconrestyle/preview/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/preview/selectors';
import * as services from 'local_iconrestyle/preview/services';
import {bindPreviewListeners} from 'local_iconrestyle/preview/listeners';
import {CARD_LAYOUT, cell, fitCells, isolate} from 'local_iconrestyle/preview/templates';
import {watch} from 'local_iconrestyle/preview/colourmode';
import {toInput} from 'local_iconrestyle/lib/draft';

const SIZES = [16, 24, 32, 48];
const CARD_SIZE = 24;
const PANEL_LIMIT = 84;
const DEBOUNCE_MS = 250;
const CACHE_LIMIT = 200;

/**
 * Create the preview.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} options text(name, value), modes, the colour modes of the site, modeLabels, their names, and
 *     onSurface(name), which is
 *     called when the surface changes, whether the person chose it or the colour mode of the page did.
 * @returns {{show: Function, hide: Function, update: Function, setSurface: Function, surface: Function, setView: Function,
 *     mountCard: Function}} Preview API.
 */
export const createPreview = (root, options) => {
    const panel = root.querySelector(selectors.panel);
    const surfaceEl = root.querySelector(selectors.surface);
    const areas = {};
    ['default', 'new'].forEach((area) => {
        areas[area] = isolate(root.querySelector(selectors.cells(area)), area);
    });
    const cache = new Map();
    const held = new Map();
    let timer = 0;
    let token = 0;
    let busy = Promise.resolve();
    let css = '';
    let showing = null;
    let surfaceName = 'light';
    let card = null;
    let cardHost = null;
    let cardIcon = null;

    const paintCard = () => {
        const wanted = css;
        if (!card && cardHost && !cardHost.shadowRoot && css !== '') {
            card = isolate(cardHost, 'new', CARD_LAYOUT);
            paintMode();
            card.stage.replaceChildren(cell(cardIcon, CARD_SIZE));
        }
        if (card) {
            card.style.textContent = wanted;
        }
    };

    const fitAll = () => {
        fitCells(areas.new.stage, PANEL_LIMIT);
        if (card) {
            fitCells(card.stage, Math.max(16, cardHost.clientHeight * 0.92));
        }
        areas.new.stage.classList.remove('irs-wait');
    };

    const apply = (compiled) => {
        css = compiled;
        if (showing !== null) {
            held.set(showing, compiled);
        }
        areas.new.style.textContent = css;
        paintCard();
        fitAll();
        window.requestAnimationFrame(fitAll);
        window.setTimeout(fitAll, 250);
    };

    const remember = (signature, compiled) => {
        cache.set(signature, compiled);
        if (cache.size > CACHE_LIMIT) {
            cache.delete(cache.keys().next().value);
        }
    };

    /**
     * Ask the server for the CSS of a look, unless a newer look was asked for while this one waited its turn.
     *
     * @param {object} input Rule input.
     * @param {string} signature What identifies the look.
     * @param {number} mine Number of this request.
     */
    const request = async(input, signature, mine) => {
        if (mine !== token) {
            return;
        }
        let compiled = cache.get(signature);
        if (compiled === undefined) {
            try {
                compiled = await services.previewCss([input], 'new');
                remember(signature, compiled);
            } catch (error) {
                compiled = '';
            }
        }
        if (mine === token) {
            apply(compiled);
        }
    };

    const compile = (icon, draft) => {
        window.clearTimeout(timer);
        if (!draft) {
            token++;
            apply('');
            return Promise.resolve();
        }
        const input = toInput(draft, icon.kind);
        const signature = JSON.stringify(input);
        if (cache.has(signature)) {
            token++;
            apply(cache.get(signature));
            return Promise.resolve();
        }
        areas.new.stage.classList.add('irs-wait');
        const mine = ++token;
        return new Promise((resolve) => {
            timer = window.setTimeout(() => {
                busy = busy.then(() => request(input, signature, mine)).then(resolve);
            }, DEBOUNCE_MS);
        });
    };

    const setView = (name) => {
        surfaceEl.dataset.view = name;
        root.querySelectorAll(selectors.viewButton).forEach((button) => {
            const on = button.dataset.view === name;
            button.classList.toggle('irs-active', on);
            button.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        paintCard();
    };

    const paintMode = () => {
        if (options.modes.length === 0) {
            return;
        }
        [areas.default.stage, areas.new.stage, card ? card.stage : null].forEach((stage) => {
            if (stage) {
                stage.setAttribute('data-bs-theme', surfaceName);
            }
        });
    };

    const setSurface = (name) => {
        surfaceName = name;
        paintMode();
        surfaceEl.classList.toggle('irs-dark', name === 'dark');
        root.querySelectorAll(selectors.surfaceButton).forEach((button) => {
            const on = button.dataset.surface === name;
            button.classList.toggle('irs-active', on);
            button.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    };

    root.querySelector(selectors.surfaceGroup).hidden = options.modes.length === 0;

    bindPreviewListeners(root, {
        onView: setView,
        onSurface: (name) => {
            setSurface(name);
            options.onSurface(name);
        },
    });

    return {
        /**
         * Show the surface that matches the colour mode of the page, and keep following it when it changes.
         *
         * Does nothing on a site that has no colour modes.
         */
        followColourMode: () => {
            const note = root.querySelector(selectors.modeNote);
            if (options.modes.length === 0) {
                return;
            }
            watch((mode) => {
                note.hidden = mode === null;
                if (mode === null || !options.modes.includes(mode.applied)) {
                    return;
                }
                const name = mode.followsDevice ? 'currentmodeauto' : 'currentmode';
                note.textContent = options.text(name, options.modeLabels[mode.applied] || mode.applied);
                setSurface(mode.applied);
                options.onSurface(mode.applied);
            });
        },
        /**
         * Show the preview for an icon.
         *
         * @param {object} icon Catalogue entry.
         */
        show: (icon) => {
            panel.hidden = false;
            if (showing !== icon.key) {
                showing = icon.key;
                css = '';
                areas.new.style.textContent = '';
                areas.new.stage.classList.add('irs-wait');
                ['default', 'new'].forEach((area) => {
                    areas[area].stage.replaceChildren(...SIZES.map((size) => cell(icon, size)));
                });
            }
        },
        hide: () => {
            panel.hidden = true;
            showing = null;
        },
        /**
         * Recompile the look the draft gives the icon.
         *
         * @param {object} icon Catalogue entry.
         * @param {object|null} draft Draft, or null for Moodle's default.
         * @returns {Promise<void>} Resolves when the preview is up to date.
         */
        update: (icon, draft) => compile(icon, draft),
        /**
         * Switch the surface the icons are shown on.
         *
         * @param {string} name light or dark.
         */
        setSurface,
        /**
         * The surface the icons are shown on.
         *
         * @returns {string} light or dark.
         */
        surface: () => surfaceName,
        /**
         * Choose what the preview and the card of the icon show.
         *
         * @param {string} name edited, original or compare.
         */
        setView,
        /**
         * Make the cards of icons that were just edited keep showing the edited look.
         *
         * The stylesheet of the site only shows a change once it is saved and loaded, so an icon that is no longer open would
         * show Moodle's own look for a moment, and then the edited one. Until the stylesheet has them, these cards are drawn
         * from the last look that was compiled for each icon, as the card of the open icon is.
         *
         * @param {Array<{host: HTMLElement, icon: object}>} cards Icon area and catalogue entry of each card.
         */
        mountHeld: (cards) => {
            cards.forEach(({host, icon}) => {
                const compiled = held.get(icon.key);
                if (!compiled || host.shadowRoot) {
                    return;
                }
                const entry = isolate(host, 'new', CARD_LAYOUT);
                entry.stage.replaceChildren(cell(icon, CARD_SIZE));
                entry.style.textContent = compiled;
                if (options.modes.length > 0) {
                    entry.stage.setAttribute('data-bs-theme', surfaceName);
                }
                fitCells(entry.stage, Math.max(16, host.clientHeight * 0.92));
                window.requestAnimationFrame(() => fitCells(entry.stage, Math.max(16, host.clientHeight * 0.92)));
            });
        },
        /**
         * Make the card of the open icon show the draft too, so the grid previews it at its own place.
         *
         * Until there is something to show, the card keeps the look the site gives it, so nothing flashes. Every render of
         * the grid builds the cards again, so this is called after each one.
         *
         * @param {HTMLElement|null} host Icon area of the selected card, or null when it is not on screen.
         * @param {object|null} icon Catalogue entry.
         */
        mountCard: (host, icon) => {
            card = null;
            cardHost = host;
            cardIcon = icon;
            if (host && icon && !host.shadowRoot) {
                paintCard();
                fitAll();
                window.requestAnimationFrame(fitAll);
            }
        },
    };
};
