var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Finds the colours the active theme declares as CSS custom properties.
 *
 * @module     local_iconrestyle/lib/themevars
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
const ROOT_SELECTOR = /(^|[\s,>+~(])(:root|html|body)(?![\w-])/;
const VARIABLE = /^--[A-Za-z0-9_-]{1,64}$/;
const KEYWORDS = /^(inherit|initial|unset|revert|revert-layer)$/i;
const PREFIX = "var:";
const collect = /* @__PURE__ */ __name((rules, names) => {
  for (const rule of Array.from(rules)) {
    const styled = rule;
    if (styled.selectorText === void 0) {
      const grouping = rule;
      if (grouping.cssRules) {
        collect(grouping.cssRules, names);
      }
      continue;
    }
    if (!ROOT_SELECTOR.test(styled.selectorText)) {
      continue;
    }
    for (const property of Array.from(styled.style)) {
      if (property.startsWith("--") && VARIABLE.test(property)) {
        names.add(property);
      }
    }
  }
}, "collect");
const collectNames = /* @__PURE__ */ __name((sheets) => {
  const names = /* @__PURE__ */ new Set();
  for (const sheet of sheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    if (rules) {
      collect(rules, names);
    }
  }
  return [...names].sort();
}, "collectNames");
const resolveColours = /* @__PURE__ */ __name((names, read, supports) => names.map((name) => ({ name, value: read(name).trim() })).filter(({ value }) => value !== "" && !KEYWORDS.test(value) && supports(value)), "resolveColours");
const search = /* @__PURE__ */ __name((items, query, limit) => {
  const words = String(query).toLowerCase().replace(/--/g, " ").split(/\s+/).filter(Boolean);
  const matches = items.filter(({ name, value }) => {
    const haystack = `${name.slice(2)} ${value}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
  if (words.length > 0) {
    const first = words[0];
    const rank = /* @__PURE__ */ __name((item) => item.name.slice(2).toLowerCase().startsWith(first) ? 0 : 1, "rank");
    matches.sort((one, two) => rank(one) - rank(two));
  }
  return { items: matches.slice(0, limit), more: matches.length > limit };
}, "search");
const isVariableName = /* @__PURE__ */ __name((text) => VARIABLE.test(text), "isVariableName");
const toStored = /* @__PURE__ */ __name((name) => PREFIX + name, "toStored");
const nameOf = /* @__PURE__ */ __name((stored) => {
  if (stored.startsWith(PREFIX)) {
    return stored.slice(PREFIX.length);
  }
  if (stored.startsWith("token:")) {
    const token = stored.slice(6);
    return token.startsWith("activity") ? `--${token}` : `--bs-${token}`;
  }
  return "";
}, "nameOf");
const cssOf = /* @__PURE__ */ __name((stored) => {
  const name = nameOf(stored);
  if (name === "") {
    return "";
  }
  if (stored.startsWith("token:") && !name.startsWith("--activity")) {
    return `var(${name}, var(--${name.slice(5)}))`;
  }
  return `var(${name})`;
}, "cssOf");
export {
  collectNames,
  cssOf,
  isVariableName,
  nameOf,
  resolveColours,
  search,
  toStored
};
//# sourceMappingURL=themevars.dev.js.map
