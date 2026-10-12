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
 * Export the customisations of the site to a file and import them from one, on this site or another.
 *
 * Exporting takes everything or the icons that were chosen in the grid. Importing first reads the package, lists the icons in
 * it with what would happen to each, lets the person choose all or some of them and how to import them, and changes nothing
 * until the person confirms.
 *
 * @module     local_iconrestyle/exchange/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import ModalEvents from 'core/modal_events';
import {add as addToast} from 'core/toast';
import selectors from 'local_iconrestyle/exchange/selectors';
import * as services from 'local_iconrestyle/exchange/services';
import {bindExchangeListeners, bindReviewListeners} from 'local_iconrestyle/exchange/listeners';
import {renderImportBody, showReport, showRows} from 'local_iconrestyle/exchange/templates';
import {createModal} from 'local_iconrestyle/common/modal';

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_ROWS = 200;
const PREVIEW_DELAY = 300;

/**
 * How an icon of the package shows in the list.
 *
 * @param {{slot: string, created: number, updated: number, skipped: number}} entry What happens to the icon.
 * @param {Set<string>} chosen Icons that are chosen.
 * @returns {object} Template context of one row.
 */
const rowOf = (entry, chosen) => {
    const usable = entry.created + entry.updated > 0;
    return {
        slot: entry.slot,
        rules: entry.created + entry.updated + entry.skipped,
        isnew: usable && entry.updated === 0,
        updates: entry.updated > 0,
        skipped: !usable,
        disabled: !usable,
        checked: usable && chosen.has(entry.slot),
    };
};

/**
 * Create the export and import controls.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} options text(name, value), defaults (importmode and importchoose, which the site chose in the settings),
 *     save() that writes every change that waits, and onImported(report), which is called after an import changed the site.
 * @returns {{exportSlots: Function}} exportSlots(keys) exports some icons and resolves with true when the file was made.
 */
export const createExchange = (root, options) => {
    const {text, defaults, save, onImported} = options;

    const download = (filename, content) => {
        const url = window.URL.createObjectURL(new window.Blob([content], {type: 'text/plain;charset=utf-8'}));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    };

    const fail = (error) => addToast(text('exchangefailed', error.message || ''), {type: 'danger', closeButton: true});

    const exportSlots = async(slots) => {
        try {
            await save();
            const result = await services.exportRules(slots);
            download(result.filename, result.content);
            addToast(slots.length > 0 ? text('exportdone', slots.length) : text('exportdoneall'), {type: 'success'});
            if (result.skipped.length > 0) {
                addToast(text('exportskipped', result.skipped.length), {type: 'warning', closeButton: true});
            }
            return true;
        } catch (error) {
            fail(error);
            return false;
        }
    };

    const review = async(content, first) => {
        const entries = first.entries;
        const usable = entries.filter((entry) => entry.created + entry.updated > 0);
        if (usable.length === 0) {
            addToast(text('importempty'), {type: 'warning', closeButton: true});
            return;
        }
        const total = usable.length;
        const wanted = {all: () => true, 'new': (entry) => entry.updated === 0, none: () => false}[defaults.importchoose];
        const chosen = new Set(usable.filter(wanted).map((entry) => entry.slot));
        const rules = entries.reduce((sum, entry) => sum + entry.created + entry.updated + entry.skipped, 0);
        let mode = defaults.importmode;
        let query = '';
        let token = 0;
        let timer = 0;
        const modal = await createModal({
            title: text('importtitle'),
            body: await renderImportBody({
                summary: text('importsummary', {icons: entries.length, rules, assets: first.assets}),
                report: first,
            }),
            save: text('importconfirm'),
        });
        const form = modal.getRoot()[0].querySelector(selectors.form);
        const find = (selector) => form.querySelector(selector);
        form.querySelector(`${selectors.modes}[value="${mode}"]`).checked = true;
        const slotsParam = () => (chosen.size === total ? [] : [...chosen]);

        const drawRows = async() => {
            const words = query.toLowerCase().split(/\s+/).filter((word) => word !== '');
            const found = entries.filter((entry) => words.every((word) => entry.slot.toLowerCase().includes(word)));
            await showRows(find(selectors.rows), {
                rows: found.slice(0, MAX_ROWS).map((entry) => rowOf(entry, chosen)),
                more: found.length > MAX_ROWS ? text('importmore', MAX_ROWS) : '',
                none: found.length === 0,
            });
        };
        const drawCount = () => {
            find(selectors.count).textContent = text('importchosen', {chosen: chosen.size, total});
            const replaceHelp = chosen.size === total ? 'importreplacehelp' : 'importreplacechosenhelp';
            find(selectors.modeHelp).textContent = text(mode === 'merge' ? 'importmergehelp' : replaceHelp);
            find(selectors.error).hidden = true;
        };
        const preview = async() => {
            const mine = ++token;
            const target = find(selectors.report);
            if (chosen.size === 0) {
                target.replaceChildren();
                return;
            }
            try {
                const report = await services.importRules(content, mode, true, slotsParam());
                if (mine === token) {
                    await showReport(target, report);
                }
            } catch (error) {
                fail(error);
            }
        };
        const changed = (redraw) => {
            drawCount();
            if (redraw) {
                drawRows();
            }
            window.clearTimeout(timer);
            timer = window.setTimeout(preview, PREVIEW_DELAY);
        };
        const choose = (wanted) => {
            chosen.clear();
            usable.filter(wanted).forEach((entry) => chosen.add(entry.slot));
            changed(true);
        };

        bindReviewListeners(form, {
            onMode: (value) => {
                mode = value;
                changed(false);
            },
            onSearch: (value) => {
                query = value;
                drawRows();
            },
            onAll: () => choose(() => true),
            onNew: () => choose((entry) => entry.updated === 0),
            onNone: () => choose(() => false),
            onToggle: (slot, checked) => {
                chosen[checked ? 'add' : 'delete'](slot);
                changed(false);
            },
        });
        modal.getRoot().on(ModalEvents.save, async(event) => {
            if (chosen.size === 0) {
                event.preventDefault();
                const error = find(selectors.error);
                error.hidden = false;
                error.textContent = text('importnothing');
                return;
            }
            try {
                const report = await services.importRules(content, mode, false, slotsParam());
                addToast(text('importdone', report), {type: 'success', closeButton: true});
                onImported(report);
            } catch (error) {
                fail(error);
            }
        });
        drawCount();
        drawRows();
        if (mode !== 'merge' || chosen.size !== total) {
            preview();
        }
        modal.show();
    };

    const readFile = (file) => {
        if (file.size > MAX_BYTES) {
            addToast(text('importtoobig'), {type: 'danger', closeButton: true});
            return;
        }
        const reader = new window.FileReader();
        reader.onload = async() => {
            try {
                await save();
                const content = String(reader.result);
                await review(content, await services.importRules(content, 'merge', true));
            } catch (error) {
                fail(error);
            }
        };
        reader.readAsText(file);
    };

    bindExchangeListeners(root, {
        onExport: () => exportSlots([]),
        onImport: () => root.querySelector(selectors.file).click(),
        onFile: readFile,
    });
    return {exportSlots};
};
