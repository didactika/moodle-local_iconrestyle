var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * A property with a slider, a number box and a cross that puts it back to Moodle's own value.
 *
 * @module     local_iconrestyle/components/inspector/SliderField
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useState } from "react";
function SliderField({ prop, label, min, max, step, defaultValue, value, text, onChange }) {
  const [typed, setTyped] = useState(null);
  const type = /* @__PURE__ */ __name((raw) => {
    setTyped(raw);
    if (raw === "") {
      onChange(prop, null, true);
      return;
    }
    const number = Math.min(max, Math.max(min, parseInt(raw, 10)));
    onChange(prop, Number.isNaN(number) ? null : number, true);
  }, "type");
  return /* @__PURE__ */ jsxDEV("div", { className: "irs-field irs-slider", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "irs-slider-head", children: [
      /* @__PURE__ */ jsxDEV("label", { className: "irs-label", htmlFor: `irs-${prop}`, children: label }, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SliderField.tsx",
        lineNumber: 49,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "number",
          className: "form-control irs-num",
          "data-prop-num": prop,
          min,
          max,
          step,
          "aria-label": label,
          placeholder: text("propdefault"),
          value: typed ?? (value === null ? "" : value),
          onFocus: (event) => setTyped(event.target.value),
          onBlur: () => setTyped(null),
          onChange: (event) => type(event.target.value)
        },
        void 0,
        false,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SliderField.tsx",
          lineNumber: 50,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          className: "btn btn-link btn-sm irs-reset",
          "data-action": "reset-prop",
          "data-prop": prop,
          "aria-label": text("resetproperty", label),
          title: text("resetproperty", label),
          onClick: () => {
            setTyped(null);
            onChange(prop, null, false);
          },
          children: "\u2715"
        },
        void 0,
        false,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SliderField.tsx",
          lineNumber: 54,
          columnNumber: 13
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SliderField.tsx",
      lineNumber: 48,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV(
      "input",
      {
        type: "range",
        id: `irs-${prop}`,
        "data-prop": prop,
        min,
        max,
        step,
        "data-default": defaultValue,
        value: value === null ? defaultValue : value,
        onChange: (event) => onChange(prop, parseInt(event.target.value, 10), true)
      },
      void 0,
      false,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SliderField.tsx",
        lineNumber: 63,
        columnNumber: 9
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SliderField.tsx",
    lineNumber: 47,
    columnNumber: 12
  }, this);
}
__name(SliderField, "SliderField");
export {
  SliderField as default
};
//# sourceMappingURL=SliderField.dev.js.map
