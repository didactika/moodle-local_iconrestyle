// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * The filters panel: one button with the number of filters that are on, and a panel to choose them.
 *
 * Besides the search of the toolbar, the icons can be narrowed by type, by status, by component, by purpose, by what they
 * customise, by the kind of place of the customisation and by colour mode, and sorted. What is on is shown by the number on the
 * button and by the boxes of the panel, so many filters never take room from the icons.
 *
 * @module     local_iconrestyle/components/FiltersPanel
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useEffect, useMemo, useRef, useState, type CSSProperties} from 'react';
import {IconFilter, IconFilterClear} from './common/Icons';
import type {Filters, Icon, Text} from '../types';

const SHOWN = 80;
const STATUS = ['untouched', 'modified', 'shared'];
const DETAIL = ['colour', 'shape', 'spacing', 'transform', 'effects', 'artwork', 'limited'];

type Group = 'kinds' | 'components' | 'purposes' | 'traits' | 'places' | 'modes';

interface FiltersPanelProps {
    icons: Icon[];
    filters: Filters;
    modes: Record<string, string>;
    text: Text;
    onChange: (patch: Partial<Filters>) => void;
}

/**
 * Words with a capital letter.
 *
 * @param value Token.
 * @returns Token with its first letter in capitals.
 */
const capital = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * The filters panel.
 *
 * @param props The icons of the catalogue, what is chosen, the colour modes of the site, the texts and what to do on a change.
 * @returns The button and its panel.
 */
