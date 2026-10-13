// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * The quick looks, the groups of properties that can be linked and what it takes to clear a design.
 *
 * @module     local_iconrestyle/lib/presets
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {DESIGN_PROPS} from './draft';
import type {Patch} from '../types';

/** The four sides of the properties that have one value per side. */
export const SIDE_GROUPS: Record<string, string[]> = {padding: ['pt', 'pr', 'pb', 'pl'], margin: ['mt', 'mr', 'mb', 'ml']};

/** Patch that leaves the artwork of a draft empty. */
export const NO_ARTWORK: Patch = {assetid: 0, asseturl: '', assetkind: '', assetmono: false, autoartwork: false};

/** Patch that clears every design property. */
export const CLEAR_DESIGN: Patch = Object.fromEntries(DESIGN_PROPS.map((name) => [name, null]));

const around = (value: number): Patch => ({pt: value, pr: value, pb: value, pl: value});

/** A quick look: what it sets, the colours it gives to what has none and what it forces. */
export interface Look {
    keepDesign?: boolean;
    design?: Patch;
    colours?: Record<string, string>;
    force?: Patch;
    kinds: string[];
}

/**
 * The quick looks, by name.
 *
 * A look gives the shape, the spacing, the border and the shadow. It keeps the colours the person has already chosen and only
 * gives a colour to what has none, so choosing a look never undoes a colour. The exception is the one look that exists to take
 * a colour away, which does that and nothing else.
 */
export const LOOKS: Record<string, Look> = {
    flat: {kinds: ['container'], keepDesign: true, force: {bg: 'transparent'}},
    box: {kinds: ['container'], design: {shape: 'rounded', ...around(20)}},
    pill: {kinds: ['container'], design: {shape: 'pill', pt: 15, pr: 35, pb: 15, pl: 35, shadow: 'soft'}},
    tile: {kinds: ['font', 'image'], design: {shape: 'rounded', ...around(25)}, colours: {bg: 'token:light'}},
    badge: {kinds: ['font', 'image'], design: {shape: 'circle', ...around(30)}, colours: {bg: 'token:primary', fg: '#ffffff'}},
    outline: {kinds: ['font', 'image'], design: {shape: 'circle', ...around(25), bw: 2, bs: 'solid'}},
};

/** The string that names each look and the one that explains it. */
export const LOOK_STRINGS: Record<string, [string, string]> = {
    flat: ['presetflat', 'presetflathelp'],
    box: ['presetbox', 'presetboxhelp'],
    pill: ['lookpill', 'lookpillhelp'],
    tile: ['looktile', 'looktilehelp'],
    badge: ['lookbadge', 'lookbadgehelp'],
    outline: ['lookoutline', 'lookoutlinehelp'],
};

/**
 * The group of sides a property belongs to.
 *
 * @param prop Design property.
 * @returns padding or margin, or undefined when the property has no sides.
 */
export const groupOf = (prop: string): string | undefined => Object.keys(SIDE_GROUPS).find(
    (group) => SIDE_GROUPS[group].includes(prop),
);

/**
 * A patch that sets every side of a group to one value.
 *
 * @param group padding or margin.
 * @param value Value, or null to clear.
 * @returns Patch.
 */
export const sidesOf = (group: string, value: number | null): Patch => Object.fromEntries(
    SIDE_GROUPS[group].map((side) => [side, value]),
);
