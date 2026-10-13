/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The editing panel of the open icon: its title, the preview, the tabs, what is edited and the button that removes the variant.
 *
 * @module     local_iconrestyle/components/Inspector
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useState, type ReactNode} from 'react';
import StyleTab from './inspector/StyleTab';
import PlacesTab, {type VariantChip} from './places/PlacesTab';
import {IconClose, IconCopy, IconTrash} from './common/Icons';
import type {Draft, Icon, Patch, Text} from '../types';

interface InspectorProps {
    icon: Icon | null;
    draft: Draft | null;
    customised: boolean;
    removable: boolean;
    preview: ReactNode;
    variants: VariantChip[];
    otherModes: number;
    ranges: Record<string, [number, number]>;
    specials: Record<string, Array<{value: string; label: string}>>;
    copying: boolean;
    text: Text;
    onProp: (prop: string, value: number | string | null, continuous?: boolean) => void;
    onStage: (patch: Patch, continuous?: boolean) => void;
    onClose: () => void;
    onCopyLook: () => void;
    onRemoveVariant: () => void;
    onPickVariant: (key: string) => void;
    onRemoveVariantChip: (key: string) => void;
    onAddPlaces: () => void;
    onCopyMode: () => void;
}

/**
 * The editing panel.
 *
 * @param props The open icon and its draft, what is shown about it, and what to do with everything the person does.
 * @returns The panel, hidden while no icon is open.
 */
export default function Inspector(props: InspectorProps) {
    const {icon, draft, customised, removable, preview, variants, otherModes, ranges, specials, copying, text} = props;
    const [tab, setTab] = useState<'style' | 'places'>('style');
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const tabs: Array<['style' | 'places', string]> = [['style', 'tabstyle'], ['places', 'tabplaces']];
    const notice = icon !== null && icon.group >= 2 && !dismissed.has(icon.key);

    return <aside className="irs-panel" data-region="panel" aria-label={text('editor')} hidden={icon === null || draft === null}
        onKeyDown={(event) => {
            if (event.key === 'Escape' && !(event.target as HTMLElement).closest('.modal')) {
                props.onClose();
            }
        }}>
        <header className="irs-panel-head">
            <div className="irs-panel-title">
                <h2 className="irs-title" data-region="title">{icon?.key}</h2>
                <span className="irs-pill" data-region="origin">{customised ? text('originhere') : text('origindefault')}</span>
            </div>
            <div className="irs-panel-actions">
                <button type="button" className="irs-iconbtn" data-action="copy-look" aria-pressed={copying}
                    aria-label={text('copylook')} title={text('copylook')} onClick={props.onCopyLook}>
                    <IconCopy />
                </button>
                <button type="button" className="btn btn-secondary irs-close" data-action="close-panel"
                    aria-label={text('closepanel')} title={text('closepanel')} onClick={props.onClose}>
                    &#10005;
                </button>
            </div>
        </header>

        {preview}

        <div className="irs-tabs" role="tablist" aria-label={text('editor')}>
            {tabs.map(([name, label]) => <button key={name} type="button" role="tab" id={`irs-tab-${name}`} data-action="tab"
                data-tab={name} aria-selected={tab === name} aria-controls={`irs-panel-${name}`} tabIndex={tab === name ? 0 : -1}
                className={`irs-tab${tab === name ? ' irs-active' : ''}`} onClick={() => setTab(name)}>
                {text(label)}
                {name === 'places' && <span className="irs-badge" data-region="places-count">{variants.length}</span>}
            </button>)}
        </div>

        <div className="irs-panel-body">
            <div className="irs-notice" data-region="shared-notice" role="status" hidden={!notice}>
                <span data-region="shared-notice-text">{icon && icon.group >= 2 ? text('sharedglyph', icon.group) : ''}</span>
                <button type="button" className="irs-x" data-action="dismiss-notice" aria-label={text('dismiss')}
                    title={text('dismiss')} onClick={() => icon && setDismissed(new Set([...dismissed, icon.key]))}>
                    <IconClose />
                </button>
            </div>
            {icon && draft && <StyleTab icon={icon} draft={draft} ranges={ranges} specials={specials} text={text}
                hidden={tab !== 'style'} onProp={props.onProp} onStage={props.onStage} boxColours={icon.kind === 'container'} />}
            <PlacesTab variants={variants} otherModes={otherModes} text={text} hidden={tab !== 'places'}
                onPick={props.onPickVariant} onRemove={props.onRemoveVariantChip} onAdd={props.onAddPlaces}
                onCopyMode={props.onCopyMode} />
        </div>

        <footer className="irs-panel-foot">
            <button type="button" className="irs-pillbtn irs-pillbtn-danger" data-action="remove-variant" hidden={!removable}
                onClick={props.onRemoveVariant}>
                <IconTrash /> {text('removevariant')}
            </button>
        </footer>
    </aside>;
}
