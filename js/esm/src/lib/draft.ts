// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * The editable form of a rule, kept apart from the server's own response so it can be compared and staged.
 *
 * A rule is an icon, a place where it applies (the site, a category, a course or an activity, optionally limited to some
 * kinds of page and some page regions) and an appearance. The place is what tells apart the variants of one icon.
 *
 * @module     local_iconrestyle/lib/draft
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import type {Draft, Patch, Rule, Where} from '../types';

/** Design properties of a draft. Each is null while it is not set, which leaves Moodle's own value alone. */
export const DESIGN_PROPS = [
    'shape', 'radius', 'pt', 'pr', 'pb', 'pl', 'mt', 'mr', 'mb', 'ml', 'scale', 'rotate', 'skx', 'sky', 'flipx', 'flipy', 'bw',
    'bs', 'bc', 'ow', 'oc', 'oo', 'bg2', 'gd', 'shadow', 'sc', 'ds', 'blur', 'brightness', 'contrast', 'saturate', 'grayscale',
    'hue', 'sepia', 'invert', 'blend', 'hover', 'opacity',
];

const FIELDS = ['assetid', 'fg', 'bg', 'enabled', ...DESIGN_PROPS];

/**
 * Identity of a place, the same for the same site, category, course or activity with the same pages and regions.
 *
 * @param where Place.
 * @returns Identity.
 */
export const whereKey = (where: Where): string =>
    `${where.contextid}|${where.pages.join(',')}|${where.regions.join(',')}|${where.mode}`;

/**
 * Identity of one variant of one icon.
 *
 * @param slotkey Slot key.
 * @param where Place.
 * @returns Identity.
 */
export const ruleKey = (slotkey: string, where: Where): string => `${slotkey}#${whereKey(where)}`;

/** Names to describe a place with. */
export interface WhereLabels {
    everywhere: string;
    pages: Record<string, string>;
    regions: Record<string, string>;
    modes: Record<string, string>;
}

/**
 * Words that describe a place.
 *
 * @param where Place.
 * @param labels Names to use.
 * @returns For example "Faculty of Arts · Administration pages · Navigation bar · Dark mode", or "Everywhere".
 */
export const whereLabel = (where: Where, labels: WhereLabels): string => {
    const parts: string[] = [];
    if (where.contextkind !== 'site') {
        parts.push(where.contextname);
    }
    parts.push(...where.pages.map((page) => labels.pages[page] || page));
    parts.push(...where.regions.map((region) => labels.regions[region] || region));
    if (where.mode !== 'all') {
        parts.push(labels.modes[where.mode] || where.mode);
    }
    return parts.length ? parts.join(' · ') : labels.everywhere;
};

/**
 * The design properties that are not set.
 *
 * @returns Every design property, null.
 */
const noDesign = (): Record<string, null> => Object.fromEntries(DESIGN_PROPS.map((name) => [name, null]));

/**
 * A draft that changes nothing.
 *
 * @param slotkey Slot key.
 * @param where Place.
 * @returns Draft.
 */
export const emptyDraft = (slotkey: string, where: Where): Draft => ({
    slotkey,
    id: 0,
    contextid: where.contextid,
    contextname: where.contextname,
    contextkind: where.contextkind,
    pages: [...where.pages],
    regions: [...where.regions],
    mode: where.mode,
    painter: 'none',
    assetid: 0,
    asseturl: '',
    assetkind: '',
    assetmono: false,
    fg: '',
    bg: '',
    ...noDesign(),
    enabled: true,
    rev: 0,
});

/**
 * Turn a rule returned by the server into a draft.
 *
 * @param rule Rule as returned by local_iconrestyle_get_rules.
 * @returns Draft.
 */
export const fromRule = (rule: Rule): Draft => {
    const design = rule.design ? JSON.parse(rule.design) as Record<string, string | number> : {};
    return {
        slotkey: rule.slotkey,
        id: rule.id,
        contextid: rule.contextid,
        contextname: rule.contextname,
        contextkind: rule.contextkind,
        pages: [...rule.pages],
        regions: [...rule.regions],
        mode: rule.mode,
        painter: rule.painter,
        assetid: rule.assetid,
        asseturl: rule.asseturl,
        assetkind: rule.assetkind,
        assetmono: rule.painter === 'mask',
        fg: rule.fg,
        bg: rule.bg,
        ...noDesign(),
        ...design,
        enabled: rule.enabled,
        rev: rule.rev,
    };
};

/**
 * The place of a draft.
 *
 * @param draft Draft.
 * @returns Place.
 */
export const whereOf = (draft: Draft | Rule): Where => ({
    contextid: draft.contextid,
    contextname: draft.contextname,
    contextkind: draft.contextkind,
    pages: draft.pages,
    regions: draft.regions,
    mode: draft.mode,
});

/**
 * The design properties of a draft that are set.
 *
 * @param draft Draft.
 * @returns Properties by name.
 */
export const designOf = (draft: Draft): Record<string, string | number> => Object.fromEntries(
    DESIGN_PROPS.filter((name) => draft[name] !== null && draft[name] !== undefined)
        .map((name) => [name, draft[name] as string | number]),
);

/**
 * Whether a draft changes nothing at all.
 *
 * @param draft Draft.
 * @returns True when there is no artwork, colour or design property.
 */
