var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * One icon of the grid: how the site draws it, or how it will look once what is waiting is saved.
 *
 * @module     local_iconrestyle/components/IconCard
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { memo } from "react";
import IconCell from "./IconCell";
import ShadowStage, { CARD_LAYOUT } from "./ShadowStage";
import { IconCheck } from "./common/Icons";
const CARD_SIZE = 24;
const glyphOf = /* @__PURE__ */ __name((icon) => {
  if (icon.kind === "font") {
    return /* @__PURE__ */ jsxDEV("i", { className: icon.classes, "aria-hidden": "true" }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
      lineNumber: 41,
      columnNumber: 16
    });
  }
  if (icon.kind === "image") {
    return /* @__PURE__ */ jsxDEV("img", { className: "icon", src: icon.imageurl, alt: "" }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
      lineNumber: 44,
      columnNumber: 16
    });
  }
  return /* @__PURE__ */ jsxDEV("span", { className: icon.component === "activity" ? `modtype_${icon.name}` : "", children: /* @__PURE__ */ jsxDEV("span", { className: `${icon.classes} irs-box`, children: /* @__PURE__ */ jsxDEV("img", { className: "activityicon", src: icon.imageurl, alt: "" }, void 0, false, {
    fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
    lineNumber: 47,
    columnNumber: 53
  }) }, void 0, false, {
    fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
    lineNumber: 47,
    columnNumber: 9
  }) }, void 0, false, {
    fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
    lineNumber: 46,
    columnNumber: 12
  });
}, "glyphOf");
function Card({ icon, modified, selected, picking, picked, pickable, css, theme, text, onSelect }) {
  const unpickable = picking && !pickable && !selected;
  const classes = `irs-card${selected ? " irs-selected" : ""}${picking ? " irs-picking" : ""}${picked ? " irs-picked" : ""}`;
  return /* @__PURE__ */ jsxDEV(
    "button",
    {
      type: "button",
      className: classes,
      "data-action": "select",
      "data-key": icon.key,
      "aria-pressed": picking ? picked : selected,
      title: icon.key,
      disabled: unpickable,
      onClick: (event) => onSelect(icon.key, event.shiftKey),
      children: [
        css === null ? /* @__PURE__ */ jsxDEV("span", { className: "irs-card-icon", children: /* @__PURE__ */ jsxDEV("span", { className: "irs-card-fit", children: glyphOf(icon) }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
          lineNumber: 65,
          columnNumber: 45
        }, this) }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
          lineNumber: 65,
          columnNumber: 13
        }, this) : /* @__PURE__ */ jsxDEV(ShadowStage, { className: "irs-card-icon", area: "new", layout: CARD_LAYOUT, css, theme, limit: "host", children: /* @__PURE__ */ jsxDEV(IconCell, { icon, size: CARD_SIZE }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
          lineNumber: 67,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
          lineNumber: 66,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "irs-card-name", children: icon.name }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
          lineNumber: 69,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "irs-card-component", children: icon.component }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
          lineNumber: 70,
          columnNumber: 9
        }, this),
        picking && /* @__PURE__ */ jsxDEV("span", { className: "irs-pick", "aria-hidden": "true", children: /* @__PURE__ */ jsxDEV(IconCheck, { size: 11 }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
          lineNumber: 71,
          columnNumber: 67
        }, this) }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
          lineNumber: 71,
          columnNumber: 21
        }, this),
        modified && /* @__PURE__ */ jsxDEV("span", { className: "irs-dot", role: "img", "aria-label": text("modified") }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
          lineNumber: 72,
          columnNumber: 22
        }, this),
        icon.group > 1 && /* @__PURE__ */ jsxDEV("span", { className: "irs-shared", "aria-hidden": "true", children: "\u2261" }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
          lineNumber: 73,
          columnNumber: 28
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/IconCard.tsx",
      lineNumber: 61,
      columnNumber: 12
    },
    this
  );
}
__name(Card, "Card");
var IconCard_default = memo(Card);
export {
  IconCard_default as default
};
//# sourceMappingURL=IconCard.dev.js.map
