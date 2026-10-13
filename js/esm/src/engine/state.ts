// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
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
import * as api from '../services/api';
import {emptyDraft, fromRule, isEmpty, ruleKey, sameDraft, toInput, traitsOf, whereOf} from '../lib/draft';
import type {Draft, Icon, Patch, Rule, Where} from '../types';

const COALESCE_MS = 700;
const MAX_HISTORY = 200;
const BATCH_SIZE = 100;

/** One step of the history: the variant, how it was and how it became. */
interface Operation {
    key: string;
    before: Draft | null;
    after: Draft | null;
}

/** A step of the history that can hold several variants, so one undo takes them all back. */
type Step = Operation | {ops: Operation[]};

/** What a flush wrote. */
export interface FlushResult {
    written: number;
    stylesheeturl: string | null;
}

/** A variant of an icon. */
export interface Variant {
    key: string;
    where: Where;
    base: boolean;
}

/** The state of one designer session. */
export interface DesignerState {
    load(): Promise<void>;
    reloadRules(): Promise<void>;
    icons(): Icon[];
    icon(key: string | null): Icon | null;
    everywhereKey(slotkey: string, mode?: string): string;
    keyFor(slotkey: string, where: Where): string;
    slotOf(key: string): string;
    whereOfKey(key: string): Where;
    draftOf(key: string): Draft;
    savedDraft(key: string): Draft | null;
    isSaved(key: string): boolean;
    isPending(key: string): boolean;
    variants(slotkey: string): Variant[];
    modifiedKeys(): Set<string>;
    traits(): Map<string, Set<string>>;
    stage(key: string, patch: Patch): boolean;
    stageMany(entries: Array<{key: string; patch: Patch}>): number;
    addVariant(slotkey: string, where: Where): string;
    remove(key: string): void;
    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
    pendingCount(): number;
    pendingSlots(): Set<string>;
    flush(): Promise<FlushResult>;
}

/**
 * Create the state of one designer session.
 *
 * @param everywhere The place that means every page of the site in every colour mode.
 * @param modes The colour modes every icon has a look for, or all when the site has no colour modes.
 * @returns State API.
 */
