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
 * The icon designer: creates the components of the page and connects them to the state.
 *
 * Every component keeps to its own markup and its own events and talks to the others only through the callbacks given here,
 * so each one maps to a component of its own when the designer moves to React.
 *
 * @module     local_iconrestyle/designer/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Notification from 'core/notification';
import {add as addToast} from 'core/toast';
import selectors from 'local_iconrestyle/designer/selectors';
import {applyStylesheet} from 'local_iconrestyle/designer/stylesheet';
import {bindLayout} from 'local_iconrestyle/designer/listeners';
import {createText} from 'local_iconrestyle/common/text';
import {createState} from 'local_iconrestyle/state/index';
import {createAutosave} from 'local_iconrestyle/autosave/index';
import {createToolbar} from 'local_iconrestyle/toolbar/index';
import {createGrid} from 'local_iconrestyle/grid/index';
import {createPreview} from 'local_iconrestyle/preview/index';
import {createColourFields} from 'local_iconrestyle/colour/index';
import {createInspector} from 'local_iconrestyle/inspector/index';
import {createPlaces} from 'local_iconrestyle/places/index';
import {createExchange} from 'local_iconrestyle/exchange/index';
import {createSelection} from 'local_iconrestyle/selection/index';
import {useIconArtwork} from 'local_iconrestyle/inspector/services';
import {NO_ARTWORK} from 'local_iconrestyle/inspector/presets';
import {createFilters} from 'local_iconrestyle/filters/index';
import {filterIcons, sortIcons} from 'local_iconrestyle/lib/filter';
import {appearanceOf, needsOwnArtwork, pickLook} from 'local_iconrestyle/lib/draft';

/**
 * Note a moment of the start-up in the performance timeline of the browser, where tests and developers can read it.
 *
 * @param {string} name Name of the moment.
 */
const mark = (name) => {
    if (window.performance && typeof window.performance.mark === 'function') {
        window.performance.mark(name);
    }
};

/**
 * Start the designer.
 *
 * The settings and text come from the server in a data attribute of the root element.
 */
