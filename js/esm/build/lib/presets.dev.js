var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The quick looks, the groups of properties that can be linked and what it takes to clear a design.
 *
 * @module     local_iconrestyle/lib/presets
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { DESIGN_PROPS } from "./draft";
const SIDE_GROUPS = { padding: ["pt", "pr", "pb", "pl"], margin: ["mt", "mr", "mb", "ml"] };
const NO_ARTWORK = { assetid: 0, asseturl: "", assetkind: "", assetmono: false, autoartwork: false };
const CLEAR_DESIGN = Object.fromEntries(DESIGN_PROPS.map((name) => [name, null]));
const around = /* @__PURE__ */ __name((value) => ({ pt: value, pr: value, pb: value, pl: value }), "around");
const LOOKS = {
  flat: { kinds: ["container"], keepDesign: true, force: { bg: "transparent" } },
  box: { kinds: ["container"], design: { shape: "rounded", ...around(20) } },
  pill: { kinds: ["container"], design: { shape: "pill", pt: 15, pr: 35, pb: 15, pl: 35, shadow: "soft" } },
  tile: { kinds: ["font", "image"], design: { shape: "rounded", ...around(25) }, colours: { bg: "token:light" } },
  badge: { kinds: ["font", "image"], design: { shape: "circle", ...around(30) }, colours: { bg: "token:primary", fg: "#ffffff" } },
  outline: { kinds: ["font", "image"], design: { shape: "circle", ...around(25), bw: 2, bs: "solid" } }
};
const LOOK_STRINGS = {
  flat: ["presetflat", "presetflathelp"],
  box: ["presetbox", "presetboxhelp"],
  pill: ["lookpill", "lookpillhelp"],
  tile: ["looktile", "looktilehelp"],
  badge: ["lookbadge", "lookbadgehelp"],
  outline: ["lookoutline", "lookoutlinehelp"]
};
const groupOf = /* @__PURE__ */ __name((prop) => Object.keys(SIDE_GROUPS).find(
  (group) => SIDE_GROUPS[group].includes(prop)
), "groupOf");
const sidesOf = /* @__PURE__ */ __name((group, value) => Object.fromEntries(
  SIDE_GROUPS[group].map((side) => [side, value])
), "sidesOf");
export {
  CLEAR_DESIGN,
  LOOKS,
  LOOK_STRINGS,
  NO_ARTWORK,
  SIDE_GROUPS,
  groupOf,
  sidesOf
};
//# sourceMappingURL=presets.dev.js.map
