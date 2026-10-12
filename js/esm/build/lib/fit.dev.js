var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * Keeps an icon whose customised look has grown from covering its neighbours.
 *
 * @module     local_iconrestyle/lib/fit
 * @copyright  2026 Didactica.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
const fitCells = /* @__PURE__ */ __name((stage, limit) => {
  stage.querySelectorAll(".irs-cell").forEach((wrapper) => {
    const fit = wrapper.firstElementChild;
    if (!fit) {
      return;
    }
    fit.style.zoom = "";
    const target = fit.querySelector(".activityiconcontainer, .icon, img");
    if (!target) {
      return;
    }
    const rect = target.getBoundingClientRect();
    const longest = Math.max(rect.width, rect.height);
    if (longest > limit) {
      fit.style.zoom = (limit / longest).toFixed(3);
    }
  });
}, "fitCells");
const fitCards = /* @__PURE__ */ __name((container) => {
  container.querySelectorAll(".irs-card-icon").forEach((area) => {
    const fit = area.firstElementChild;
    if (!fit || fit.classList.contains("irs-card-fit") === false) {
      return;
    }
    fit.style.zoom = "";
    const target = fit.querySelector(".activityiconcontainer, .icon, img");
    if (!target) {
      return;
    }
    const rect = target.getBoundingClientRect();
    const room = Math.min(area.clientWidth, area.clientHeight) * 0.92;
    const longest = Math.max(rect.width, rect.height);
    if (longest > room) {
      fit.style.zoom = (room / longest).toFixed(3);
    }
  });
}, "fitCards");
export {
  fitCards,
  fitCells
};
//# sourceMappingURL=fit.dev.js.map
