var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Every web service call of the designer, in one place.
 *
 * @module     local_iconrestyle/services/api
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { fetchOne } from "@moodle/lms/core/ajax";
const SAVE_TIMEOUT_MS = 3e4;
class TimeoutError extends Error {
  static {
    __name(this, "TimeoutError");
  }
  timedout = true;
  constructor() {
    super("The server did not answer in time.");
  }
}
const call = /* @__PURE__ */ __name((methodname, args) => fetchOne({ methodname, args }), "call");
const withTimeout = /* @__PURE__ */ __name((promise, milliseconds) => new Promise((resolve, reject) => {
  const timer = window.setTimeout(() => reject(new TimeoutError()), milliseconds);
  promise.then((value) => {
    window.clearTimeout(timer);
    resolve(value);
    return null;
  }, (error) => {
    window.clearTimeout(timer);
    reject(error);
  });
}), "withTimeout");
const getCatalogue = /* @__PURE__ */ __name(() => call("local_iconrestyle_get_catalogue", {}), "getCatalogue");
const getRules = /* @__PURE__ */ __name(() => call("local_iconrestyle_get_rules", {}), "getRules");
const saveRules = /* @__PURE__ */ __name((rules, deleteids) => withTimeout(call("local_iconrestyle_save_rules", { rules, deleteids }), SAVE_TIMEOUT_MS), "saveRules");
const previewCss = /* @__PURE__ */ __name((rules, scope) => call(
  "local_iconrestyle_preview_css",
  { rules, scope }
), "previewCss");
const searchLocations = /* @__PURE__ */ __name((kind, query) => call(
  "local_iconrestyle_search_locations",
  { kind, query }
), "searchLocations");
const addAsset = /* @__PURE__ */ __name((content) => call("local_iconrestyle_add_asset", { content }), "addAsset");
const useIconArtwork = /* @__PURE__ */ __name((slotkey) => call("local_iconrestyle_use_icon_artwork", { slotkey }), "useIconArtwork");
const exportRules = /* @__PURE__ */ __name((slots = []) => call(
  "local_iconrestyle_export_rules",
  { slots }
), "exportRules");
const importRules = /* @__PURE__ */ __name((content, mode, dryrun, slots = []) => call(
  "local_iconrestyle_import_rules",
  { content, mode, dryrun, slots }
), "importRules");
export {
  TimeoutError,
  addAsset,
  exportRules,
  getCatalogue,
  getRules,
  importRules,
  previewCss,
  saveRules,
  searchLocations,
  useIconArtwork
};
//# sourceMappingURL=api.dev.js.map
