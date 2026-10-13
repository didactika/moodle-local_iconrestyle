var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * A list of the colours the active theme declares, that looks and works like a select and can be searched by typing.
 *
 * The colours are read from the page: every custom property that the stylesheets declare on the root of the page and whose
 * value is a colour. They are not a fixed list, so a theme that adds its own colours offers them too.
 *
 * @module     local_iconrestyle/components/inspector/ThemeColourSelect
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFollowAnchor } from "../../hooks/useFollowAnchor";
import { IconChevron } from "../common/Icons";
import * as themevars from "../../lib/themevars";
const LIMIT = 80;
const GAP = 4;
const MARGIN = 12;
let catalogue = null;
const themeColours = /* @__PURE__ */ __name(() => {
  if (catalogue === null) {
    const style = window.getComputedStyle(document.documentElement);
    catalogue = themevars.resolveColours(
      themevars.collectNames(Array.from(document.styleSheets)),
      (name) => style.getPropertyValue(name),
      (value) => window.CSS.supports("color", value)
    );
  }
  return catalogue;
}, "themeColours");
function ThemeColourSelect({ name, stored, specials, text, onPick }) {
  const input = useRef(null);
  const panel = useRef(null);
  const list = useRef(null);
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState({ panel: {}, list: {} });
  const variable = themevars.nameOf(stored);
  const special = specials.find((item) => item.value === stored);
  const shown = variable !== "" ? variable : special?.label ?? "";
  const needle = typing ? query.trim() : "";
  const choices = useMemo(() => {
    if (!open) {
      return null;
    }
    const found = themevars.search(themeColours(), needle, LIMIT);
    const custom = themevars.isVariableName(needle) && !themeColours().some((item) => item.name === needle) ? needle : "";
    const wanted = specials.filter((item) => needle === "" || item.label.toLowerCase().includes(needle.toLowerCase()));
    return { found, custom, specials: wanted };
  }, [open, needle, specials]);
  const close = /* @__PURE__ */ __name(() => {
    setOpen(false);
    setTyping(false);
  }, "close");
  const follow = /* @__PURE__ */ __name(() => {
    if (!input.current) {
      return;
    }
    const rect = input.current.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      close();
      return;
    }
    const width = Math.min(Math.max(rect.width, 260), window.innerWidth - 2 * MARGIN);
    const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - width - MARGIN));
    const below = window.innerHeight - rect.bottom - MARGIN;
    const above = rect.top - MARGIN;
    if (below >= 220 || below >= above) {
      setPlace({
        panel: { left, width, top: rect.bottom + GAP },
        list: { maxHeight: Math.max(140, below - 16) }
      });
    } else {
      setPlace({
        panel: { left, width, bottom: window.innerHeight - rect.top + GAP },
        list: { maxHeight: Math.max(140, above - 16) }
      });
    }
  }, "follow");
  useLayoutEffect(() => {
    if (open) {
      follow();
    }
  }, [open]);
  useFollowAnchor(open, follow, () => panel.current);
  useEffect(() => {
    if (!open) {
      return void 0;
    }
    const outside = /* @__PURE__ */ __name((event) => {
      const target = event.target;
      if (!panel.current?.contains(target) && target !== input.current) {
        close();
      }
    }, "outside");
    document.addEventListener("pointerdown", outside, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
    };
  }, [open]);
  const pick = /* @__PURE__ */ __name((value) => {
    close();
    input.current?.blur();
    onPick(value);
  }, "pick");
  const items = /* @__PURE__ */ __name(() => Array.from(list.current?.querySelectorAll(".irs-theme-item") ?? []), "items");
  const inputKeys = /* @__PURE__ */ __name((event) => {
    const first = items()[0];
    if (event.key === "Enter") {
      event.preventDefault();
      if (open && first) {
        pick(first.dataset.value ?? "");
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      } else if (first) {
        first.focus();
      }
    } else if (event.key === "Escape" && open) {
      event.stopPropagation();
      close();
    }
  }, "inputKeys");
  const panelKeys = /* @__PURE__ */ __name((event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      input.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }
    const all = items();
    const index = all.indexOf(document.activeElement);
    if (index < 0) {
      return;
    }
    event.preventDefault();
    if (event.key === "ArrowUp" && index === 0) {
      input.current?.focus();
      return;
    }
    all[index + (event.key === "ArrowDown" ? 1 : -1)]?.focus();
  }, "panelKeys");
  const none = choices !== null && choices.found.items.length === 0 && choices.specials.length === 0 && choices.custom === "";
  return /* @__PURE__ */ jsxDEV("div", { className: "irs-theme", children: [
    /* @__PURE__ */ jsxDEV(
      "span",
      {
        className: "irs-swatch",
        "data-region": `${name}-themeswatch`,
        "aria-hidden": "true",
        hidden: variable === "",
        style: variable === "" ? void 0 : { background: themevars.cssOf(stored) }
      },
      void 0,
      false,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
        lineNumber: 199,
        columnNumber: 9
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      "input",
      {
        type: "text",
        className: "form-control irs-theme-input",
        role: "combobox",
        "aria-expanded": open,
        "aria-autocomplete": "list",
        "aria-controls": `irs-${name}-themelist`,
        "data-region": `${name}-themeinput`,
        autoComplete: "off",
        spellCheck: false,
        placeholder: text("choosethemecolour"),
        "aria-label": text("searchthemecolours"),
        ref: input,
        value: open && typing ? query : shown,
        onFocus: () => setOpen(true),
        onClick: () => setOpen(true),
        onChange: (event) => {
          setTyping(true);
          setQuery(event.target.value);
          setOpen(true);
        },
        onKeyDown: inputKeys
      },
      void 0,
      false,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
        lineNumber: 201,
        columnNumber: 9
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("span", { className: "irs-caret", "aria-hidden": "true", children: /* @__PURE__ */ jsxDEV(IconChevron, {}, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
      lineNumber: 212,
      columnNumber: 56
    }, this) }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
      lineNumber: 212,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: "irs-theme-panel",
        "data-region": `${name}-themepanel`,
        hidden: !open,
        style: place.panel,
        ref: panel,
        onKeyDown: panelKeys,
        children: /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "irs-theme-list",
            id: `irs-${name}-themelist`,
            role: "listbox",
            "data-region": `${name}-themelist`,
            style: place.list,
            ref: list,
            children: [
              choices?.specials.map((item) => /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "irs-theme-item",
                  "data-value": item.value,
                  onClick: () => pick(item.value),
                  children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "irs-swatch irs-swatch-none", "aria-hidden": "true" }, void 0, false, {
                      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
                      lineNumber: 219,
                      columnNumber: 21
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "irs-theme-name", children: item.label }, void 0, false, {
                      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
                      lineNumber: 220,
                      columnNumber: 21
                    }, this)
                  ]
                },
                item.value,
                true,
                {
                  fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
                  lineNumber: 217,
                  columnNumber: 50
                },
                this
              )),
              choices?.found.items.map((item) => /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "irs-theme-item",
                  "data-value": themevars.toStored(item.name),
                  onClick: () => pick(themevars.toStored(item.name)),
                  children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "irs-swatch", style: { background: `var(${item.name})` }, "aria-hidden": "true" }, void 0, false, {
                      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
                      lineNumber: 224,
                      columnNumber: 21
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "irs-theme-name", children: item.name }, void 0, false, {
                      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
                      lineNumber: 225,
                      columnNumber: 21
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "irs-theme-value", children: item.value }, void 0, false, {
                      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
                      lineNumber: 226,
                      columnNumber: 21
                    }, this)
                  ]
                },
                item.name,
                true,
                {
                  fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
                  lineNumber: 222,
                  columnNumber: 53
                },
                this
              )),
              choices && choices.custom !== "" && /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "irs-theme-item",
                  "data-value": themevars.toStored(choices.custom),
                  onClick: () => pick(themevars.toStored(choices.custom)),
                  children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "irs-swatch", style: { background: `var(${choices.custom})` }, "aria-hidden": "true" }, void 0, false, {
                      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
                      lineNumber: 230,
                      columnNumber: 21
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "irs-theme-name", children: text("themecolourcustom", choices.custom) }, void 0, false, {
                      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
                      lineNumber: 231,
                      columnNumber: 21
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
                  lineNumber: 228,
                  columnNumber: 54
                },
                this
              ),
              choices?.found.more && /* @__PURE__ */ jsxDEV("p", { className: "irs-theme-note", children: text("themecoloursmore") }, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
                lineNumber: 233,
                columnNumber: 41
              }, this),
              none && /* @__PURE__ */ jsxDEV("p", { className: "irs-theme-note", children: text("nothemecolours") }, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
                lineNumber: 234,
                columnNumber: 26
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
            lineNumber: 215,
            columnNumber: 13
          },
          this
        )
      },
      void 0,
      false,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
        lineNumber: 213,
        columnNumber: 9
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ThemeColourSelect.tsx",
    lineNumber: 198,
    columnNumber: 12
  }, this);
}
__name(ThemeColourSelect, "ThemeColourSelect");
export {
  ThemeColourSelect as default
};
//# sourceMappingURL=ThemeColourSelect.dev.js.map
