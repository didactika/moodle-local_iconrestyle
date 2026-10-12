var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * The modal that adds places to the open icon: a place, the kinds of page and the regions of the page, and a colour mode.
 *
 * @module     local_iconrestyle/components/places/PlacesModal
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useState } from "react";
import Modal from "../common/Modal";
import LocationPicker from "./LocationPicker";
const KINDS = [
  ["site", "wheresite"],
  ["category", "wherecategories"],
  ["course", "wherecourses"],
  ["activity", "whereactivities"]
];
function PlacesModal({ text, everywhere, pages, regions, modes, currentMode, onAdd, onClose }) {
  const [kind, setKind] = useState("site");
  const [chosen, setChosen] = useState({ category: [], course: [], activity: [] });
  const [pageBoxes, setPageBoxes] = useState([]);
  const [regionBoxes, setRegionBoxes] = useState([]);
  const [mode, setMode] = useState(modes.some((each) => each.value === currentMode) ? currentMode : modes[0]?.value ?? "all");
  const [copy, setCopy] = useState(true);
  const [error, setError] = useState("");
  const toggle = /* @__PURE__ */ __name((list, set, value) => {
    set(list.includes(value) ? list.filter((each) => each !== value) : [...list, value]);
  }, "toggle");
  const save = /* @__PURE__ */ __name(() => {
    const extra = { pages: pageBoxes, regions: regionBoxes, mode: modes.length > 0 ? mode : "all" };
    const wheres = kind === "site" ? [{ contextid: everywhere.contextid, contextname: everywhere.contextname, contextkind: "site", ...extra }] : chosen[kind].map((place) => ({ contextid: place.contextid, contextname: place.name, contextkind: kind, ...extra }));
    if (wheres.length === 0) {
      setError(text("wherechoose"));
      return;
    }
    onAdd(wheres, copy);
  }, "save");
  const picker = /* @__PURE__ */ __name((own, label, hint) => kind === own && /* @__PURE__ */ jsxDEV(
    LocationPicker,
    {
      kind: own,
      label: text(label),
      hint: hint ? text(hint) : void 0,
      chosen: chosen[own],
      text,
      onChange: (next) => setChosen({ ...chosen, [own]: next })
    },
    own,
    false,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
      lineNumber: 66,
      columnNumber: 81
    },
    this
  ), "picker");
  return /* @__PURE__ */ jsxDEV(
    Modal,
    {
      title: text("addplacestitle"),
      saveLabel: text("addplacesconfirm"),
      cancelLabel: text("cancel"),
      closeLabel: text("closepanel"),
      onSave: save,
      onClose,
      children: /* @__PURE__ */ jsxDEV("div", { className: "irs-places-form", "data-region": "places-form", children: [
        /* @__PURE__ */ jsxDEV("fieldset", { className: "irs-field", children: [
          /* @__PURE__ */ jsxDEV("legend", { className: "irs-label", children: text("wherelocation") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
            lineNumber: 75,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "irs-seg", role: "radiogroup", children: KINDS.map(([value, label]) => /* @__PURE__ */ jsxDEV("label", { className: "irs-seg-option", children: [
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "radio",
                name: "irs-kind",
                value,
                checked: kind === value,
                onChange: () => setKind(value)
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
                lineNumber: 78,
                columnNumber: 25
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("span", { children: text(label) }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
              lineNumber: 80,
              columnNumber: 25
            }, this)
          ] }, value, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
            lineNumber: 77,
            columnNumber: 52
          }, this)) }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
            lineNumber: 76,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
          lineNumber: 74,
          columnNumber: 13
        }, this),
        picker("category", "wherecategories", "wherecategoryhint"),
        picker("course", "wherecourses"),
        picker("activity", "whereactivities", "whereactivityhint"),
        /* @__PURE__ */ jsxDEV("fieldset", { className: "irs-checks", children: [
          /* @__PURE__ */ jsxDEV("legend", { className: "irs-label", children: text("wherepages") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
            lineNumber: 88,
            columnNumber: 17
          }, this),
          pages.map((page) => /* @__PURE__ */ jsxDEV("label", { className: "irs-check", children: [
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "checkbox",
                "data-region": "where-page",
                value: page.value,
                checked: pageBoxes.includes(page.value),
                onChange: () => toggle(pageBoxes, setPageBoxes, page.value)
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
                lineNumber: 90,
                columnNumber: 21
              },
              this
            ),
            " ",
            page.label
          ] }, page.value, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
            lineNumber: 89,
            columnNumber: 38
          }, this))
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
          lineNumber: 87,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("fieldset", { className: "irs-checks", children: [
          /* @__PURE__ */ jsxDEV("legend", { className: "irs-label", children: text("whereregions") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
            lineNumber: 95,
            columnNumber: 17
          }, this),
          regions.map((region) => /* @__PURE__ */ jsxDEV("label", { className: "irs-check", children: [
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "checkbox",
                "data-region": "where-region",
                value: region.value,
                checked: regionBoxes.includes(region.value),
                onChange: () => toggle(regionBoxes, setRegionBoxes, region.value)
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
                lineNumber: 97,
                columnNumber: 21
              },
              this
            ),
            " ",
            region.label
          ] }, region.value, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
            lineNumber: 96,
            columnNumber: 42
          }, this))
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
          lineNumber: 94,
          columnNumber: 13
        }, this),
        modes.length > 0 && /* @__PURE__ */ jsxDEV("fieldset", { className: "irs-field", children: [
          /* @__PURE__ */ jsxDEV("legend", { className: "irs-label", children: text("wheremode") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
            lineNumber: 103,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "irs-seg", role: "radiogroup", children: modes.map((each) => /* @__PURE__ */ jsxDEV("label", { className: "irs-seg-option", children: [
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "radio",
                name: "irs-mode",
                value: each.value,
                checked: mode === each.value,
                onChange: () => setMode(each.value)
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
                lineNumber: 106,
                columnNumber: 25
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("span", { children: each.label }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
              lineNumber: 108,
              columnNumber: 25
            }, this)
          ] }, each.value, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
            lineNumber: 105,
            columnNumber: 42
          }, this)) }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
            lineNumber: 104,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
          lineNumber: 102,
          columnNumber: 34
        }, this),
        /* @__PURE__ */ jsxDEV("label", { className: "irs-check irs-copy", children: [
          /* @__PURE__ */ jsxDEV("input", { type: "checkbox", "data-region": "places-copy", checked: copy, onChange: () => setCopy(!copy) }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
            lineNumber: 113,
            columnNumber: 17
          }, this),
          " ",
          text("placescopy")
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
          lineNumber: 112,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "irs-hint irs-error", "data-region": "places-error", role: "alert", hidden: error === "", children: error }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
          lineNumber: 116,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
        lineNumber: 73,
        columnNumber: 9
      }, this)
    },
    void 0,
    false,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/places/PlacesModal.tsx",
      lineNumber: 71,
      columnNumber: 12
    },
    this
  );
}
__name(PlacesModal, "PlacesModal");
export {
  PlacesModal as default
};
//# sourceMappingURL=PlacesModal.dev.js.map
