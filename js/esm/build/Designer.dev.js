var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The icon designer: one grid of every icon that can be customised, a panel to edit the open one and the tools to filter,
 * choose, copy, export and import.
 *
 * Mounted by core/react_autoinit from the data-react-component that the page writes. Every part keeps to its own markup and talks
 * to the others only through the properties given here.
 *
 * @module     local_iconrestyle/Designer
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import FiltersPanel from "./components/FiltersPanel";
import Grid from "./components/Grid";
import ImportModal from "./components/ImportModal";
import Inspector from "./components/Inspector";
import PlacesModal from "./components/places/PlacesModal";
import PreviewPanel from "./components/PreviewPanel";
import SelectionBar from "./components/SelectionBar";
import Toolbar from "./components/Toolbar";
import { createAutosave } from "./engine/autosave";
import { download } from "./engine/download";
import { createState } from "./engine/state";
import { applyStylesheet } from "./engine/stylesheet";
import { createText } from "./engine/text";
import { addToast } from "./engine/toast";
import { usePageColourMode } from "./hooks/usePageColourMode";
import { useNarrow } from "./hooks/useNarrow";
import { usePreviewCss } from "./hooks/usePreviewCss";
import { useSelection } from "./hooks/useSelection";
import { appearanceOf, needsOwnArtwork, pickLook } from "./lib/draft";
import { filterIcons, sortIcons } from "./lib/filter";
import { NO_ARTWORK } from "./lib/presets";
import { deriveView } from "./lib/view";
import * as api from "./services/api";
const MAX_BYTES = 20 * 1024 * 1024;
const NO_TRAITS = /* @__PURE__ */ new Set();
const mark = /* @__PURE__ */ __name((name) => {
  if (window.performance && typeof window.performance.mark === "function") {
    window.performance.mark(name);
  }
}, "mark");
function Designer(props) {
  const { everywhere, labels, specials, ranges } = props;
  const modes = props.colourmodes;
  const text = useMemo(() => createText(props.strings), [props.strings]);
  const [tick, refresh] = useReducer((count) => count + 1, 0);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const [active, setActive] = useState(null);
  const [filters, setFilters] = useState({
    query: "",
    kinds: [],
    components: [],
    purposes: [],
    traits: [],
    places: [],
    modes: [],
    sort: "catalogue"
  });
  const [status, setStatus] = useState("saved");
  const [surface, setSurface] = useState("light");
  const [previewView, setPreviewView] = useState("edited");
  const [stylesheetVersion, bumpStylesheet] = useReducer((count) => count + 1, 0);
  const [review, setReview] = useState(null);
  const [placesOpen, setPlacesOpen] = useState(false);
  const pageMode = usePageColourMode();
  const root = useRef(null);
  const narrow = useNarrow(root);
  const waiting = useRef(/* @__PURE__ */ new Set());
  const pendingArtwork = useRef(/* @__PURE__ */ new Set());
  const stateRef = useRef(null);
  stateRef.current ??= createState(everywhere, modes.length > 0 ? modes : ["all"]);
  const state = stateRef.current;
  const autosaveRef = useRef(null);
  autosaveRef.current ??= createAutosave({
    flush: state.flush,
    pendingCount: state.pendingCount,
    onStatus: /* @__PURE__ */ __name((name) => {
      if (name === "saving") {
        waiting.current = /* @__PURE__ */ new Set([...waiting.current, ...state.pendingSlots()]);
      }
      setStatus(name);
    }, "onStatus"),
    onSaved: /* @__PURE__ */ __name((result) => {
      if (result.stylesheeturl === null) {
        waiting.current = /* @__PURE__ */ new Set();
        return;
      }
      const covered = new Set(waiting.current);
      applyStylesheet(result.stylesheeturl, () => {
        covered.forEach((key) => waiting.current.delete(key));
        bumpStylesheet();
      });
    }, "onSaved"),
    onFailure: /* @__PURE__ */ __name(async (error) => {
      const reason = error.timedout ? text("savetimeout") : error.message || "";
      void addToast(text("savefailed", reason), { type: "danger", autohide: false, closeButton: true });
      await state.reloadRules();
      refresh();
    }, "onFailure")
  });
  const autosave = autosaveRef.current;
  useEffect(() => {
    mark("irs:init");
    state.load().then(() => {
      mark("irs:loaded");
      setLoaded(true);
      return null;
    }).catch((error) => void addToast(text("exchangefailed", error.message), { type: "danger" }));
    return () => autosave.dispose();
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element) {
      return void 0;
    }
    const fit = /* @__PURE__ */ __name(() => {
      element.style.setProperty("--irs-top", `${element.getBoundingClientRect().top + window.pageYOffset}px`);
    }, "fit");
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const modeNow = /* @__PURE__ */ __name(() => modes.length > 0 ? surface : "all", "modeNow");
  const icons = state.icons();
  const modified = state.modifiedKeys();
  const filtered = useMemo(() => {
    const wantsTraits = filters.traits.length > 0 || filters.places.length > 0 || filters.modes.length > 0;
    const traits = wantsTraits ? state.traits() : null;
    return sortIcons(filterIcons(icons, {
      ...filters,
      modified,
      traitsOf: /* @__PURE__ */ __name((key) => traits?.get(key) ?? NO_TRAITS, "traitsOf")
    }), filters.sort, modified);
  }, [icons, filters, tick, loaded]);
  const icon = state.icon(selected);
  const draft = icon && active ? state.draftOf(active) : null;
  const customised = active !== null && (state.isSaved(active) || state.isPending(active) || state.isInherited(active));
  const preview = usePreviewCss(icon, customised ? draft : null);
  const select = /* @__PURE__ */ __name((key) => {
    if (key === null && selection.mode === "copy") {
      selection.stop();
    }
    setSelected(key);
    setActive(key ? state.everywhereKey(key, modeNow()) : null);
    refresh();
  }, "select");
  const ensureArtwork = /* @__PURE__ */ __name(async (key) => {
    if (pendingArtwork.current.has(key)) {
      return;
    }
    pendingArtwork.current.add(key);
    try {
      const asset = await api.useIconArtwork(state.slotOf(key));
      state.stage(key, { assetid: asset.id, asseturl: asset.url, assetkind: asset.kind, assetmono: true, autoartwork: true });
      autosave.schedule(true);
    } catch {
      void addToast(text("artworkfailed"), { type: "warning" });
    } finally {
      pendingArtwork.current.delete(key);
      refresh();
    }
  }, "ensureArtwork");
  const stage = /* @__PURE__ */ __name((patch, continuous = false) => {
    if (!active || !icon) {
      return;
    }
    const clean = { ...patch };
    ["bc", "sc", "bg2", "oc"].forEach((name) => {
      if (clean[name] === "") {
        clean[name] = null;
      }
    });
    let changed = state.stage(active, clean);
    const now = state.draftOf(active);
    if (needsOwnArtwork(now, icon.kind)) {
      void ensureArtwork(active);
    } else if (icon.kind === "image" && "fg" in clean && clean.fg === "" && now.autoartwork) {
      changed = state.stage(active, NO_ARTWORK) || changed;
    }
    if (!changed) {
      return;
    }
    autosave.schedule(!continuous);
    refresh();
  }, "stage");
  const history = /* @__PURE__ */ __name((step) => {
    step();
    refresh();
    autosave.schedule(true);
  }, "history");
  const showWhere = /* @__PURE__ */ __name((key) => {
    const mode = state.whereOfKey(key).mode;
    if (modes.includes(mode)) {
      setSurface(mode);
    }
  }, "showWhere");
  const changeSurface = /* @__PURE__ */ __name((name) => {
    setSurface(name);
    const where = active === null ? null : state.whereOfKey(active);
    if (selected !== null && where !== null && modes.length > 0 && where.mode !== name) {
      setActive(state.addVariant(selected, { ...where, mode: name }));
      refresh();
    }
  }, "changeSurface");
  useEffect(() => {
    if (modes.length > 0 && pageMode && modes.includes(pageMode.applied)) {
      changeSurface(pageMode.applied);
    }
  }, [pageMode?.applied]);
  const fail = /* @__PURE__ */ __name((error) => void addToast(
    text("exchangefailed", error.message || ""),
    { type: "danger", closeButton: true }
  ), "fail");
  const exportSlots = /* @__PURE__ */ __name(async (slots) => {
    try {
      await autosave.flushAll();
      const result = await api.exportRules(slots);
      download(result.filename, result.content);
      void addToast(slots.length > 0 ? text("exportdone", slots.length) : text("exportdoneall"), { type: "success" });
      if (result.skipped.length > 0) {
        void addToast(text("exportskipped", result.skipped.length), { type: "warning", closeButton: true });
      }
      return true;
    } catch (error) {
      fail(error);
      return false;
    }
  }, "exportSlots");
  const readFile = /* @__PURE__ */ __name((file) => {
    if (file.size > MAX_BYTES) {
      void addToast(text("importtoobig"), { type: "danger", closeButton: true });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result);
      autosave.flushAll().then(() => api.importRules(content, "merge", true)).then((first) => {
        if (first.entries.some((entry) => entry.created + entry.updated > 0)) {
          setReview({ content, first });
        } else {
          void addToast(text("importempty"), { type: "warning", closeButton: true });
        }
        return null;
      }).catch((error) => fail(error));
    };
    reader.readAsText(file);
  }, "readFile");
  const imported = /* @__PURE__ */ __name(async (report) => {
    void addToast(text("importdone", {
      created: report.created,
      updated: report.updated,
      deleted: report.deleted,
      skipped: report.skipped
    }), { type: "success", closeButton: true });
    await state.reloadRules();
    refresh();
    applyStylesheet(report.stylesheeturl, bumpStylesheet);
  }, "imported");
  const copyLook = /* @__PURE__ */ __name(async (slots, groups) => {
    if (active === null) {
      return false;
    }
    const where = state.whereOfKey(active);
    const look = pickLook(state.draftOf(active), groups);
    const keys = slots.map((slot) => state.addVariant(slot, where));
    const changed = state.stageMany(keys.map((key) => ({ key, patch: look })));
    autosave.schedule(true);
    refresh();
    void addToast(text("copylookdone", changed), { type: "success" });
    for (const key of keys) {
      const target = state.icon(state.slotOf(key));
      if (target && needsOwnArtwork(state.draftOf(key), target.kind)) {
        await ensureArtwork(key);
      }
    }
    return true;
  }, "copyLook");
  const copyModes = /* @__PURE__ */ __name((slots, from, to, overwrite) => {
    const entries = [];
    let skipped = 0;
    slots.forEach((slot) => {
      state.variants(slot).filter(({ where }) => where.mode === from).forEach(({ key, where }) => {
        const target = state.keyFor(slot, { ...where, mode: to });
        if (!overwrite && (state.isSaved(target) || state.isPending(target))) {
          skipped++;
          return;
        }
        entries.push({ key: state.addVariant(slot, { ...where, mode: to }), patch: appearanceOf(state.draftOf(key)) });
      });
    });
    const changed = state.stageMany(entries);
    autosave.schedule(true);
    refresh();
    const names = { copied: changed, skipped, from: labels.modes[from] ?? from, to: labels.modes[to] ?? to };
    void addToast(text("copymodesdone", names), { type: changed > 0 ? "success" : "warning" });
    return Promise.resolve(true);
  }, "copyModes");
  const selection = useSelection({
    defaults: props.defaults,
    modeNames: modes.length > 1 ? modes : [],
    currentMode: modeNow,
    items: /* @__PURE__ */ __name(() => filtered, "items"),
    isPickable: /* @__PURE__ */ __name((mode, key, from) => mode === "copy" ? key !== from : modified.has(key), "isPickable"),
    source: /* @__PURE__ */ __name(() => selected, "source"),
    onStart: /* @__PURE__ */ __name((mode) => {
      if (mode === "export") {
        select(null);
      }
    }, "onStart"),
    onExport: exportSlots,
    onCopy: copyLook,
    onCopyModes: copyModes
  });
  useEffect(() => {
    const element = root.current;
    if (!element) {
      return void 0;
    }
    const escape = /* @__PURE__ */ __name((event) => {
      if (event.key === "Escape" && selection.mode !== null && !event.target.closest(".modal")) {
        selection.stop();
      }
    }, "escape");
    element.addEventListener("keydown", escape);
    return () => element.removeEventListener("keydown", escape);
  });
  const view = deriveView({
    state,
    selected,
    active,
    customised,
    modes,
    labels,
    surface,
    modeNow: modeNow(),
    pageMode,
    text,
    selecting: selection.mode !== null
  });
  const addPlaces = /* @__PURE__ */ __name((wheres, copy, stay = false) => {
    if (selected === null || active === null) {
      return;
    }
    const source = copy ? appearanceOf(state.draftOf(active)) : null;
    const keep = active;
    let last = active;
    wheres.forEach((where) => {
      last = state.addVariant(selected, where);
      if (source) {
        state.stage(last, source);
      }
    });
    autosave.schedule(true);
    if (stay) {
      setActive(keep);
      const names = wheres.map((where) => labels.modes[where.mode] || where.mode).join(", ");
      void addToast(text("copied", names), { type: "success" });
    } else {
      setActive(last);
      showWhere(last);
    }
    refresh();
  }, "addPlaces");
  const removeVariant = /* @__PURE__ */ __name((key) => {
    state.remove(key);
    if (selected !== null && key === active) {
      setActive(state.everywhereKey(selected, modeNow()));
    }
    refresh();
    autosave.schedule(true);
  }, "removeVariant");
  const cardCss = useCallback((key) => {
    if (key === selected) {
      return preview.css === "" ? null : preview.css;
    }
    if (waiting.current.has(key) || state.pendingSlots().has(key)) {
      return preview.held.get(key) || null;
    }
    return null;
  }, [selected, preview.css, preview.held, state, tick, stylesheetVersion]);
  const pickVariant = /* @__PURE__ */ __name((key) => {
    setActive(key);
    showWhere(key);
    refresh();
  }, "pickVariant");
  const copyToOtherModes = /* @__PURE__ */ __name(() => {
    if (view.activeWhere) {
      addPlaces(view.others.map((mode) => ({ ...view.activeWhere, mode })), true, true);
    }
  }, "copyToOtherModes");
  const toggleSelection = /* @__PURE__ */ __name((kind) => selection.mode === kind ? selection.stop() : selection.start(kind), "toggleSelection");
  const panel = icon && draft ? /* @__PURE__ */ jsxDEV(
    PreviewPanel,
    {
      icon,
      css: preview.css,
      waiting: preview.waiting,
      view: previewView,
      surface,
      modes,
      note: view.note,
      foreground: draft.fg,
      text,
      onView: setPreviewView,
      onSurface: changeSurface
    },
    void 0,
    false,
    {
      fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
      lineNumber: 428,
      columnNumber: 35
    },
    this
  ) : null;
  return /* @__PURE__ */ jsxDEV("div", { className: narrow ? `${view.rootClass} irs-narrow` : view.rootClass, "data-region": "designer", ref: root, children: [
    /* @__PURE__ */ jsxDEV("div", { className: icon ? "irs-layout irs-open" : "irs-layout", "data-region": "layout", children: [
      /* @__PURE__ */ jsxDEV("section", { className: "irs-browser", "aria-label": text("iconlist"), children: [
        /* @__PURE__ */ jsxDEV(
          Toolbar,
          {
            adminurl: props.adminurl,
            query: filters.query,
            count: filtered.length,
            status,
            canUndo: state.canUndo(),
            canRedo: state.canRedo(),
            selecting: selection.mode === "export",
            text,
            onQuery: (query) => setFilters({ ...filters, query }),
            onUndo: () => history(state.undo),
            onRedo: () => history(state.redo),
            onSave: () => void autosave.flushAll(),
            onSelect: () => toggleSelection("export"),
            onExportAll: () => void exportSlots([]),
            onFile: readFile,
            filters: /* @__PURE__ */ jsxDEV(
              FiltersPanel,
              {
                icons,
                filters,
                modes: view.filterModes,
                text,
                onChange: (patch) => setFilters({ ...filters, ...patch })
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
                lineNumber: 440,
                columnNumber: 30
              },
              this
            )
          },
          void 0,
          false,
          {
            fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
            lineNumber: 435,
            columnNumber: 17
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          Grid,
          {
            items: filtered,
            selected,
            modified,
            picking: selection.mode !== null,
            isPicked: selection.isPicked,
            isPickable: selection.isPickable,
            cardCss,
            theme: view.theme,
            text,
            stylesheetVersion,
            onSelect: (key, range) => selection.mode === null ? select(key) : selection.toggle(key, range),
            onMove: select,
            onFirstRender: () => mark("irs:rendered")
          },
          void 0,
          false,
          {
            fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
            lineNumber: 442,
            columnNumber: 17
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(SelectionBar, { selection, modeLabels: view.selectionModes, text }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
          lineNumber: 447,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "irs-empty", "data-region": "empty", hidden: !loaded || filtered.length > 0, children: text("noicons") }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
          lineNumber: 448,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "irs-loading irs-sk-over", "data-region": "loading", role: "status", hidden: loaded, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "irs-sk-grid", "aria-hidden": "true", children: Array.from({ length: 40 }, (_, index) => /* @__PURE__ */ jsxDEV("span", { className: "irs-sk irs-sk-cell" }, index, false, {
            fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
            lineNumber: 451,
            columnNumber: 65
          }, this)) }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
            lineNumber: 450,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "irs-sk-label", children: text("loading") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
            lineNumber: 453,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
          lineNumber: 449,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
        lineNumber: 434,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV(
        Inspector,
        {
          icon,
          draft,
          customised,
          removable: view.removable,
          variants: view.variants,
          otherModes: view.others.length,
          ranges,
          specials,
          copying: selection.mode === "copy",
          text,
          preview: panel,
          onProp: (prop, value, continuous = false) => stage({ [prop]: value }, continuous),
          onStage: stage,
          onClose: () => select(null),
          onCopyLook: () => toggleSelection("copy"),
          onRemoveVariant: () => active !== null && removeVariant(active),
          onPickVariant: pickVariant,
          onRemoveVariantChip: removeVariant,
          onAddPlaces: () => setPlacesOpen(true),
          onCopyMode: copyToOtherModes
        },
        void 0,
        false,
        {
          fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
          lineNumber: 456,
          columnNumber: 13
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
      lineNumber: 433,
      columnNumber: 9
    }, this),
    placesOpen && /* @__PURE__ */ jsxDEV(
      PlacesModal,
      {
        text,
        everywhere,
        pages: props.pages,
        regions: props.regions,
        modes: modes.map((mode) => ({ value: mode, label: labels.modes[mode] || mode })),
        currentMode: modeNow(),
        onAdd: (wheres, copy) => {
          setPlacesOpen(false);
          addPlaces(wheres, copy);
        },
        onClose: () => setPlacesOpen(false)
      },
      void 0,
      false,
      {
        fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
        lineNumber: 464,
        columnNumber: 24
      },
      this
    ),
    review && /* @__PURE__ */ jsxDEV(
      ImportModal,
      {
        content: review.content,
        first: review.first,
        defaults: props.defaults,
        text,
        onClose: () => setReview(null),
        onFailure: fail,
        onImported: (report) => void imported(report)
      },
      void 0,
      false,
      {
        fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
        lineNumber: 471,
        columnNumber: 20
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/Designer.tsx",
    lineNumber: 432,
    columnNumber: 12
  }, this);
}
__name(Designer, "Designer");
export {
  Designer as default
};
//# sourceMappingURL=Designer.dev.js.map