export const isEmpty = (draft: Draft): boolean => draft.assetid === 0 && draft.fg === '' && draft.bg === '' &&
    Object.keys(designOf(draft)).length === 0;

/**
 * Whether two drafts would produce the same appearance.
 *
 * @param first First draft.
 * @param second Second draft.
 * @returns True when every editable field matches.
 */
export const sameDraft = (first: Draft, second: Draft): boolean => FIELDS.every(
    (field) => (first[field] ?? null) === (second[field] ?? null),
);

/**
 * The appearance of a draft, without its place, so it can be copied to another place.
 *
 * @param draft Draft.
 * @returns Fields to stage on another variant.
 */
export const appearanceOf = (draft: Draft): Patch => ({
    assetid: draft.assetid,
    asseturl: draft.asseturl,
    assetkind: draft.assetkind,
    assetmono: draft.assetmono,
    fg: draft.fg,
    bg: draft.bg,
    ...Object.fromEntries(DESIGN_PROPS.map((name) => [name, draft[name] ?? null])),
});

/** What the look of an icon is made of, in the groups the person chooses from when copying it to other icons. */
export const LOOK_GROUPS: Record<string, string[]> = {
    colours: ['fg', 'bg', 'bg2', 'gd'],
    shape: ['shape', 'radius', 'bw', 'bs', 'bc', 'ow', 'oc', 'oo'],
    spacing: ['pt', 'pr', 'pb', 'pl', 'mt', 'mr', 'mb', 'ml', 'scale'],
    transform: ['rotate', 'skx', 'sky', 'flipx', 'flipy'],
    effects: [
        'opacity', 'shadow', 'sc', 'ds', 'blur', 'brightness', 'contrast', 'saturate', 'grayscale', 'hue', 'sepia', 'invert',
        'blend', 'hover',
    ],
    icon: ['assetid', 'asseturl', 'assetkind', 'assetmono', 'autoartwork'],
};

/**
 * The part of a look that was chosen.
 *
 * @param draft Draft to take the look from.
 * @param groups Names of the groups of LOOK_GROUPS to take.
 * @returns Fields to stage on another variant.
 */
export const pickLook = (draft: Draft, groups: string[]): Patch => Object.fromEntries(
    groups.flatMap((group) => (LOOK_GROUPS[group] ?? []).map((name) => [name, draft[name] ?? null])),
);

/**
 * What a draft customises, in words the filters of the designer use.
 *
 * @param draft Draft.
 * @returns colour, shape, spacing, transform, effects, artwork, limited, place:<kind> and mode:<mode>.
 */
export const traitsOf = (draft: Draft): Set<string> => {
    const traits = new Set<string>([`place:${draft.contextkind}`, `mode:${draft.mode}`]);
    ['colours', 'shape', 'spacing', 'transform', 'effects'].forEach((group) => {
        if (LOOK_GROUPS[group].some((name) => draft[name] !== null && draft[name] !== undefined && draft[name] !== '')) {
            traits.add(group === 'colours' ? 'colour' : group);
        }
    });
    if (draft.assetid > 0) {
        traits.add('artwork');
    }
    if (draft.pages.length > 0 || draft.regions.length > 0) {
        traits.add('limited');
    }
    return traits;
};

/**
 * The painter a draft needs.
 *
 * An icon of the person's own, which any icon can have, is drawn through a mask when it has a single colour, so it can be
 * recoloured, and as an image otherwise. A font icon with only a colour keeps Moodle's glyph and just changes its colour.
 *
 * @param draft Draft.
 * @param kind font, image or container.
 * @returns color, mask, image or none.
 */
export const painterFor = (draft: Draft, kind: string): string => {
    if (draft.assetid > 0) {
        return draft.assetmono ? 'mask' : 'image';
    }
    if (kind === 'container') {
        return 'none';
    }
    return draft.fg !== '' && kind === 'font' ? 'color' : 'none';
};

/** The input of local_iconrestyle_save_rules and local_iconrestyle_preview_css. */
export interface RuleInput {
    slotkey: string;
    contextid: number;
    pages: string[];
    regions: string[];
    mode: string;
    painter: string;
    assetid: number;
    fg: string;
    bg: string;
    design: string;
    enabled: boolean;
    rev: number;
}

/**
 * Fields for local_iconrestyle_save_rules and local_iconrestyle_preview_css.
 *
 * @param draft Draft.
 * @param kind font, image or container.
 * @returns Input following the web service description.
 */
export const toInput = (draft: Draft, kind: string): RuleInput => {
    const design = designOf(draft);
    return {
        slotkey: draft.slotkey,
        contextid: draft.contextid,
        pages: draft.pages,
        regions: draft.regions,
        mode: draft.mode,
        painter: painterFor(draft, kind),
        assetid: draft.assetid,
        fg: draft.fg,
        bg: draft.bg,
        design: Object.keys(design).length ? JSON.stringify(design) : '',
        enabled: draft.enabled,
        rev: draft.rev,
    };
};

/**
 * Whether the foreground colour of an image icon still needs its artwork.
 *
 * Image icons are recoloured through their own file, which the designer fetches when a colour is set.
 *
 * @param draft Draft.
 * @param kind font, image or container.
 * @returns True when a colour is set and there is no artwork yet.
 */
export const needsOwnArtwork = (draft: Draft, kind: string): boolean => kind === 'image' && draft.fg !== '' && draft.assetid === 0;
