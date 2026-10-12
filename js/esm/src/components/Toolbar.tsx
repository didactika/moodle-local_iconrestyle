// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * The toolbar above the grid: back, search, filters, selection, the count, the save status, undo and redo and the actions menu.
 *
 * @module     local_iconrestyle/components/Toolbar
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react';
import {
    IconAlert, IconBack, IconCheck, IconDownload, IconMore, IconRedo, IconRefresh, IconSearch, IconSelect, IconUndo, IconUpload,
} from './common/Icons';
import type {SaveStatus} from '../engine/autosave';
import type {Text} from '../types';

interface ToolbarProps {
    adminurl: string;
    query: string;
    count: number;
    status: SaveStatus;
    canUndo: boolean;
    canRedo: boolean;
    selecting: boolean;
    filters: ReactNode;
    text: Text;
    onQuery: (query: string) => void;
    onUndo: () => void;
    onRedo: () => void;
    onSave: () => void;
    onSelect: () => void;
    onExportAll: () => void;
    onFile: (file: File) => void;
}

/**
 * Go to the page the person came from, or to the administration page when there is none.
 *
 * @param fallback Where to go when there is no previous page.
 */
const goBack = (fallback: string): void => {
    if (window.history.length > 1 && document.referrer !== '') {
        window.history.back();
    } else {
        window.location.href = fallback;
    }
};

/**
 * The toolbar.
 *
 * @param props What it shows and what to do with everything the person does in it.
 * @returns The toolbar.
 */
export default function Toolbar(props: ToolbarProps) {
    const {adminurl, query, count, status, canUndo, canRedo, selecting, filters, text} = props;
    const [menu, setMenu] = useState<CSSProperties | null>(null);
    const file = useRef<HTMLInputElement>(null);
    const toggle = useRef<HTMLButtonElement>(null);
    const shortcuts = useRef(props);
    shortcuts.current = props;

    useEffect(() => {
        const keys = (event: KeyboardEvent): void => {
            const target = event.target as HTMLElement;
            if (!(event.ctrlKey || event.metaKey) || target.matches('input[type="text"], input[type="search"], textarea')) {
                return;
            }
            const key = event.key.toLowerCase();
            if (key === 'z' && !event.shiftKey) {
                event.preventDefault();
                shortcuts.current.onUndo();
            } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
                event.preventDefault();
                shortcuts.current.onRedo();
            } else if (key === 's') {
                event.preventDefault();
                shortcuts.current.onSave();
            }
        };
        document.addEventListener('keydown', keys);
        return () => document.removeEventListener('keydown', keys);
    }, []);

    useEffect(() => {
        if (menu === null) {
            return undefined;
        }
        const outside = (event: MouseEvent): void => {
            if (!(event.target as HTMLElement).closest('.irs-menu')) {
                setMenu(null);
            }
        };
        document.addEventListener('click', outside);
        return () => document.removeEventListener('click', outside);
    }, [menu]);

    const openMenu = (): void => {
        if (menu !== null || !toggle.current) {
            setMenu(null);
            return;
        }
        const rect = toggle.current.getBoundingClientRect();
        setMenu({top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right)});
    };

    const item = (action: string, label: string, icon: ReactNode, onClick: () => void, disabled = false, shortcut = '') => <button
        type="button" role="menuitem" data-action={action} disabled={disabled}
        onClick={() => {
            setMenu(null);
            onClick();
        }}>
        {icon}<span>{label}</span>{shortcut ? <kbd>{shortcut}</kbd> : null}
    </button>;

    return <div className="irs-bar" role="search" onKeyDown={(event) => {
        if (event.key === 'Escape') {
            setMenu(null);
        }
    }}>
        <button type="button" className="irs-back" data-action="history-back" data-fallback={adminurl} title={text('back')}
            onClick={() => goBack(adminurl)}>
            <IconBack /><span>{text('back')}</span>
        </button>
        <div className="irs-search">
            <IconSearch />
            <label className="sr-only visually-hidden" htmlFor="irs-search">{text('searchicons')}</label>
            <input type="search" className={`form-control${query.trim() === '' ? '' : ' irs-active'}`} id="irs-search"
                data-region="search" autoComplete="off" placeholder={text('searchicons')} value={query}
                onChange={(event) => props.onQuery(event.target.value)} />
        </div>
        {filters}
        <button type="button" className="irs-pillbtn irs-selectbtn" data-action="selection-start" aria-pressed={selecting}
            title={text('selectstarthelp')} onClick={props.onSelect}>
            <IconSelect /><span>{text('selectstart')}</span>
        </button>
        <span className="irs-count" data-region="count" role="status" aria-live="polite">{text('iconcount', count)}</span>
        <span className="irs-status" data-region="status" data-state={status} role="status" aria-live="polite">
            <span className="irs-status-icon irs-status-saved"><IconCheck /></span>
            <span className="irs-status-icon irs-status-busy"><IconRefresh /></span>
            <span className="irs-status-icon irs-status-error"><IconAlert /></span>
            <span className="irs-status-text" data-region="status-text">{text(`status${status}`)}</span>
        </span>
        <div className="irs-tools">
            <button type="button" className="irs-iconbtn" data-action="undo" disabled={!canUndo}
                title={`${text('undo')} (Ctrl+Z)`} aria-label={text('undo')} onClick={props.onUndo}>
                <IconUndo />
            </button>
            <button type="button" className="irs-iconbtn" data-action="redo" disabled={!canRedo}
                title={`${text('redo')} (Ctrl+Y)`} aria-label={text('redo')} onClick={props.onRedo}>
                <IconRedo />
            </button>
            <div className="irs-menu">
                <button type="button" className="irs-iconbtn" data-action="menu-toggle" aria-haspopup="true"
                    aria-expanded={menu !== null} title={text('actionsmenu')} aria-label={text('actionsmenu')} ref={toggle}
                    onClick={openMenu}>
                    <IconMore />
                </button>
                <div className="irs-menu-list" data-region="menu" role="menu" hidden={menu === null} style={menu ?? undefined}>
                    {item('undo', text('undo'), <IconUndo />, props.onUndo, !canUndo, 'Ctrl Z')}
                    {item('redo', text('redo'), <IconRedo />, props.onRedo, !canRedo, 'Ctrl Y')}
                    <hr />
                    {item('exchange-export', text('exportcustomisations'), <IconDownload />, props.onExportAll)}
                    {item('exchange-import', text('importcustomisations'), <IconUpload />, () => file.current?.click())}
                </div>
            </div>
        </div>
        <input type="file" className="irs-upload-input" data-region="exchange-file" tabIndex={-1} aria-hidden="true"
            accept=".iconrestyle,.json,.txt,text/plain,application/json" ref={file}
            onChange={(event) => {
                const chosen = event.target.files?.[0];
                event.target.value = '';
                if (chosen) {
                    props.onFile(chosen);
                }
            }} />
    </div>;
}
