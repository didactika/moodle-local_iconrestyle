var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The icon grid. Only the rows that can be seen exist in the page, so thousands of icons cost the same as dozens.
 *
 * @module     local_iconrestyle/components/Grid
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import IconCard from "./IconCard";
import { fitCards } from "../lib/fit";
import { visibleRows } from "../lib/filter";
const BUFFER_ROWS = 6;
const CARD_REM = 6.5;
const GAP_REM = 0.5;
const DIRECTIONS = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
const metrics = /* @__PURE__ */ __name((viewport) => {
  const rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
  const card = CARD_REM * rem;
  const gap = GAP_REM * rem;
  const width = Math.max(card, (viewport?.clientWidth ?? 0) - 2 * gap);
  return { columns: Math.max(1, Math.floor((width + gap) / (card + gap))), rowHeight: card + gap };
}, "metrics");
function Grid({
  items,
  selected,
  modified,
  picking,
  isPicked,
  isPickable,
  cardCss,
  theme,
  text,
  stylesheetVersion,
  onSelect,
  onMove,
  onFirstRender
}) {
  const viewport = useRef(null);
  const windowEl = useRef(null);
  const [scroll, setScroll] = useState({ top: 0, height: 0, width: 0 });
  const frame = useRef(0);
  const drawn = useRef(false);
  const measure = useCallback(() => {
    window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => {
      const element = viewport.current;
      if (element) {
        setScroll({ top: element.scrollTop, height: element.clientHeight, width: element.clientWidth });
      }
    });
  }, []);
  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (viewport.current) {
      observer?.observe(viewport.current);
    }
    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
      window.cancelAnimationFrame(frame.current);
    };
  }, [measure]);
  const { columns, rowHeight } = metrics(viewport.current);
  const rows = Math.ceil(items.length / columns);
  const { first, last } = visibleRows(scroll.top, scroll.height, rowHeight, rows, BUFFER_ROWS);
  const slice = items.slice(first * columns, last * columns);
  useLayoutEffect(() => {
    if (windowEl.current) {
      fitCards(windowEl.current);
    }
  });
  useEffect(() => {
    if (!drawn.current && slice.length > 0) {
      drawn.current = true;
      onFirstRender();
    }
  }, [slice.length, onFirstRender]);
  useEffect(() => {
    measure();
  }, [selected === null, measure]);
  const scrollTo = /* @__PURE__ */ __name((key) => {
    const element = viewport.current;
    const position = items.findIndex((icon) => icon.key === key);
    if (!element || position < 0) {
      return;
    }
    const top = Math.floor(position / columns) * rowHeight;
    if (top < element.scrollTop || top + rowHeight > element.scrollTop + element.clientHeight) {
      element.scrollTop = Math.max(0, top - element.clientHeight / 2 + rowHeight / 2);
    }
  }, "scrollTo");
  const keydown = /* @__PURE__ */ __name((event) => {
    const direction = DIRECTIONS[event.key];
    if (!direction || picking) {
      return;
    }
    event.preventDefault();
    const position = selected === null ? -1 : items.findIndex((icon) => icon.key === selected);
    if (position < 0) {
      if (items.length > 0) {
        onMove(items[0].key);
        scrollTo(items[0].key);
      }
      return;
    }
    const step = { left: -1, right: 1, up: -columns, down: columns }[direction];
    const next = items[Math.min(items.length - 1, Math.max(0, position + step))].key;
    onMove(next);
    scrollTo(next);
  }, "keydown");
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: "irs-grid",
      "data-region": "grid",
      tabIndex: 0,
      ref: viewport,
      onScroll: measure,
      onKeyDown: keydown,
      "data-version": stylesheetVersion,
      children: /* @__PURE__ */ jsxDEV("div", { className: "irs-grid-spacer", "data-region": "grid-spacer", style: { height: rows * rowHeight }, children: /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "irs-grid-window",
          "data-region": "grid-window",
          ref: windowEl,
          style: {
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            transform: `translateY(${first * rowHeight}px)`
          },
          children: slice.map((icon) => /* @__PURE__ */ jsxDEV(
            IconCard,
            {
              icon,
              modified: modified.has(icon.key),
              selected: icon.key === selected,
              picking,
              picked: picking && isPicked(icon.key),
              pickable: picking && isPickable(icon.key),
              css: cardCss(icon.key),
              theme,
              text,
              onSelect
            },
            icon.key,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/Grid.tsx",
              lineNumber: 156,
              columnNumber: 38
            },
            this
          ))
        },
        void 0,
        false,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/Grid.tsx",
          lineNumber: 152,
          columnNumber: 13
        },
        this
      ) }, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/Grid.tsx",
        lineNumber: 151,
        columnNumber: 9
      }, this)
    },
    void 0,
    false,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/Grid.tsx",
      lineNumber: 149,
      columnNumber: 12
    },
    this
  );
}
__name(Grid, "Grid");
export {
  Grid as default
};
//# sourceMappingURL=Grid.dev.js.map
