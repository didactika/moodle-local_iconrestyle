var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Client-side search, filtering and sorting of the icon catalogue.
 *
 * @module     local_iconrestyle/lib/filter
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
const NONE = /* @__PURE__ */ new Set();
const STATUS = ["untouched", "modified", "shared"];
const words = /* @__PURE__ */ __name((text) => String(text).toLowerCase().split(/[\s/:_-]+/).filter((word) => word !== ""), "words");
const sortIcons = /* @__PURE__ */ __name((icons, sort, modified) => {
  if (sort === "name") {
    return [...icons].sort((a, b) => a.name.localeCompare(b.name) || a.component.localeCompare(b.component));
  }
  if (sort === "component") {
    return [...icons].sort((a, b) => a.component.localeCompare(b.component) || a.name.localeCompare(b.name));
  }
  if (sort === "modified") {
    return [...icons].sort((a, b) => Number(modified.has(b.key)) - Number(modified.has(a.key)));
  }
  return icons;
}, "sortIcons");
const filterIcons = /* @__PURE__ */ __name((icons, options = {}) => {
  const {
    query = "",
    kinds = [],
    modified = NONE,
    components = [],
    purposes = [],
    traits = [],
    places = [],
    modes = [],
    traitsOf = /* @__PURE__ */ __name(() => NONE, "traitsOf")
  } = options;
  const wanted = words(query);
  const all = traits.filter((trait) => !STATUS.includes(trait));
  const needTraits = all.length > 0 || places.length > 0 || modes.length > 0;
  return icons.filter((icon) => {
    if (kinds.length > 0 && !kinds.includes(icon.kind)) {
      return false;
    }
    if (components.length > 0 && !components.includes(icon.component)) {
      return false;
    }
    if (purposes.length > 0 && !purposes.includes(icon.purpose)) {
      return false;
    }
    if (traits.includes("untouched") && modified.has(icon.key) || traits.includes("modified") && !modified.has(icon.key) || traits.includes("shared") && icon.group < 2) {
      return false;
    }
    if (needTraits) {
      const have = traitsOf(icon.key);
      const anyOf = /* @__PURE__ */ __name((prefix, list) => list.length === 0 || list.some((name) => have.has(`${prefix}:${name}`)), "anyOf");
      if (!all.every((trait) => have.has(trait)) || !anyOf("place", places) || !anyOf("mode", modes)) {
        return false;
      }
    }
    const haystack = icon.key.toLowerCase();
    return wanted.every((word) => haystack.includes(word));
  });
}, "filterIcons");
const visibleRows = /* @__PURE__ */ __name((scrollTop, viewportHeight, rowHeight, rowCount, buffer = 2) => {
  const first = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
  const last = Math.min(rowCount, Math.ceil((scrollTop + viewportHeight) / rowHeight) + buffer);
  return { first, last };
}, "visibleRows");
export {
  filterIcons,
  sortIcons,
  visibleRows
};
//# sourceMappingURL=filter.dev.js.map
