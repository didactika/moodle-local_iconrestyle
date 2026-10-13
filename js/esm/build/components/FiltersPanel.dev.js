var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The filters panel: one button with the number of filters that are on, and a panel to choose them.
 *
 * Besides the search of the toolbar, the icons can be narrowed by type, by status, by component, by purpose, by what they
 * customise, by the kind of place of the customisation and by colour mode, and sorted. What is on is shown by the number on the
 * button and by the boxes of the panel, so many filters never take room from the icons.
 *
 * @module     local_iconrestyle/components/FiltersPanel
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFollowAnchor } from "../hooks/useFollowAnchor";
import { IconFilter, IconFilterClear } from "./common/Icons";
const SHOWN = 80;
const STATUS = ["untouched", "modified", "shared"];
const DETAIL = ["colour", "shape", "spacing", "transform", "effects", "artwork", "limited"];
const capital = /* @__PURE__ */ __name((value) => value.charAt(0).toUpperCase() + value.slice(1), "capital");
function FiltersPanel({ icons, filters, modes, text, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [place, setPlace] = useState({});
  const wrapper = useRef(null);
  const button = useRef(null);
  const panel = useRef(null);
  const total = filters.kinds.length + filters.components.length + filters.purposes.length + filters.traits.length + filters.places.length + filters.modes.length + (filters.sort === "catalogue" ? 0 : 1);
  const counts = useMemo(() => {
    const components = /* @__PURE__ */ new Map();
    const purposes2 = /* @__PURE__ */ new Map();
    icons.forEach((icon) => {
      components.set(icon.component, (components.get(icon.component) ?? 0) + 1);
      if (icon.purpose) {
        purposes2.set(icon.purpose, (purposes2.get(icon.purpose) ?? 0) + 1);
      }
    });
    return { components, purposes: purposes2 };
  }, [icons]);
  useEffect(() => {
    if (!open) {
      return void 0;
    }
    const outside = /* @__PURE__ */ __name((event) => {
      if (!wrapper.current?.contains(event.target)) {
        setOpen(false);
      }
    }, "outside");
    document.addEventListener("click", outside);
    return () => document.removeEventListener("click", outside);
  }, [open]);
  const follow = /* @__PURE__ */ __name(() => {
    if (!button.current) {
      return;
    }
    const rect = button.current.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setOpen(false);
      return;
    }
    const width = Math.min(24 * 16, window.innerWidth - 16);
    setPlace({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      maxHeight: Math.max(240, window.innerHeight - rect.bottom - 24)
    });
  }, "follow");
  useFollowAnchor(open, follow, () => panel.current);
  const toggle = /* @__PURE__ */ __name(() => {
    if (!open) {
      follow();
    }
    setOpen(!open);
  }, "toggle");
  const choose = /* @__PURE__ */ __name((group, value, checked) => {
    const current = filters[group];
    let next = checked ? [...current, value] : current.filter((each) => each !== value);
    if (group === "traits" && checked) {
      if (value === "untouched") {
        next = next.filter((each) => !DETAIL.includes(each) && each !== "modified");
      } else if (value === "modified" || DETAIL.includes(value)) {
        next = next.filter((each) => each !== "untouched");
      }
    }
    onChange({ [group]: next });
  }, "choose");
  const chip = /* @__PURE__ */ __name((group, value, label, extra) => /* @__PURE__ */ jsxDEV(
    "label",
    {
      className: "irs-chipcheck",
      children: [
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "checkbox",
            "data-filter": group,
            value,
            checked: filters[group].includes(value),
            onChange: (event) => choose(group, value, event.target.checked)
          },
          void 0,
          false,
          {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 129,
            columnNumber: 9
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("span", { children: [
          label,
          extra === void 0 ? null : /* @__PURE__ */ jsxDEV(Fragment, { children: [
            " ",
            /* @__PURE__ */ jsxDEV("small", { children: extra }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 131,
              columnNumber: 55
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 131,
            columnNumber: 52
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
          lineNumber: 131,
          columnNumber: 9
        }, this)
      ]
    },
    `${group}${value}`,
    true,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
      lineNumber: 127,
      columnNumber: 82
    },
    this
  ), "chip");
  const words = search.toLowerCase().split(/\s+/).filter((word) => word !== "");
  const found = [...counts.components.keys()].sort().filter((name) => words.every((word) => name.toLowerCase().includes(word)));
  const purposes = [...counts.purposes.keys()].sort();
  const hasModes = Object.keys(modes).length > 0;
  return /* @__PURE__ */ jsxDEV("div", { className: "irs-filters", "data-region": "filters", ref: wrapper, onKeyDown: (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  }, children: [
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        className: `irs-pillbtn irs-filtersbtn${total > 0 ? " irs-active" : ""}`,
        "data-action": "filters-toggle",
        "aria-haspopup": "true",
        "aria-expanded": open,
        title: text("filtbutton"),
        ref: button,
        onClick: toggle,
        children: [
          /* @__PURE__ */ jsxDEV(IconFilter, {}, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 146,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("span", { children: text("filtbutton") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 146,
            columnNumber: 27
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "irs-count-badge", "data-region": "filters-count", hidden: total === 0, children: total > 0 ? total : "" }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 147,
            columnNumber: 13
          }, this)
        ]
      },
      void 0,
      true,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
        lineNumber: 144,
        columnNumber: 9
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: "irs-filters-panel",
        "data-region": "filters-panel",
        ref: panel,
        role: "dialog",
        "aria-label": text("filtbutton"),
        hidden: !open,
        style: place,
        children: [
          /* @__PURE__ */ jsxDEV("div", { className: "irs-filter-head", children: [
            /* @__PURE__ */ jsxDEV("h2", { className: "irs-filter-heading", children: text("filtbutton") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 152,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                className: "irs-iconbtn",
                "data-action": "filters-clear",
                disabled: total === 0,
                title: text("filtclear"),
                "aria-label": text("filtclear"),
                onClick: () => onChange({
                  kinds: [],
                  components: [],
                  purposes: [],
                  traits: [],
                  places: [],
                  modes: [],
                  sort: "catalogue"
                }),
                children: /* @__PURE__ */ jsxDEV(IconFilterClear, {}, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
                  lineNumber: 158,
                  columnNumber: 21
                }, this)
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
                lineNumber: 153,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 151,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("section", { className: "irs-filter-section", children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "irs-filter-title", children: text("filttype") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 162,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "irs-filter-chips", children: [
              chip("kinds", "font", text("kindfont")),
              chip("kinds", "image", text("kindimage")),
              chip("kinds", "container", text("kindactivity"))
            ] }, void 0, true, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 163,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 161,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("section", { className: "irs-filter-section", children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "irs-filter-title", children: text("filtstatus") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 170,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "irs-filter-chips", children: STATUS.map((value) => chip("traits", value, text(`filttrait${value === "untouched" ? "untouched" : value}`))) }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 171,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 169,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("section", { className: "irs-filter-section", children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "irs-filter-title", children: text("filtsort") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 176,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV(
              "select",
              {
                className: "custom-select form-select",
                "data-region": "filters-sort",
                "aria-label": text("filtsort"),
                value: filters.sort,
                onChange: (event) => onChange({ sort: event.target.value }),
                children: ["catalogue", "name", "component", "modified"].map((value) => /* @__PURE__ */ jsxDEV("option", { value, children: text(`filtsort${value}`) }, value, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
                  lineNumber: 179,
                  columnNumber: 84
                }, this))
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
                lineNumber: 177,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 175,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("section", { className: "irs-filter-section", children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "irs-filter-title", children: text("filtcustom") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 185,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "irs-filter-chips", children: DETAIL.map((value) => chip("traits", value, text(`filttrait${value}`))) }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 186,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 184,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("section", { className: "irs-filter-section", children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "irs-filter-title", children: text("filtplace") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 191,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "irs-filter-chips", children: ["site", "category", "course", "activity"].map((value) => chip("places", value, text(`filtplace${value}`))) }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 192,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 190,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("section", { className: "irs-filter-section", "data-region": "filters-mode-section", hidden: !hasModes, children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "irs-filter-title", children: text("filtmode") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 197,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "irs-filter-chips", children: Object.keys(modes).map((value) => chip("modes", value, modes[value])) }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 198,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 196,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("section", { className: "irs-filter-section", "data-region": "filters-purpose-section", hidden: purposes.length === 0, children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "irs-filter-title", children: text("filtpurpose") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 203,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "irs-filter-chips", "data-region": "filters-purposes", children: purposes.map((value) => chip("purposes", value, capital(value), counts.purposes.get(value))) }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 204,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 202,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("section", { className: "irs-filter-section", children: [
            /* @__PURE__ */ jsxDEV("h3", { className: "irs-filter-title", children: text("filtcomponent") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 209,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "search",
                className: "form-control",
                "data-region": "filters-component-search",
                autoComplete: "off",
                placeholder: text("filtsearchcomponent"),
                "aria-label": text("filtsearchcomponent"),
                value: search,
                onChange: (event) => setSearch(event.target.value)
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
                lineNumber: 210,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "irs-filter-list", "data-region": "filters-components", children: [
              found.slice(0, SHOWN).map((name) => /* @__PURE__ */ jsxDEV("label", { className: "irs-filter-row", children: [
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "checkbox",
                    "data-filter": "components",
                    value: name,
                    checked: filters.components.includes(name),
                    onChange: (event) => choose("components", name, event.target.checked)
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
                    lineNumber: 215,
                    columnNumber: 25
                  },
                  this
                ),
                /* @__PURE__ */ jsxDEV("span", { className: "irs-filter-name", children: name }, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
                  lineNumber: 217,
                  columnNumber: 25
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "irs-filter-count", children: counts.components.get(name) }, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
                  lineNumber: 218,
                  columnNumber: 25
                }, this)
              ] }, name, true, {
                fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
                lineNumber: 214,
                columnNumber: 58
              }, this)),
              found.length > SHOWN && /* @__PURE__ */ jsxDEV("p", { className: "irs-theme-note", children: text("filtmore", SHOWN) }, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
                lineNumber: 220,
                columnNumber: 46
              }, this),
              found.length === 0 && /* @__PURE__ */ jsxDEV("p", { className: "irs-theme-note", children: text("importnoresults") }, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
                lineNumber: 221,
                columnNumber: 44
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
              lineNumber: 213,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
            lineNumber: 208,
            columnNumber: 13
          }, this)
        ]
      },
      void 0,
      true,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
        lineNumber: 149,
        columnNumber: 9
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/FiltersPanel.tsx",
    lineNumber: 139,
    columnNumber: 12
  }, this);
}
__name(FiltersPanel, "FiltersPanel");
export {
  FiltersPanel as default
};
//# sourceMappingURL=FiltersPanel.dev.js.map
