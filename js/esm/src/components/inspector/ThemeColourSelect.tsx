// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * A list of the colours the active theme declares, that looks and works like a select and can be searched by typing.
 *
 * The colours are read from the page: every custom property that the stylesheets declare on the root of the page and whose
 * value is a colour. They are not a fixed list, so a theme that adds its own colours offers them too.
 *
 * @module     local_iconrestyle/components/inspector/ThemeColourSelect
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent} from 'react';
import {useFollowAnchor} from '../../hooks/useFollowAnchor';
import {IconChevron} from '../common/Icons';
import * as themevars from '../../lib/themevars';
import type {Text} from '../../types';

const LIMIT = 80;
const GAP = 4;
const MARGIN = 12;

let catalogue: themevars.ThemeColour[] | null = null;

/**
 * The colours the theme of this page declares, read once.
 *
 * @returns Colours.
 */
const themeColours = (): themevars.ThemeColour[] => {
    if (catalogue === null) {
        const style = window.getComputedStyle(document.documentElement);
        catalogue = themevars.resolveColours(
            themevars.collectNames(Array.from(document.styleSheets)),
            (name) => style.getPropertyValue(name),
            (value) => window.CSS.supports('color', value),
        );
    }
    return catalogue;
};

interface Special {
    value: string;
    label: string;
}

interface ThemeColourSelectProps {
    name: string;
    stored: string;
    specials: Special[];
    text: Text;
    onPick: (value: string) => void;
}

/**
 * The list of the colours of the theme for one colour field.
 *
 * @param props Name of the field, its colour, the choices that are not theme variables and what to do with a choice.
 * @returns The list.
 */
