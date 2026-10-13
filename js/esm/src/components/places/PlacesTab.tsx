// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * The places where the open icon has a look, as chips, with the buttons that add more and copy the look to other colour modes.
 *
 * @module     local_iconrestyle/components/places/PlacesTab
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {IconClose, IconCopy, IconPlus} from '../common/Icons';
import type {Text} from '../../types';

/** A variant as the tab shows it. */
export interface VariantChip {
    key: string;
    label: string;
    active: boolean;
    removable: boolean;
}

interface PlacesTabProps {
    variants: VariantChip[];
    otherModes: number;
    text: Text;
    hidden: boolean;
    onPick: (key: string) => void;
    onRemove: (key: string) => void;
    onAdd: () => void;
    onCopyMode: () => void;
}

/**
 * The places tab.
 *
 * @param props The variants, how many other colour modes there are, the texts and what to do with a click.
 * @returns The tab.
 */
export default function PlacesTab({variants, otherModes, text, hidden, onPick, onRemove, onAdd, onCopyMode}: PlacesTabProps) {
    return <div className="irs-tabpanel" role="tabpanel" id="irs-panel-places" aria-labelledby="irs-tab-places"
        data-region="tab-places" hidden={hidden}>
        <p className="irs-help">{text('placeshelp')}</p>
        <div className="irs-variants" data-region="variants" role="group" aria-label={text('appliesto')}>
            {variants.map((variant) => <span key={variant.key}
                className={`irs-chip${variant.active ? ' irs-active' : ''}${variant.removable ? ' irs-has-x' : ''}`}>
                <button type="button" className="irs-chip-label" data-action="pick-variant" data-key={variant.key}
                    aria-pressed={variant.active} onClick={() => onPick(variant.key)}>{variant.label}</button>
                {variant.removable && <button type="button" className="irs-x" data-action="remove-chip" data-key={variant.key}
                    aria-label={text('removeplace', variant.label)} title={text('removeplace', variant.label)}
                    onClick={() => onRemove(variant.key)}>
                    <IconClose />
                </button>}
            </span>)}
        </div>
        <div className="irs-places-actions">
            <button type="button" className="irs-pillbtn irs-pillbtn-primary" data-action="add-places" onClick={onAdd}>
                <IconPlus /> {text('addplaces')}
            </button>
            <button type="button" className="irs-pillbtn" data-action="copy-mode" hidden={otherModes === 0} onClick={onCopyMode}>
                <IconCopy />
                <span data-region="copy-mode-label">{text(otherModes > 1 ? 'copytoothermodes' : 'copytoothermode')}</span>
            </button>
        </div>
    </div>;
}
