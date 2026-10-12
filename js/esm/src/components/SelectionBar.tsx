// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * The bar that floats over the grid while icons are being chosen: what to do with them and how many there are.
 *
 * @module     local_iconrestyle/components/SelectionBar
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useLayoutEffect, useRef} from 'react';
import {IconClose} from './common/Icons';
import type {Selection} from '../hooks/useSelection';
import type {Text} from '../types';

const GROUPS = ['colours', 'shape', 'spacing', 'transform', 'effects', 'icon'];

interface SelectionBarProps {
    selection: Selection;
    modeLabels: Record<string, string>;
    text: Text;
}

/**
 * The selection bar.
 *
 * @param props The selection, the names of the colour modes and the texts.
 * @returns The bar, hidden while no choice is going on.
 */
export default function SelectionBar({selection, modeLabels, text}: SelectionBarProps) {
    const {mode, from, picked, groups, overwrite, fromMode, toMode, busy} = selection;
    const modeNames = Object.keys(modeLabels);
    const titles = {
        copy: text('selectcopytitle', from ?? ''), modes: text('selectmodestitle'), 'export': text('selectexporttitle'),
    };
    const disabled = busy || picked.size === 0 || (mode === 'copy' && groups.length === 0) ||
        (mode === 'modes' && fromMode === toMode);
    const bar = useRef<HTMLDivElement>(null);
    // The grid keeps room for the bar, whose height changes with what it offers and with the width.
    useLayoutEffect(() => {
        const element = bar.current;
        const root = element?.closest<HTMLElement>('.irs');
        if (!element || !root) {
            return undefined;
        }
        const measure = () => root.style.setProperty('--irs-selbar', `${element.offsetHeight}px`);
        measure();
        if (typeof ResizeObserver === 'undefined') {
            return undefined;
        }
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => {
            observer.disconnect();
            root.style.removeProperty('--irs-selbar');
        };
    }, [mode]);
    return <div className="irs-selbar" data-region="selection-bar" role="region" aria-label={text('selectbar')}
        ref={bar} hidden={mode === null}>
        <div className="irs-selbar-head">
            <span className="irs-selbar-title" data-region="selection-title">{mode === null ? '' : titles[mode]}</span>
            <span className="irs-selbar-count" data-region="selection-count" role="status" aria-live="polite">
                {text('selectcount', picked.size)}
            </span>
        </div>
        <div className="irs-selbar-modes" data-for="modes" role="group" aria-label={text('selectmodeswhat')}
            hidden={mode !== 'modes'}>
            <select className="custom-select form-select irs-mini" data-region="selection-from" aria-label={text('selectfrom')}
                value={fromMode} onChange={(event) => selection.setFromMode(event.target.value)}>
                {modeNames.map((name) => <option key={name} value={name}>{modeLabels[name]}</option>)}
            </select>
            <span className="irs-arrow" aria-hidden="true">&#8594;</span>
            <select className="custom-select form-select irs-mini" data-region="selection-to" aria-label={text('selectto')}
                value={toMode} onChange={(event) => selection.setToMode(event.target.value)}>
                {modeNames.map((name) => <option key={name} value={name}>{modeLabels[name]}</option>)}
            </select>
            <label className="irs-chipcheck">
                <input type="checkbox" data-region="selection-overwrite" checked={overwrite}
                    onChange={(event) => selection.setOverwrite(event.target.checked)} />
                <span>{text('selectoverwrite')}</span>
            </label>
        </div>
        <div className="irs-selbar-what" data-for="copy" role="group" aria-label={text('copywhat')} hidden={mode !== 'copy'}>
            {GROUPS.map((group) => <label className="irs-chipcheck" key={group}>
                <input type="checkbox" data-region="selection-group" value={group} checked={groups.includes(group)}
                    onChange={(event) => selection.setGroups(event.target.checked ?
                        [...groups, group] : groups.filter((each) => each !== group))} />
                <span>{text(`copygroup${group}`)}</span>
            </label>)}
        </div>
        <div className="irs-selbar-quick" data-for="export copy modes">
            <button type="button" className="irs-linkbtn" data-action="selection-all" onClick={selection.all}>
                {text('selectall')}
            </button>
            <button type="button" className="irs-linkbtn" data-action="selection-none" onClick={selection.none}>
                {text('selectnone')}
            </button>
        </div>
        <div className="irs-selbar-actions">
            <button type="button" className="irs-pillbtn" data-action="selection-back" data-for="modes" hidden={mode !== 'modes'}
                onClick={() => selection.switchTo('export')}>{text('back')}</button>
            <button type="button" className="irs-pillbtn" data-action="selection-modes" data-for="export"
                hidden={mode !== 'export' || modeNames.length < 2} disabled={picked.size === 0}
                onClick={() => selection.switchTo('modes')}>{text('selectmodes')}</button>
            <button type="button" className="irs-pillbtn irs-pillbtn-primary" data-action="selection-apply" disabled={disabled}
                onClick={() => void selection.apply()}>
                <span data-region="selection-apply-text">{text(mode === 'export' ? 'selectexport' : 'selectcopy')}</span>
            </button>
            <button type="button" className="irs-iconbtn" data-action="selection-cancel"
                title={`${text('selectdone')} (Esc)`} aria-label={text('selectdone')} onClick={selection.stop}>
                <IconClose />
            </button>
        </div>
    </div>;
}
