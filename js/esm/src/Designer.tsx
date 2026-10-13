// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * The icon designer: one grid of every icon that can be customised, a panel to edit the open one and the tools to filter,
 * choose, copy, export and import.
 *
 * Mounted by core/react_autoinit from the data-react-component that the page writes. Every part keeps to its own markup and talks
 * to the others only through the properties given here.
 *
 * @module     local_iconrestyle/Designer
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react';
import FiltersPanel from './components/FiltersPanel';
import Grid from './components/Grid';
import ImportModal from './components/ImportModal';
import Inspector from './components/Inspector';
import PlacesModal from './components/places/PlacesModal';
import PreviewPanel, {type PreviewView} from './components/PreviewPanel';
import SelectionBar from './components/SelectionBar';
import Toolbar from './components/Toolbar';
import {createAutosave, type Autosave, type SaveStatus} from './engine/autosave';
import {download} from './engine/download';
import {createState, type DesignerState} from './engine/state';
import {applyStylesheet} from './engine/stylesheet';
import {createText} from './engine/text';
import {addToast} from './engine/toast';
import {usePageColourMode} from './hooks/usePageColourMode';
import {usePreviewCss} from './hooks/usePreviewCss';
import {useSelection, type SelectionMode} from './hooks/useSelection';
import {appearanceOf, needsOwnArtwork, pickLook} from './lib/draft';
import {filterIcons, sortIcons} from './lib/filter';
import {NO_ARTWORK} from './lib/presets';
import {deriveView} from './lib/view';
import * as api from './services/api';
import type {DesignerProps, Filters, ImportReport, Patch, Where} from './types';

const MAX_BYTES = 20 * 1024 * 1024;
const NO_TRAITS = new Set<string>();

/**
 * Note a moment of the start-up in the performance timeline of the browser, where tests and developers can read it.
 *
 * @param name Name of the moment.
 */
const mark = (name: string): void => {
    if (window.performance && typeof window.performance.mark === 'function') {
        window.performance.mark(name);
    }
};

/**
 * The icon designer.
 *
 * @param props What the server gives the designer to start from: the settings and the text.
 * @returns The designer.
 */
