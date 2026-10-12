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
 * The places where the selected icon has a variant, and the modal that adds more.
 *
 * @module     local_iconrestyle/places/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import ModalEvents from 'core/modal_events';
import * as AutoComplete from 'core/form-autocomplete';
import selectors from 'local_iconrestyle/places/selectors';
import {nameOf} from 'local_iconrestyle/places/locations';
import {createModal} from 'local_iconrestyle/common/modal';
import {bindFormListeners, bindPlacesListeners} from 'local_iconrestyle/places/listeners';
import {renderForm, showVariants} from 'local_iconrestyle/places/templates';
import {whereLabel} from 'local_iconrestyle/lib/draft';

const KINDS = ['category', 'course', 'activity'];

/**
 * Create the places control.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} options Names to show, the place that means every page, the pages and regions to offer, the colour modes of
 *     the site and currentMode(), which says the one the page is shown in, and callbacks:
 *     variants() lists the variants of the selected icon, activeKey() and activeWhere() describe them,
 *     onPick(key) selects one and onAdd(wheres, copy, stay) adds the places chosen in the modal, or the look copied to other
 *     colour modes, in which case stay is true and the person keeps editing the look they were on.
 * @returns {{render: Function}} Places API.
 */
export const createPlaces = (root, options) => {
    const {labels, everywhere, pages, regions, modes, currentMode, variants, activeKey, activeWhere, onPick, onAdd,
        onRemove, text} = options;
    const others = () => (activeWhere().mode === 'all' ? [] : modes.filter((mode) => mode !== activeWhere().mode));

    const render = async() => {
        const list = variants();
        await showVariants(root.querySelector(selectors.variants), list.map((variant) => ({
            key: variant.key,
            label: whereLabel(variant.where, labels),
            active: variant.key === activeKey(),
            removable: !variant.base,
        })));
        root.querySelector(selectors.count).textContent = String(list.length);
        const targets = others();
        root.querySelectorAll(selectors.copyMode).forEach((button) => {
            button.hidden = targets.length === 0;
        });
        root.querySelectorAll(selectors.copyModeLabel).forEach((label) => {
            label.textContent = text(targets.length > 1 ? 'copytoothermodes' : 'copytoothermode');
        });
    };

    const chosenKind = (form) => form.querySelector(selectors.kindChosen).value;

    const checked = (form, selector) => Array.from(form.querySelectorAll(`${selector}:checked`)).map((input) => input.value);

    const syncKind = (form) => {
        const kind = chosenKind(form);
        form.querySelectorAll(selectors.kindField).forEach((field) => {
            field.hidden = field.dataset.kindField !== kind;
        });
    };

    const wheresOf = (form) => {
        const kind = chosenKind(form);
        const extra = {
            pages: checked(form, selectors.pageBoxes),
            regions: checked(form, selectors.regionBoxes),
            mode: form.querySelector(selectors.modeChosen) ? form.querySelector(selectors.modeChosen).value : 'all',
        };
        if (kind === 'site') {
            return [{contextid: everywhere.contextid, contextname: everywhere.contextname, contextkind: 'site', ...extra}];
        }
        const select = form.querySelector(selectors.placesSelect(kind));
        return Array.from(select.selectedOptions).map((option) => {
            const contextid = parseInt(option.value, 10);
            return {contextid, contextname: nameOf(contextid) || option.textContent, contextkind: kind, ...extra};
        });
    };

    const open = async() => {
        const html = await renderForm(pages, regions, modes.map((mode) => ({
            value: mode,
            label: labels.modes[mode] || mode,
            checked: mode === currentMode(),
        })));
        const modal = await createModal({title: text('addplacestitle'), body: html, save: text('addplacesconfirm')});
        const form = modal.getRoot()[0].querySelector(selectors.form);
        modal.getRoot().on(ModalEvents.save, (event) => {
            const wheres = wheresOf(form);
            const error = form.querySelector(selectors.error);
            if (wheres.length === 0) {
                event.preventDefault();
                error.hidden = false;
                error.textContent = text('wherechoose');
                return;
            }
            onAdd(wheres, form.querySelector(selectors.copy).checked);
        });
        modal.getRoot().on(ModalEvents.shown, () => {
            KINDS.forEach((kind) => AutoComplete.enhance(
                selectors.placesSelect(kind),
                false,
                'local_iconrestyle/places/locations',
                text('placesplaceholder'),
                false,
                true,
                text('placesnone')
            ));
        });
        bindFormListeners(form, () => syncKind(form));
        syncKind(form);
        modal.show();
    };

    bindPlacesListeners(root, {
        onPick,
        onRemove,
        onOpen: open,
        onCopyMode: () => onAdd(others().map((mode) => ({...activeWhere(), mode})), true, true),
    });

    return {render};
};