export default function ThemeColourSelect({name, stored, specials, text, onPick}: ThemeColourSelectProps) {
    const input = useRef<HTMLInputElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const list = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [typing, setTyping] = useState(false);
    const [query, setQuery] = useState('');
    const [place, setPlace] = useState<{panel: CSSProperties; list: CSSProperties}>({panel: {}, list: {}});

    const variable = themevars.nameOf(stored);
    const special = specials.find((item) => item.value === stored);
    const shown = variable !== '' ? variable : (special?.label ?? '');
    const needle = typing ? query.trim() : '';

    const choices = useMemo(() => {
        if (!open) {
            return null;
        }
        const found = themevars.search(themeColours(), needle, LIMIT);
        const custom = themevars.isVariableName(needle) && !themeColours().some((item) => item.name === needle) ? needle : '';
        const wanted = specials.filter((item) => needle === '' || item.label.toLowerCase().includes(needle.toLowerCase()));
        return {found, custom, specials: wanted};
    }, [open, needle, specials]);

    const close = (): void => {
        setOpen(false);
        setTyping(false);
    };

    /**
     * Put the list under the field, or over it when there is more room there, where the field is now.
     */
    const follow = (): void => {
        if (!input.current) {
            return;
        }
        const rect = input.current.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
            close();
            return;
        }
        const width = Math.min(Math.max(rect.width, 260), window.innerWidth - 2 * MARGIN);
        const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - width - MARGIN));
        const below = window.innerHeight - rect.bottom - MARGIN;
        const above = rect.top - MARGIN;
        if (below >= 220 || below >= above) {
            setPlace({
                panel: {left, width, top: rect.bottom + GAP},
                list: {maxHeight: Math.max(140, below - 16)},
            });
        } else {
            setPlace({
                panel: {left, width, bottom: window.innerHeight - rect.top + GAP},
                list: {maxHeight: Math.max(140, above - 16)},
            });
        }
    };

    useLayoutEffect(() => {
        if (open) {
            follow();
        }
    }, [open]);

    useFollowAnchor(open, follow, () => panel.current);

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const outside = (event: PointerEvent): void => {
            const target = event.target as Node;
            if (!panel.current?.contains(target) && target !== input.current) {
                close();
            }
        };
        document.addEventListener('pointerdown', outside, true);
        return () => {
            document.removeEventListener('pointerdown', outside, true);
        };
    }, [open]);

    const pick = (value: string): void => {
        close();
        input.current?.blur();
        onPick(value);
    };

    const items = (): HTMLButtonElement[] => Array.from(list.current?.querySelectorAll<HTMLButtonElement>('.irs-theme-item') ?? []);

    const inputKeys = (event: KeyboardEvent<HTMLInputElement>): void => {
        const first = items()[0];
        if (event.key === 'Enter') {
            event.preventDefault();
            if (open && first) {
                pick(first.dataset.value ?? '');
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!open) {
                setOpen(true);
            } else if (first) {
                first.focus();
            }
        } else if (event.key === 'Escape' && open) {
            event.stopPropagation();
            close();
        }
    };

    const panelKeys = (event: KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === 'Escape') {
            event.stopPropagation();
            close();
            input.current?.focus();
            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return;
        }
        const all = items();
        const index = all.indexOf(document.activeElement as HTMLButtonElement);
        if (index < 0) {
            return;
        }
        event.preventDefault();
        if (event.key === 'ArrowUp' && index === 0) {
            input.current?.focus();
            return;
        }
        all[index + (event.key === 'ArrowDown' ? 1 : -1)]?.focus();
    };

    const none = choices !== null && choices.found.items.length === 0 && choices.specials.length === 0 && choices.custom === '';

    return <div className="irs-theme">
        <span className="irs-swatch" data-region={`${name}-themeswatch`} aria-hidden="true" hidden={variable === ''}
            style={variable === '' ? undefined : {background: themevars.cssOf(stored)}} />
        <input type="text" className="form-control irs-theme-input" role="combobox" aria-expanded={open} aria-autocomplete="list"
            aria-controls={`irs-${name}-themelist`} data-region={`${name}-themeinput`} autoComplete="off" spellCheck={false}
            placeholder={text('choosethemecolour')} aria-label={text('searchthemecolours')} ref={input}
            value={open && typing ? query : shown}
            onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
            onChange={(event) => {
                setTyping(true);
                setQuery(event.target.value);
                setOpen(true);
            }}
            onKeyDown={inputKeys} />
        <span className="irs-caret" aria-hidden="true"><IconChevron /></span>
        <div className="irs-theme-panel" data-region={`${name}-themepanel`} hidden={!open} style={place.panel} ref={panel}
            onKeyDown={panelKeys}>
            <div className="irs-theme-list" id={`irs-${name}-themelist`} role="listbox" data-region={`${name}-themelist`}
                style={place.list} ref={list}>
                {choices?.specials.map((item) => <button key={item.value} type="button" className="irs-theme-item"
                    data-value={item.value} onClick={() => pick(item.value)}>
                    <span className="irs-swatch irs-swatch-none" aria-hidden="true" />
                    <span className="irs-theme-name">{item.label}</span>
                </button>)}
                {choices?.found.items.map((item) => <button key={item.name} type="button" className="irs-theme-item"
                    data-value={themevars.toStored(item.name)} onClick={() => pick(themevars.toStored(item.name))}>
                    <span className="irs-swatch" style={{background: `var(${item.name})`}} aria-hidden="true" />
                    <span className="irs-theme-name">{item.name}</span>
                    <span className="irs-theme-value">{item.value}</span>
                </button>)}
                {choices && choices.custom !== '' && <button type="button" className="irs-theme-item"
                    data-value={themevars.toStored(choices.custom)} onClick={() => pick(themevars.toStored(choices.custom))}>
                    <span className="irs-swatch" style={{background: `var(${choices.custom})`}} aria-hidden="true" />
                    <span className="irs-theme-name">{text('themecolourcustom', choices.custom)}</span>
                </button>}
                {choices?.found.more && <p className="irs-theme-note">{text('themecoloursmore')}</p>}
                {none && <p className="irs-theme-note">{text('nothemecolours')}</p>}
            </div>
        </div>
    </div>;
}
