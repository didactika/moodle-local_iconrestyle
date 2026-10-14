var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * An isolated tree that shows icons with the stylesheets of the page and a look that is not saved yet.
 *
 * The tree is a shadow root of its own, so the compiled look of a draft cannot reach the rest of the page and the stylesheet of
 * the site, which also loads on this page, cannot reach it. Its content is drawn by React through a portal.
 *
 * @module     local_iconrestyle/components/ShadowStage
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fitCells } from "../lib/fit";
const OWN_STYLESHEET = "/local/iconrestyle/styles.php";
const LAYOUT = ".irs-stage{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1.25rem;max-width:100%;transition:opacity .12s ease}.irs-stage.irs-wait{opacity:0}.irs-cell{display:flex;flex:none;align-items:center;justify-content:center}.irs-fit{display:flex;align-items:center;justify-content:center}.irs-cell .icon,.irs-cell .activityiconcontainer{margin:0;flex:none}.irs-cell i.icon{display:inline-flex;align-items:center;justify-content:center}";
const CARD_LAYOUT = ":host{display:block;width:100%;height:100%;overflow:hidden}.irs-stage{display:grid;place-items:center;width:100%;height:100%;overflow:hidden}";
const pageStylesheets = /* @__PURE__ */ __name(() => Array.from(document.querySelectorAll('link[rel="stylesheet"]')).filter((link) => !link.href.includes(OWN_STYLESHEET)).map((link) => {
  const copy = document.createElement("link");
  copy.rel = "stylesheet";
  copy.href = link.href;
  return copy;
}), "pageStylesheets");
function ShadowStage(props) {
  const { className, region, area, layout = "", css, theme, waiting = false, limit, children } = props;
  const host = useRef(null);
  const [parts, setParts] = useState(null);
  useLayoutEffect(() => {
    const element = host.current;
    if (!element || element.shadowRoot) {
      return;
    }
    const shadow = element.attachShadow({ mode: "open" });
    const base = document.createElement("style");
    base.textContent = LAYOUT + layout;
    const style = document.createElement("style");
    const stage = document.createElement("div");
    stage.className = `irs-stage irs-preview-${area}`;
    shadow.append(...pageStylesheets(), base, style, stage);
    setParts({ style, stage });
  }, [area, layout]);
  useLayoutEffect(() => {
    if (parts) {
      parts.style.textContent = css;
    }
  }, [parts, css]);
  useLayoutEffect(() => {
    if (!parts) {
      return;
    }
    if (theme === null) {
      parts.stage.removeAttribute("data-bs-theme");
    } else {
      parts.stage.setAttribute("data-bs-theme", theme);
    }
    parts.stage.classList.toggle("irs-wait", waiting);
  }, [parts, theme, waiting]);
  useLayoutEffect(() => {
    if (!parts) {
      return void 0;
    }
    const size = /* @__PURE__ */ __name(() => limit === "host" ? Math.max(16, (host.current?.clientHeight ?? 0) * 0.92) : limit, "size");
    fitCells(parts.stage, size());
    const frame = window.requestAnimationFrame(() => fitCells(parts.stage, size()));
    const later = window.setTimeout(() => fitCells(parts.stage, size()), 250);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(later);
    };
  });
  return /* @__PURE__ */ jsxDEV("div", { ref: host, className, "data-region": region, children: parts ? createPortal(children, parts.stage) : null }, void 0, false, {
    fileName: "public/local/iconrestyle/js/esm/src/components/ShadowStage.tsx",
    lineNumber: 123,
    columnNumber: 12
  }, this);
}
__name(ShadowStage, "ShadowStage");
export {
  CARD_LAYOUT,
  ShadowStage as default
};
//# sourceMappingURL=ShadowStage.dev.js.map