export const createState = (everywhere: Where, modes: string[] = ['all']): DesignerState => {
    let icons: Icon[] = [];
    let index = new Map<string, Icon>();
    let saved = new Map<string, Rule>();
    let pending: Record<string, Draft | null> = {};
    let inflight: Record<string, Draft | null> = {};
    let added: Record<string, Where> = {};
    let undoOps: Step[] = [];
    let redoOps: Step[] = [];
    let lastTime = 0;
    let chain: Promise<FlushResult> = Promise.resolve({written: 0, stylesheeturl: null});

    const has = (object: object, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key);

    const slotOf = (key: string): string => key.split('#')[0];

    const whereOfKey = (key: string): Where => {
        const rule = saved.get(key);
        if (rule) {
            return whereOf(fromRule(rule));
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
     * @param key Rule key.
     * @returns Draft, or null when there is no rule.
     */
    const current = (key: string): Draft | null => {
        if (has(pending, key)) {
            return pending[key];
        }
        if (has(inflight, key)) {
            return inflight[key];
        }
        const rule = saved.get(key);
        return rule ? fromRule(rule) : null;
    };

    /**
     * The rule a change to a variant is compared with: what is being written, or else what is stored.
     *
     * @param key Rule key.
     * @returns Draft, or null when there is no rule.
     */
    const baseline = (key: string): Draft | null => {
        if (has(inflight, key)) {
            return inflight[key];
        }
        const rule = saved.get(key);
        return rule ? fromRule(rule) : null;
    };

    /**
     * Whether a variant has been removed and the removal is pending or in flight.
     *
     * @param key Rule key.
     * @returns True when it is removed.
     */
    const isRemoved = (key: string): boolean => {
        if (has(pending, key)) {
            return pending[key] === null;
        }
        return has(inflight, key) && inflight[key] === null;
    };

    const draftOf = (key: string): Draft => current(key) || emptyDraft(slotOf(key), whereOfKey(key));

    /**
     * Make a variant look like a draft, or have no rule, by changing what is pending.
     *
     * @param key Rule key.
     * @param draft Draft, or null for no rule.
     */
    const setState = (key: string, draft: Draft | null): void => {
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

    const record = (key: string, before: Draft | null, after: Draft | null): void => {
        const now = Date.now();
        const last = undoOps[undoOps.length - 1];
        if (last && 'key' in last && last.key === key && now - lastTime < COALESCE_MS) {
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

    const ingest = (rules: Rule[]): void => {
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
     * @param keys Rule keys of the batch.
     * @returns The address of the stylesheet the site has now.
     */
    const send = async(keys: string[]): Promise<string> => {
        const rules: ReturnType<typeof toInput>[] = [];
        const ruleKeys: string[] = [];
        const deleteids: number[] = [];
        const removedKeys: string[] = [];
        const drafts: Record<string, Draft | null> = {};
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
                rules.push(toInput({...draft, rev: rule ? rule.rev : 0}, (index.get(slotOf(key)) as Icon).kind));
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
    };

    const write = async(): Promise<FlushResult> => {
        const keys = Object.keys(pending);
        let stylesheeturl: string | null = null;
        for (let start = 0; start < keys.length; start += BATCH_SIZE) {
            stylesheeturl = await send(keys.slice(start, start + BATCH_SIZE));
        }
        return {written: keys.length, stylesheeturl};
    };

    const changeOf = (key: string, patch: Patch): Operation | null => {
        const before = current(key);
        const after: Draft = {...(before || emptyDraft(slotOf(key), whereOfKey(key))), ...patch} as Draft;
        const next = isEmpty(after) ? null : after;
        const unchanged = before === null ? next === null : next !== null && sameDraft(before, next);
        return unchanged ? null : {key, before, after: next};
    };

    const stepsOf = (step: Step): Operation[] => ('ops' in step ? step.ops : [step]);

    return {
        load: async() => {
            const [catalogue, rules] = await Promise.all([api.getCatalogue(), api.getRules()]);
            icons = catalogue.icons;
            index = new Map(icons.map((icon) => [icon.key, icon]));
            ingest(rules.rules);
        },
        reloadRules: async() => {
            ingest((await api.getRules()).rules);
        },
        icons: () => icons,
        icon: (key) => (key === null ? null : index.get(key) || null),
        everywhereKey: (slotkey, mode = 'all') => ruleKey(slotkey, {...everywhere, mode}),
        keyFor: (slotkey, where) => ruleKey(slotkey, where),
        slotOf,
        whereOfKey,
        draftOf,
        savedDraft: (key) => {
            const rule = saved.get(key);
            return rule ? fromRule(rule) : null;
        },
        isSaved: (key) => saved.has(key),
        isPending: (key) => has(pending, key) || has(inflight, key),
        variants: (slotkey) => {
            const bases = modes.map((mode) => ruleKey(slotkey, {...everywhere, mode}));
            const keys = new Set(bases);
            const wanted = (key: string): boolean => slotOf(key) === slotkey && !isRemoved(key);
            [...saved.keys(), ...Object.keys(added), ...Object.keys(pending), ...Object.keys(inflight)]
                .filter(wanted).forEach((key) => keys.add(key));
            const rest = [...keys].filter((key) => !bases.includes(key)).sort();
            return [...bases, ...rest].map((key) => ({key, where: whereOfKey(key), base: bases.includes(key)}));
        },
        modifiedKeys: () => {
            const keys = new Set<string>();
            [...saved.keys(), ...Object.keys(pending), ...Object.keys(inflight)].forEach((key) => {
                const draft = current(key);
                if (draft !== null && !isEmpty(draft)) {
                    keys.add(slotOf(key));
                }
            });
            return keys;
        },
        traits: () => {
            const map = new Map<string, Set<string>>();
            [...saved.keys(), ...Object.keys(pending), ...Object.keys(inflight)].forEach((key) => {
                const draft = current(key);
                if (draft === null || isEmpty(draft)) {
                    return;
                }
                const set = map.get(slotOf(key)) || new Set<string>();
                traitsOf(draft).forEach((trait) => set.add(trait));
                map.set(slotOf(key), set);
            });
            return map;
        },
        stage: (key, patch) => {
            const operation = changeOf(key, patch);
            if (operation === null) {
                return false;
            }
            setState(key, operation.after);
            record(key, operation.before, operation.after);
            return true;
        },
        stageMany: (entries) => {
            const ops: Operation[] = [];
            entries.forEach(({key, patch}) => {
                const operation = changeOf(key, patch);
                if (operation !== null) {
                    setState(key, operation.after);
                    ops.push(operation);
                }
            });
            if (ops.length > 0) {
                undoOps.push({ops});
                if (undoOps.length > MAX_HISTORY) {
                    undoOps.shift();
                }
                redoOps = [];
            }
            return ops.length;
        },
        addVariant: (slotkey, where) => {
            const key = ruleKey(slotkey, where);
            if (has(pending, key) && pending[key] === null) {
                delete pending[key];
            } else if (isRemoved(key) || (!saved.has(key) && key !== ruleKey(slotkey, {...everywhere, mode: where.mode}))) {
                added[key] = where;
            }
            return key;
        },
        remove: (key) => {
            const before = current(key);
            delete added[key];
            setState(key, null);
            record(key, before, null);
        },
        undo: () => {
            const step = undoOps.pop();
            if (step) {
                stepsOf(step).forEach((each) => setState(each.key, each.before));
                redoOps.push(step);
            }
        },
        redo: () => {
            const step = redoOps.pop();
            if (step) {
                stepsOf(step).forEach((each) => setState(each.key, each.after));
                undoOps.push(step);
            }
        },
        canUndo: () => undoOps.length > 0,
        canRedo: () => redoOps.length > 0,
        pendingCount: () => Object.keys(pending).length,
        pendingSlots: () => new Set([...Object.keys(pending), ...Object.keys(inflight)].map(slotOf)),
        flush: () => {
            chain = chain.catch(() => ({written: 0, stylesheeturl: null})).then(write);
            return chain;
        },
    };
};
