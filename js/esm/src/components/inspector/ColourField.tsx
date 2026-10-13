/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * One colour control: a picker, a hex box with a cross that clears it, and a searchable list of the colours of the theme.
 *
 * @module     local_iconrestyle/components/inspector/ColourField
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useMemo, useState} from 'react';
import ThemeColourSelect from './ThemeColourSelect';
import {IconClose} from '../common/Icons';
import {normalise, parseHex, toHex} from '../../lib/color';
import * as themevars from '../../lib/themevars';
import type {Text} from '../../types';

const FOLLOWS_THEME = /^(var:|token:)|^(currentcolor|transparent)$/;

interface ColourFieldProps {
    name: string;
    label: string;
    value: string;
    specials: Array<{value: string; label: string}>;
    text: Text;
    onChange: (name: string, value: string, continuous: boolean) => void;
}

/**
 * The colour that CSS gives a value in this page, as hex.
 *
 * @param css A CSS colour such as var(--bs-primary).
 * @returns Hex, or an empty string when the browser does not give it a colour.
 */
const hexOf = (css: string): string => {
    const probe = document.createElement('span');
    probe.style.color = css;
    document.body.appendChild(probe);
    const [red, green, blue, alpha] = (window.getComputedStyle(probe).color.match(/[0-9.]+/g) || []).map(Number);
    probe.remove();
    return red === undefined ? '' : toHex({r: red, g: green, b: blue, a: alpha === undefined ? 255 : Math.round(alpha * 255)});
};

/**
 * A colour field.
 *
 * @param props Name and label of the field, its colour, the choices that are not theme variables, the texts and what to do
 *     with a colour the person chooses, which also says whether they are still choosing.
 * @returns The field.
 */
export default function ColourField({name, label, value, specials, text, onChange}: ColourFieldProps) {
    const [typed, setTyped] = useState<string | null>(null);
    const [invalid, setInvalid] = useState(false);
    const themed = FOLLOWS_THEME.test(value);
    const fromTheme = themevars.cssOf(value);
    const shown = useMemo(() => {
        if (!themed) {
            return value;
        }
        return fromTheme === '' ? '' : hexOf(fromTheme);
    }, [themed, fromTheme, value]);
    const special = specials.find((item) => item.value === value);
    const hasTheme = themevars.nameOf(value) !== '' || Boolean(special);
    const parsed = parseHex(shown);
    const pair = (channel: number): string => channel.toString(16).padStart(2, '0');
    const picker = parsed ? `#${pair(parsed.r)}${pair(parsed.g)}${pair(parsed.b)}` : '#000000';

    const input = (raw: string): void => {
        const current = raw.trim();
        setTyped(raw);
        if (current === '') {
            setInvalid(false);
            onChange(name, '', true);
        } else if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(current)) {
            setInvalid(false);
            onChange(name, normalise(current) ?? '', true);
        } else if (/[^#0-9a-f]/i.test(current) || current.length > 9) {
            setInvalid(true);
        }
    };

    const commit = (raw: string): void => {
        const current = raw.trim();
        const valid = current === '' ? '' : normalise(current);
        setTyped(null);
        if (valid === null) {
            setInvalid(true);
        } else {
            setInvalid(false);
            onChange(name, valid, false);
        }
    };

    return <div className={`irs-field irs-colour${hasTheme ? ' irs-themed' : ''}`} data-colour={name}>
        <label className="irs-label" htmlFor={`irs-${name}-hex`} data-region={`${name}-label`}>{label}</label>
        <div className="irs-colour-row">
            <input type="color" className="irs-colour-picker" data-region={`${name}-picker`} value={picker} aria-label={label}
                title={label} onChange={(event) => onChange(name, normalise(event.target.value) ?? '', true)} />
            <div className="irs-with-x">
                <input type="text" className={`form-control irs-colour-hex${fromTheme !== '' ? ' irs-from-theme' : ''}`}
                    id={`irs-${name}-hex`} data-region={`${name}-hex`} maxLength={9} spellCheck={false} autoComplete="off"
                    placeholder="#rrggbb" aria-invalid={invalid ? true : undefined}
                    value={typed ?? shown}
                    onFocus={(event) => setTyped(event.target.value)}
                    onChange={(event) => input(event.target.value)}
                    onBlur={(event) => commit(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            commit((event.target as HTMLInputElement).value);
                        }
                    }} />
                <button type="button" className="irs-x" data-action={`clear-${name}`} aria-label={text('clearcolour')}
                    title={text('clearcolour')} onClick={() => {
                        setTyped(null);
                        setInvalid(false);
                        onChange(name, '', false);
                    }}>
                    <IconClose />
                </button>
            </div>
            <ThemeColourSelect name={name} stored={value} specials={specials} text={text}
                onPick={(picked) => onChange(name, picked, false)} />
        </div>
        <p className="irs-hint" data-region={`${name}-hint`} hidden />
    </div>;
}
