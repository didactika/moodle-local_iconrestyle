var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * The editing panel of the open icon: its title, the preview, the tabs, what is edited and the button that removes the variant.
 *
 * @module     local_iconrestyle/components/Inspector
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useState } from "react";
import StyleTab from "./inspector/StyleTab";
import PlacesTab from "./places/PlacesTab";
import { IconClose, IconCopy, IconTrash } from "./common/Icons";
function Inspector(props) {
  const { icon, draft, customised, removable, preview, variants, otherModes, ranges, specials, copying, text } = props;
  const [tab, setTab] = useState("style");
  const [dismissed, setDismissed] = useState(/* @__PURE__ */ new Set());
  const tabs = [["style", "tabstyle"], ["places", "tabplaces"]];
  const notice = icon !== null && icon.group >= 2 && !dismissed.has(icon.key);
  return /* @__PURE__ */ jsxDEV(
    "aside",
    {
      className: "irs-panel",
      "data-region": "panel",
      "aria-label": text("editor"),
      hidden: icon === null || draft === null,
      onKeyDown: (event) => {
        if (event.key === "Escape" && !event.target.closest(".modal")) {
          props.onClose();
        }
      },
      children: [
        /* @__PURE__ */ jsxDEV("header", { className: "irs-panel-head", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "irs-panel-title", children: [
            /* @__PURE__ */ jsxDEV("h2", { className: "irs-title", "data-region": "title", children: icon?.key }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
              lineNumber: 62,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "irs-pill", "data-region": "origin", children: customised ? text("originhere") : text("origindefault") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
              lineNumber: 63,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
            lineNumber: 61,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "irs-panel-actions", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                className: "irs-iconbtn",
                "data-action": "copy-look",
                "aria-pressed": copying,
                "aria-label": text("copylook"),
                title: text("copylook"),
                onClick: props.onCopyLook,
                children: /* @__PURE__ */ jsxDEV(IconCopy, {}, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
                  lineNumber: 68,
                  columnNumber: 21
                }, this)
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
                lineNumber: 66,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                className: "btn btn-secondary irs-close",
                "data-action": "close-panel",
                "aria-label": text("closepanel"),
                title: text("closepanel"),
                onClick: props.onClose,
                children: "\u2715"
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
                lineNumber: 70,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
            lineNumber: 65,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
          lineNumber: 60,
          columnNumber: 9
        }, this),
        preview,
        /* @__PURE__ */ jsxDEV("div", { className: "irs-tabs", role: "tablist", "aria-label": text("editor"), children: tabs.map(([name, label]) => /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            role: "tab",
            id: `irs-tab-${name}`,
            "data-action": "tab",
            "data-tab": name,
            "aria-selected": tab === name,
            "aria-controls": `irs-panel-${name}`,
            tabIndex: tab === name ? 0 : -1,
            className: `irs-tab${tab === name ? " irs-active" : ""}`,
            onClick: () => setTab(name),
            children: [
              text(label),
              name === "places" && /* @__PURE__ */ jsxDEV("span", { className: "irs-badge", "data-region": "places-count", children: variants.length }, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
                lineNumber: 84,
                columnNumber: 39
              }, this)
            ]
          },
          name,
          true,
          {
            fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
            lineNumber: 80,
            columnNumber: 42
          },
          this
        )) }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
          lineNumber: 79,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "irs-panel-body", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "irs-notice", "data-region": "shared-notice", role: "status", hidden: !notice, children: [
            /* @__PURE__ */ jsxDEV("span", { "data-region": "shared-notice-text", children: icon && icon.group >= 2 ? text("sharedglyph", icon.group) : "" }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
              lineNumber: 90,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                className: "irs-x",
                "data-action": "dismiss-notice",
                "aria-label": text("dismiss"),
                title: text("dismiss"),
                onClick: () => icon && setDismissed(/* @__PURE__ */ new Set([...dismissed, icon.key])),
                children: /* @__PURE__ */ jsxDEV(IconClose, {}, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
                  lineNumber: 93,
                  columnNumber: 21
                }, this)
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
                lineNumber: 91,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
            lineNumber: 89,
            columnNumber: 13
          }, this),
          icon && draft && /* @__PURE__ */ jsxDEV(
            StyleTab,
            {
              icon,
              draft,
              ranges,
              specials,
              text,
              hidden: tab !== "style",
              onProp: props.onProp,
              onStage: props.onStage,
              boxColours: icon.kind === "container"
            },
            void 0,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
              lineNumber: 96,
              columnNumber: 31
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            PlacesTab,
            {
              variants,
              otherModes,
              text,
              hidden: tab !== "places",
              onPick: props.onPickVariant,
              onRemove: props.onRemoveVariantChip,
              onAdd: props.onAddPlaces,
              onCopyMode: props.onCopyMode
            },
            void 0,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
              lineNumber: 98,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
          lineNumber: 88,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("footer", { className: "irs-panel-foot", children: /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            className: "irs-pillbtn irs-pillbtn-danger",
            "data-action": "remove-variant",
            hidden: !removable,
            onClick: props.onRemoveVariant,
            children: [
              /* @__PURE__ */ jsxDEV(IconTrash, {}, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
                lineNumber: 106,
                columnNumber: 17
              }, this),
              " ",
              text("removevariant")
            ]
          },
          void 0,
          true,
          {
            fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
            lineNumber: 104,
            columnNumber: 13
          },
          this
        ) }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
          lineNumber: 103,
          columnNumber: 9
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/Inspector.tsx",
      lineNumber: 54,
      columnNumber: 12
    },
    this
  );
}
__name(Inspector, "Inspector");
export {
  Inspector as default
};
//# sourceMappingURL=Inspector.dev.js.map
