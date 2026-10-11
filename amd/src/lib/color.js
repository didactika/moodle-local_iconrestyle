// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Colour maths with no dependencies, so it can be tested without a browser.
 *
 * @module     local_iconrestyle/lib/color
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

/**
 * Parse #rgb, #rgba, #rrggbb or #rrggbbaa.
 *
 * @param {string} text Colour text.
 * @returns {{r: number, g: number, b: number, a: number}|null} Channels 0-255, or null when the text is not a hex colour.
 */
export const parseHex = (text) => {
    const match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(String(text).trim());
    if (!match) {
        return null;
    }
    let digits = match[1];
    if (digits.length <= 4) {
        digits = digits.split('').map((digit) => digit + digit).join('');
    }
    const alpha = digits.length === 8 ? parseInt(digits.slice(6, 8), 16) : 255;
    return {
        r: parseInt(digits.slice(0, 2), 16),
        g: parseInt(digits.slice(2, 4), 16),
        b: parseInt(digits.slice(4, 6), 16),
        a: alpha,
    };
};

/**
 * Write a colour in the canonical form the server stores.
 *
 * @param {{r: number, g: number, b: number, a: number}} colour Channels 0-255.
 * @returns {string} Lower-case hex, with alpha only when it is not opaque.
 */
export const toHex = ({r, g, b, a = 255}) => {
    const two = (value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0');
    return '#' + two(r) + two(g) + two(b) + (Math.round(a) === 255 ? '' : two(a));
};

/**
 * Canonical form of a colour typed by a person.
 *
 * @param {string} text Typed text.
 * @returns {string|null} Canonical hex, or null when it is not a valid hex colour.
 */
export const normalise = (text) => {
    const parsed = parseHex(text);
    return parsed ? toHex(parsed) : null;
};

/**
 * Convert RGB to hue, saturation and value.
 *
 * @param {{r: number, g: number, b: number}} colour Channels 0-255.
 * @returns {{h: number, s: number, v: number}} Hue 0-360, saturation and value 0-1.
 */
export const rgbToHsv = ({r, g, b}) => {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const max = Math.max(red, green, blue);
    const delta = max - Math.min(red, green, blue);
    let hue = 0;
    if (delta !== 0) {
        if (max === red) {
            hue = ((green - blue) / delta) % 6;
        } else if (max === green) {
            hue = (blue - red) / delta + 2;
        } else {
            hue = (red - green) / delta + 4;
        }
    }
    return {h: (Math.round(hue * 60) + 360) % 360, s: max === 0 ? 0 : delta / max, v: max};
};

/**
 * Convert hue, saturation and value to RGB.
 *
 * @param {{h: number, s: number, v: number}} colour Hue 0-360, saturation and value 0-1.
 * @returns {{r: number, g: number, b: number}} Channels 0-255.
 */
export const hsvToRgb = ({h, s, v}) => {
    const chroma = v * s;
    const second = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const match = v - chroma;
    const sector = Math.floor((((h % 360) + 360) % 360) / 60);
    const table = [[chroma, second, 0], [second, chroma, 0], [0, chroma, second], [0, second, chroma], [second, 0, chroma],
        [chroma, 0, second]];
    const [red, green, blue] = table[sector];
    return {r: Math.round((red + match) * 255), g: Math.round((green + match) * 255), b: Math.round((blue + match) * 255)};
};

/**
 * WCAG relative luminance.
 *
 * @param {{r: number, g: number, b: number}} colour Channels 0-255.
 * @returns {number} Luminance 0-1.
 */
export const luminance = ({r, g, b}) => {
    const linear = (channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

/**
 * WCAG contrast ratio between two opaque colours.
 *
 * @param {{r: number, g: number, b: number}} first First colour.
 * @param {{r: number, g: number, b: number}} second Second colour.
 * @returns {number} Ratio from 1 to 21.
 */
export const contrastRatio = (first, second) => {
    const one = luminance(first);
    const two = luminance(second);
    return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
};
