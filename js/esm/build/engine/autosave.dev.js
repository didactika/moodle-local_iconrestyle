var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * Saves the changes of the designer on its own, without ever sending two requests at once.
 *
 * A click, a choice or an undo is saved at once. What the person is still typing or dragging waits a third of a second
 * after the last step, so a slider makes one request and not one per step, and a save is forced after two seconds if the
 * person never stops. Everything that changed goes in a single request. While a request is in flight, new changes only wait:
 * they go in the next request, which starts the moment the first one ends.
 *
 * @module     local_iconrestyle/engine/autosave
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
const QUIET_MS = 350;
const MAX_WAIT_MS = 2e3;
const createAutosave = /* @__PURE__ */ __name((options) => {
  const { flush, pendingCount, onStatus, onSaved, onFailure } = options;
  let timer = 0;
  let dirtySince = 0;
  let saving = null;
  const run = /* @__PURE__ */ __name(async () => {
    let failed = false;
    onStatus("saving");
    try {
      onSaved(await flush());
    } catch (error) {
      failed = true;
      onStatus("error");
      await onFailure(error);
    } finally {
      saving = null;
    }
    if (pendingCount() > 0) {
      schedule(true);
    } else if (!failed) {
      onStatus("saved");
    }
  }, "run");
  const saveNow = /* @__PURE__ */ __name(() => {
    window.clearTimeout(timer);
    if (saving) {
      return saving;
    }
    if (pendingCount() === 0) {
      onStatus("saved");
      return Promise.resolve();
    }
    dirtySince = 0;
    saving = run();
    return saving;
  }, "saveNow");
  function schedule(immediate = false) {
    if (!saving && pendingCount() > 0) {
      onStatus("dirty");
    }
    const now = Date.now();
    dirtySince = dirtySince || now;
    window.clearTimeout(timer);
    const wait = immediate ? 0 : Math.max(0, Math.min(QUIET_MS, dirtySince + MAX_WAIT_MS - now));
    timer = window.setTimeout(() => {
      void saveNow();
    }, wait);
  }
  __name(schedule, "schedule");
  const flushAll = /* @__PURE__ */ __name(async () => {
    await saveNow();
    if (pendingCount() > 0) {
      await saveNow();
    }
  }, "flushAll");
  const isBusy = /* @__PURE__ */ __name(() => saving !== null || pendingCount() > 0, "isBusy");
  const beforeUnload = /* @__PURE__ */ __name((event) => {
    if (isBusy()) {
      event.preventDefault();
      event.returnValue = "";
    }
  }, "beforeUnload");
  const hidden = /* @__PURE__ */ __name(() => {
    if (document.visibilityState === "hidden" && isBusy()) {
      void flushAll();
    }
  }, "hidden");
  window.addEventListener("beforeunload", beforeUnload);
  document.addEventListener("visibilitychange", hidden);
  return {
    schedule,
    saveNow,
    flushAll,
    isBusy,
    dispose: /* @__PURE__ */ __name(() => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("visibilitychange", hidden);
    }, "dispose")
  };
}, "createAutosave");
export {
  createAutosave
};
//# sourceMappingURL=autosave.dev.js.map
