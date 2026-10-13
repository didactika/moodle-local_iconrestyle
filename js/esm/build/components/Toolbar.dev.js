var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The toolbar above the grid: back, search, filters, selection, the count, the save status, undo and redo and the actions menu.
 *
 * @module     local_iconrestyle/components/Toolbar
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useEffect, useRef, useState } from "react";
import {
  IconAlert,
  IconBack,
  IconCheck,
  IconDownload,
  IconMore,
  IconRedo,
  IconRefresh,
  IconSearch,
  IconSelect,
  IconUndo,
  IconUpload
} from "./common/Icons";
const goBack = /* @__PURE__ */ __name((fallback) => {
  if (window.history.length > 1 && document.referrer !== "") {
    window.history.back();
  } else {
    window.location.href = fallback;
  }
}, "goBack");
function Toolbar(props) {
  const { adminurl, query, count, status, canUndo, canRedo, selecting, filters, text } = props;
  const [menu, setMenu] = useState(null);
  const file = useRef(null);
  const toggle = useRef(null);
  const shortcuts = useRef(props);
  shortcuts.current = props;
  useEffect(() => {
    const keys = /* @__PURE__ */ __name((event) => {
      const target = event.target;
      if (!(event.ctrlKey || event.metaKey) || target.matches('input[type="text"], input[type="search"], textarea')) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        shortcuts.current.onUndo();
      } else if (key === "y" || key === "z" && event.shiftKey) {
        event.preventDefault();
        shortcuts.current.onRedo();
      } else if (key === "s") {
        event.preventDefault();
        shortcuts.current.onSave();
      }
    }, "keys");
    document.addEventListener("keydown", keys);
    return () => document.removeEventListener("keydown", keys);
  }, []);
  useEffect(() => {
    if (menu === null) {
      return void 0;
    }
    const outside = /* @__PURE__ */ __name((event) => {
      if (!event.target.closest(".irs-menu")) {
        setMenu(null);
      }
    }, "outside");
    document.addEventListener("click", outside);
    return () => document.removeEventListener("click", outside);
  }, [menu]);
  const openMenu = /* @__PURE__ */ __name(() => {
    if (menu !== null || !toggle.current) {
      setMenu(null);
      return;
    }
    const rect = toggle.current.getBoundingClientRect();
    setMenu({ top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) });
  }, "openMenu");
  const item = /* @__PURE__ */ __name((action, label, icon, onClick, disabled = false, shortcut = "") => /* @__PURE__ */ jsxDEV(
    "button",
    {
      type: "button",
      role: "menuitem",
      "data-action": action,
      disabled,
      onClick: () => {
        setMenu(null);
        onClick();
      },
      children: [
        icon,
        /* @__PURE__ */ jsxDEV("span", { children: label }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
          lineNumber: 115,
          columnNumber: 15
        }, this),
        shortcut ? /* @__PURE__ */ jsxDEV("kbd", { children: shortcut }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
          lineNumber: 115,
          columnNumber: 47
        }, this) : null
      ]
    },
    void 0,
    true,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
      lineNumber: 109,
      columnNumber: 124
    },
    this
  ), "item");
  return /* @__PURE__ */ jsxDEV("div", { className: "irs-bar", role: "search", onKeyDown: (event) => {
    if (event.key === "Escape") {
      setMenu(null);
    }
  }, children: [
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        className: "irs-back",
        "data-action": "history-back",
        "data-fallback": adminurl,
        title: text("back"),
        onClick: () => goBack(adminurl),
        children: [
          /* @__PURE__ */ jsxDEV(IconBack, {}, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
            lineNumber: 125,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("span", { children: text("back") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
            lineNumber: 125,
            columnNumber: 25
          }, this)
        ]
      },
      void 0,
      true,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 123,
        columnNumber: 9
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "irs-search", children: [
      /* @__PURE__ */ jsxDEV(IconSearch, {}, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 128,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("label", { className: "sr-only visually-hidden", htmlFor: "irs-search", children: text("searchicons") }, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 129,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "search",
          className: `form-control${query.trim() === "" ? "" : " irs-active"}`,
          id: "irs-search",
          "data-region": "search",
          autoComplete: "off",
          placeholder: text("searchicons"),
          value: query,
          onChange: (event) => props.onQuery(event.target.value)
        },
        void 0,
        false,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
          lineNumber: 130,
          columnNumber: 13
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
      lineNumber: 127,
      columnNumber: 9
    }, this),
    filters,
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        type: "button",
        className: "irs-pillbtn irs-selectbtn",
        "data-action": "selection-start",
        "aria-pressed": selecting,
        title: text("selectstarthelp"),
        onClick: props.onSelect,
        children: [
          /* @__PURE__ */ jsxDEV(IconSelect, {}, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
            lineNumber: 137,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("span", { children: text("selectstart") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
            lineNumber: 137,
            columnNumber: 27
          }, this)
        ]
      },
      void 0,
      true,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 135,
        columnNumber: 9
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("span", { className: "irs-count", "data-region": "count", role: "status", "aria-live": "polite", children: text("iconcount", count) }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
      lineNumber: 139,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("span", { className: "irs-status", "data-region": "status", "data-state": status, role: "status", "aria-live": "polite", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "irs-status-icon irs-status-saved", children: /* @__PURE__ */ jsxDEV(IconCheck, {}, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 141,
        columnNumber: 64
      }, this) }, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 141,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "irs-status-icon irs-status-busy", children: /* @__PURE__ */ jsxDEV(IconRefresh, {}, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 142,
        columnNumber: 63
      }, this) }, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 142,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "irs-status-icon irs-status-error", children: /* @__PURE__ */ jsxDEV(IconAlert, {}, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 143,
        columnNumber: 64
      }, this) }, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 143,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "irs-status-text", "data-region": "status-text", children: text(`status${status}`) }, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 144,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
      lineNumber: 140,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "irs-tools", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          className: "irs-iconbtn",
          "data-action": "undo",
          disabled: !canUndo,
          title: `${text("undo")} (Ctrl+Z)`,
          "aria-label": text("undo"),
          onClick: props.onUndo,
          children: /* @__PURE__ */ jsxDEV(IconUndo, {}, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
            lineNumber: 149,
            columnNumber: 17
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
          lineNumber: 147,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          className: "irs-iconbtn",
          "data-action": "redo",
          disabled: !canRedo,
          title: `${text("redo")} (Ctrl+Y)`,
          "aria-label": text("redo"),
          onClick: props.onRedo,
          children: /* @__PURE__ */ jsxDEV(IconRedo, {}, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
            lineNumber: 153,
            columnNumber: 17
          }, this)
        },
        void 0,
        false,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
          lineNumber: 151,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "irs-menu", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            className: "irs-iconbtn",
            "data-action": "menu-toggle",
            "aria-haspopup": "true",
            "aria-expanded": menu !== null,
            title: text("actionsmenu"),
            "aria-label": text("actionsmenu"),
            ref: toggle,
            onClick: openMenu,
            children: /* @__PURE__ */ jsxDEV(IconMore, {}, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
              lineNumber: 159,
              columnNumber: 21
            }, this)
          },
          void 0,
          false,
          {
            fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
            lineNumber: 156,
            columnNumber: 17
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("div", { className: "irs-menu-list", "data-region": "menu", role: "menu", hidden: menu === null, style: menu ?? void 0, children: [
          item("undo", text("undo"), /* @__PURE__ */ jsxDEV(IconUndo, {}, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
            lineNumber: 162,
            columnNumber: 49
          }, this), props.onUndo, !canUndo, "Ctrl Z"),
          item("redo", text("redo"), /* @__PURE__ */ jsxDEV(IconRedo, {}, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
            lineNumber: 163,
            columnNumber: 49
          }, this), props.onRedo, !canRedo, "Ctrl Y"),
          /* @__PURE__ */ jsxDEV("hr", {}, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
            lineNumber: 164,
            columnNumber: 21
          }, this),
          item("exchange-export", text("exportcustomisations"), /* @__PURE__ */ jsxDEV(IconDownload, {}, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
            lineNumber: 165,
            columnNumber: 76
          }, this), props.onExportAll),
          item("exchange-import", text("importcustomisations"), /* @__PURE__ */ jsxDEV(IconUpload, {}, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
            lineNumber: 166,
            columnNumber: 76
          }, this), () => file.current?.click())
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
          lineNumber: 161,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 155,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
      lineNumber: 146,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV(
      "input",
      {
        type: "file",
        className: "irs-upload-input",
        "data-region": "exchange-file",
        tabIndex: -1,
        "aria-hidden": "true",
        accept: ".iconrestyle,.json,.txt,text/plain,application/json",
        ref: file,
        onChange: (event) => {
          const chosen = event.target.files?.[0];
          event.target.value = "";
          if (chosen) {
            props.onFile(chosen);
          }
        }
      },
      void 0,
      false,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
        lineNumber: 170,
        columnNumber: 9
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/Toolbar.tsx",
    lineNumber: 118,
    columnNumber: 12
  }, this);
}
__name(Toolbar, "Toolbar");
export {
  Toolbar as default
};
//# sourceMappingURL=Toolbar.dev.js.map
