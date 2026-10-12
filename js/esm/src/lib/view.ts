// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * What the designer shows about the open icon and the colour mode, worked out from its state.
 *
 * @module     local_iconrestyle/lib/view
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {whereLabel} from './draft';
import type {DesignerState} from '../engine/state';
import type {PageColourMode} from '../hooks/usePageColourMode';
import type {Text, Where} from '../types';

/** What it takes to work out the view. */
export interface ViewInput {
    state: DesignerState;
    selected: string | null;
    active: string | null;
    customised: boolean;
    modes: string[];
    labels: {
        everywhere: string;
        pages: Record<string, string>;
        regions: Record<string, string>;
        modes: Record<string, string>;
    };
    surface: string;
    modeNow: string;
    pageMode: PageColourMode | null;
    selecting: boolean;
    text: Text;
}

/** What the designer shows. */
export interface View {
    rootClass: string;
    theme: string | null;
    note: string;
    filterModes: Record<string, string>;
    selectionModes: Record<string, string>;
    activeWhere: Where | null;
    others: string[];
    removable: boolean;
    variants: Array<{key: string; label: string; active: boolean; removable: boolean}>;
}

/**
 * The colour modes other than the one of the open variant, which a look can be copied to.
 *
 * @param where Place of the open variant, or null when none is open.
 * @param modes The colour modes of the site.
 * @returns The other modes, none for a look that applies to every mode.
 */
const othersOf = (where: Where | null, modes: string[]): string[] => {
    if (where === null || where.mode === 'all') {
        return [];
    }
    return modes.filter((mode) => mode !== where.mode);
};

/**
 * The note that says which colour mode the page is shown in.
 *
 * @param input The view input.
 * @returns The text, empty when the site has no colour modes or the page has none.
 */
const noteOf = (input: ViewInput): string => {
    const {pageMode, modes, labels, text} = input;
    if (modes.length === 0 || pageMode === null) {
        return '';
    }
    return text(pageMode.followsDevice ? 'currentmodeauto' : 'currentmode', labels.modes[pageMode.applied] || pageMode.applied);
};

/**
 * Work out what the designer shows.
 *
 * @param input The state of the designer and what it needs to describe it.
 * @returns The view.
 */
export const deriveView = (input: ViewInput): View => {
    const {state, selected, active, customised, modes, labels, surface, modeNow, selecting} = input;
    const activeWhere = active === null ? null : state.whereOfKey(active);
    const hasModes = modes.length > 0;
    const variants = selected === null ? [] : state.variants(selected);
    const everywhere = selected === null ? null : state.everywhereKey(selected, modeNow);
    return {
        rootClass: selecting ? 'irs irs-picking' : 'irs',
        theme: hasModes ? surface : null,
        note: noteOf(input),
        filterModes: hasModes ? labels.modes : {},
        selectionModes: modes.length > 1 ? labels.modes : {},
        activeWhere,
        others: othersOf(activeWhere, modes),
        removable: customised || (active !== null && active !== everywhere),
        variants: variants.map((variant) => ({
            key: variant.key,
            label: whereLabel(variant.where, labels),
            active: variant.key === active,
            removable: !variant.base,
        })),
    };
};
