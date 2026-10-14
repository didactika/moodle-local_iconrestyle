var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The live preview of the open icon: how Moodle draws it, how it looks with the draft, or both, on a light or a dark surface.
 *
 * @module     local_iconrestyle/components/PreviewPanel
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import ShadowStage from "./ShadowStage";
import IconCell from "./IconCell";
import { contrastRatio, parseHex } from "../lib/color";
const SIZES = [16, 24, 32, 48];
const PANEL_LIMIT = 84;
const SURFACES = { light: { r: 255, g: 255, b: 255 }, dark: { r: 33, g: 37, b: 41 } };
function PreviewPanel(props) {
  const { icon, css, waiting, view, surface, modes, note, foreground, text, onView, onSurface } = props;
  const theme = modes.length > 0 ? surface : null;
  const colour = parseHex(foreground);
  const contrast = colour && colour.a === 255 ? contrastRatio(colour, SURFACES[surface] ?? SURFACES.light) : null;
  const views = [
    ["edited", "previewedited"],
    ["original", "previeworiginal"],
    ["compare", "previewcompare"]
  ];
  const stages = /* @__PURE__ */ __name((area, compiled) => /* @__PURE__ */ jsxDEV(
    ShadowStage,
    {
      className: "irs-preview-cells",
      region: `cells-${area}`,
      area,
      css: compiled,
      theme,
      waiting: area === "new" && waiting,
      limit: PANEL_LIMIT,
      children: SIZES.map((size) => /* @__PURE__ */ jsxDEV(IconCell, { icon, size }, size, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
        lineNumber: 55,
        columnNumber: 30
      }, this))
    },
    void 0,
    false,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
      lineNumber: 51,
      columnNumber: 56
    },
    this
  ), "stages");
  return /* @__PURE__ */ jsxDEV("div", { className: "irs-preview", "data-region": "preview", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "irs-preview-head", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "irs-seg-group", role: "group", "aria-label": text("previewview"), children: views.map(([name, label]) => /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          "data-action": "preview-view",
          "data-view": name,
          className: `irs-seg-btn${view === name ? " irs-active" : ""}`,
          "aria-pressed": view === name,
          onClick: () => onView(name),
          children: text(label)
        },
        name,
        false,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
          lineNumber: 60,
          columnNumber: 47
        },
        this
      )) }, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
        lineNumber: 59,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "irs-seg-group irs-surface",
          "data-region": "surface-group",
          role: "group",
          "aria-label": text("surface"),
          hidden: modes.length === 0,
          children: ["light", "dark"].map((name) => /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              "data-action": "surface",
              "data-surface": name,
              className: `irs-seg-btn${surface === name ? " irs-active" : ""}`,
              "aria-pressed": surface === name,
              onClick: () => onSurface(name),
              children: text(name === "light" ? "surfacelight" : "surfacedark")
            },
            name,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
              lineNumber: 66,
              columnNumber: 50
            },
            this
          ))
        },
        void 0,
        false,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
          lineNumber: 64,
          columnNumber: 13
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
      lineNumber: 58,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("p", { className: "irs-mode-note", "data-region": "mode-note", role: "status", hidden: note === "", children: note }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
      lineNumber: 71,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: `irs-preview-cols${surface === "dark" ? " irs-dark" : ""}`, "data-region": "preview-surface", "data-view": view, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "irs-preview-col", "data-area": "default", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "irs-preview-label", children: text("previeworiginal") }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
          lineNumber: 74,
          columnNumber: 17
        }, this),
        stages("default", "")
      ] }, void 0, true, {
        fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
        lineNumber: 73,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "irs-preview-col", "data-area": "new", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "irs-preview-label", children: text("previewedited") }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
          lineNumber: 78,
          columnNumber: 17
        }, this),
        stages("new", css)
      ] }, void 0, true, {
        fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
        lineNumber: 77,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
      lineNumber: 72,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("p", { className: "irs-contrast", "data-region": "contrast", role: "status", hidden: contrast === null, children: contrast === null ? "" : text(contrast >= 3 ? "contrastgood" : "contrastlow", contrast.toFixed(1)) }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
      lineNumber: 82,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/PreviewPanel.tsx",
    lineNumber: 57,
    columnNumber: 12
  }, this);
}
__name(PreviewPanel, "PreviewPanel");
export {
  PreviewPanel as default
};
//# sourceMappingURL=PreviewPanel.dev.js.map
