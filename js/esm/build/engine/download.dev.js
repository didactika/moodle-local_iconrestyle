var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * Gives the browser a file to save.
 *
 * @module     local_iconrestyle/engine/download
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
const download = /* @__PURE__ */ __name((filename, content) => {
  const url = window.URL.createObjectURL(new window.Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1e3);
}, "download");
export {
  download
};
//# sourceMappingURL=download.dev.js.map
