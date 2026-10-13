var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * The bar that floats over the grid while icons are being chosen: what to do with them and how many there are.
 *
 * @module     local_iconrestyle/components/SelectionBar
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { IconClose, IconColourMode } from "./common/Icons";
const GROUPS = ["colours", "shape", "spacing", "transform", "effects", "icon"];
function SelectionBar({ selection, modeLabels, text }) {
  const { mode, from, picked, groups, overwrite, fromMode, toMode, busy } = selection;
  const modeNames = Object.keys(modeLabels);
  const titles = {
    copy: text("selectcopytitle", from ?? ""),
    modes: text("selectmodestitle"),
    "export": text("selectexporttitle")
  };
  const disabled = busy || picked.size === 0 || mode === "copy" && groups.length === 0 || mode === "modes" && fromMode === toMode;
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: "irs-selbar",
      "data-region": "selection-bar",
      role: "region",
      "aria-label": text("selectbar"),
      hidden: mode === null,
      children: [
        /* @__PURE__ */ jsxDEV("div", { className: "irs-selbar-head", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "irs-selbar-title", "data-region": "selection-title", children: mode === null ? "" : titles[mode] }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
            lineNumber: 41,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "irs-selbar-count", "data-region": "selection-count", role: "status", "aria-live": "polite", children: text("selectcount", picked.size) }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
            lineNumber: 42,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
          lineNumber: 40,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "irs-selbar-modes",
            "data-for": "modes",
            role: "group",
            "aria-label": text("selectmodeswhat"),
            hidden: mode !== "modes",
            children: [
              /* @__PURE__ */ jsxDEV(
                "select",
                {
                  className: "custom-select form-select irs-mini",
                  "data-region": "selection-from",
                  "aria-label": text("selectfrom"),
                  value: fromMode,
                  onChange: (event) => selection.setFromMode(event.target.value),
                  children: modeNames.map((name) => /* @__PURE__ */ jsxDEV("option", { value: name, children: modeLabels[name] }, name, false, {
                    fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
                    lineNumber: 50,
                    columnNumber: 42
                  }, this))
                },
                void 0,
                false,
                {
                  fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
                  lineNumber: 48,
                  columnNumber: 13
                },
                this
              ),
              /* @__PURE__ */ jsxDEV("span", { className: "irs-arrow", "aria-hidden": "true", children: "\u2192" }, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
                lineNumber: 52,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDEV(
                "select",
                {
                  className: "custom-select form-select irs-mini",
                  "data-region": "selection-to",
                  "aria-label": text("selectto"),
                  value: toMode,
                  onChange: (event) => selection.setToMode(event.target.value),
                  children: modeNames.map((name) => /* @__PURE__ */ jsxDEV("option", { value: name, children: modeLabels[name] }, name, false, {
                    fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
                    lineNumber: 55,
                    columnNumber: 42
                  }, this))
                },
                void 0,
                false,
                {
                  fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
                  lineNumber: 53,
                  columnNumber: 13
                },
                this
              ),
              /* @__PURE__ */ jsxDEV("label", { className: "irs-chipcheck", children: [
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "checkbox",
                    "data-region": "selection-overwrite",
                    checked: overwrite,
                    onChange: (event) => selection.setOverwrite(event.target.checked)
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
                    lineNumber: 58,
                    columnNumber: 17
                  },
                  this
                ),
                /* @__PURE__ */ jsxDEV("span", { children: text("selectoverwrite") }, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
                  lineNumber: 60,
                  columnNumber: 17
                }, this)
              ] }, void 0, true, {
                fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
                lineNumber: 57,
                columnNumber: 13
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
            lineNumber: 46,
            columnNumber: 9
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("div", { className: "irs-selbar-what", "data-for": "copy", role: "group", "aria-label": text("copywhat"), hidden: mode !== "copy", children: GROUPS.map((group) => /* @__PURE__ */ jsxDEV("label", { className: "irs-chipcheck", children: [
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "checkbox",
              "data-region": "selection-group",
              value: group,
              checked: groups.includes(group),
              onChange: (event) => selection.setGroups(event.target.checked ? [...groups, group] : groups.filter((each) => each !== group))
            },
            void 0,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
              lineNumber: 65,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDEV("span", { children: text(`copygroup${group}`) }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
            lineNumber: 68,
            columnNumber: 17
          }, this)
        ] }, group, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
          lineNumber: 64,
          columnNumber: 36
        }, this)) }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
          lineNumber: 63,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "irs-selbar-quick", "data-for": "export copy modes", children: [
          /* @__PURE__ */ jsxDEV("button", { type: "button", className: "irs-linkbtn", "data-action": "selection-all", onClick: selection.all, children: text("selectall") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
            lineNumber: 72,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("button", { type: "button", className: "irs-linkbtn", "data-action": "selection-none", onClick: selection.none, children: text("selectnone") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
            lineNumber: 75,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
          lineNumber: 71,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "irs-selbar-actions", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              className: "irs-pillbtn",
              "data-action": "selection-back",
              "data-for": "modes",
              hidden: mode !== "modes",
              onClick: () => selection.switchTo("export"),
              children: text("back")
            },
            void 0,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
              lineNumber: 80,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              className: "irs-iconbtn irs-modesbtn",
              "data-action": "selection-modes",
              "data-for": "export",
              hidden: mode !== "export" || modeNames.length < 2,
              disabled: picked.size === 0,
              title: text("selectmodes"),
              "aria-label": text("selectmodes"),
              onClick: () => selection.switchTo("modes"),
              children: /* @__PURE__ */ jsxDEV(IconColourMode, {}, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
                lineNumber: 85,
                columnNumber: 17
              }, this)
            },
            void 0,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
              lineNumber: 82,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              className: "irs-pillbtn irs-pillbtn-primary",
              "data-action": "selection-apply",
              disabled,
              onClick: () => void selection.apply(),
              children: /* @__PURE__ */ jsxDEV("span", { "data-region": "selection-apply-text", children: text(mode === "export" ? "selectexport" : "selectcopy") }, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
                lineNumber: 89,
                columnNumber: 17
              }, this)
            },
            void 0,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
              lineNumber: 87,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              className: "irs-iconbtn",
              "data-action": "selection-cancel",
              title: `${text("selectdone")} (Esc)`,
              "aria-label": text("selectdone"),
              onClick: selection.stop,
              children: /* @__PURE__ */ jsxDEV(IconClose, {}, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
                lineNumber: 93,
                columnNumber: 17
              }, this)
            },
            void 0,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
              lineNumber: 91,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
          lineNumber: 79,
          columnNumber: 9
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/SelectionBar.tsx",
      lineNumber: 38,
      columnNumber: 12
    },
    this
  );
}
__name(SelectionBar, "SelectionBar");
export {
  SelectionBar as default
};
//# sourceMappingURL=SelectionBar.dev.js.map
