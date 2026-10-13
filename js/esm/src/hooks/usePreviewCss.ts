// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * Compiles the look of a draft that is not saved yet, so the preview and the card of the open icon can show it.
 *
 * The server compiles it, so what the preview shows is what the site will show. A request goes out a moment after the last
 * change, only one request is in flight at a time with the newest look winning, and a look that was compiled before is not
 * asked for again.
 *
 * @module     local_iconrestyle/hooks/usePreviewCss
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useEffect, useRef, useState} from 'react';
import * as api from '../services/api';
import {toInput, type RuleInput} from '../lib/draft';
import type {Draft, Icon} from '../types';

const DEBOUNCE_MS = 250;
const CACHE_LIMIT = 200;

/** What the hook gives. */
export interface PreviewCss {
    /** CSS of the look of the open icon, scoped to the preview. */
    css: string;
    /** Whether a look is being compiled. */
    waiting: boolean;
    /** The last look that was compiled for each icon, for the cards of icons whose change the site does not show yet. */
    held: Map<string, string>;
}

/**
 * Compile the look of the draft of an icon.
 *
 * @param icon The open icon, or null when none is open.
 * @param draft The draft to show, or null for the look Moodle gives the icon.
 * @returns The compiled CSS and whether it is being compiled.
 */
export const usePreviewCss = (icon: Icon | null, draft: Draft | null): PreviewCss => {
    const [shown, setShown] = useState<{key: string; css: string}>({key: '', css: ''});
    const [waiting, setWaiting] = useState(false);
    const cache = useRef(new Map<string, string>());
    const held = useRef(new Map<string, string>());
    const token = useRef(0);
    const busy = useRef<Promise<void>>(Promise.resolve());
    const timer = useRef(0);
    const input = icon && draft ? toInput(draft, icon.kind) : null;
    const signature = input ? JSON.stringify(input) : '';
    const key = icon ? icon.key : '';

    useEffect(() => {
        window.clearTimeout(timer.current);
        const apply = (compiled: string): void => {
            held.current.set(key, compiled);
            setShown({key, css: compiled});
            setWaiting(false);
        };
        if (key === '') {
            token.current++;
            setShown({key: '', css: ''});
            setWaiting(false);
            return;
        }
        if (input === null) {
            token.current++;
            apply('');
            return;
        }
        const cached = cache.current.get(signature);
        if (cached !== undefined) {
            token.current++;
            apply(cached);
            return;
        }
        setWaiting(true);
        const mine = ++token.current;
        const request = async(rule: RuleInput): Promise<void> => {
            if (mine !== token.current) {
                return;
            }
            let compiled: string;
            try {
                compiled = await api.previewCss([rule], 'new');
                cache.current.set(signature, compiled);
                if (cache.current.size > CACHE_LIMIT) {
                    cache.current.delete(cache.current.keys().next().value as string);
                }
            } catch {
                compiled = '';
            }
            if (mine === token.current) {
                apply(compiled);
            }
        };
        timer.current = window.setTimeout(() => {
            busy.current = busy.current.then(() => request(input));
        }, DEBOUNCE_MS);
        // The signature stands for the draft and the icon kind.
    }, [key, signature]);

    return {css: shown.key === key ? shown.css : '', waiting, held: held.current};
};
