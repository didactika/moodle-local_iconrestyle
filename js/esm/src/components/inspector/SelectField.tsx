// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * A property that takes one of a fixed list of values, or Moodle's own.
 *
 * @module     local_iconrestyle/components/inspector/SelectField
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import type {Text} from '../../types';

interface SelectFieldProps {
    prop: string;
    label: string;
    options: string[][];
    value: string | null;
    text: Text;
    onChange: (prop: string, value: string | null) => void;
}

/**
 * A select property.
 *
 * @param props The property, its label, the options as value and string, the value, the texts and what to do on a change.
 * @returns The field.
 */
export default function SelectField({prop, label, options, value, text, onChange}: SelectFieldProps) {
    return <div className="irs-field irs-row">
        <label className="irs-label" htmlFor={`irs-${prop}`}>{label}</label>
        <select className="custom-select form-select" id={`irs-${prop}`} data-prop={prop} value={value ?? ''}
            onChange={(event) => onChange(prop, event.target.value === '' ? null : event.target.value)}>
            <option value="">{text('propdefault')}</option>
            {options.map(([option, string]) => <option key={option} value={option}>{text(string)}</option>)}
        </select>
    </div>;
}
