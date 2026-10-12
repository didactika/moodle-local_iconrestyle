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
 * The variants of the selected icon and the form that adds one for a new place.
 *
 * @module     local_iconrestyle/variants
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Templates from 'core/templates';
import selectors from 'local_iconrestyle/selectors';
import * as repository from 'local_iconrestyle/repository';
import {whereLabel} from 'local_iconrestyle/lib/draft';

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Create the variants control.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} options Names to show, the place that means every page, and callbacks: variants() lists the variants
 *     of the selected icon, activeKey() and isStaged(key) describe them, onPick(key) selects one, onAdd(where) adds one.
 * @returns {{render: Function, close: Function}} Variants API.
 */
export const createVariants = (root, options) => {
    const {labels, everywhere, variants, activeKey, isStaged, onPick, onAdd, text} = options;
    const find = (selector) => root.querySelector(selector);
    let chosen = null;
    let timer = 0;
    let searchToken = 0;

    const checked = (selector) => Array.from(root.querySelectorAll(`${selector}:checked`)).map((input) => input.value);

    const render = async() => {
        const items = variants().map((variant) => ({
            key: variant.key,
            label: whereLabel(variant.where, labels),
            active: variant.key === activeKey(),
            changed: isStaged(variant.key),
        }));
        const {html, js} = await Templates.renderForPromise('local_iconrestyle/variant_chips', {variants: items});
        Templates.replaceNodeContents(find(selectors.variants), html, js);
    };

    const showResults = async(places) => {
        const {html, js} = await Templates.renderForPromise('local_iconrestyle/location_results', {places});
        Templates.replaceNodeContents(find(selectors.whereResults), html, js);
    };

    const kind = () => find(selectors.whereKind).value;

    const syncKind = () => {
        const needsPlace = kind() !== 'site';
        find(selectors.whereSearchBlock).hidden = !needsPlace;
        chosen = null;
        find(selectors.whereChosen).textContent = '';
        find(selectors.whereSearch).value = '';
        showResults([]);
        if (needsPlace && kind() === 'category') {
            search();
        }
    };

    const search = async() => {
        const mine = ++searchToken;
        try {
            const result = await repository.searchLocations(kind(), find(selectors.whereSearch).value.trim());
            if (mine === searchToken) {
                await showResults(result.places);
            }
        } catch (error) {
            await showResults([]);
        }
    };

    const reset = () => {
        find(selectors.whereKind).value = 'site';
        root.querySelectorAll(`${selectors.wherePage}, ${selectors.whereRegion}`).forEach((input) => {
            input.checked = false;
        });
        find(selectors.whereError).hidden = true;
        syncKind();
    };

    const open = () => {
        reset();
        find(selectors.whereForm).hidden = false;
        find(selectors.whereKind).focus();
    };

    const close = () => {
        find(selectors.whereForm).hidden = true;
    };

    const confirm = () => {
        const pages = checked(selectors.wherePage);
        const regions = checked(selectors.whereRegion);
        const error = find(selectors.whereError);
        if (kind() !== 'site' && !chosen) {
            error.hidden = false;
            error.textContent = text('wherechoose');
            return;
        }
        error.hidden = true;
        const place = kind() === 'site' ? everywhere : chosen;
        close();
        onAdd({contextid: place.contextid, contextname: place.contextname, contextkind: place.contextkind, pages, regions});
    };

    find(selectors.whereKind).addEventListener('change', syncKind);
    find(selectors.whereSearch).addEventListener('input', () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(search, SEARCH_DEBOUNCE_MS);
    });
    find(selectors.whereResults).addEventListener('click', (event) => {
        const button = event.target.closest('button[data-contextid]');
        if (!button) {
            return;
        }
        chosen = {
            contextid: parseInt(button.dataset.contextid, 10),
            contextname: button.dataset.name,
            contextkind: kind(),
        };
        find(selectors.whereChosen).textContent = text('wherechosen', button.dataset.name);
    });
    find(selectors.variants).addEventListener('click', (event) => {
        const chip = event.target.closest('button[data-action="pick-variant"]');
        if (chip) {
            onPick(chip.dataset.key);
        }
    });
    root.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }
        if (button.dataset.action === 'add-variant') {
            open();
        } else if (button.dataset.action === 'cancel-variant') {
            close();
        } else if (button.dataset.action === 'confirm-variant') {
            confirm();
        }
    });

    return {render, close};
};