export const init = () => {
    const root = document.querySelector(selectors.root);
    if (!root) {
        return;
    }
    mark('irs:init');
    const config = JSON.parse(root.dataset.config);
    const text = createText(config.strings);
    const modes = config.colourmodes || [];
    const state = createState(config.everywhere, modes.length > 0 ? modes : ['all']);
    const filters = {
        query: '', kinds: [], components: [], purposes: [], traits: [], places: [], modes: [], sort: 'catalogue',
    };
    const pendingArtwork = new Set();
    let selected = null;
    let active = null;
    let filtered = [];
    let rendered = false;
    let waiting = new Set();

    bindLayout(root);

    const refilter = () => {
        const modified = state.modifiedKeys();
        const wantsTraits = filters.traits.length > 0 || filters.places.length > 0 || filters.modes.length > 0;
        const traits = wantsTraits ? state.traits() : null;
        const none = new Set();
        filtered = sortIcons(filterIcons(state.icons(), {
            ...filters, modified, traitsOf: (key) => (traits && traits.get(key)) || none,
        }), filters.sort, modified);
        toolbar.setCount(filtered.length);
    };

    const modeNow = () => (modes.length > 0 ? preview.surface() : 'all');

    const refreshInspector = () => {
        const icon = state.icon(selected);
        inspector.show(Boolean(icon));
        if (!icon) {
            preview.hide();
            return;
        }
        const draft = state.draftOf(active);
        const customised = state.isSaved(active) || state.isPending(active);
        inspector.render(icon, draft, {
            customised,
            removable: customised || active !== state.everywhereKey(selected, modeNow()),
        });
        colour.render(draft, icon.kind === 'container');
        colour.showContrast(draft, preview.surface());
        places.render();
        preview.show(icon);
        preview.update(icon, customised ? draft : null);
    };

    const refresh = () => {
        refilter();
        refreshInspector();
        toolbar.setHistory({canUndo: state.canUndo(), canRedo: state.canRedo()});
        grid.render();
    };

    const select = (key) => {
        if (key === null && selection.mode() === 'copy') {
            selection.stop();
        }
        const wasOpen = selected !== null;
        selected = key;
        active = key ? state.everywhereKey(key, modeNow()) : null;
        refreshInspector();
        if (wasOpen !== (key !== null)) {
            window.requestAnimationFrame(() => grid.render());
        } else {
            grid.render();
        }
    };

    const showWhere = (key) => {
        const mode = state.whereOfKey(key).mode;
        if (modes.includes(mode)) {
            preview.setSurface(mode);
        }
    };

    const ensureArtwork = async(key) => {
        if (pendingArtwork.has(key)) {
            return;
        }
        pendingArtwork.add(key);
        try {
            const asset = await useIconArtwork(state.slotOf(key));
            state.stage(key, {assetid: asset.id, asseturl: asset.url, assetkind: asset.kind, assetmono: true, autoartwork: true});
            autosave.schedule(true);
        } catch (error) {
            addToast(text('artworkfailed'), {type: 'warning'});
        } finally {
            pendingArtwork.delete(key);
            refresh();
        }
    };

    const stage = (patch, continuous = false) => {
        if (!active) {
            return;
        }
        const clean = {...patch};
        ['bc', 'sc', 'bg2', 'oc'].forEach((name) => {
            if (clean[name] === '') {
                clean[name] = null;
            }
        });
        let changed = state.stage(active, clean);
        const icon = state.icon(selected);
        const draft = state.draftOf(active);
        if (needsOwnArtwork(draft, icon.kind)) {
            ensureArtwork(active);
        } else if (icon.kind === 'image' && 'fg' in clean && clean.fg === '' && draft.autoartwork) {
            changed = state.stage(active, NO_ARTWORK) || changed;
        }
        if (!changed) {
            return;
        }
        autosave.schedule(!continuous);
        refresh();
    };

    const history = (step) => {
        step();
        refresh();
        autosave.schedule(true);
    };

    const toolbar = createToolbar(root, {
        text,
        onFilter: (patch) => {
            Object.assign(filters, patch);
            refilter();
            grid.render();
        },
        onUndo: () => history(state.undo),
        onRedo: () => history(state.redo),
        onSave: () => autosave.flushAll(),
    });

    const preview = createPreview(root, {
        text,
        modes,
        modeLabels: config.labels.modes,
        onSurface: (mode) => {
            const where = active === null ? null : state.whereOfKey(active);
            if (where !== null && modes.length > 0 && where.mode !== mode) {
                active = state.addVariant(selected, {...where, mode});
                refreshInspector();
                return;
            }
            colour.showContrast(active ? state.draftOf(active) : null, preview.surface());
        },
    });

    const colour = createColourFields(root, {
        text,
        specials: config.specials,
        onChange: (name, value, continuous) => stage({[name]: value}, continuous),
    });

    const inspector = createInspector(root, {
        text,
        draft: () => state.draftOf(active),
        onStage: stage,
        onClose: () => select(null),
        onRemoveVariant: () => {
            state.remove(active);
            active = state.everywhereKey(selected, modeNow());
            refresh();
            autosave.schedule(true);
        },
    });

    const places = createPlaces(root, {
        labels: config.labels,
        everywhere: config.everywhere,
        modes,
        currentMode: modeNow,
        pages: config.pages,
        regions: config.regions,
        text,
        variants: () => (selected ? state.variants(selected) : []),
        activeKey: () => active,
        activeWhere: () => state.whereOfKey(active),
        onPick: (key) => {
            active = key;
            showWhere(key);
            refreshInspector();
        },
        onRemove: (key) => {
            state.remove(key);
            if (key === active) {
                active = state.everywhereKey(selected, modeNow());
            }
            refresh();
            autosave.schedule(true);
        },
        onAdd: (wheres, copy, stay = false) => {
            const source = copy ? appearanceOf(state.draftOf(active)) : null;
            const keep = active;
            wheres.forEach((where) => {
                active = state.addVariant(selected, where);
                if (source) {
                    state.stage(active, source);
                }
            });
            autosave.schedule(true);
            if (stay) {
                active = keep;
                addToast(text('copied', wheres.map((where) => config.labels.modes[where.mode] || where.mode).join(', ')), {
                    type: 'success',
                });
            } else {
                showWhere(active);
            }
            refresh();
        },
    });

    const grid = createGrid(root, {
        items: () => filtered,
        isSelected: (key) => key === selected,
        isModified: (key) => state.modifiedKeys().has(key),
        isPicking: () => selection.active(),
        isPicked: (key) => selection.isPicked(key),
        isPickable: (key) => selection.isPickable(key),
        onSelect: (key, range) => (selection.active() ? selection.toggle(key, range) : select(key)),
        onMove: (direction) => {
            if (selection.active()) {
                return;
            }
            const next = grid.neighbour(selected, direction);
            if (next) {
                select(next);
                grid.scrollTo(next);
            }
        },
        onRender: () => {
            const icon = state.icon(selected);
            preview.mountCard(icon ? grid.selectedCardIcon() : null, icon);
            const cards = [];
            new Set([...waiting, ...state.pendingSlots()]).forEach((key) => {
                const host = key === selected ? null : grid.cardIconOf(key);
                if (host && state.icon(key)) {
                    cards.push({host, icon: state.icon(key)});
                }
            });
            preview.mountHeld(cards);
            if (!rendered) {
                rendered = true;
                mark('irs:rendered');
            }
        },
    });

    preview.followColourMode();

    const filterPanel = createFilters(root, {
        text,
        modeLabels: modes.length > 0 ? config.labels.modes : {},
        onChange: (patch) => {
            Object.assign(filters, patch);
            refilter();
            grid.render();
        },
    });

    const copyLook = async(slots, groups) => {
        const where = state.whereOfKey(active);
        const look = pickLook(state.draftOf(active), groups);
        const keys = slots.map((slot) => state.addVariant(slot, where));
        const changed = state.stageMany(keys.map((key) => ({key, patch: look})));
        autosave.schedule(true);
        refresh();
        addToast(text('copylookdone', changed), {type: 'success'});
        for (const key of keys) {
            if (needsOwnArtwork(state.draftOf(key), state.icon(state.slotOf(key)).kind)) {
                await ensureArtwork(key);
            }
        }
        return true;
    };

    const copyModes = async(slots, from, to, overwrite) => {
        const entries = [];
        let skipped = 0;
        slots.forEach((slot) => {
            state.variants(slot).filter(({where}) => where.mode === from).forEach(({key, where}) => {
                const target = state.keyFor(slot, {...where, mode: to});
                if (!overwrite && (state.isSaved(target) || state.isPending(target))) {
                    skipped++;
                    return;
                }
                entries.push({key: state.addVariant(slot, {...where, mode: to}), patch: appearanceOf(state.draftOf(key))});
            });
        });
        const changed = state.stageMany(entries);
        autosave.schedule(true);
        refresh();
        addToast(text('copymodesdone', {copied: changed, skipped, from: config.labels.modes[from], to: config.labels.modes[to]}), {
            type: changed > 0 ? 'success' : 'warning',
        });
        return true;
    };

    const selection = createSelection(root, {
        text,
        defaults: config.defaults,
        modeLabels: modes.length > 1 ? config.labels.modes : {},
        currentMode: modeNow,
        onCopyModes: copyModes,
        items: () => filtered,
        isPickable: (mode, key, from) => (mode === 'export' ? state.modifiedKeys().has(key) : key !== from),
        onChange: () => grid.render(),
        onStart: (mode) => {
            if (mode === 'export') {
                select(null);
            }
        },
        source: () => selected,
        onExport: (keys) => exchange.exportSlots(keys),
        onCopy: copyLook,
    });

    const exchange = createExchange(root, {
        text,
        defaults: config.defaults,
        save: () => autosave.flushAll(),
        onImported: async(report) => {
            await state.reloadRules();
            refresh();
            applyStylesheet(report.stylesheeturl, () => grid.render());
        },
    });

    const autosave = createAutosave({
        flush: state.flush,
        pendingCount: state.pendingCount,
        onStatus: (name) => {
            if (name === 'saving') {
                waiting = new Set([...waiting, ...state.pendingSlots()]);
            }
            toolbar.setStatus(name);
        },
        onSaved: (result) => {
            if (result.stylesheeturl === null) {
                waiting = new Set();
                return;
            }
            const covered = new Set(waiting);
            applyStylesheet(result.stylesheeturl, () => {
                covered.forEach((key) => waiting.delete(key));
                grid.render();
            });
        },
        onFailure: async(error) => {
            const reason = error.timedout ? text('savetimeout') : (error.message || '');
            addToast(text('savefailed', reason), {type: 'danger', autohide: false, closeButton: true});
            await state.reloadRules();
            refresh();
        },
    });

    state.load().then(() => {
        mark('irs:loaded');
        filterPanel.populate(state.icons());
        toolbar.showLoaded();
        refresh();
        return null;
    }).catch(Notification.exception);
};
