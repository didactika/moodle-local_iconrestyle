var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * Keeps the stylesheet of the site, which this page also loads, in step with what was just saved.
 *
 * @module     local_iconrestyle/engine/stylesheet
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
const SITE_STYLESHEET = 'link[href*="/local/iconrestyle/styles.php"]';
const applyStylesheet = /* @__PURE__ */ __name((url, onApplied) => {
  const current = document.querySelector(SITE_STYLESHEET);
  if (url === "") {
    current?.remove();
    onApplied();
    return;
  }
  if (current && current.href === url) {
    onApplied();
    return;
  }
  const next = document.createElement("link");
  next.rel = "stylesheet";
  next.href = url;
  next.addEventListener("load", () => {
    current?.remove();
    onApplied();
  });
  if (current) {
    current.after(next);
  } else {
    document.head.appendChild(next);
  }
}, "applyStylesheet");
export {
  applyStylesheet
};
//# sourceMappingURL=stylesheet.dev.js.map
