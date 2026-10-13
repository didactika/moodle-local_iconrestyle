// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * What is saved, what is waiting to be saved and how to undo and redo.
 *
 * Every icon can have several variants, one for each place where it applies. A variant is identified by its rule key,
 * made of the icon and the place. Changes wait in a pending set, where a newer change to a variant replaces the older
 * one, until flush() sends them all in one request. While that request is in flight the variants it carries are kept
 * apart, so a change made meanwhile is compared with what is being written and not with what was written before. Undo
 * and redo move a variant between the states it has been in, and the result is saved like any other change.
 *
 * @module     local_iconrestyle/state/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import * as services from 'local_iconrestyle/state/services';
import {emptyDraft, fromRule, isEmpty, ruleKey, sameDraft, toInput, traitsOf, whereOf} from 'local_iconrestyle/lib/draft';

const COALESCE_MS = 700;
const MAX_HISTORY = 200;
const BATCH_SIZE = 100;

/**
 * Create the state of one designer session.
 *
 * @param {object} everywhere The place that means every page of the site in every colour mode: contextid, contextname,
 *     contextkind, pages, regions and mode.
 * @param {string[]} modes The colour modes every icon has a look for, or all when the site has no colour modes.
 * @returns {object} State API.
 */
export const createState = (everywhere, modes = ['all']) => {
    let icons = [];
    let index = new Map();
    let saved = new Map();
    let pending = {};
    let inflight = {};
    let added = {};
    let undoOps = [];
    let redoOps = [];
    let lastTime = 0;
    let chain = Promise.resolve({written: 0, stylesheeturl: null});

    const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

    const slotOf = (key) => key.split('#')[0];

    const whereOfKey = (key) => {
        if (saved.has(key)) {
            return whereOf(fromRule(saved.get(key)));
        }
        if (added[key]) {
            return added[key];
        }
        const [, contextid, pages, regions, mode] = /^[^#]*#([^|]*)\|([^|]*)\|([^|]*)\|(.*)$/.exec(key) || [];
        if (contextid === String(everywhere.contextid) && pages === '' && regions === '') {
            return {...everywhere, mode};
        }
        return everywhere;
    };

    /**
     * The rule that exists for a variant once everything that is pending or in flight is written.
     *
     * @param {string} key Rule key.
     * @returns {object|null} Draft, or null when there is no rule.
     */
    const current = (key) => {
        if (has(pending, key)) {
            return pending[key];
        }
        if (has(inflight, key)) {
            return inflight[key];
        }
        return saved.has(key) ? fromRule(saved.get(key)) : null;
    };

    /**
     * The rule a change to a variant is compared with: what is being written, or else what is stored.
     *
     * @param {string} key Rule key.
     * @returns {object|null} Draft, or null when there is no rule.
     */
    const baseline = (key) => {
        if (has(inflight, key)) {
            return inflight[key];
        }
        return saved.has(key) ? fromRule(saved.get(key)) : null;
    };

    /**
     * Whether a variant has been removed and the removal is pending or in flight.
     *
     * @param {string} key Rule key.
     * @returns {boolean} True when it is removed.
     */
    const isRemoved = (key) => {
        if (has(pending, key)) {
            return pending[key] === null;
        }
        return has(inflight, key) && inflight[key] === null;
    };

    /**
     * The rule of every colour mode that a variant of one mode shows through, because it has no rule of its own.
     *
     * A look made before the site had colour modes applies to every mode. It is the look the pages show in each mode that has
     * none of its own, so it is the one the designer must open with, and the one a removal or a change has to deal with.
     *
     * @param {string} key Rule key of a variant of one colour mode.
     * @returns {string|null} Rule key of the look that applies to every mode, or null when the variant has its own rule or
     *     there is none.
     */
    const inheritedKey = (key) => {
        const where = whereOfKey(key);
        if (where.mode === 'all' || !modes.includes(where.mode) || current(key) !== null) {
            return null;
        }
        const everyKey = ruleKey(slotOf(key), {...where, mode: 'all'});
        const every = current(everyKey);
        return every !== null && !isEmpty(every) ? everyKey : null;
    };

    /**
     * The look a variant of one mode starts from when it has no rule: the look that applies to every mode, if there is one.
     *
     * @param {string} key Rule key.
     * @returns {object|null} Draft, or null when there is no such look.
     */
    const inheritedDraft = (key) => {
        const everyKey = inheritedKey(key);
        return everyKey === null ? null : {...current(everyKey), id: 0, rev: 0, mode: whereOfKey(key).mode};
    };

    /**
     * What a variant looks like now, including what it shows through from the look of every mode.
     *
     * @param {string} key Rule key.
     * @returns {object|null} Draft, or null when nothing styles it.
     */
    const effective = (key) => current(key) || inheritedDraft(key);

    const draftOf = (key) => effective(key) || emptyDraft(slotOf(key), whereOfKey(key));

    /**
     * Make a variant look like a draft, or have no rule, by changing what is pending.
     *
     * @param {string} key Rule key.
     * @param {object|null} draft Draft, or null for no rule.
     */
    const setState = (key, draft) => {
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
    };

    const record = (key, before, after) => {
        const now = Date.now();
        const last = undoOps[undoOps.length - 1];
        if (last && last.key === key && now - lastTime < COALESCE_MS) {
            last.after = after;
        } else {
            undoOps.push({key, before, after});
            if (undoOps.length > MAX_HISTORY) {
                undoOps.shift();
            }
        }
        lastTime = now;
        redoOps = [];
    };

    const changeOf = (key, patch) => {
        const before = effective(key);
        const after = {...(before || emptyDraft(slotOf(key), whereOfKey(key))), ...patch};
        const next = isEmpty(after) ? null : after;
        const unchanged = before === null ? next === null : next !== null && sameDraft(before, next);
        return unchanged ? null : {key, before, after: next};
    };

    /**
     * Give every colour mode its own copy of the look that applies to all of them, and drop that look.
     *
     * It is what a change to the look of one mode starts with, so that mode can change, or lose its look, without the
     * look of every mode still being served under it, and the other modes keep what they show.
     *
     * @param {string} key Rule key of the variant that is about to change.
     * @returns {object[]} The steps that were taken, which an undo takes back, empty when there was nothing to fold.
     */
    const fold = (key) => {
        const everyKey = inheritedKey(key);
        if (everyKey === null) {
            return [];
        }
        const every = current(everyKey);
        const where = whereOfKey(key);
        const ops = [];
        modes.forEach((mode) => {
            const modeKey = ruleKey(slotOf(key), {...where, mode});
            if (current(modeKey) !== null) {
                return;
            }
            const copy = {...every, id: 0, rev: 0, mode};
            if (!saved.has(modeKey)) {
                added[modeKey] = {...where, mode};
            }
            ops.push({key: modeKey, before: null, after: copy});
            setState(modeKey, copy);
        });
        ops.push({key: everyKey, before: every, after: null});
        setState(everyKey, null);
        return ops;
    };

    /**
     * Change a variant, folding the look of every mode first when the variant shows it through.
     *
     * @param {string} key Rule key.
     * @param {object} patch Fields to change.
     * @returns {object[]|null} The steps of the change, or null when it changes nothing.
     */
    const change = (key, patch) => {
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
    };

    /**
     * Add one step to the history, which an undo takes back whole.
     *
     * @param {object[]} ops The operations of the step.
     */
    const pushStep = (ops) => {
        undoOps.push({ops});
        if (undoOps.length > MAX_HISTORY) {
            undoOps.shift();
        }
        redoOps = [];
    };

    const ingest = (rules) => {
        saved = new Map(rules.map((rule) => [ruleKey(rule.slotkey, whereOf(rule)), rule]));
        pending = {};
        inflight = {};
        added = {};
        undoOps = [];
        redoOps = [];
    };

    /**
     * Send one batch of variants in a single request and take the stored rules from the answer.
     *
     * @param {string[]} keys Rule keys of the batch.
     * @returns {Promise<string>} The address of the stylesheet the site has now.
     */
    const send = async(keys) => {
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
            if (drafts[key] === null) {
                if (rule) {
                    deleteids.push(rule.id);
                    removedKeys.push(key);
                }
            } else {
                rules.push(toInput({...drafts[key], rev: rule ? rule.rev : 0}, index.get(slotOf(key)).kind));
                ruleKeys.push(key);
            }
        });
        try {
            const result = await services.saveRules(rules, deleteids);
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
    };

    const write = async() => {
        const keys = Object.keys(pending);
        let stylesheeturl = null;
        for (let start = 0; start < keys.length; start += BATCH_SIZE) {
            stylesheeturl = await send(keys.slice(start, start + BATCH_SIZE));
        }
        return {written: keys.length, stylesheeturl};
    };

    return {
        /**
         * Load the catalogue and every rule of the site.
         *
         * @returns {Promise<void>} Resolves when both are loaded.
         */
        load: async() => {
            const [catalogue, rules] = await Promise.all([services.getCatalogue(), services.getRules()]);
            icons = catalogue.icons;
            index = new Map(icons.map((icon) => [icon.key, icon]));
            ingest(rules.rules);
        },
        /**
         * Read every rule again and forget what is pending, as after a conflict.
         *
         * @returns {Promise<void>} Resolves when the rules are reloaded.
         */
        reloadRules: async() => {
            ingest((await services.getRules()).rules);
        },
        icons: () => icons,
        icon: (key) => index.get(key) || null,
        everywhereKey: (slotkey, mode = 'all') => ruleKey(slotkey, {...everywhere, mode}),
        keyFor: (slotkey, where) => ruleKey(slotkey, where),
        slotOf,
        whereOfKey,
        draftOf,
        /**
         * The draft that applies today, ignoring anything pending.
         *
         * @param {string} key Rule key.
         * @returns {object|null} Draft, or null when no rule is saved.
         */
        savedDraft: (key) => (saved.has(key) ? fromRule(saved.get(key)) : null),
        isSaved: (key) => saved.has(key),
        /**
         * Whether a variant has no rule of its own and shows the look that applies to every colour mode.
         *
         * @param {string} key Rule key.
         * @returns {boolean} True when it does.
         */
        isInherited: (key) => inheritedKey(key) !== null,
        isPending: (key) => has(pending, key) || has(inflight, key),
        /**
         * The variants of an icon: the one for every page first, then the others in a stable order.
         *
         * @param {string} slotkey Slot key.
         * @returns {Array<{key: string, where: object}>} Variants.
         */
        variants: (slotkey) => {
            const bases = modes.map((mode) => ruleKey(slotkey, {...everywhere, mode}));
            const keys = new Set(bases);
            const wanted = (key) => slotOf(key) === slotkey && !isRemoved(key);
            [...saved.keys(), ...Object.keys(added), ...Object.keys(pending), ...Object.keys(inflight)]
                .filter(wanted).forEach((key) => keys.add(key));
            const rest = [...keys].filter((key) => !bases.includes(key)).sort();
            return [...bases, ...rest].map((key) => ({key, where: whereOfKey(key), base: bases.includes(key)}));
        },
        /**
         * Slot keys of icons that have a variant, saved or pending with content.
         *
         * @returns {Set<string>} Keys.
         */
        modifiedKeys: () => {
            const keys = new Set();
            [...saved.keys(), ...Object.keys(pending), ...Object.keys(inflight)].forEach((key) => {
                const draft = current(key);
                if (draft !== null && !isEmpty(draft)) {
                    keys.add(slotOf(key));
                }
            });
            return keys;
        },
        /**
         * What each customised icon changes, from all its variants, saved or pending.
         *
         * @returns {Map<string, Set<string>>} Traits by slot key, as traitsOf describes them.
         */
        traits: () => {
            const map = new Map();
            [...saved.keys(), ...Object.keys(pending), ...Object.keys(inflight)].forEach((key) => {
                const draft = current(key);
                if (draft === null || isEmpty(draft)) {
                    return;
                }
                const set = map.get(slotOf(key)) || new Set();
                traitsOf(draft).forEach((trait) => set.add(trait));
                map.set(slotOf(key), set);
            });
            return map;
        },
        /**
         * Change one variant.
         *
         * Changes to the same variant in quick succession, such as dragging a slider, share one undo step.
         *
         * @param {string} key Rule key.
         * @param {object} patch Fields to change.
         * @returns {boolean} Whether anything changed, which is not the case when the variant already looks like that.
         */
        stage: (key, patch) => {
            const ops = change(key, patch);
            if (ops === null) {
                return false;
            }
            if (ops.length === 1) {
                record(key, ops[0].before, ops[0].after);
            } else {
                pushStep(ops);
            }
            return true;
        },
        /**
         * Change several variants as one step, so that a single undo takes all of them back.
         *
         * @param {Array<{key: string, patch: object}>} entries The variants and what to change in each.
         * @returns {number} How many variants changed.
         */
        stageMany: (entries) => {
            const ops = [];
            entries.forEach(({key, patch}) => {
                ops.push(...(change(key, patch) || []));
            });
            if (ops.length > 0) {
                pushStep(ops);
            }
            return ops.length;
        },
        /**
         * Add a variant of an icon for a place, or bring back one that was removed.
         *
         * @param {string} slotkey Slot key.
         * @param {object} where Place.
         * @returns {string} Rule key of the variant.
         */
        addVariant: (slotkey, where) => {
            const key = ruleKey(slotkey, where);
            if (has(pending, key) && pending[key] === null) {
                delete pending[key];
            } else if (isRemoved(key) || (!saved.has(key) && key !== ruleKey(slotkey, {...everywhere, mode: where.mode}))) {
                added[key] = where;
            }
            return key;
        },
        /**
         * Remove a variant, so the icon looks as the less specific variants say.
         *
         * @param {string} key Rule key.
         */
        remove: (key) => {
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
                pushStep(ops);
            }
        },
        undo: () => {
            const op = undoOps.pop();
            if (op) {
                (op.ops || [op]).forEach((each) => setState(each.key, each.before));
                redoOps.push(op);
            }
        },
        redo: () => {
            const op = redoOps.pop();
            if (op) {
                (op.ops || [op]).forEach((each) => setState(each.key, each.after));
                undoOps.push(op);
            }
        },
        canUndo: () => undoOps.length > 0,
        canRedo: () => redoOps.length > 0,
        pendingCount: () => Object.keys(pending).length,
        /**
         * The icons that have a change that is waiting or being written, which the stylesheet of the site cannot show yet.
         *
         * @returns {Set<string>} Slot keys.
         */
        pendingSlots: () => new Set([...Object.keys(pending), ...Object.keys(inflight)].map(slotOf)),
        /**
         * Write what is pending, all of it in one request. Calls queue, so two flushes never write at the same time.
         *
         * @returns {Promise<{written: number, stylesheeturl: (string|null)}>} How many changes were written, and the address
         *     of the stylesheet the site has afterwards, null when nothing was written.
         */
        flush: () => {
            chain = chain.catch(() => null).then(write);
            return chain;
        },
    };
};