export default function Designer(props: DesignerProps) {
    const {everywhere, labels, specials, ranges} = props;
    const modes = props.colourmodes;
    const text = useMemo(() => createText(props.strings), [props.strings]);
    const [tick, refresh] = useReducer((count: number) => count + 1, 0);
    const [loaded, setLoaded] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [active, setActive] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>({
        query: '', kinds: [], components: [], purposes: [], traits: [], places: [], modes: [], sort: 'catalogue',
    });
    const [status, setStatus] = useState<SaveStatus>('saved');
    const [surface, setSurface] = useState('light');
    const [previewView, setPreviewView] = useState<PreviewView>('edited');
    const [stylesheetVersion, bumpStylesheet] = useReducer((count: number) => count + 1, 0);
    const [review, setReview] = useState<{content: string; first: ImportReport} | null>(null);
    const [placesOpen, setPlacesOpen] = useState(false);
    const pageMode = usePageColourMode();
    const root = useRef<HTMLDivElement>(null);
    const waiting = useRef(new Set<string>());
    const pendingArtwork = useRef(new Set<string>());

    const stateRef = useRef<DesignerState | null>(null);
    stateRef.current ??= createState(everywhere, modes.length > 0 ? modes : ['all']);
    const state = stateRef.current;

    const autosaveRef = useRef<Autosave | null>(null);
    autosaveRef.current ??= createAutosave({
        flush: state.flush,
        pendingCount: state.pendingCount,
        onStatus: (name) => {
            if (name === 'saving') {
                waiting.current = new Set([...waiting.current, ...state.pendingSlots()]);
            }
            setStatus(name);
        },
        onSaved: (result) => {
            if (result.stylesheeturl === null) {
                waiting.current = new Set();
                return;
            }
            const covered = new Set(waiting.current);
            applyStylesheet(result.stylesheeturl, () => {
                covered.forEach((key) => waiting.current.delete(key));
                bumpStylesheet();
            });
        },
        onFailure: async(error) => {
            const reason = (error as {timedout?: boolean}).timedout ? text('savetimeout') : (error.message || '');
            void addToast(text('savefailed', reason), {type: 'danger', autohide: false, closeButton: true});
            await state.reloadRules();
            refresh();
        },
    });
    const autosave = autosaveRef.current;

    useEffect(() => {
        mark('irs:init');
        state.load().then(() => {
            mark('irs:loaded');
            setLoaded(true);
            return null;
        }).catch((error: Error) => void addToast(text('exchangefailed', error.message), {type: 'danger'}));
        return () => autosave.dispose();
        // The designer loads once.
    }, []);

    useEffect(() => {
        const element = root.current;
        if (!element) {
            return undefined;
        }
        const fit = (): void => {
            element.style.setProperty('--irs-top', `${element.getBoundingClientRect().top + window.pageYOffset}px`);
        };
        fit();
        window.addEventListener('resize', fit);
        return () => window.removeEventListener('resize', fit);
    }, []);

    const modeNow = (): string => (modes.length > 0 ? surface : 'all');

    const icons = state.icons();
    const modified = state.modifiedKeys();
    const filtered = useMemo(() => {
        const wantsTraits = filters.traits.length > 0 || filters.places.length > 0 || filters.modes.length > 0;
        const traits = wantsTraits ? state.traits() : null;
        return sortIcons(filterIcons(icons, {
            ...filters, modified, traitsOf: (key) => traits?.get(key) ?? NO_TRAITS,
        }), filters.sort, modified);
        // The state changes under the same object, which tick stands for.
    }, [icons, filters, tick, loaded]);

    const icon = state.icon(selected);
    const draft = icon && active ? state.draftOf(active) : null;
    const customised = active !== null && (
        state.isSaved(active) || state.isPending(active) ||
        state.isInherited(active)
    );
    const preview = usePreviewCss(icon, customised ? draft : null);

    const select = (key: string | null): void => {
        if (key === null && selection.mode === 'copy') {
            selection.stop();
        }
        setSelected(key);
        setActive(key ? state.everywhereKey(key, modeNow()) : null);
        refresh();
    };

    const ensureArtwork = async(key: string): Promise<void> => {
        if (pendingArtwork.current.has(key)) {
            return;
        }
        pendingArtwork.current.add(key);
        try {
            const asset = await api.useIconArtwork(state.slotOf(key));
            state.stage(key, {assetid: asset.id, asseturl: asset.url, assetkind: asset.kind, assetmono: true, autoartwork: true});
            autosave.schedule(true);
        } catch {
            void addToast(text('artworkfailed'), {type: 'warning'});
        } finally {
            pendingArtwork.current.delete(key);
            refresh();
        }
    };

    const stage = (patch: Patch, continuous = false): void => {
        if (!active || !icon) {
            return;
        }
        const clean: Patch = {...patch};
        ['bc', 'sc', 'bg2', 'oc'].forEach((name) => {
            if (clean[name] === '') {
                clean[name] = null;
            }
        });
        let changed = state.stage(active, clean);
        const now = state.draftOf(active);
        if (needsOwnArtwork(now, icon.kind)) {
            void ensureArtwork(active);
        } else if (icon.kind === 'image' && 'fg' in clean && clean.fg === '' && now.autoartwork) {
            changed = state.stage(active, NO_ARTWORK) || changed;
        }
        if (!changed) {
            return;
        }
        autosave.schedule(!continuous);
        refresh();
    };

    const history = (step: () => void): void => {
        step();
        refresh();
        autosave.schedule(true);
    };

    const showWhere = (key: string): void => {
        const mode = state.whereOfKey(key).mode;
        if (modes.includes(mode)) {
            setSurface(mode);
        }
    };

    const changeSurface = (name: string): void => {
        setSurface(name);
        const where = active === null ? null : state.whereOfKey(active);
        if (selected !== null && where !== null && modes.length > 0 && where.mode !== name) {
            setActive(state.addVariant(selected, {...where, mode: name}));
            refresh();
        }
    };

    useEffect(() => {
        if (modes.length > 0 && pageMode && modes.includes(pageMode.applied)) {
            changeSurface(pageMode.applied);
        }
        // Only a change of the colour mode of the page moves the surface.
    }, [pageMode?.applied]);

    const fail = (error: Error): void => void addToast(
        text('exchangefailed', error.message || ''),
        {type: 'danger', closeButton: true},
    );

    const exportSlots = async(slots: string[]): Promise<boolean> => {
        try {
            await autosave.flushAll();
            const result = await api.exportRules(slots);
            download(result.filename, result.content);
            void addToast(slots.length > 0 ? text('exportdone', slots.length) : text('exportdoneall'), {type: 'success'});
            if (result.skipped.length > 0) {
                void addToast(text('exportskipped', result.skipped.length), {type: 'warning', closeButton: true});
            }
            return true;
        } catch (error) {
            fail(error as Error);
            return false;
        }
    };

    const readFile = (file: File): void => {
        if (file.size > MAX_BYTES) {
            void addToast(text('importtoobig'), {type: 'danger', closeButton: true});
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const content = String(reader.result);
            autosave.flushAll().then(() => api.importRules(content, 'merge', true)).then((first) => {
                if (first.entries.some((entry) => entry.created + entry.updated > 0)) {
                    setReview({content, first});
                } else {
                    void addToast(text('importempty'), {type: 'warning', closeButton: true});
                }
                return null;
            }).catch((error: Error) => fail(error));
        };
        reader.readAsText(file);
    };

    const imported = async(report: ImportReport): Promise<void> => {
        void addToast(text('importdone', {
            created: report.created, updated: report.updated, deleted: report.deleted, skipped: report.skipped,
        }), {type: 'success', closeButton: true});
        await state.reloadRules();
        refresh();
        applyStylesheet(report.stylesheeturl, bumpStylesheet);
    };

    const copyLook = async(slots: string[], groups: string[]): Promise<boolean> => {
        if (active === null) {
            return false;
        }
        const where = state.whereOfKey(active);
        const look = pickLook(state.draftOf(active), groups);
        const keys = slots.map((slot) => state.addVariant(slot, where));
        const changed = state.stageMany(keys.map((key) => ({key, patch: look})));
        autosave.schedule(true);
        refresh();
        void addToast(text('copylookdone', changed), {type: 'success'});
        for (const key of keys) {
            const target = state.icon(state.slotOf(key));
            if (target && needsOwnArtwork(state.draftOf(key), target.kind)) {
                await ensureArtwork(key);
            }
        }
        return true;
    };

    const copyModes = (slots: string[], from: string, to: string, overwrite: boolean): Promise<boolean> => {
        const entries: Array<{key: string; patch: Patch}> = [];
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
        const names = {copied: changed, skipped, from: labels.modes[from] ?? from, to: labels.modes[to] ?? to};
        void addToast(text('copymodesdone', names), {type: changed > 0 ? 'success' : 'warning'});
        return Promise.resolve(true);
    };

    const selection = useSelection({
        defaults: props.defaults,
        modeNames: modes.length > 1 ? modes : [],
        currentMode: modeNow,
        items: () => filtered,
        isPickable: (mode: SelectionMode, key: string, from: string | null) => (mode === 'copy' ? key !== from : modified.has(key)),
        source: () => selected,
        onStart: (mode) => {
            if (mode === 'export') {
                select(null);
            }
        },
        onExport: exportSlots,
        onCopy: copyLook,
        onCopyModes: copyModes,
    });

    useEffect(() => {
        const element = root.current;
        if (!element) {
            return undefined;
        }
        const escape = (event: KeyboardEvent): void => {
            if (event.key === 'Escape' && selection.mode !== null && !(event.target as HTMLElement).closest('.modal')) {
                selection.stop();
            }
        };
        element.addEventListener('keydown', escape);
        return () => element.removeEventListener('keydown', escape);
    });

    const view = deriveView({
        state, selected, active, customised, modes, labels, surface, modeNow: modeNow(), pageMode, text,
        selecting: selection.mode !== null,
    });

    const addPlaces = (wheres: Where[], copy: boolean, stay = false): void => {
        if (selected === null || active === null) {
            return;
        }
        const source = copy ? appearanceOf(state.draftOf(active)) : null;
        const keep = active;
        let last = active;
        wheres.forEach((where) => {
            last = state.addVariant(selected, where);
            if (source) {
                state.stage(last, source);
            }
        });
        autosave.schedule(true);
        if (stay) {
            setActive(keep);
            const names = wheres.map((where) => labels.modes[where.mode] || where.mode).join(', ');
            void addToast(text('copied', names), {type: 'success'});
        } else {
            setActive(last);
            showWhere(last);
        }
        refresh();
    };

    const removeVariant = (key: string): void => {
        state.remove(key);
        if (selected !== null && key === active) {
            setActive(state.everywhereKey(selected, modeNow()));
        }
        refresh();
        autosave.schedule(true);
    };

    const cardCss = useCallback((key: string): string | null => {
        if (key === selected) {
            return preview.css === '' ? null : preview.css;
        }
        if (waiting.current.has(key) || state.pendingSlots().has(key)) {
            return preview.held.get(key) || null;
        }
        return null;
    }, [selected, preview.css, preview.held, state, tick, stylesheetVersion]);

    const pickVariant = (key: string): void => {
        setActive(key);
        showWhere(key);
        refresh();
    };

    const copyToOtherModes = (): void => {
        if (view.activeWhere) {
            addPlaces(view.others.map((mode) => ({...view.activeWhere as Where, mode})), true, true);
        }
    };

    const toggleSelection = (kind: SelectionMode): void => (selection.mode === kind ? selection.stop() : selection.start(kind));

    const panel = icon && draft ? <PreviewPanel icon={icon} css={preview.css} waiting={preview.waiting} view={previewView}
        surface={surface} modes={modes} note={view.note} foreground={draft.fg} text={text} onView={setPreviewView}
        onSurface={changeSurface} /> : null;

    return <div className={view.rootClass} data-region="designer" ref={root}>
        <div className={icon ? 'irs-layout irs-open' : 'irs-layout'} data-region="layout">
            <section className="irs-browser" aria-label={text('iconlist')}>
                <Toolbar adminurl={props.adminurl} query={filters.query} count={filtered.length} status={status}
                    canUndo={state.canUndo()} canRedo={state.canRedo()} selecting={selection.mode === 'export'} text={text}
                    onQuery={(query) => setFilters({...filters, query})} onUndo={() => history(state.undo)}
                    onRedo={() => history(state.redo)} onSave={() => void autosave.flushAll()}
                    onSelect={() => toggleSelection('export')} onExportAll={() => void exportSlots([])} onFile={readFile}
                    filters={<FiltersPanel icons={icons} filters={filters} modes={view.filterModes} text={text}
                        onChange={(patch) => setFilters({...filters, ...patch})} />} />
                <Grid items={filtered} selected={selected} modified={modified} picking={selection.mode !== null}
                    isPicked={selection.isPicked} isPickable={selection.isPickable} cardCss={cardCss} theme={view.theme}
                    text={text} stylesheetVersion={stylesheetVersion}
                    onSelect={(key, range) => (selection.mode === null ? select(key) : selection.toggle(key, range))}
                    onMove={select} onFirstRender={() => mark('irs:rendered')} />
                <SelectionBar selection={selection} modeLabels={view.selectionModes} text={text} />
                <p className="irs-empty" data-region="empty" hidden={!loaded || filtered.length > 0}>{text('noicons')}</p>
                <p className="irs-loading" data-region="loading" hidden={loaded}>{text('loading')}</p>
            </section>
            <Inspector icon={icon} draft={draft} customised={customised} removable={view.removable} variants={view.variants}
                otherModes={view.others.length} ranges={ranges} specials={specials} copying={selection.mode === 'copy'}
                text={text} preview={panel}
                onProp={(prop, value, continuous = false) => stage({[prop]: value}, continuous)}
                onStage={stage} onClose={() => select(null)} onCopyLook={() => toggleSelection('copy')}
                onRemoveVariant={() => active !== null && removeVariant(active)} onPickVariant={pickVariant}
                onRemoveVariantChip={removeVariant} onAddPlaces={() => setPlacesOpen(true)} onCopyMode={copyToOtherModes} />
        </div>
        {placesOpen && <PlacesModal text={text} everywhere={everywhere} pages={props.pages} regions={props.regions}
            modes={modes.map((mode) => ({value: mode, label: labels.modes[mode] || mode}))} currentMode={modeNow()}
            onAdd={(wheres, copy) => {
                setPlacesOpen(false);
                addPlaces(wheres, copy);
            }}
            onClose={() => setPlacesOpen(false)} />}
        {review && <ImportModal content={review.content} first={review.first} defaults={props.defaults} text={text}
            onClose={() => setReview(null)} onFailure={fail} onImported={(report) => void imported(report)} />}
    </div>;
}
