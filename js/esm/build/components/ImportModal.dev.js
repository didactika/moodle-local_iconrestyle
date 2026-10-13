var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
/**
 * Reviews a package before it changes anything: what is in it, how to import it, which icons to take and what that would do.
 *
 * @module     local_iconrestyle/components/ImportModal
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "./common/Modal";
import * as api from "../services/api";
const MAX_ROWS = 200;
const PREVIEW_DELAY = 300;
const usable = /* @__PURE__ */ __name((entry) => entry.created + entry.updated > 0, "usable");
const Report = /* @__PURE__ */ __name(({ report, text }) => /* @__PURE__ */ jsxDEV(Fragment, { children: [
  /* @__PURE__ */ jsxDEV("ul", { className: "irs-import-counts", children: [
    /* @__PURE__ */ jsxDEV("li", { children: text("importcreated", report.created) }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
      lineNumber: 40,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("li", { children: text("importupdated", report.updated) }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
      lineNumber: 41,
      columnNumber: 9
    }),
    report.deleted > 0 && /* @__PURE__ */ jsxDEV("li", { children: text("importdeleted", report.deleted) }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
      lineNumber: 42,
      columnNumber: 32
    }),
    /* @__PURE__ */ jsxDEV("li", { children: text("importassets", report.assets) }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
      lineNumber: 43,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
    lineNumber: 39,
    columnNumber: 5
  }),
  report.skipped > 0 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("p", { className: "irs-import-skipped", children: text("importskipped", report.skipped) }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
      lineNumber: 46,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("ul", { className: "irs-import-issues", children: report.issues.map((issue, index) => /* @__PURE__ */ jsxDEV("li", { children: issue }, index, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
      lineNumber: 47,
      columnNumber: 80
    })) }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
      lineNumber: 47,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
    lineNumber: 45,
    columnNumber: 28
  })
] }, void 0, true, {
  fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
  lineNumber: 38,
  columnNumber: 72
}), "Report");
function ImportModal({ content, first, defaults, text, onClose, onFailure, onImported }) {
  const entries = first.entries;
  const importable = useMemo(() => entries.filter(usable), [entries]);
  const total = importable.length;
  const [chosen, setChosen] = useState(() => {
    const wanted = {
      all: /* @__PURE__ */ __name(() => true, "all"),
      "new": /* @__PURE__ */ __name((entry) => entry.updated === 0, "new"),
      none: /* @__PURE__ */ __name(() => false, "none")
    }[defaults.importchoose];
    return new Set(importable.filter(wanted).map((entry) => entry.slot));
  });
  const [mode, setMode] = useState(defaults.importmode);
  const [query, setQuery] = useState("");
  const [report, setReport] = useState(first);
  const [error, setError] = useState("");
  const token = useRef(0);
  const started = useRef(false);
  const slotsParam = /* @__PURE__ */ __name(() => chosen.size === total ? [] : [...chosen], "slotsParam");
  const rules = entries.reduce((sum, entry) => sum + entry.created + entry.updated + entry.skipped, 0);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      if (mode === "merge" && chosen.size === total) {
        return void 0;
      }
    }
    setError("");
    const mine = ++token.current;
    if (chosen.size === 0) {
      setReport(null);
      return void 0;
    }
    const timer = window.setTimeout(() => {
      api.importRules(content, mode, true, slotsParam()).then((result) => {
        if (mine === token.current) {
          setReport(result);
        }
        return null;
      }).catch((reason) => onFailure(reason));
    }, PREVIEW_DELAY);
    return () => window.clearTimeout(timer);
  }, [mode, chosen]);
  const words = query.toLowerCase().split(/\s+/).filter((word) => word !== "");
  const found = entries.filter((entry) => words.every((word) => entry.slot.toLowerCase().includes(word)));
  const pickWhere = /* @__PURE__ */ __name((wanted) => setChosen(
    new Set(importable.filter(wanted).map((entry) => entry.slot))
  ), "pickWhere");
  const save = /* @__PURE__ */ __name(() => {
    if (chosen.size === 0) {
      setError(text("importnothing"));
      return;
    }
    api.importRules(content, mode, false, slotsParam()).then((result) => {
      onImported(result);
      return null;
    }).catch((reason) => onFailure(reason));
    onClose();
  }, "save");
  const replaceHelp = chosen.size === total ? "importreplacehelp" : "importreplacechosenhelp";
  const help = mode === "merge" ? "importmergehelp" : replaceHelp;
  return /* @__PURE__ */ jsxDEV(
    Modal,
    {
      title: text("importtitle"),
      saveLabel: text("importconfirm"),
      cancelLabel: text("cancel"),
      closeLabel: text("closepanel"),
      onSave: save,
      onClose,
      children: /* @__PURE__ */ jsxDEV("div", { className: "irs-import", "data-region": "import-form", children: [
        /* @__PURE__ */ jsxDEV("p", { className: "irs-import-summary", "data-region": "import-summary", children: text("importsummary", { icons: entries.length, rules, assets: first.assets }) }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
          lineNumber: 128,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("fieldset", { className: "irs-import-section", children: [
          /* @__PURE__ */ jsxDEV("legend", { className: "irs-label", children: text("importmode") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
            lineNumber: 132,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "irs-seg irs-seg-wide", children: [
            /* @__PURE__ */ jsxDEV("label", { className: "irs-seg-option", children: [
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "radio",
                  name: "irs-import-mode",
                  id: "irs-import-merge",
                  value: "merge",
                  checked: mode === "merge",
                  onChange: () => setMode("merge")
                },
                void 0,
                false,
                {
                  fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                  lineNumber: 135,
                  columnNumber: 25
                },
                this
              ),
              /* @__PURE__ */ jsxDEV("span", { children: text("importmodemerge") }, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                lineNumber: 137,
                columnNumber: 25
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
              lineNumber: 134,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("label", { className: "irs-seg-option", children: [
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "radio",
                  name: "irs-import-mode",
                  id: "irs-import-replace",
                  value: "replace",
                  checked: mode === "replace",
                  onChange: () => setMode("replace")
                },
                void 0,
                false,
                {
                  fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                  lineNumber: 140,
                  columnNumber: 25
                },
                this
              ),
              /* @__PURE__ */ jsxDEV("span", { children: text("importmodereplace") }, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                lineNumber: 142,
                columnNumber: 25
              }, this)
            ] }, void 0, true, {
              fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
              lineNumber: 139,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
            lineNumber: 133,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "irs-hint", "data-region": "import-mode-help", children: text(help) }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
            lineNumber: 145,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
          lineNumber: 131,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "irs-import-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "irs-label", children: text("importchoose") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
            lineNumber: 148,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "irs-review-bar", children: [
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "search",
                className: "form-control",
                "data-region": "import-search",
                autoComplete: "off",
                placeholder: text("importsearch"),
                "aria-label": text("importsearch"),
                value: query,
                onChange: (event) => setQuery(event.target.value)
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                lineNumber: 150,
                columnNumber: 21
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("button", { type: "button", className: "irs-linkbtn", "data-action": "review-all", onClick: () => pickWhere(() => true), children: text("selectall") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
              lineNumber: 153,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                className: "irs-linkbtn",
                "data-action": "review-new",
                onClick: () => pickWhere((entry) => entry.updated === 0),
                children: text("importonlynew")
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                lineNumber: 156,
                columnNumber: 21
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("button", { type: "button", className: "irs-linkbtn", "data-action": "review-none", onClick: () => pickWhere(() => false), children: text("selectnone") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
              lineNumber: 158,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "irs-review-count", "data-region": "import-count", role: "status", "aria-live": "polite", children: text("importchosen", { chosen: chosen.size, total }) }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
              lineNumber: 161,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
            lineNumber: 149,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "irs-review-list", "data-region": "import-rows", children: [
            found.slice(0, MAX_ROWS).map((entry) => {
              const ok = usable(entry);
              return /* @__PURE__ */ jsxDEV("label", { className: `irs-review-row${ok ? "" : " irs-disabled"}`, children: [
                /* @__PURE__ */ jsxDEV(
                  "input",
                  {
                    type: "checkbox",
                    "data-region": "import-row",
                    value: entry.slot,
                    disabled: !ok,
                    checked: ok && chosen.has(entry.slot),
                    onChange: (event) => {
                      const next = new Set(chosen);
                      if (event.target.checked) {
                        next.add(entry.slot);
                      } else {
                        next.delete(entry.slot);
                      }
                      setChosen(next);
                    }
                  },
                  void 0,
                  false,
                  {
                    fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                    lineNumber: 169,
                    columnNumber: 29
                  },
                  this
                ),
                /* @__PURE__ */ jsxDEV("span", { className: "irs-review-name", children: entry.slot }, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                  lineNumber: 180,
                  columnNumber: 29
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "irs-review-rules", children: text("importrules", entry.created + entry.updated + entry.skipped) }, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                  lineNumber: 181,
                  columnNumber: 29
                }, this),
                ok && entry.updated === 0 && /* @__PURE__ */ jsxDEV("span", { className: "irs-state irs-state-new", children: text("importrownew") }, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                  lineNumber: 184,
                  columnNumber: 59
                }, this),
                ok && entry.updated > 0 && /* @__PURE__ */ jsxDEV("span", { className: "irs-state irs-state-updates", children: text("importrowupdates") }, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                  lineNumber: 186,
                  columnNumber: 33
                }, this),
                !ok && /* @__PURE__ */ jsxDEV("span", { className: "irs-state irs-state-skipped", children: text("importrowskipped") }, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                  lineNumber: 187,
                  columnNumber: 37
                }, this)
              ] }, entry.slot, true, {
                fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
                lineNumber: 168,
                columnNumber: 32
              }, this);
            }),
            found.length > MAX_ROWS && /* @__PURE__ */ jsxDEV("p", { className: "irs-theme-note", children: text("importmore", MAX_ROWS) }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
              lineNumber: 190,
              columnNumber: 49
            }, this),
            found.length === 0 && /* @__PURE__ */ jsxDEV("p", { className: "irs-theme-note", children: text("importnoresults") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
              lineNumber: 191,
              columnNumber: 44
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
            lineNumber: 165,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "irs-hint irs-error", "data-region": "import-error", role: "alert", hidden: error === "", children: error }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
            lineNumber: 193,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
          lineNumber: 147,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "irs-import-report", "data-region": "import-report", "aria-live": "polite", children: report && /* @__PURE__ */ jsxDEV(Report, { report, text }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
          lineNumber: 196,
          columnNumber: 28
        }, this) }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
          lineNumber: 195,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
        lineNumber: 127,
        columnNumber: 9
      }, this)
    },
    void 0,
    false,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/ImportModal.tsx",
      lineNumber: 125,
      columnNumber: 12
    },
    this
  );
}
__name(ImportModal, "ImportModal");
export {
  ImportModal as default
};
//# sourceMappingURL=ImportModal.dev.js.map
