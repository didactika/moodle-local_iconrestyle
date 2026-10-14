/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Choosing icons in the grid itself, to export them, to copy the look of the open icon to them or to copy one colour mode to
 * another in them.
 *
 * While a choice is going on, a click on a card chooses it instead of opening it, a click with Shift chooses everything between
 * it and the last card chosen, and a bar floats over the grid with what can be done with the choice. Nothing is changed until
 * the person applies, and leaving the choice, with Esc or the cross, changes nothing.
 *
 * @module     local_iconrestyle/hooks/useSelection
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useCallback, useRef, useState} from 'react';
import type {DesignerProps, Icon} from '../types';

export type SelectionMode = 'export' | 'copy' | 'modes';

/** What the selection needs from the rest of the designer. */
export interface SelectionOptions {
    defaults: DesignerProps['defaults'];
    modeNames: string[];
    currentMode: () => string;
    items: () => Icon[];
    isPickable: (mode: SelectionMode, key: string, source: string | null) => boolean;
    source: () => string | null;
    onStart: (mode: SelectionMode) => void;
    onExport: (keys: string[]) => Promise<boolean>;
    onCopy: (keys: string[], groups: string[]) => Promise<boolean>;
    onCopyModes: (keys: string[], from: string, to: string, overwrite: boolean) => Promise<boolean>;
}

/** The controller of the selection. */
export interface Selection {
    mode: SelectionMode | null;
    from: string | null;
    picked: Set<string>;
    groups: string[];
    overwrite: boolean;
    fromMode: string;
    toMode: string;
    busy: boolean;
    start: (kind: SelectionMode) => void;
    stop: () => void;
    toggle: (key: string, range?: boolean) => void;
    all: () => void;
    none: () => void;
    setGroups: (groups: string[]) => void;
    setOverwrite: (overwrite: boolean) => void;
    setFromMode: (mode: string) => void;
    setToMode: (mode: string) => void;
    switchTo: (mode: SelectionMode) => void;
    apply: () => Promise<void>;
    isPicked: (key: string) => boolean;
    isPickable: (key: string) => boolean;
}

/**
 * The selection of icons.
 *
 * @param options What it needs from the rest of the designer.
 * @returns The controller.
 */
export const useSelection = (options: SelectionOptions): Selection => {
    const [mode, setMode] = useState<SelectionMode | null>(null);
    const [from, setFrom] = useState<string | null>(null);
    const [picked, setPicked] = useState<Set<string>>(new Set());
    const [groups, setGroups] = useState<string[]>(options.defaults.copygroups);
    const [overwrite, setOverwrite] = useState(options.defaults.copyoverwrite);
    const [fromMode, setFromMode] = useState('');
    const [toMode, setToMode] = useState('');
    const [busy, setBusy] = useState(false);
    const last = useRef<string | null>(null);
    const current = useRef<SelectionMode | null>(null);
    const latest = useRef(options);
    latest.current = options;

    const pickable = (key: string, kind: SelectionMode | null = mode, source: string | null = from): boolean => kind !== null &&
        latest.current.isPickable(kind, key, source);

    const stop = useCallback(() => {
        current.current = null;
        setMode(null);
        setFrom(null);
        setPicked(new Set());
        last.current = null;
    }, []);

    const start = useCallback((kind: SelectionMode) => {
        const wanted = latest.current;
        if (kind === 'copy' && wanted.source() === null) {
            return;
        }
        if (current.current === null) {
            setGroups(wanted.defaults.copygroups);
            setOverwrite(wanted.defaults.copyoverwrite);
            const names = wanted.modeNames;
            const now = names.includes(wanted.currentMode()) ? wanted.currentMode() : names[0] ?? '';
            setFromMode(now);
            setToMode(names.find((name) => name !== now) ?? names[0] ?? '');
            wanted.onStart(kind);
        }
        current.current = kind;
        setMode(kind);
        setFrom(kind === 'copy' ? wanted.source() : null);
        setPicked(new Set());
        last.current = null;
    }, []);

    const switchTo = (kind: SelectionMode): void => {
        current.current = kind;
        setMode(kind);
    };

    const toggle = (key: string, range = false): void => {
        if (mode === null || !pickable(key)) {
            return;
        }
        const wanted = !picked.has(key);
        let keys = [key];
        if (range && last.current !== null) {
            const list = options.items().filter((icon) => pickable(icon.key)).map((icon) => icon.key);
            const a = list.indexOf(last.current);
            const b = list.indexOf(key);
            if (a >= 0 && b >= 0) {
                keys = list.slice(Math.min(a, b), Math.max(a, b) + 1);
            }
        }
        const next = new Set(picked);
        keys.forEach((one) => {
            if (wanted) {
                next.add(one);
            } else {
                next.delete(one);
            }
        });
        setPicked(next);
        last.current = key;
    };

    const apply = async(): Promise<void> => {
        if (busy || picked.size === 0 || mode === null) {
            return;
        }
        setBusy(true);
        const keys = [...picked];
        const finished = await ({
            copy: () => options.onCopy(keys, groups),
            modes: () => options.onCopyModes(keys, fromMode, toMode, overwrite),
            'export': () => options.onExport(keys),
        }[mode]());
        setBusy(false);
        if (finished) {
            stop();
        }
    };

    return {
        mode, from, picked, groups, overwrite, fromMode, toMode, busy, start, stop, toggle, apply,
        all: () => setPicked(new Set(options.items().filter((icon) => pickable(icon.key)).map((icon) => icon.key))),
        none: () => setPicked(new Set()),
        setGroups, setOverwrite, setFromMode, setToMode,
        switchTo,
        isPicked: (key) => picked.has(key),
        isPickable: (key) => pickable(key),
    };
};
