/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * How each slider of the editing panel is named, stepped and where it rests while its property is not set.
 *
 * @module     local_iconrestyle/components/inspector/config
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/** A slider: the string of its label, its step and the value it rests at. */
export interface SliderConfig {
    label: string;
    step: number;
    rest: number;
}

export const SLIDERS: Record<string, SliderConfig> = {
    radius: {label: 'radius', step: 1, rest: 0},
    bw: {label: 'borderwidth', step: 1, rest: 0},
    ow: {label: 'outlinewidth', step: 1, rest: 0},
    oo: {label: 'outlineoffset', step: 1, rest: 0},
    gd: {label: 'gradientangle', step: 5, rest: 135},
    scale: {label: 'scale', step: 5, rest: 100},
    rotate: {label: 'rotation', step: 5, rest: 0},
    skx: {label: 'skewx', step: 1, rest: 0},
    sky: {label: 'skewy', step: 1, rest: 0},
    opacity: {label: 'opacity', step: 5, rest: 100},
    brightness: {label: 'brightness', step: 5, rest: 100},
    contrast: {label: 'contrast', step: 5, rest: 100},
    saturate: {label: 'saturation', step: 5, rest: 100},
    grayscale: {label: 'grayscale', step: 5, rest: 0},
    hue: {label: 'hue', step: 5, rest: 0},
    sepia: {label: 'sepia', step: 5, rest: 0},
    invert: {label: 'invert', step: 5, rest: 0},
    blur: {label: 'blur', step: 1, rest: 0},
};

/** The groups of sides: the strings of the label and of the button that clears them, and the range in em. */
export const SIDES = {
    padding: {label: 'padding', reset: 'resetpadding', first: 'p', min: 0, max: 3},
    margin: {label: 'margin', reset: 'resetmargin', first: 'm', min: -1, max: 3},
};

/** The strings that name the four sides, by the letter of the property. */
export const SIDE_STRINGS: Record<string, string> = {t: 'padtop', r: 'padright', b: 'padbottom', l: 'padleft'};

/** The options of a select that has a list of values, as value and string. */
export const SELECTS = {
    shadow: ['none', 'soft', 'medium', 'strong', 'glow', 'inner', 'lifted', 'hard'].map((value) => [value, `shadow${value}`]),
    ds: ['none', 'soft', 'medium', 'strong', 'glow'].map((value) => [value, `shadow${value}`]),
    bs: ['solid', 'dashed', 'dotted', 'double'].map((value) => [value, `border${value}`]),
    blend: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'difference'].map((value) => [value, `blend${value}`]),
    hover: [['none', 'shadownone'], ['grow', 'hovergrow'], ['shrink', 'hovershrink'], ['lift', 'hoverlift'], ['tilt', 'hovertilt'],
        ['fade', 'hoverfade']],
} as Record<string, string[][]>;

/** The string that labels each select. */
export const SELECT_LABELS: Record<string, string> = {
    shadow: 'shadow', ds: 'dropshadow', bs: 'borderstyle', blend: 'blend', hover: 'hover',
};

/** The shapes, by value, with the string that names each and the class that draws its sample. */
export const SHAPES: Array<[string, string, string]> = [
    ['', 'shapedefault', ''],
    ['square', 'shapesquare', 'irs-square'],
    ['rounded', 'shaperounded', 'irs-rounded'],
    ['circle', 'shapecircle', 'irs-circle'],
    ['pill', 'shapepill', 'irs-pill-shape'],
];
