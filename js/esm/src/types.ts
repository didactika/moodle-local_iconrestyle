// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * Shapes shared by the parts of the designer.
 *
 * @module     local_iconrestyle/types
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/** Where a rule applies: a place, the kinds of page and the regions of the page, and a colour mode. */
export interface Where {
    contextid: number;
    contextname: string;
    contextkind: string;
    pages: string[];
    regions: string[];
    mode: string;
}

/** An icon that can be customised, as the catalogue lists it. */
export interface Icon {
    key: string;
    kind: 'font' | 'image' | 'container';
    classes: string;
    imageurl: string;
    component: string;
    name: string;
    group: number;
    purpose: string;
    sample: string;
}

/** A rule as the server returns it. */
export interface Rule {
    id: number;
    rev: number;
    slotkey: string;
    contextid: number;
    contextname: string;
    contextkind: string;
    pages: string[];
    regions: string[];
    mode: string;
    painter: string;
    assetid: number;
    asseturl: string;
    assetkind: string;
    fg: string;
    bg: string;
    design: string;
    enabled: boolean;
}

/** The editable form of a rule. Design properties are null while they are not set. */
export interface Draft extends Where {
    slotkey: string;
    id: number;
    rev: number;
    painter: string;
    assetid: number;
    asseturl: string;
    assetkind: string;
    assetmono: boolean;
    autoartwork?: boolean;
    fg: string;
    bg: string;
    enabled: boolean;
    [property: string]: string | number | boolean | string[] | null | undefined;
}

/** A change to some fields of a draft. */
export type Patch = Record<string, string | number | boolean | string[] | null | undefined>;

/** What the server gives the designer to start from. */
export interface DesignerProps {
    adminurl: string;
    everywhere: Where;
    labels: {
        everywhere: string;
        pages: Record<string, string>;
        regions: Record<string, string>;
        modes: Record<string, string>;
    };
    pages: Array<{value: string; label: string}>;
    regions: Array<{value: string; label: string}>;
    colourmodes: string[];
    ranges: Record<string, [number, number]>;
    specials: Record<string, Array<{value: string; label: string}>>;
    defaults: {
        copygroups: string[];
        copyoverwrite: boolean;
        importmode: 'merge' | 'replace';
        importchoose: 'all' | 'new' | 'none';
    };
    strings: Record<string, string>;
}

/** Translate a string of the plugin, with the values of its placeholders in place. */
export type Text = (name: string, value?: string | number | Record<string, string | number>) => string;

/** The filters the person chose. */
export interface Filters {
    query: string;
    kinds: string[];
    components: string[];
    purposes: string[];
    traits: string[];
    places: string[];
    modes: string[];
    sort: 'catalogue' | 'name' | 'component' | 'modified';
}

/** What happens to an icon of a package that is imported. */
export interface ImportEntry {
    slot: string;
    created: number;
    updated: number;
    skipped: number;
}

/** What an import did, or would do. */
export interface ImportReport {
    created: number;
    updated: number;
    deleted: number;
    skipped: number;
    assets: number;
    issues: string[];
    entries: ImportEntry[];
    stylesheeturl: string;
}
