var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * Keep a floating list under the element that opened it while the page, or anything inside the page, scrolls or changes size.
 *
 * The lists are placed in the coordinates of the window, so they would stay where they were put while the element that opened
 * them moves away. While the list is open, the place is worked out again as often as the screen is drawn, and not more.
 *
 * @module     local_iconrestyle/hooks/useFollowAnchor
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useEffect, useRef } from "react";
const useFollowAnchor = /* @__PURE__ */ __name((active, update, ignore) => {
  const latest = useRef(update);
  const skipped = useRef(ignore);
  latest.current = update;
  skipped.current = ignore;
  useEffect(() => {
    if (!active) {
      return void 0;
    }
    let frame = 0;
    let timer = 0;
    let waiting = false;
    const go = /* @__PURE__ */ __name(() => {
      if (!waiting) {
        return;
      }
      waiting = false;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      latest.current();
    }, "go");
    const run = /* @__PURE__ */ __name((event) => {
      const inside = skipped.current?.();
      if (waiting || inside && event.target instanceof Node && inside.contains(event.target)) {
        return;
      }
      waiting = true;
      frame = window.requestAnimationFrame(go);
      timer = window.setTimeout(go, 50);
    }, "run");
    window.addEventListener("scroll", run, true);
    window.addEventListener("resize", run);
    return () => {
      waiting = false;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("scroll", run, true);
      window.removeEventListener("resize", run);
    };
  }, [active]);
}, "useFollowAnchor");
export {
  useFollowAnchor
};
//# sourceMappingURL=useFollowAnchor.dev.js.map
