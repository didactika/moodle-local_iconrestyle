// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * Colour maths with no dependencies, so it can be tested without a browser.
 *
 * @module     local_iconrestyle/lib/color
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

export interface Rgb {
    r: number;
    g: number;
    b: number;
}

export interface Rgba extends Rgb {
    a: number;
}

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

/**
 * Parse #rgb, #rgba, #rrggbb or #rrggbbaa.
 *
 * @param text Colour text.
 * @returns Channels 0-255, or null when the text is not a hex colour.
 */
export const parseHex = (text: string | null | undefined): Rgba | null => {
    const match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(String(text ?? '').trim());
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
 * @param colour Channels 0-255.
 * @returns Lower-case hex, with alpha only when it is not opaque.
 */
export const toHex = ({r, g, b, a = 255}: Rgb & {a?: number}): string => {
    const two = (value: number): string => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0');
    return '#' + two(r) + two(g) + two(b) + (Math.round(a) === 255 ? '' : two(a));
};

/**
 * Canonical form of a colour typed by a person.
 *
 * @param text Typed text.
 * @returns Canonical hex, or null when it is not a valid hex colour.
 */
export const normalise = (text: string): string | null => {
    const parsed = parseHex(text);
    return parsed ? toHex(parsed) : null;
};

/**
 * WCAG relative luminance.
 *
 * @param colour Channels 0-255.
 * @returns Luminance 0-1.
 */
export const luminance = ({r, g, b}: Rgb): number => {
    const linear = (channel: number): number => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

/**
 * WCAG contrast ratio between two opaque colours.
 *
 * @param first First colour.
 * @param second Second colour.
 * @returns Ratio from 1 to 21.
 */
export const contrastRatio = (first: Rgb, second: Rgb): number => {
    const one = luminance(first);
    const two = luminance(second);
    return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
};
