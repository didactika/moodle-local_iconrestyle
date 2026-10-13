// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * The colour mode this page is shown in, when Moodle has colour modes.
 *
 * Boost writes the mode that is applied in the data-bs-theme attribute of the html element, and the mode the person chose,
 * which can also be to follow the device, in data-colourmode. A site where colour modes are not enabled writes neither, and
 * then nothing is shown and nothing is preselected.
 *
 * @module     local_iconrestyle/hooks/usePageColourMode
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useEffect, useState} from 'react';

/** The mode of the page. */
export interface PageColourMode {
    applied: string;
    followsDevice: boolean;
}

/**
 * The mode of the page right now.
 *
 * @returns The mode that is applied, light or dark, and whether the person chose to follow the device; or null when the page
 *     has no colour mode.
 */
const detect = (): PageColourMode | null => {
    const html = document.documentElement;
    const applied = html.getAttribute('data-bs-theme');
    if (applied !== 'light' && applied !== 'dark') {
        return null;
    }
    return {applied, followsDevice: html.getAttribute('data-colourmode') === 'auto'};
};

/**
 * Follow the colour mode of the page, as when the person picks another one in the menu of Boost.
 *
 * @returns The mode of the page, which changes when the page changes it.
 */
export const usePageColourMode = (): PageColourMode | null => {
    const [mode, setMode] = useState<PageColourMode | null>(detect);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const next = detect();
            setMode((before) => (before && next && before.applied === next.applied && before.followsDevice === next.followsDevice ?
                before : next));
        });
        observer.observe(document.documentElement, {attributes: true, attributeFilter: ['data-bs-theme', 'data-colourmode']});
        return () => observer.disconnect();
    }, []);

    return mode;
};
