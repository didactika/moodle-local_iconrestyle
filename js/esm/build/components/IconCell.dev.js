var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * One icon as Moodle draws it, at one size, in the preview and on the cards of the grid.
 *
 * @module     local_iconrestyle/components/IconCell
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
function IconCell({ icon, size }) {
  let glyph;
  if (icon.kind === "container") {
    glyph = /* @__PURE__ */ jsxDEV("span", { className: icon.component === "activity" ? `modtype_${icon.name}` : "", children: /* @__PURE__ */ jsxDEV("div", { className: `${icon.classes} irs-box`, style: { width: size * 1.6, height: size * 1.6 }, children: /* @__PURE__ */ jsxDEV("img", { className: "activityicon", alt: "", src: icon.imageurl }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/IconCell.tsx",
      lineNumber: 30,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/IconCell.tsx",
      lineNumber: 29,
      columnNumber: 13
    }, this) }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/IconCell.tsx",
      lineNumber: 28,
      columnNumber: 17
    }, this);
  } else if (icon.kind === "font") {
    glyph = /* @__PURE__ */ jsxDEV(
      "i",
      {
        className: icon.classes,
        "aria-hidden": "true",
        style: { fontSize: size, width: size, height: size, lineHeight: `${size}px` }
      },
      void 0,
      false,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/IconCell.tsx",
        lineNumber: 34,
        columnNumber: 17
      },
      this
    );
  } else {
    glyph = /* @__PURE__ */ jsxDEV("img", { className: "icon", alt: "", src: icon.imageurl, style: { width: size, height: size } }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/IconCell.tsx",
      lineNumber: 37,
      columnNumber: 17
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("span", { className: "irs-cell", children: /* @__PURE__ */ jsxDEV("span", { className: "irs-fit", children: glyph }, void 0, false, {
    fileName: "public/local/iconrestyle/js/esm/src/components/IconCell.tsx",
    lineNumber: 39,
    columnNumber: 39
  }, this) }, void 0, false, {
    fileName: "public/local/iconrestyle/js/esm/src/components/IconCell.tsx",
    lineNumber: 39,
    columnNumber: 12
  }, this);
}
__name(IconCell, "IconCell");
export {
  IconCell as default
};
//# sourceMappingURL=IconCell.dev.js.map
