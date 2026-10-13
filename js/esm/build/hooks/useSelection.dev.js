var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * Choosing icons in the grid itself, to export them, to copy the look of the open icon to them or to copy one colour mode to
 * another in them.
 *
 * While a choice is going on, a click on a card chooses it instead of opening it, a click with Shift chooses everything between
 * it and the last card chosen, and a bar floats over the grid with what can be done with the choice. Nothing is changed until
 * the person applies, and leaving the choice, with Esc or the cross, changes nothing.
 *
 * @module     local_iconrestyle/hooks/useSelection
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useCallback, useRef, useState } from "react";
const useSelection = /* @__PURE__ */ __name((options) => {
  const [mode, setMode] = useState(null);
  const [from, setFrom] = useState(null);
  const [picked, setPicked] = useState(/* @__PURE__ */ new Set());
  const [groups, setGroups] = useState(options.defaults.copygroups);
  const [overwrite, setOverwrite] = useState(options.defaults.copyoverwrite);
  const [fromMode, setFromMode] = useState("");
  const [toMode, setToMode] = useState("");
  const [busy, setBusy] = useState(false);
  const last = useRef(null);
  const current = useRef(null);
  const latest = useRef(options);
  latest.current = options;
  const pickable = /* @__PURE__ */ __name((key, kind = mode, source = from) => kind !== null && latest.current.isPickable(kind, key, source), "pickable");
  const stop = useCallback(() => {
    current.current = null;
    setMode(null);
    setFrom(null);
    setPicked(/* @__PURE__ */ new Set());
    last.current = null;
  }, []);
  const start = useCallback((kind) => {
    const wanted = latest.current;
    if (kind === "copy" && wanted.source() === null) {
      return;
    }
    if (current.current === null) {
      setGroups(wanted.defaults.copygroups);
      setOverwrite(wanted.defaults.copyoverwrite);
      const names = wanted.modeNames;
      const now = names.includes(wanted.currentMode()) ? wanted.currentMode() : names[0] ?? "";
      setFromMode(now);
      setToMode(names.find((name) => name !== now) ?? names[0] ?? "");
      wanted.onStart(kind);
    }
    current.current = kind;
    setMode(kind);
    setFrom(kind === "copy" ? wanted.source() : null);
    setPicked(/* @__PURE__ */ new Set());
    last.current = null;
  }, []);
  const switchTo = /* @__PURE__ */ __name((kind) => {
    current.current = kind;
    setMode(kind);
  }, "switchTo");
  const toggle = /* @__PURE__ */ __name((key, range = false) => {
    if (mode === null || !pickable(key)) {
      return;
    }
    const wanted = !picked.has(key);
    let keys = [key];
    if (range && last.current !== null) {
      const list = options.items().filter((icon) => pickable(icon.key)).map((icon) => icon.key);
      const a = list.indexOf(last.current);
      const b = list.indexOf(key);
      if (a >= 0 && b >= 0) {
        keys = list.slice(Math.min(a, b), Math.max(a, b) + 1);
      }
    }
    const next = new Set(picked);
    keys.forEach((one) => {
      if (wanted) {
        next.add(one);
      } else {
        next.delete(one);
      }
    });
    setPicked(next);
    last.current = key;
  }, "toggle");
  const apply = /* @__PURE__ */ __name(async () => {
    if (busy || picked.size === 0 || mode === null) {
      return;
    }
    setBusy(true);
    const keys = [...picked];
    const finished = await {
      copy: /* @__PURE__ */ __name(() => options.onCopy(keys, groups), "copy"),
      modes: /* @__PURE__ */ __name(() => options.onCopyModes(keys, fromMode, toMode, overwrite), "modes"),
      "export": /* @__PURE__ */ __name(() => options.onExport(keys), "export")
    }[mode]();
    setBusy(false);
    if (finished) {
      stop();
    }
  }, "apply");
  return {
    mode,
    from,
    picked,
    groups,
    overwrite,
    fromMode,
    toMode,
    busy,
    start,
    stop,
    toggle,
    apply,
    all: /* @__PURE__ */ __name(() => setPicked(new Set(options.items().filter((icon) => pickable(icon.key)).map((icon) => icon.key))), "all"),
    none: /* @__PURE__ */ __name(() => setPicked(/* @__PURE__ */ new Set()), "none"),
    setGroups,
    setOverwrite,
    setFromMode,
    setToMode,
    switchTo,
    isPicked: /* @__PURE__ */ __name((key) => picked.has(key), "isPicked"),
    isPickable: /* @__PURE__ */ __name((key) => pickable(key), "isPickable")
  };
}, "useSelection");
export {
  useSelection
};
//# sourceMappingURL=useSelection.dev.js.map
