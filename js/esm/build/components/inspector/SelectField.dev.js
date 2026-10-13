var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * A property that takes one of a fixed list of values, or Moodle's own.
 *
 * @module     local_iconrestyle/components/inspector/SelectField
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
function SelectField({ prop, label, options, value, text, onChange }) {
  return /* @__PURE__ */ jsxDEV("div", { className: "irs-field irs-row", children: [
    /* @__PURE__ */ jsxDEV("label", { className: "irs-label", htmlFor: `irs-${prop}`, children: label }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SelectField.tsx",
      lineNumber: 31,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV(
      "select",
      {
        className: "custom-select form-select",
        id: `irs-${prop}`,
        "data-prop": prop,
        value: value ?? "",
        onChange: (event) => onChange(prop, event.target.value === "" ? null : event.target.value),
        children: [
          /* @__PURE__ */ jsxDEV("option", { value: "", children: text("propdefault") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SelectField.tsx",
            lineNumber: 34,
            columnNumber: 13
          }, this),
          options.map(([option, string]) => /* @__PURE__ */ jsxDEV("option", { value: option, children: text(string) }, option, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SelectField.tsx",
            lineNumber: 35,
            columnNumber: 48
          }, this))
        ]
      },
      void 0,
      true,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SelectField.tsx",
        lineNumber: 32,
        columnNumber: 9
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/inspector/SelectField.tsx",
    lineNumber: 30,
    columnNumber: 12
  }, this);
}
__name(SelectField, "SelectField");
export {
  SelectField as default
};
//# sourceMappingURL=SelectField.dev.js.map
