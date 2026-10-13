/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * A property with a slider, a number box and a cross that puts it back to Moodle's own value.
 *
 * @module     local_iconrestyle/components/inspector/SliderField
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useState} from 'react';
import type {Text} from '../../types';

interface SliderFieldProps {
    prop: string;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    value: number | null;
    text: Text;
    onChange: (prop: string, value: number | null, continuous: boolean) => void;
}

/**
 * A slider property.
 *
 * @param props The property, its label, range and step, the value the slider rests at while it is not set, the value, the
 *     texts and what to do when the person changes it.
 * @returns The field.
 */
export default function SliderField({prop, label, min, max, step, defaultValue, value, text, onChange}: SliderFieldProps) {
    const [typed, setTyped] = useState<string | null>(null);

    const type = (raw: string): void => {
        setTyped(raw);
        if (raw === '') {
            onChange(prop, null, true);
            return;
        }
        const number = Math.min(max, Math.max(min, parseInt(raw, 10)));
        onChange(prop, Number.isNaN(number) ? null : number, true);
    };

    return <div className="irs-field irs-slider">
        <div className="irs-slider-head">
            <label className="irs-label" htmlFor={`irs-${prop}`}>{label}</label>
            <input type="number" className="form-control irs-num" data-prop-num={prop} min={min} max={max} step={step}
                aria-label={label} placeholder={text('propdefault')} value={typed ?? (value === null ? '' : value)}
                onFocus={(event) => setTyped(event.target.value)} onBlur={() => setTyped(null)}
                onChange={(event) => type(event.target.value)} />
            <button type="button" className="btn btn-link btn-sm irs-reset" data-action="reset-prop" data-prop={prop}
                aria-label={text('resetproperty', label)} title={text('resetproperty', label)}
                onClick={() => {
                    setTyped(null);
                    onChange(prop, null, false);
                }}>
                &#10005;
            </button>
        </div>
        <input type="range" id={`irs-${prop}`} data-prop={prop} min={min} max={max} step={step} data-default={defaultValue}
            value={value === null ? defaultValue : value}
            onChange={(event) => onChange(prop, parseInt(event.target.value, 10), true)} />
    </div>;
}
