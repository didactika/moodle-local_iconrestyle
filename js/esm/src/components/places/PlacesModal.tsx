// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * The modal that adds places to the open icon: a place, the kinds of page and the regions of the page, and a colour mode.
 *
 * @module     local_iconrestyle/components/places/PlacesModal
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useState} from 'react';
import Modal from '../common/Modal';
import LocationPicker, {type ChosenPlace} from './LocationPicker';
import type {Text, Where} from '../../types';

type Kind = 'site' | 'category' | 'course' | 'activity';

interface PlacesModalProps {
    text: Text;
    everywhere: Where;
    pages: Array<{value: string; label: string}>;
    regions: Array<{value: string; label: string}>;
    modes: Array<{value: string; label: string}>;
    currentMode: string;
    onAdd: (wheres: Where[], copy: boolean) => void;
    onClose: () => void;
}

const KINDS: Array<[Kind, string]> = [
    ['site', 'wheresite'], ['category', 'wherecategories'], ['course', 'wherecourses'], ['activity', 'whereactivities'],
];

/**
 * The modal.
 *
 * @param props The texts, the place that means every page, the pages, regions and modes to offer, the mode the page is in and
 *     what to do with the places that were chosen.
 * @returns The modal.
 */
export default function PlacesModal({text, everywhere, pages, regions, modes, currentMode, onAdd, onClose}: PlacesModalProps) {
    const [kind, setKind] = useState<Kind>('site');
    const [chosen, setChosen] = useState<Record<string, ChosenPlace[]>>({category: [], course: [], activity: []});
    const [pageBoxes, setPageBoxes] = useState<string[]>([]);
    const [regionBoxes, setRegionBoxes] = useState<string[]>([]);
    const [mode, setMode] = useState(modes.some((each) => each.value === currentMode) ? currentMode : (modes[0]?.value ?? 'all'));
    const [copy, setCopy] = useState(true);
    const [error, setError] = useState('');

    const toggle = (list: string[], set: (next: string[]) => void, value: string): void => {
        set(list.includes(value) ? list.filter((each) => each !== value) : [...list, value]);
    };

    const save = (): void => {
        const extra = {pages: pageBoxes, regions: regionBoxes, mode: modes.length > 0 ? mode : 'all'};
        const wheres: Where[] = kind === 'site' ?
            [{contextid: everywhere.contextid, contextname: everywhere.contextname, contextkind: 'site', ...extra}] :
            chosen[kind].map((place) => ({contextid: place.contextid, contextname: place.name, contextkind: kind, ...extra}));
        if (wheres.length === 0) {
            setError(text('wherechoose'));
            return;
        }
        onAdd(wheres, copy);
    };

    const picker = (own: Kind, label: string, hint?: string) => kind === own && <LocationPicker key={own} kind={own}
        label={text(label)}
        hint={hint ? text(hint) : undefined} chosen={chosen[own]} text={text}
        onChange={(next) => setChosen({...chosen, [own]: next})} />;

    return <Modal title={text('addplacestitle')} saveLabel={text('addplacesconfirm')} cancelLabel={text('cancel')}
        closeLabel={text('closepanel')} onSave={save} onClose={onClose}>
        <div className="irs-places-form" data-region="places-form">
            <fieldset className="irs-field">
                <legend className="irs-label">{text('wherelocation')}</legend>
                <div className="irs-seg" role="radiogroup">
                    {KINDS.map(([value, label]) => <label className="irs-seg-option" key={value}>
                        <input type="radio" name="irs-kind" value={value} checked={kind === value}
                            onChange={() => setKind(value)} />
                        <span>{text(label)}</span>
                    </label>)}
                </div>
            </fieldset>
            {picker('category', 'wherecategories', 'wherecategoryhint')}
            {picker('course', 'wherecourses')}
            {picker('activity', 'whereactivities', 'whereactivityhint')}
            <fieldset className="irs-checks">
                <legend className="irs-label">{text('wherepages')}</legend>
                {pages.map((page) => <label className="irs-check" key={page.value}>
                    <input type="checkbox" data-region="where-page" value={page.value} checked={pageBoxes.includes(page.value)}
                        onChange={() => toggle(pageBoxes, setPageBoxes, page.value)} /> {page.label}
                </label>)}
            </fieldset>
            <fieldset className="irs-checks">
                <legend className="irs-label">{text('whereregions')}</legend>
                {regions.map((region) => <label className="irs-check" key={region.value}>
                    <input type="checkbox" data-region="where-region" value={region.value}
                        checked={regionBoxes.includes(region.value)}
                        onChange={() => toggle(regionBoxes, setRegionBoxes, region.value)} /> {region.label}
                </label>)}
            </fieldset>
            {modes.length > 0 && <fieldset className="irs-field">
                <legend className="irs-label">{text('wheremode')}</legend>
                <div className="irs-seg" role="radiogroup">
                    {modes.map((each) => <label className="irs-seg-option" key={each.value}>
                        <input type="radio" name="irs-mode" value={each.value} checked={mode === each.value}
                            onChange={() => setMode(each.value)} />
                        <span>{each.label}</span>
                    </label>)}
                </div>
            </fieldset>}
            <label className="irs-check irs-copy">
                <input type="checkbox" data-region="places-copy" checked={copy} onChange={() => setCopy(!copy)} />
                {' '}{text('placescopy')}
            </label>
            <p className="irs-hint irs-error" data-region="places-error" role="alert" hidden={error === ''}>{error}</p>
        </div>
    </Modal>;
}