export default function FiltersPanel({icons, filters, modes, text, onChange}: FiltersPanelProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [place, setPlace] = useState<CSSProperties>({});
    const wrapper = useRef<HTMLDivElement>(null);
    const button = useRef<HTMLButtonElement>(null);

    const total = filters.kinds.length + filters.components.length + filters.purposes.length + filters.traits.length +
        filters.places.length + filters.modes.length + (filters.sort === 'catalogue' ? 0 : 1);

    const counts = useMemo(() => {
        const components = new Map<string, number>();
        const purposes = new Map<string, number>();
        icons.forEach((icon) => {
            components.set(icon.component, (components.get(icon.component) ?? 0) + 1);
            if (icon.purpose) {
                purposes.set(icon.purpose, (purposes.get(icon.purpose) ?? 0) + 1);
            }
        });
        return {components, purposes};
    }, [icons]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const outside = (event: MouseEvent): void => {
            if (!wrapper.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('click', outside);
        return () => document.removeEventListener('click', outside);
    }, [open]);

    const toggle = (): void => {
        if (!open && button.current) {
            const rect = button.current.getBoundingClientRect();
            const width = Math.min(24 * 16, window.innerWidth - 16);
            setPlace({
                top: rect.bottom + 6,
                left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
                maxHeight: Math.max(240, window.innerHeight - rect.bottom - 24),
            });
        }
        setOpen(!open);
    };

    const choose = (group: Group, value: string, checked: boolean): void => {
        const current = filters[group];
        let next = checked ? [...current, value] : current.filter((each) => each !== value);
        if (group === 'traits' && checked) {
            if (value === 'untouched') {
                next = next.filter((each) => !DETAIL.includes(each) && each !== 'modified');
            } else if (value === 'modified' || DETAIL.includes(value)) {
                next = next.filter((each) => each !== 'untouched');
            }
        }
        onChange({[group]: next});
    };

    const chip = (group: Group, value: string, label: string, extra?: number) => <label className="irs-chipcheck"
        key={`${group}${value}`}>
        <input type="checkbox" data-filter={group} value={value} checked={filters[group].includes(value)}
            onChange={(event) => choose(group, value, event.target.checked)} />
        <span>{label}{extra === undefined ? null : <> <small>{extra}</small></>}</span>
    </label>;

    const words = search.toLowerCase().split(/\s+/).filter((word) => word !== '');
    const found = [...counts.components.keys()].sort().filter((name) => words.every((word) => name.toLowerCase().includes(word)));
    const purposes = [...counts.purposes.keys()].sort();
    const hasModes = Object.keys(modes).length > 0;

    return <div className="irs-filters" data-region="filters" ref={wrapper} onKeyDown={(event) => {
        if (event.key === 'Escape') {
            setOpen(false);
        }
    }}>
        <button type="button" className={`irs-pillbtn irs-filtersbtn${total > 0 ? ' irs-active' : ''}`} data-action="filters-toggle"
            aria-haspopup="true" aria-expanded={open} title={text('filtbutton')} ref={button} onClick={toggle}>
            <IconFilter /><span>{text('filtbutton')}</span>
            <span className="irs-count-badge" data-region="filters-count" hidden={total === 0}>{total > 0 ? total : ''}</span>
        </button>
        <div className="irs-filters-panel" data-region="filters-panel" role="dialog" aria-label={text('filtbutton')} hidden={!open}
            style={place}>
            <header className="irs-filter-head">
                <h2 className="irs-filter-heading">{text('filtbutton')}</h2>
                <button type="button" className="irs-iconbtn" data-action="filters-clear" disabled={total === 0}
                    title={text('filtclear')} aria-label={text('filtclear')}
                    onClick={() => onChange({
                        kinds: [], components: [], purposes: [], traits: [], places: [], modes: [], sort: 'catalogue',
                    })}>
                    <IconFilterClear />
                </button>
            </header>
            <section className="irs-filter-section">
                <h3 className="irs-filter-title">{text('filttype')}</h3>
                <div className="irs-filter-chips">
                    {chip('kinds', 'font', text('kindfont'))}
                    {chip('kinds', 'image', text('kindimage'))}
                    {chip('kinds', 'container', text('kindactivity'))}
                </div>
            </section>
            <section className="irs-filter-section">
                <h3 className="irs-filter-title">{text('filtstatus')}</h3>
                <div className="irs-filter-chips">
                    {STATUS.map((value) => chip('traits', value, text(`filttrait${value === 'untouched' ? 'untouched' : value}`)))}
                </div>
            </section>
            <section className="irs-filter-section">
                <h3 className="irs-filter-title">{text('filtsort')}</h3>
                <select className="custom-select form-select" data-region="filters-sort" aria-label={text('filtsort')}
                    value={filters.sort} onChange={(event) => onChange({sort: event.target.value as Filters['sort']})}>
                    {['catalogue', 'name', 'component', 'modified'].map((value) => <option key={value} value={value}>
                        {text(`filtsort${value}`)}
                    </option>)}
                </select>
            </section>
            <section className="irs-filter-section">
                <h3 className="irs-filter-title">{text('filtcustom')}</h3>
                <div className="irs-filter-chips">
                    {DETAIL.map((value) => chip('traits', value, text(`filttrait${value}`)))}
                </div>
            </section>
            <section className="irs-filter-section">
                <h3 className="irs-filter-title">{text('filtplace')}</h3>
                <div className="irs-filter-chips">
                    {['site', 'category', 'course', 'activity'].map((value) => chip('places', value, text(`filtplace${value}`)))}
                </div>
            </section>
            <section className="irs-filter-section" data-region="filters-mode-section" hidden={!hasModes}>
                <h3 className="irs-filter-title">{text('filtmode')}</h3>
                <div className="irs-filter-chips">
                    {Object.keys(modes).map((value) => chip('modes', value, modes[value]))}
                </div>
            </section>
            <section className="irs-filter-section" data-region="filters-purpose-section" hidden={purposes.length === 0}>
                <h3 className="irs-filter-title">{text('filtpurpose')}</h3>
                <div className="irs-filter-chips" data-region="filters-purposes">
                    {purposes.map((value) => chip('purposes', value, capital(value), counts.purposes.get(value)))}
                </div>
            </section>
            <section className="irs-filter-section">
                <h3 className="irs-filter-title">{text('filtcomponent')}</h3>
                <input type="search" className="form-control" data-region="filters-component-search" autoComplete="off"
                    placeholder={text('filtsearchcomponent')} aria-label={text('filtsearchcomponent')} value={search}
                    onChange={(event) => setSearch(event.target.value)} />
                <div className="irs-filter-list" data-region="filters-components">
                    {found.slice(0, SHOWN).map((name) => <label className="irs-filter-row" key={name}>
                        <input type="checkbox" data-filter="components" value={name} checked={filters.components.includes(name)}
                            onChange={(event) => choose('components', name, event.target.checked)} />
                        <span className="irs-filter-name">{name}</span>
                        <span className="irs-filter-count">{counts.components.get(name)}</span>
                    </label>)}
                    {found.length > SHOWN && <p className="irs-theme-note">{text('filtmore', SHOWN)}</p>}
                    {found.length === 0 && <p className="irs-theme-note">{text('importnoresults')}</p>}
                </div>
            </section>
        </div>
    </div>;
}
