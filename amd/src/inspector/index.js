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
 * The editing panel of the icon that is open: its sliders, shapes, looks, artwork and tabs.
 *
 * @module     local_iconrestyle/inspector/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/inspector/selectors';
import * as services from 'local_iconrestyle/inspector/services';
import {bindInspectorListeners} from 'local_iconrestyle/inspector/listeners';
import {CLEAR_DESIGN, LOOKS, NO_ARTWORK, groupOf, sidesOf} from 'local_iconrestyle/inspector/presets';

const MAX_UPLOAD_BASE64 = 360000;

/**
 * Create the panel.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} options text(name, value), draft() that returns the draft being edited, and the handlers onStage(patch),
 *     onClose() and onRemoveVariant().
 * @returns {{show: Function, render: Function}} Panel API.
 */
export const createInspector = (root, options) => {
    const {text, draft, onStage, onClose, onRemoveVariant} = options;
    const find = (selector) => root.querySelector(selector);
    const linked = {padding: true, margin: true};
    const dismissed = new Set();
    let shown = null;

    const showHint = (message) => {
        const hint = find(selectors.artworkHint);
        hint.hidden = false;
        hint.classList.add('irs-error');
        hint.textContent = message;
    };

    const showTab = (name) => {
        root.querySelectorAll(selectors.tabs).forEach((tab) => {
            const on = tab.dataset.tab === name;
            tab.classList.toggle('irs-active', on);
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
            tab.tabIndex = on ? 0 : -1;
            find(selectors.tab(tab.dataset.tab)).hidden = !on;
        });
    };

    const showProps = (draft) => {
        root.querySelectorAll(selectors.flipButtons).forEach((button) => {
            button.setAttribute('aria-pressed', draft[button.dataset.flip] === 1 ? 'true' : 'false');
        });
        root.querySelectorAll(selectors.props).forEach((element) => {
            const prop = element.dataset.prop;
            const value = draft[prop];
            if (element.matches('input[type="range"]')) {
                element.value = value === null ? element.dataset.default : value;
                const number = find(selectors.number(prop));
                if (document.activeElement !== number) {
                    number.value = value === null ? '' : value;
                }
            } else if (element.matches('input[type="number"]')) {
                if (document.activeElement !== element) {
                    element.value = value === null ? '' : (value / 100).toFixed(2);
                }
            } else if (element.matches('select')) {
                element.value = value === null ? '' : value;
            } else {
                element.querySelectorAll('button').forEach((button) => {
                    button.setAttribute('aria-pressed', button.dataset.value === (value === null ? '' : value) ? 'true' : 'false');
                });
            }
        });
    };

    const upload = (file) => {
        const reader = new FileReader();
        reader.onload = async() => {
            const content = String(reader.result).split(',')[1] || '';
            if (content.length > MAX_UPLOAD_BASE64) {
                showHint(text('uploadfailed', file.name));
                return;
            }
            try {
                const asset = await services.addAsset(content);
                onStage({
                    assetid: asset.id,
                    asseturl: asset.url,
                    assetkind: asset.kind,
                    assetmono: asset.monochrome,
                    autoartwork: false,
                });
            } catch (error) {
                showHint(text('uploadfailed', error.message || file.name));
            }
        };
        reader.readAsDataURL(file);
    };

    bindInspectorListeners(root, {
        onProp: (prop, value, continuous) => {
            const group = groupOf(prop);
            onStage(group && linked[group] ? sidesOf(group, value) : {[prop]: value}, continuous);
        },
        onStage,
        onLook: (name) => {
            const look = LOOKS[name];
            const patch = look.keepDesign ? {} : {...CLEAR_DESIGN, ...look.design};
            const current = draft();
            Object.keys(look.colours || {}).forEach((colour) => {
                if (!current[colour]) {
                    patch[colour] = look.colours[colour];
                }
            });
            onStage({...patch, ...(look.force || {})});
        },
        onResetSides: (group) => onStage(sidesOf(group, null)),
        onToggleLink: (group, button) => {
            linked[group] = !linked[group];
            button.setAttribute('aria-pressed', linked[group] ? 'true' : 'false');
        },
        onRemoveArtwork: () => onStage(NO_ARTWORK),
        onTab: showTab,
        onClose,
        onDismissNotice: () => {
            dismissed.add(shown);
            find(selectors.sharedNotice).hidden = true;
        },
        onRemoveVariant,
        onUpload: upload,
    });

    return {
        /**
         * Show the panel, or hide it when no icon is open.
         *
         * @param {boolean} open Whether an icon is open.
         */
        show: (open) => {
            find(selectors.panel).hidden = !open;
            find(selectors.layout).classList.toggle('irs-open', open);
        },
        /**
         * Show an icon and the variant that is being edited.
         *
         * @param {object} icon Catalogue entry.
         * @param {object} draft Draft of the variant.
         * @param {{customised: boolean, removable: boolean}} flags Whether the variant is customised and whether it can be removed.
         */
        render: (icon, draft, flags) => {
            find(selectors.title).textContent = icon.key;
            find(selectors.origin).textContent = flags.customised ? text('originhere') : text('origindefault');
            find(selectors.removeVariant).hidden = !flags.removable;
            shown = icon.key;
            find(selectors.sharedNotice).hidden = icon.group < 2 || dismissed.has(icon.key);
            find(selectors.sharedNoticeText).textContent = icon.group < 2 ? '' : text('sharedglyph', icon.group);
            root.querySelectorAll(selectors.lookButtons).forEach((button) => {
                button.hidden = !button.dataset.kinds.split(' ').includes(icon.kind);
            });
            showProps(draft);
            const hasArtwork = draft.assetid > 0;
            find(selectors.removeArtwork).hidden = !hasArtwork;
            find(selectors.artworkChip).classList.toggle('irs-has-file', hasArtwork);
            find(selectors.artworkName).textContent = hasArtwork ?
                text('artworkready', draft.assetkind.toUpperCase()) : text('noartwork');
            const hint = find(selectors.artworkHint);
            hint.hidden = true;
            hint.classList.remove('irs-error');
        },
    };
};
