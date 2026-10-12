// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * Reviews a package before it changes anything: what is in it, how to import it, which icons to take and what that would do.
 *
 * @module     local_iconrestyle/components/ImportModal
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import Modal from './common/Modal';
import * as api from '../services/api';
import type {DesignerProps, ImportEntry, ImportReport, Text} from '../types';

const MAX_ROWS = 200;
const PREVIEW_DELAY = 300;

interface ImportModalProps {
    content: string;
    first: ImportReport;
    defaults: DesignerProps['defaults'];
    text: Text;
    onClose: () => void;
    onFailure: (error: Error) => void;
    onImported: (report: ImportReport) => void;
}

const usable = (entry: ImportEntry): boolean => entry.created + entry.updated > 0;

/**
 * What importing would do.
 *
 * @param props The report.
 * @returns The counts and the reasons rules would be left out.
 */
const Report = ({report, text}: {report: ImportReport; text: Text}) => <>
    <ul className="irs-import-counts">
        <li>{text('importcreated', report.created)}</li>
        <li>{text('importupdated', report.updated)}</li>
        {report.deleted > 0 && <li>{text('importdeleted', report.deleted)}</li>}
        <li>{text('importassets', report.assets)}</li>
    </ul>
    {report.skipped > 0 && <>
        <p className="irs-import-skipped">{text('importskipped', report.skipped)}</p>
        <ul className="irs-import-issues">{report.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>
    </>}
</>;

/**
 * The modal that reviews a package.
 *
 * @param props The package, what importing it would do, what the site chose to start from, the texts and what to do when the
 *     modal closes, an import fails and an import is done.
 * @returns The modal.
 */
export default function ImportModal({content, first, defaults, text, onClose, onFailure, onImported}: ImportModalProps) {
    const entries = first.entries;
    const importable = useMemo(() => entries.filter(usable), [entries]);
    const total = importable.length;
    const [chosen, setChosen] = useState<Set<string>>(() => {
        const wanted = {
            all: () => true, 'new': (entry: ImportEntry) => entry.updated === 0, none: () => false,
        }[defaults.importchoose];
        return new Set(importable.filter(wanted).map((entry) => entry.slot));
    });
    const [mode, setMode] = useState<'merge' | 'replace'>(defaults.importmode);
    const [query, setQuery] = useState('');
    const [report, setReport] = useState<ImportReport | null>(first);
    const [error, setError] = useState('');
    const token = useRef(0);
    const started = useRef(false);

    const slotsParam = (): string[] => (chosen.size === total ? [] : [...chosen]);
    const rules = entries.reduce((sum, entry) => sum + entry.created + entry.updated + entry.skipped, 0);

    useEffect(() => {
        if (!started.current) {
            started.current = true;
            if (mode === 'merge' && chosen.size === total) {
                return undefined;
            }
        }
        setError('');
        const mine = ++token.current;
        if (chosen.size === 0) {
            setReport(null);
            return undefined;
        }
        const timer = window.setTimeout(() => {
            api.importRules(content, mode, true, slotsParam()).then((result) => {
                if (mine === token.current) {
                    setReport(result);
                }
                return null;
            }).catch((reason: Error) => onFailure(reason));
        }, PREVIEW_DELAY);
        return () => window.clearTimeout(timer);
        // The report depends on the mode and on which icons are chosen.
    }, [mode, chosen]);

    const words = query.toLowerCase().split(/\s+/).filter((word) => word !== '');
    const found = entries.filter((entry) => words.every((word) => entry.slot.toLowerCase().includes(word)));

    const pickWhere = (wanted: (entry: ImportEntry) => boolean): void => setChosen(
        new Set(importable.filter(wanted).map((entry) => entry.slot)),
    );

    const save = (): void => {
        if (chosen.size === 0) {
            setError(text('importnothing'));
            return;
        }
        api.importRules(content, mode, false, slotsParam()).then((result) => {
            onImported(result);
            return null;
        }).catch((reason: Error) => onFailure(reason));
        onClose();
    };

    const replaceHelp = chosen.size === total ? 'importreplacehelp' : 'importreplacechosenhelp';
    const help = mode === 'merge' ? 'importmergehelp' : replaceHelp;

    return <Modal title={text('importtitle')} saveLabel={text('importconfirm')} cancelLabel={text('cancel')}
        closeLabel={text('closepanel')} onSave={save} onClose={onClose}>
        <div className="irs-import" data-region="import-form">
            <p className="irs-import-summary" data-region="import-summary">
                {text('importsummary', {icons: entries.length, rules, assets: first.assets})}
            </p>
            <fieldset className="irs-import-section">
                <legend className="irs-label">{text('importmode')}</legend>
                <div className="irs-seg irs-seg-wide">
                    <label className="irs-seg-option">
                        <input type="radio" name="irs-import-mode" id="irs-import-merge" value="merge" checked={mode === 'merge'}
                            onChange={() => setMode('merge')} />
                        <span>{text('importmodemerge')}</span>
                    </label>
                    <label className="irs-seg-option">
                        <input type="radio" name="irs-import-mode" id="irs-import-replace" value="replace"
                            checked={mode === 'replace'} onChange={() => setMode('replace')} />
                        <span>{text('importmodereplace')}</span>
                    </label>
                </div>
                <p className="irs-hint" data-region="import-mode-help">{text(help)}</p>
            </fieldset>
            <div className="irs-import-section">
                <div className="irs-label">{text('importchoose')}</div>
                <div className="irs-review-bar">
                    <input type="search" className="form-control" data-region="import-search" autoComplete="off"
                        placeholder={text('importsearch')} aria-label={text('importsearch')} value={query}
                        onChange={(event) => setQuery(event.target.value)} />
                    <button type="button" className="irs-linkbtn" data-action="review-all" onClick={() => pickWhere(() => true)}>
                        {text('selectall')}
                    </button>
                    <button type="button" className="irs-linkbtn" data-action="review-new"
                        onClick={() => pickWhere((entry) => entry.updated === 0)}>{text('importonlynew')}</button>
                    <button type="button" className="irs-linkbtn" data-action="review-none" onClick={() => pickWhere(() => false)}>
                        {text('selectnone')}
                    </button>
                    <span className="irs-review-count" data-region="import-count" role="status" aria-live="polite">
                        {text('importchosen', {chosen: chosen.size, total})}
                    </span>
                </div>
                <div className="irs-review-list" data-region="import-rows">
                    {found.slice(0, MAX_ROWS).map((entry) => {
                        const ok = usable(entry);
                        return <label key={entry.slot} className={`irs-review-row${ok ? '' : ' irs-disabled'}`}>
                            <input type="checkbox" data-region="import-row" value={entry.slot} disabled={!ok}
                                checked={ok && chosen.has(entry.slot)}
                                onChange={(event) => {
                                    const next = new Set(chosen);
                                    if (event.target.checked) {
                                        next.add(entry.slot);
                                    } else {
                                        next.delete(entry.slot);
                                    }
                                    setChosen(next);
                                }} />
                            <span className="irs-review-name">{entry.slot}</span>
                            <span className="irs-review-rules">
                                {text('importrules', entry.created + entry.updated + entry.skipped)}
                            </span>
                            {ok && entry.updated === 0 && <span className="irs-state irs-state-new">{text('importrownew')}</span>}
                            {ok && entry.updated > 0 &&
                                <span className="irs-state irs-state-updates">{text('importrowupdates')}</span>}
                            {!ok && <span className="irs-state irs-state-skipped">{text('importrowskipped')}</span>}
                        </label>;
                    })}
                    {found.length > MAX_ROWS && <p className="irs-theme-note">{text('importmore', MAX_ROWS)}</p>}
                    {found.length === 0 && <p className="irs-theme-note">{text('importnoresults')}</p>}
                </div>
                <p className="irs-hint irs-error" data-region="import-error" role="alert" hidden={error === ''}>{error}</p>
            </div>
            <div className="irs-import-report" data-region="import-report" aria-live="polite">
                {report && <Report report={report} text={text} />}
            </div>
        </div>
    </Modal>;
}
