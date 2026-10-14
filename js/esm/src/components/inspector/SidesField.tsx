/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * A property with a value for each side, which can be linked so that the four sides move together.
 *
 * @module     local_iconrestyle/components/inspector/SidesField
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useState} from 'react';
import {IconLinked, IconUnlinked} from '../common/Icons';
import type {Draft, Patch, Text} from '../../types';

interface SidesFieldProps {
    group: string;
    label: string;
    resetLabel: string;
    min: number;
    max: number;
    sides: Array<{prop: string; label: string}>;
    draft: Draft;
    text: Text;
    onStage: (patch: Patch, continuous?: boolean) => void;
}

/**
 * A padding or margin field.
 *
 * @param props The group, its label, the text of the button that clears it, the smallest and largest value in em, its
 *     four sides, the draft, the texts and what to do when the person changes it.
 * @returns The field.
 */
export default function SidesField({group, label, resetLabel, min, max, sides, draft, text, onStage}: SidesFieldProps) {
    const [linked, setLinked] = useState(true);
    const [typed, setTyped] = useState<{prop: string; raw: string} | null>(null);

    const change = (prop: string, raw: string): void => {
        setTyped({prop, raw});
        const value = raw === '' ? null : Math.round(parseFloat(raw) * 100);
        const finite = value === null || Number.isNaN(value) ? null : value;
        if (linked) {
            onStage(Object.fromEntries(sides.map((side) => [side.prop, finite])), true);
        } else {
            onStage({[prop]: finite}, true);
        }
    };

    return <div className="irs-field" data-sides={group}>
        <div className="irs-slider-head">
            <span className="irs-label" id={`irs-${group}-label`}>{label}</span>
            <button type="button" className="btn btn-link btn-sm irs-reset" data-action="reset-sides" data-group={group}
                aria-label={resetLabel} title={resetLabel}
                onClick={() => onStage(Object.fromEntries(sides.map((side) => [side.prop, null])))}>
                &#10005;
            </button>
        </div>
        <div className="irs-sides" role="group" aria-labelledby={`irs-${group}-label`}>
            {sides.map((side) => {
                const value = draft[side.prop] as number | null | undefined;
                const stored = value === null || value === undefined ? '' : (value / 100).toFixed(2);
                const shown = typed && typed.prop === side.prop ? typed.raw : stored;
                return <label className="irs-side" key={side.prop}><span>{side.label}</span>
                    <input type="number" className="form-control" data-prop={side.prop} min={min} max={max} step="0.05"
                        value={shown} onFocus={(event) => setTyped({prop: side.prop, raw: event.target.value})}
                        onBlur={() => setTyped(null)} onChange={(event) => change(side.prop, event.target.value)} /></label>;
            })}
            <button type="button" className="irs-link" data-action="toggle-link" data-group={group} aria-pressed={linked}
                aria-label={text('padlink')} title={text('padlink')} onClick={() => setLinked(!linked)}>
                <IconLinked />
                <IconUnlinked />
            </button>
        </div>
    </div>;
}
