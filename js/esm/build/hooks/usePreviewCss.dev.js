var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Compiles the look of a draft that is not saved yet, so the preview and the card of the open icon can show it.
 *
 * The server compiles it, so what the preview shows is what the site will show. A request goes out a moment after the last
 * change, only one request is in flight at a time with the newest look winning, and a look that was compiled before is not
 * asked for again.
 *
 * @module     local_iconrestyle/hooks/usePreviewCss
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useEffect, useRef, useState } from "react";
import * as api from "../services/api";
import { toInput } from "../lib/draft";
const DEBOUNCE_MS = 250;
const CACHE_LIMIT = 200;
const usePreviewCss = /* @__PURE__ */ __name((icon, draft) => {
  const [shown, setShown] = useState({ key: "", css: "" });
  const [waiting, setWaiting] = useState(false);
  const cache = useRef(/* @__PURE__ */ new Map());
  const held = useRef(/* @__PURE__ */ new Map());
  const token = useRef(0);
  const busy = useRef(Promise.resolve());
  const timer = useRef(0);
  const input = icon && draft ? toInput(draft, icon.kind) : null;
  const signature = input ? JSON.stringify(input) : "";
  const key = icon ? icon.key : "";
  useEffect(() => {
    window.clearTimeout(timer.current);
    const apply = /* @__PURE__ */ __name((compiled) => {
      held.current.set(key, compiled);
      setShown({ key, css: compiled });
      setWaiting(false);
    }, "apply");
    if (key === "") {
      token.current++;
      setShown({ key: "", css: "" });
      setWaiting(false);
      return;
    }
    if (input === null) {
      token.current++;
      apply("");
      return;
    }
    const cached = cache.current.get(signature);
    if (cached !== void 0) {
      token.current++;
      apply(cached);
      return;
    }
    setWaiting(true);
    const mine = ++token.current;
    const request = /* @__PURE__ */ __name(async (rule) => {
      if (mine !== token.current) {
        return;
      }
      let compiled;
      try {
        compiled = await api.previewCss([rule], "new");
        cache.current.set(signature, compiled);
        if (cache.current.size > CACHE_LIMIT) {
          cache.current.delete(cache.current.keys().next().value);
        }
      } catch {
        compiled = "";
      }
      if (mine === token.current) {
        apply(compiled);
      }
    }, "request");
    timer.current = window.setTimeout(() => {
      busy.current = busy.current.then(() => request(input));
    }, DEBOUNCE_MS);
  }, [key, signature]);
  return { css: shown.key === key ? shown.css : "", waiting, held: held.current };
}, "usePreviewCss");
export {
  usePreviewCss
};
//# sourceMappingURL=usePreviewCss.dev.js.map
