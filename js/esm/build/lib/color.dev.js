var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Colour maths with no dependencies, so it can be tested without a browser.
 *
 * @module     local_iconrestyle/lib/color
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
const clamp = /* @__PURE__ */ __name((value, low, high) => Math.min(high, Math.max(low, value)), "clamp");
const parseHex = /* @__PURE__ */ __name((text) => {
  const match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(String(text ?? "").trim());
  if (!match) {
    return null;
  }
  let digits = match[1];
  if (digits.length <= 4) {
    digits = digits.split("").map((digit) => digit + digit).join("");
  }
  const alpha = digits.length === 8 ? parseInt(digits.slice(6, 8), 16) : 255;
  return {
    r: parseInt(digits.slice(0, 2), 16),
    g: parseInt(digits.slice(2, 4), 16),
    b: parseInt(digits.slice(4, 6), 16),
    a: alpha
  };
}, "parseHex");
const toHex = /* @__PURE__ */ __name(({ r, g, b, a = 255 }) => {
  const two = /* @__PURE__ */ __name((value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0"), "two");
  return "#" + two(r) + two(g) + two(b) + (Math.round(a) === 255 ? "" : two(a));
}, "toHex");
const normalise = /* @__PURE__ */ __name((text) => {
  const parsed = parseHex(text);
  return parsed ? toHex(parsed) : null;
}, "normalise");
const luminance = /* @__PURE__ */ __name(({ r, g, b }) => {
  const linear = /* @__PURE__ */ __name((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  }, "linear");
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}, "luminance");
const contrastRatio = /* @__PURE__ */ __name((first, second) => {
  const one = luminance(first);
  const two = luminance(second);
  return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
}, "contrastRatio");
export {
  contrastRatio,
  luminance,
  normalise,
  parseHex,
  toHex
};
//# sourceMappingURL=color.dev.js.map
