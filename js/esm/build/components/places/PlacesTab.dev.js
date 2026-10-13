var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The places where the open icon has a look, as chips, with the buttons that add more and copy the look to other colour modes.
 *
 * @module     local_iconrestyle/components/places/PlacesTab
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { IconClose, IconCopy, IconPlus } from "../common/Icons";
function PlacesTab({ variants, otherModes, text, hidden, onPick, onRemove, onAdd, onCopyMode }) {
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: "irs-tabpanel",
      role: "tabpanel",
      id: "irs-panel-places",
      "aria-labelledby": "irs-tab-places",
      "data-region": "tab-places",
      hidden,
      children: [
        /* @__PURE__ */ jsxDEV("p", { className: "irs-help", children: text("placeshelp") }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
          lineNumber: 43,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "irs-variants", "data-region": "variants", role: "group", "aria-label": text("appliesto"), children: variants.map((variant) => /* @__PURE__ */ jsxDEV(
          "span",
          {
            className: `irs-chip${variant.active ? " irs-active" : ""}${variant.removable ? " irs-has-x" : ""}`,
            children: [
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "irs-chip-label",
                  "data-action": "pick-variant",
                  "data-key": variant.key,
                  "aria-pressed": variant.active,
                  onClick: () => onPick(variant.key),
                  children: variant.label
                },
                void 0,
                false,
                {
                  fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
                  lineNumber: 47,
                  columnNumber: 17
                },
                this
              ),
              variant.removable && /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  className: "irs-x",
                  "data-action": "remove-chip",
                  "data-key": variant.key,
                  "aria-label": text("removeplace", variant.label),
                  title: text("removeplace", variant.label),
                  onClick: () => onRemove(variant.key),
                  children: /* @__PURE__ */ jsxDEV(IconClose, {}, void 0, false, {
                    fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
                    lineNumber: 52,
                    columnNumber: 21
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
                  lineNumber: 49,
                  columnNumber: 39
                },
                this
              )
            ]
          },
          variant.key,
          true,
          {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
            lineNumber: 45,
            columnNumber: 40
          },
          this
        )) }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
          lineNumber: 44,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "irs-places-actions", children: [
          /* @__PURE__ */ jsxDEV("button", { type: "button", className: "irs-pillbtn irs-pillbtn-primary", "data-action": "add-places", onClick: onAdd, children: [
            /* @__PURE__ */ jsxDEV(IconPlus, {}, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
              lineNumber: 58,
              columnNumber: 17
            }, this),
            " ",
            text("addplaces")
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
            lineNumber: 57,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("button", { type: "button", className: "irs-pillbtn", "data-action": "copy-mode", hidden: otherModes === 0, onClick: onCopyMode, children: [
            /* @__PURE__ */ jsxDEV(IconCopy, {}, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
              lineNumber: 61,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("span", { "data-region": "copy-mode-label", children: text(otherModes > 1 ? "copytoothermodes" : "copytoothermode") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
              lineNumber: 62,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
            lineNumber: 60,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
          lineNumber: 56,
          columnNumber: 9
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesTab.tsx",
      lineNumber: 41,
      columnNumber: 12
    },
    this
  );
}
__name(PlacesTab, "PlacesTab");
export {
  PlacesTab as default
};
//# sourceMappingURL=PlacesTab.dev.js.map
