var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * A property with a value for each side, which can be linked so that the four sides move together.
 *
 * @module     local_iconrestyle/components/inspector/SidesField
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useState } from "react";
import { IconLinked, IconUnlinked } from "../common/Icons";
function SidesField({ group, label, resetLabel, min, max, sides, draft, text, onStage }) {
  const [linked, setLinked] = useState(true);
  const [typed, setTyped] = useState(null);
  const change = /* @__PURE__ */ __name((prop, raw) => {
    setTyped({ prop, raw });
    const value = raw === "" ? null : Math.round(parseFloat(raw) * 100);
    const finite = value === null || Number.isNaN(value) ? null : value;
    if (linked) {
      onStage(Object.fromEntries(sides.map((side) => [side.prop, finite])), true);
    } else {
      onStage({ [prop]: finite }, true);
    }
  }, "change");
  return /* @__PURE__ */ jsxDEV("div", { className: "irs-field", "data-sides": group, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "irs-slider-head", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "irs-label", id: `irs-${group}-label`, children: label }, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SidesField.tsx",
        lineNumber: 52,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          className: "btn btn-link btn-sm irs-reset",
          "data-action": "reset-sides",
          "data-group": group,
          "aria-label": resetLabel,
          title: resetLabel,
          onClick: () => onStage(Object.fromEntries(sides.map((side) => [side.prop, null]))),
          children: "\u2715"
        },
        void 0,
        false,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SidesField.tsx",
          lineNumber: 53,
          columnNumber: 13
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SidesField.tsx",
      lineNumber: 51,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "irs-sides", role: "group", "aria-labelledby": `irs-${group}-label`, children: [
      sides.map((side) => {
        const value = draft[side.prop];
        const stored = value === null || value === void 0 ? "" : (value / 100).toFixed(2);
        const shown = typed && typed.prop === side.prop ? typed.raw : stored;
        return /* @__PURE__ */ jsxDEV("label", { className: "irs-side", children: [
          /* @__PURE__ */ jsxDEV("span", { children: side.label }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SidesField.tsx",
            lineNumber: 64,
            columnNumber: 68
          }, this),
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "number",
              className: "form-control",
              "data-prop": side.prop,
              min,
              max,
              step: "0.05",
              value: shown,
              onFocus: (event) => setTyped({ prop: side.prop, raw: event.target.value }),
              onBlur: () => setTyped(null),
              onChange: (event) => change(side.prop, event.target.value)
            },
            void 0,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SidesField.tsx",
              lineNumber: 65,
              columnNumber: 21
            },
            this
          )
        ] }, side.prop, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SidesField.tsx",
          lineNumber: 64,
          columnNumber: 24
        }, this);
      }),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          className: "irs-link",
          "data-action": "toggle-link",
          "data-group": group,
          "aria-pressed": linked,
          "aria-label": text("padlink"),
          title: text("padlink"),
          onClick: () => setLinked(!linked),
          children: [
            /* @__PURE__ */ jsxDEV(IconLinked, {}, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SidesField.tsx",
              lineNumber: 71,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV(IconUnlinked, {}, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SidesField.tsx",
              lineNumber: 72,
              columnNumber: 17
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SidesField.tsx",
          lineNumber: 69,
          columnNumber: 13
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SidesField.tsx",
      lineNumber: 59,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SidesField.tsx",
    lineNumber: 50,
    columnNumber: 12
  }, this);
}
__name(SidesField, "SidesField");
export {
  SidesField as default
};
//# sourceMappingURL=SidesField.dev.js.map
