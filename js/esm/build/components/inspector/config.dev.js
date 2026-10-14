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
const SLIDERS = {
  radius: { label: "radius", step: 1, rest: 0 },
  bw: { label: "borderwidth", step: 1, rest: 0 },
  ow: { label: "outlinewidth", step: 1, rest: 0 },
  oo: { label: "outlineoffset", step: 1, rest: 0 },
  gd: { label: "gradientangle", step: 5, rest: 135 },
  scale: { label: "scale", step: 5, rest: 100 },
  rotate: { label: "rotation", step: 5, rest: 0 },
  skx: { label: "skewx", step: 1, rest: 0 },
  sky: { label: "skewy", step: 1, rest: 0 },
  opacity: { label: "opacity", step: 5, rest: 100 },
  brightness: { label: "brightness", step: 5, rest: 100 },
  contrast: { label: "contrast", step: 5, rest: 100 },
  saturate: { label: "saturation", step: 5, rest: 100 },
  grayscale: { label: "grayscale", step: 5, rest: 0 },
  hue: { label: "hue", step: 5, rest: 0 },
  sepia: { label: "sepia", step: 5, rest: 0 },
  invert: { label: "invert", step: 5, rest: 0 },
  blur: { label: "blur", step: 1, rest: 0 }
};
const SIDES = {
  padding: { label: "padding", reset: "resetpadding", first: "p", min: 0, max: 3 },
  margin: { label: "margin", reset: "resetmargin", first: "m", min: -1, max: 3 }
};
const SIDE_STRINGS = { t: "padtop", r: "padright", b: "padbottom", l: "padleft" };
const SELECTS = {
  shadow: ["none", "soft", "medium", "strong", "glow", "inner", "lifted", "hard"].map((value) => [value, `shadow${value}`]),
  ds: ["none", "soft", "medium", "strong", "glow"].map((value) => [value, `shadow${value}`]),
  bs: ["solid", "dashed", "dotted", "double"].map((value) => [value, `border${value}`]),
  blend: ["normal", "multiply", "screen", "overlay", "darken", "lighten", "difference"].map((value) => [value, `blend${value}`]),
  hover: [
    ["none", "shadownone"],
    ["grow", "hovergrow"],
    ["shrink", "hovershrink"],
    ["lift", "hoverlift"],
    ["tilt", "hovertilt"],
    ["fade", "hoverfade"]
  ]
};
const SELECT_LABELS = {
  shadow: "shadow",
  ds: "dropshadow",
  bs: "borderstyle",
  blend: "blend",
  hover: "hover"
};
const SHAPES = [
  ["", "shapedefault", ""],
  ["square", "shapesquare", "irs-square"],
  ["rounded", "shaperounded", "irs-rounded"],
  ["circle", "shapecircle", "irs-circle"],
  ["pill", "shapepill", "irs-pill-shape"]
];
export {
  SELECTS,
  SELECT_LABELS,
  SHAPES,
  SIDES,
  SIDE_STRINGS,
  SLIDERS
};
//# sourceMappingURL=config.dev.js.map
