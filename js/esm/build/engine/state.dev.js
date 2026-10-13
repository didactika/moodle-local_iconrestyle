var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * What is saved, what is waiting to be saved and how to undo and redo.
 *
 * Every icon can have several variants, one for each place where it applies. A variant is identified by its rule key,
 * made of the icon and the place. Changes wait in a pending set, where a newer change to a variant replaces the older
 * one, until flush() sends them all in one request. While that request is in flight the variants it carries are kept
 * apart, so a change made meanwhile is compared with what is being written and not with what was written before. Undo
 * and redo move a variant between the states it has been in, and the result is saved like any other change.
 *
 * @module     local_iconrestyle/engine/state
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import * as api from "../services/api";
import { emptyDraft, fromRule, isEmpty, ruleKey, sameDraft, toInput, traitsOf, whereOf } from "../lib/draft";
const COALESCE_MS = 700;
const MAX_HISTORY = 200;
const BATCH_SIZE = 100;
const createState = /* @__PURE__ */ __name((everywhere, modes = ["all"]) => {
  let icons = [];
  let index = /* @__PURE__ */ new Map();
  let saved = /* @__PURE__ */ new Map();
  let pending = {};
  let inflight = {};
  let added = {};
  let undoOps = [];
  let redoOps = [];
  let lastTime = 0;
  let chain = Promise.resolve({ written: 0, stylesheeturl: null });
  const has = /* @__PURE__ */ __name((object, key) => Object.prototype.hasOwnProperty.call(object, key), "has");
  const slotOf = /* @__PURE__ */ __name((key) => key.split("#")[0], "slotOf");
  const whereOfKey = /* @__PURE__ */ __name((key) => {
    const rule = saved.get(key);
    if (rule) {
      return whereOf(fromRule(rule));
    }
    if (added[key]) {
      return added[key];
    }
    const [, contextid, pages, regions, mode] = /^[^#]*#([^|]*)\|([^|]*)\|([^|]*)\|(.*)$/.exec(key) || [];
    if (contextid === String(everywhere.contextid) && pages === "" && regions === "") {
      return { ...everywhere, mode };
    }
    return everywhere;
  }, "whereOfKey");
  const current = /* @__PURE__ */ __name((key) => {
    if (has(pending, key)) {
      return pending[key];
    }
    if (has(inflight, key)) {
      return inflight[key];
    }
    const rule = saved.get(key);
    return rule ? fromRule(rule) : null;
  }, "current");
  const baseline = /* @__PURE__ */ __name((key) => {
    if (has(inflight, key)) {
      return inflight[key];
    }
    const rule = saved.get(key);
    return rule ? fromRule(rule) : null;
  }, "baseline");
  const isRemoved = /* @__PURE__ */ __name((key) => {
    if (has(pending, key)) {
      return pending[key] === null;
    }
    return has(inflight, key) && inflight[key] === null;
  }, "isRemoved");
  const inheritedKey = /* @__PURE__ */ __name((key) => {
    const where = whereOfKey(key);
    if (where.mode === "all" || !modes.includes(where.mode) || current(key) !== null) {
      return null;
    }
    const everyKey = ruleKey(slotOf(key), { ...where, mode: "all" });
    const every = current(everyKey);
    return every !== null && !isEmpty(every) ? everyKey : null;
  }, "inheritedKey");
  const inheritedDraft = /* @__PURE__ */ __name((key) => {
    const everyKey = inheritedKey(key);
    return everyKey === null ? null : { ...current(everyKey), id: 0, rev: 0, mode: whereOfKey(key).mode };
  }, "inheritedDraft");
  const effective = /* @__PURE__ */ __name((key) => current(key) || inheritedDraft(key), "effective");
  const draftOf = /* @__PURE__ */ __name((key) => effective(key) || emptyDraft(slotOf(key), whereOfKey(key)), "draftOf");
  const setState = /* @__PURE__ */ __name((key, draft) => {
    const base = baseline(key);
    if (draft === null || isEmpty(draft)) {
      if (base !== null) {
        pending[key] = null;
      } else {
        delete pending[key];
      }
    } else if (base !== null && sameDraft(draft, base)) {
      delete pending[key];
    } else {
      pending[key] = draft;
    }
  }, "setState");
  const record = /* @__PURE__ */ __name((key, before, after) => {
    const now = Date.now();
    const last = undoOps[undoOps.length - 1];
    if (last && "key" in last && last.key === key && now - lastTime < COALESCE_MS) {
      last.after = after;
    } else {
      undoOps.push({ key, before, after });
      if (undoOps.length > MAX_HISTORY) {
        undoOps.shift();
      }
    }
    lastTime = now;
    redoOps = [];
  }, "record");
  const fold = /* @__PURE__ */ __name((key) => {
    const everyKey = inheritedKey(key);
    if (everyKey === null) {
      return [];
    }
    const every = current(everyKey);
    const where = whereOfKey(key);
    const ops = [];
    modes.forEach((mode) => {
      const modeKey = ruleKey(slotOf(key), { ...where, mode });
      if (current(modeKey) !== null) {
        return;
      }
      const copy = { ...every, id: 0, rev: 0, mode };
      if (!saved.has(modeKey)) {
        added[modeKey] = { ...where, mode };
      }
      ops.push({ key: modeKey, before: null, after: copy });
      setState(modeKey, copy);
    });
    ops.push({ key: everyKey, before: every, after: null });
    setState(everyKey, null);
    return ops;
  }, "fold");
  const change = /* @__PURE__ */ __name((key, patch) => {
    const operation = changeOf(key, patch);
    if (operation === null) {
      return null;
    }
    const ops = fold(key);
    const own = ops.find((each) => each.key === key);
    if (own) {
      own.after = operation.after;
    } else {
      ops.push(operation);
    }
    setState(key, operation.after);
    return ops;
  }, "change");
  const ingest = /* @__PURE__ */ __name((rules) => {
    saved = new Map(rules.map((rule) => [ruleKey(rule.slotkey, whereOf(rule)), rule]));
    pending = {};
    inflight = {};
    added = {};
    undoOps = [];
    redoOps = [];
  }, "ingest");
  const send = /* @__PURE__ */ __name(async (keys) => {
    const rules = [];
    const ruleKeys = [];
    const deleteids = [];
    const removedKeys = [];
    const drafts = {};
    keys.forEach((key) => {
      drafts[key] = pending[key];
      delete pending[key];
      inflight[key] = drafts[key];
      const rule = saved.get(key);
      const draft = drafts[key];
      if (draft === null) {
        if (rule) {
          deleteids.push(rule.id);
          removedKeys.push(key);
        }
      } else {
        rules.push(toInput({ ...draft, rev: rule ? rule.rev : 0 }, index.get(slotOf(key)).kind));
        ruleKeys.push(key);
      }
    });
    try {
      const result = await api.saveRules(rules, deleteids);
      result.rules.forEach((rule, position) => saved.set(ruleKeys[position], rule));
      removedKeys.forEach((key) => saved.delete(key));
      return result.stylesheeturl;
    } catch (error) {
      keys.forEach((key) => {
        if (!has(pending, key)) {
          pending[key] = drafts[key];
        }
      });
      throw error;
    } finally {
      keys.forEach((key) => {
        delete inflight[key];
      });
    }
  }, "send");
  const write = /* @__PURE__ */ __name(async () => {
    const keys = Object.keys(pending);
    let stylesheeturl = null;
    for (let start = 0; start < keys.length; start += BATCH_SIZE) {
      stylesheeturl = await send(keys.slice(start, start + BATCH_SIZE));
    }
    return { written: keys.length, stylesheeturl };
  }, "write");
  const changeOf = /* @__PURE__ */ __name((key, patch) => {
    const before = effective(key);
    const after = { ...before || emptyDraft(slotOf(key), whereOfKey(key)), ...patch };
    const next = isEmpty(after) ? null : after;
    const unchanged = before === null ? next === null : next !== null && sameDraft(before, next);
    return unchanged ? null : { key, before, after: next };
  }, "changeOf");
  const stepsOf = /* @__PURE__ */ __name((step) => "ops" in step ? step.ops : [step], "stepsOf");
  return {
    load: /* @__PURE__ */ __name(async () => {
      const [catalogue, rules] = await Promise.all([api.getCatalogue(), api.getRules()]);
      icons = catalogue.icons;
      index = new Map(icons.map((icon) => [icon.key, icon]));
      ingest(rules.rules);
    }, "load"),
    reloadRules: /* @__PURE__ */ __name(async () => {
      ingest((await api.getRules()).rules);
    }, "reloadRules"),
    icons: /* @__PURE__ */ __name(() => icons, "icons"),
    icon: /* @__PURE__ */ __name((key) => key === null ? null : index.get(key) || null, "icon"),
    everywhereKey: /* @__PURE__ */ __name((slotkey, mode = "all") => ruleKey(slotkey, { ...everywhere, mode }), "everywhereKey"),
    keyFor: /* @__PURE__ */ __name((slotkey, where) => ruleKey(slotkey, where), "keyFor"),
    slotOf,
    whereOfKey,
    draftOf,
    savedDraft: /* @__PURE__ */ __name((key) => {
      const rule = saved.get(key);
      return rule ? fromRule(rule) : null;
    }, "savedDraft"),
    isSaved: /* @__PURE__ */ __name((key) => saved.has(key), "isSaved"),
    isPending: /* @__PURE__ */ __name((key) => has(pending, key) || has(inflight, key), "isPending"),
    isInherited: /* @__PURE__ */ __name((key) => inheritedKey(key) !== null, "isInherited"),
    variants: /* @__PURE__ */ __name((slotkey) => {
      const bases = modes.map((mode) => ruleKey(slotkey, { ...everywhere, mode }));
      const keys = new Set(bases);
      const wanted = /* @__PURE__ */ __name((key) => slotOf(key) === slotkey && !isRemoved(key), "wanted");
      [...saved.keys(), ...Object.keys(added), ...Object.keys(pending), ...Object.keys(inflight)].filter(wanted).forEach((key) => keys.add(key));
      const rest = [...keys].filter((key) => !bases.includes(key)).sort();
      return [...bases, ...rest].map((key) => ({ key, where: whereOfKey(key), base: bases.includes(key) }));
    }, "variants"),
    modifiedKeys: /* @__PURE__ */ __name(() => {
      const keys = /* @__PURE__ */ new Set();
      [...saved.keys(), ...Object.keys(pending), ...Object.keys(inflight)].forEach((key) => {
        const draft = current(key);
        if (draft !== null && !isEmpty(draft)) {
          keys.add(slotOf(key));
        }
      });
      return keys;
    }, "modifiedKeys"),
    traits: /* @__PURE__ */ __name(() => {
      const map = /* @__PURE__ */ new Map();
      [...saved.keys(), ...Object.keys(pending), ...Object.keys(inflight)].forEach((key) => {
        const draft = current(key);
        if (draft === null || isEmpty(draft)) {
          return;
        }
        const set = map.get(slotOf(key)) || /* @__PURE__ */ new Set();
        traitsOf(draft).forEach((trait) => set.add(trait));
        map.set(slotOf(key), set);
      });
      return map;
    }, "traits"),
    stage: /* @__PURE__ */ __name((key, patch) => {
      const ops = change(key, patch);
      if (ops === null) {
        return false;
      }
      if (ops.length === 1) {
        record(key, ops[0].before, ops[0].after);
      } else {
        undoOps.push({ ops });
        if (undoOps.length > MAX_HISTORY) {
          undoOps.shift();
        }
        redoOps = [];
      }
      return true;
    }, "stage"),
    stageMany: /* @__PURE__ */ __name((entries) => {
      const ops = [];
      entries.forEach(({ key, patch }) => {
        ops.push(...change(key, patch) ?? []);
      });
      if (ops.length > 0) {
        undoOps.push({ ops });
        if (undoOps.length > MAX_HISTORY) {
          undoOps.shift();
        }
        redoOps = [];
      }
      return ops.length;
    }, "stageMany"),
    addVariant: /* @__PURE__ */ __name((slotkey, where) => {
      const key = ruleKey(slotkey, where);
      if (has(pending, key) && pending[key] === null) {
        delete pending[key];
      } else if (isRemoved(key) || !saved.has(key) && key !== ruleKey(slotkey, { ...everywhere, mode: where.mode })) {
        added[key] = where;
      }
      return key;
    }, "addVariant"),
    remove: /* @__PURE__ */ __name((key) => {
      const before = effective(key);
      const ops = fold(key);
      delete added[key];
      setState(key, null);
      const own = ops.find((each) => each.key === key);
      if (own) {
        own.after = null;
      }
      if (ops.length === 0) {
        record(key, before, null);
      } else {
        undoOps.push({ ops });
        if (undoOps.length > MAX_HISTORY) {
          undoOps.shift();
        }
        redoOps = [];
      }
    }, "remove"),
    undo: /* @__PURE__ */ __name(() => {
      const step = undoOps.pop();
      if (step) {
        stepsOf(step).forEach((each) => setState(each.key, each.before));
        redoOps.push(step);
      }
    }, "undo"),
    redo: /* @__PURE__ */ __name(() => {
      const step = redoOps.pop();
      if (step) {
        stepsOf(step).forEach((each) => setState(each.key, each.after));
        undoOps.push(step);
      }
    }, "redo"),
    canUndo: /* @__PURE__ */ __name(() => undoOps.length > 0, "canUndo"),
    canRedo: /* @__PURE__ */ __name(() => redoOps.length > 0, "canRedo"),
    pendingCount: /* @__PURE__ */ __name(() => Object.keys(pending).length, "pendingCount"),
    pendingSlots: /* @__PURE__ */ __name(() => new Set([...Object.keys(pending), ...Object.keys(inflight)].map(slotOf)), "pendingSlots"),
    flush: /* @__PURE__ */ __name(() => {
      chain = chain.catch(() => ({ written: 0, stylesheeturl: null })).then(write);
      return chain;
    }, "flush")
  };
}, "createState");
export {
  createState
};
//# sourceMappingURL=state.dev.js.map
