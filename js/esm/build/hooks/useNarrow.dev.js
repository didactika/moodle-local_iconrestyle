var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * Whether the designer has little room, which is not the same as the window being small: a drawer of Moodle that is open takes room
 * from the page and leaves the window as it was.
 *
 * @module     local_iconrestyle/hooks/useNarrow
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useEffect, useState } from "react";
const NARROW = 62;
const useNarrow = /* @__PURE__ */ __name((element) => {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const target = element.current;
    if (!target || typeof ResizeObserver === "undefined") {
      return void 0;
    }
    const measure = /* @__PURE__ */ __name(() => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setNarrow(target.getBoundingClientRect().width < NARROW * rem);
    }, "measure");
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    measure();
    return () => observer.disconnect();
  }, [element]);
  return narrow;
}, "useNarrow");
export {
  useNarrow
};
//# sourceMappingURL=useNarrow.dev.js.map
