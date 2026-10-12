var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * The colour mode this page is shown in, when Moodle has colour modes.
 *
 * Boost writes the mode that is applied in the data-bs-theme attribute of the html element, and the mode the person chose,
 * which can also be to follow the device, in data-colourmode. A site where colour modes are not enabled writes neither, and
 * then nothing is shown and nothing is preselected.
 *
 * @module     local_iconrestyle/hooks/usePageColourMode
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useEffect, useState } from "react";
const detect = /* @__PURE__ */ __name(() => {
  const html = document.documentElement;
  const applied = html.getAttribute("data-bs-theme");
  if (applied !== "light" && applied !== "dark") {
    return null;
  }
  return { applied, followsDevice: html.getAttribute("data-colourmode") === "auto" };
}, "detect");
const usePageColourMode = /* @__PURE__ */ __name(() => {
  const [mode, setMode] = useState(detect);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const next = detect();
      setMode((before) => before && next && before.applied === next.applied && before.followsDevice === next.followsDevice ? before : next);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bs-theme", "data-colourmode"] });
    return () => observer.disconnect();
  }, []);
  return mode;
}, "usePageColourMode");
export {
  usePageColourMode
};
//# sourceMappingURL=usePageColourMode.dev.js.map
