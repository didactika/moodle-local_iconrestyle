/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Chooses categories, courses or activities by name: what is typed is searched on the server and the places found are offered.
 *
 * @module     local_iconrestyle/components/places/LocationPicker
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useEffect, useRef, useState} from 'react';
import * as api from '../../services/api';
import {IconClose} from '../common/Icons';
import type {Text} from '../../types';

/** A place that was chosen. */
export interface ChosenPlace {
    contextid: number;
    name: string;
}

interface LocationPickerProps {
    kind: string;
    label: string;
    hint?: string;
    chosen: ChosenPlace[];
    text: Text;
    onChange: (chosen: ChosenPlace[]) => void;
}

const SEARCH_DELAY_MS = 200;

/**
 * A search that chooses several places of one kind.
 *
 * @param props The kind of place, its label and hint, what is chosen, the texts and what to do when the choice changes.
 * @returns The field.
 */
export default function LocationPicker({kind, label, hint, chosen, text, onChange}: LocationPickerProps) {
    const [query, setQuery] = useState('');
    const [found, setFound] = useState<api.Place[] | null>(null);
    const token = useRef(0);

    useEffect(() => {
        if (query.trim() === '') {
            setFound(null);
            return undefined;
        }
        const mine = ++token.current;
        const timer = window.setTimeout(() => {
            api.searchLocations(kind, query.trim()).then((result) => {
                if (mine === token.current) {
                    setFound(result.places);
                }
                return null;
            }).catch(() => {
                if (mine === token.current) {
                    setFound([]);
                }
            });
        }, SEARCH_DELAY_MS);
        return () => window.clearTimeout(timer);
    }, [kind, query]);

    const choose = (place: api.Place): void => {
        if (!chosen.some((each) => each.contextid === place.contextid)) {
            onChange([...chosen, {contextid: place.contextid, name: place.name}]);
        }
        setQuery('');
        setFound(null);
    };

    const options = (found ?? []).filter((place) => !chosen.some((each) => each.contextid === place.contextid));

    return <div className="irs-field" data-kind-field={kind}>
        <label className="irs-label" htmlFor={`irs-places-${kind}`}>{label}</label>
        <div className="irs-picked" role="list">
            {chosen.map((place) => <span key={place.contextid} className="badge badge-primary bg-primary irs-picked-item"
                role="listitem"
                data-value={place.contextid}>
                {place.name}
                <button type="button" className="irs-x" aria-label={text('removeplace', place.name)}
                    onClick={() => onChange(chosen.filter((each) => each.contextid !== place.contextid))}>
                    <IconClose />
                </button>
            </span>)}
        </div>
        <input type="text" className="form-control" id={`irs-places-${kind}`} autoComplete="off" value={query}
            placeholder={text('placesplaceholder')} role="combobox" aria-expanded={found !== null} aria-autocomplete="list"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    if (options[0]) {
                        choose(options[0]);
                    }
                }
            }} />
        {found !== null && <div className="irs-location-list" role="listbox">
            {options.map((place) => <button key={place.contextid} type="button" className="irs-location-item" role="option"
                aria-selected="false" data-value={place.contextid} onClick={() => choose(place)}>
                <span>{place.name}</span>{place.detail ? <small>{place.detail}</small> : null}
            </button>)}
            {options.length === 0 && <p className="irs-theme-note">{text('placesnone')}</p>}
        </div>}
        {hint ? <p className="irs-hint">{hint}</p> : null}
    </div>;
}
