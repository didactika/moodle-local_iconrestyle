var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * What the designer shows about the open icon and the colour mode, worked out from its state.
 *
 * @module     local_iconrestyle/lib/view
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { whereLabel } from "./draft";
const othersOf = /* @__PURE__ */ __name((where, modes) => {
  if (where === null || where.mode === "all") {
    return [];
  }
  return modes.filter((mode) => mode !== where.mode);
}, "othersOf");
const noteOf = /* @__PURE__ */ __name((input) => {
  const { pageMode, modes, labels, text } = input;
  if (modes.length === 0 || pageMode === null) {
    return "";
  }
  return text(pageMode.followsDevice ? "currentmodeauto" : "currentmode", labels.modes[pageMode.applied] || pageMode.applied);
}, "noteOf");
const deriveView = /* @__PURE__ */ __name((input) => {
  const { state, selected, active, customised, modes, labels, surface, modeNow, selecting } = input;
  const activeWhere = active === null ? null : state.whereOfKey(active);
  const hasModes = modes.length > 0;
  const variants = selected === null ? [] : state.variants(selected);
  const everywhere = selected === null ? null : state.everywhereKey(selected, modeNow);
  return {
    rootClass: selecting ? "irs irs-picking" : "irs",
    theme: hasModes ? surface : null,
    note: noteOf(input),
    filterModes: hasModes ? labels.modes : {},
    selectionModes: modes.length > 1 ? labels.modes : {},
    activeWhere,
    others: othersOf(activeWhere, modes),
    removable: customised || active !== null && active !== everywhere,
    variants: variants.map((variant) => ({
      key: variant.key,
      label: whereLabel(variant.where, labels),
      active: variant.key === active,
      removable: !variant.base
    }))
  };
}, "deriveView");
export {
  deriveView
};
//# sourceMappingURL=view.dev.js.map
