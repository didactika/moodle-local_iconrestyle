var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
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
const DESIGN_PROPS = [
  "shape",
  "radius",
  "pt",
  "pr",
  "pb",
  "pl",
  "mt",
  "mr",
  "mb",
  "ml",
  "scale",
  "rotate",
  "skx",
  "sky",
  "flipx",
  "flipy",
  "bw",
  "bs",
  "bc",
  "ow",
  "oc",
  "oo",
  "bg2",
  "gd",
  "shadow",
  "sc",
  "ds",
  "blur",
  "brightness",
  "contrast",
  "saturate",
  "grayscale",
  "hue",
  "sepia",
  "invert",
  "blend",
  "hover",
  "opacity"
];
const FIELDS = ["assetid", "fg", "bg", "enabled", ...DESIGN_PROPS];
const whereKey = /* @__PURE__ */ __name((where) => `${where.contextid}|${where.pages.join(",")}|${where.regions.join(",")}|${where.mode}`, "whereKey");
const ruleKey = /* @__PURE__ */ __name((slotkey, where) => `${slotkey}#${whereKey(where)}`, "ruleKey");
const whereLabel = /* @__PURE__ */ __name((where, labels) => {
  const parts = [];
  if (where.contextkind !== "site") {
    parts.push(where.contextname);
  }
  parts.push(...where.pages.map((page) => labels.pages[page] || page));
  parts.push(...where.regions.map((region) => labels.regions[region] || region));
  if (where.mode !== "all") {
    parts.push(labels.modes[where.mode] || where.mode);
  }
  return parts.length ? parts.join(" \xB7 ") : labels.everywhere;
}, "whereLabel");
const noDesign = /* @__PURE__ */ __name(() => Object.fromEntries(DESIGN_PROPS.map((name) => [name, null])), "noDesign");
const emptyDraft = /* @__PURE__ */ __name((slotkey, where) => ({
  slotkey,
  id: 0,
  contextid: where.contextid,
  contextname: where.contextname,
  contextkind: where.contextkind,
  pages: [...where.pages],
  regions: [...where.regions],
  mode: where.mode,
  painter: "none",
  assetid: 0,
  asseturl: "",
  assetkind: "",
  assetmono: false,
  fg: "",
  bg: "",
  ...noDesign(),
  enabled: true,
  rev: 0
}), "emptyDraft");
const fromRule = /* @__PURE__ */ __name((rule) => {
  const design = rule.design ? JSON.parse(rule.design) : {};
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
    assetmono: rule.painter === "mask",
    fg: rule.fg,
    bg: rule.bg,
    ...noDesign(),
    ...design,
    enabled: rule.enabled,
    rev: rule.rev
  };
}, "fromRule");
const whereOf = /* @__PURE__ */ __name((draft) => ({
  contextid: draft.contextid,
  contextname: draft.contextname,
  contextkind: draft.contextkind,
  pages: draft.pages,
  regions: draft.regions,
  mode: draft.mode
}), "whereOf");
const designOf = /* @__PURE__ */ __name((draft) => Object.fromEntries(
  DESIGN_PROPS.filter((name) => draft[name] !== null && draft[name] !== void 0).map((name) => [name, draft[name]])
), "designOf");
const isEmpty = /* @__PURE__ */ __name((draft) => draft.assetid === 0 && draft.fg === "" && draft.bg === "" && Object.keys(designOf(draft)).length === 0, "isEmpty");
const sameDraft = /* @__PURE__ */ __name((first, second) => FIELDS.every(
  (field) => (first[field] ?? null) === (second[field] ?? null)
), "sameDraft");
const appearanceOf = /* @__PURE__ */ __name((draft) => ({
  assetid: draft.assetid,
  asseturl: draft.asseturl,
  assetkind: draft.assetkind,
  assetmono: draft.assetmono,
  fg: draft.fg,
  bg: draft.bg,
  ...Object.fromEntries(DESIGN_PROPS.map((name) => [name, draft[name] ?? null]))
}), "appearanceOf");
const LOOK_GROUPS = {
  colours: ["fg", "bg", "bg2", "gd"],
  shape: ["shape", "radius", "bw", "bs", "bc", "ow", "oc", "oo"],
  spacing: ["pt", "pr", "pb", "pl", "mt", "mr", "mb", "ml", "scale"],
  transform: ["rotate", "skx", "sky", "flipx", "flipy"],
  effects: [
    "opacity",
    "shadow",
    "sc",
    "ds",
    "blur",
    "brightness",
    "contrast",
    "saturate",
    "grayscale",
    "hue",
    "sepia",
    "invert",
    "blend",
    "hover"
  ],
  icon: ["assetid", "asseturl", "assetkind", "assetmono", "autoartwork"]
};
const pickLook = /* @__PURE__ */ __name((draft, groups) => Object.fromEntries(
  groups.flatMap((group) => (LOOK_GROUPS[group] ?? []).map((name) => [name, draft[name] ?? null]))
), "pickLook");
const traitsOf = /* @__PURE__ */ __name((draft) => {
  const traits = /* @__PURE__ */ new Set([`place:${draft.contextkind}`, `mode:${draft.mode}`]);
  ["colours", "shape", "spacing", "transform", "effects"].forEach((group) => {
    if (LOOK_GROUPS[group].some((name) => draft[name] !== null && draft[name] !== void 0 && draft[name] !== "")) {
      traits.add(group === "colours" ? "colour" : group);
    }
  });
  if (draft.assetid > 0) {
    traits.add("artwork");
  }
  if (draft.pages.length > 0 || draft.regions.length > 0) {
    traits.add("limited");
  }
  return traits;
}, "traitsOf");
const painterFor = /* @__PURE__ */ __name((draft, kind) => {
  if (draft.assetid > 0) {
    return draft.assetmono ? "mask" : "image";
  }
  if (kind === "container") {
    return "none";
  }
  return draft.fg !== "" && kind === "font" ? "color" : "none";
}, "painterFor");
const toInput = /* @__PURE__ */ __name((draft, kind) => {
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
    design: Object.keys(design).length ? JSON.stringify(design) : "",
    enabled: draft.enabled,
    rev: draft.rev
  };
}, "toInput");
const needsOwnArtwork = /* @__PURE__ */ __name((draft, kind) => kind === "image" && draft.fg !== "" && draft.assetid === 0, "needsOwnArtwork");
export {
  DESIGN_PROPS,
  LOOK_GROUPS,
  appearanceOf,
  designOf,
  emptyDraft,
  fromRule,
  isEmpty,
  needsOwnArtwork,
  painterFor,
  pickLook,
  ruleKey,
  sameDraft,
  toInput,
  traitsOf,
  whereKey,
  whereLabel,
  whereOf
};
//# sourceMappingURL=draft.dev.js.map
