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
 * What is saved, what is staged and how to move between them.
 *
 * Every icon can have several variants, one for each place where it applies. A variant is identified by its rule key,
 * made of the icon and the place.
 *
 * @module     local_iconrestyle/state
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import * as repository from 'local_iconrestyle/repository';
import {createHistory} from 'local_iconrestyle/lib/history';
import {emptyDraft, fromRule, isEmpty, ruleKey, sameDraft, toInput, whereOf} from 'local_iconrestyle/lib/draft';

const COALESCE_MS = 700;

/**
 * Create the state of one designer session.
 *
 * Changes are staged: nothing reaches the server until save() is called, and every staged change can be undone.
 *
 * @param {{contextid: number, contextname: string, contextkind: string, pages: string[], regions: string[]}} everywhere
 *     The place that means every page of the site.
 * @returns {object} State API.
 */
export const createState = (everywhere) => {
    let icons = [];
    let index = new Map();
    let saved = new Map();
    let staged = {};
    let added = {};
    const history = createHistory('{}');
    let lastKey = '';
    let lastTime = 0;

    const snapshot = () => JSON.stringify({staged, added});

    const restore = (text) => {
        const parsed = JSON.parse(text);
        staged = parsed.staged || {};
        added = parsed.added || {};
    };

    const slotOf = (key) => key.split('#')[0];

    const whereOfKey = (key) => {
        if (saved.has(key)) {
            return whereOf(fromRule(saved.get(key)));
        }
        if (added[key]) {
            return added[key];
        }
        return everywhere;
    };

    const draftOf = (key) => {
        if (Object.prototype.hasOwnProperty.call(staged, key) && staged[key] !== null) {
            return staged[key];
        }
        const rule = saved.get(key);
        return rule ? fromRule(rule) : emptyDraft(slotOf(key), whereOfKey(key));
    };

    const ingest = (rules) => {
        saved = new Map(rules.map((rule) => [ruleKey(rule.slotkey, whereOf(rule)), rule]));
        staged = {};
        added = {};
        history.reset(snapshot());
    };

    const remember = (key) => {
        const now = Date.now();
        if (key === lastKey && now - lastTime < COALESCE_MS && history.canUndo()) {
            history.undo();
        }
        history.push(snapshot());
        lastKey = key;
        lastTime = now;
    };

    return {
        /**
         * Load the catalogue and every rule of the site.
         *
         * @returns {Promise<void>} Resolves when both are loaded.
         */
        load: async() => {
            const [catalogue, rules] = await Promise.all([repository.getCatalogue(), repository.getRules()]);
            icons = catalogue.icons;
            index = new Map(icons.map((icon) => [icon.key, icon]));
            ingest(rules.rules);
        },
        /**
         * Reload the rules after a save.
         *
         * @returns {Promise<void>} Resolves when the rules are reloaded.
         */
        reloadRules: async() => {
            ingest((await repository.getRules()).rules);
        },
        icons: () => icons,
        icon: (key) => index.get(key) || null,
        everywhereKey: (slotkey) => ruleKey(slotkey, everywhere),
        slotOf,
        whereOfKey,
        draftOf,
        /**
         * The draft that applies today, ignoring anything staged.
         *
         * @param {string} key Rule key.
         * @returns {object|null} Draft, or null when no rule is saved.
         */
        savedDraft: (key) => (saved.has(key) ? fromRule(saved.get(key)) : null),
        isSaved: (key) => saved.has(key),
        isStaged: (key) => Object.prototype.hasOwnProperty.call(staged, key),
        /**
         * The variants of an icon: the one for every page first, then the others in a stable order.
         *
         * @param {string} slotkey Slot key.
         * @returns {Array<{key: string, where: object}>} Variants.
         */
        variants: (slotkey) => {
            const everywhereKey = ruleKey(slotkey, everywhere);
            const keys = new Set([everywhereKey]);
            const wanted = (key) => slotOf(key) === slotkey && staged[key] !== null;
            [...saved.keys(), ...Object.keys(added), ...Object.keys(staged)].filter(wanted).forEach((key) => keys.add(key));
            const rest = [...keys].filter((key) => key !== everywhereKey).sort();
            return [everywhereKey, ...rest].map((key) => ({key, where: whereOfKey(key)}));
        },
        /**
         * Slot keys of icons that have a variant, saved or staged with content.
         *
         * @returns {Set<string>} Keys.
         */
        modifiedKeys: () => {
            const keys = new Set();
            saved.forEach((rule, key) => {
                if (staged[key] !== null) {
                    keys.add(rule.slotkey);
                }
            });
            Object.keys(staged).forEach((key) => {
                if (staged[key] !== null && !isEmpty(staged[key])) {
                    keys.add(slotOf(key));
                }
            });
            return keys;
        },
        /**
         * Stage a change to one variant.
         *
         * Changes to the same variant in quick succession, such as dragging a slider, share one undo step.
         *
         * @param {string} key Rule key.
         * @param {object} patch Fields to change.
         */
        stage: (key, patch) => {
            const own = saved.get(key) || null;
            const draft = {...draftOf(key), ...patch, rev: own ? own.rev : 0, id: own ? own.id : 0};
            const original = own ? fromRule(own) : emptyDraft(slotOf(key), whereOfKey(key));
            if (sameDraft(draft, original)) {
                delete staged[key];
            } else {
                staged[key] = draft;
            }
            remember(key);
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
            if (staged[key] === null) {
                delete staged[key];
            } else if (!saved.has(key) && key !== ruleKey(slotkey, everywhere)) {
                added[key] = where;
            }
            history.push(snapshot());
            lastKey = '';
            return key;
        },
        /**
         * Remove a variant, so the icon looks as the less specific variants say.
         *
         * @param {string} key Rule key.
         */
        remove: (key) => {
            delete added[key];
            if (saved.has(key)) {
                staged[key] = null;
            } else {
                delete staged[key];
            }
            history.push(snapshot());
            lastKey = '';
        },
        undo: () => {
            restore(history.undo());
            lastKey = '';
        },
        redo: () => {
            restore(history.redo());
            lastKey = '';
        },
        discard: () => {
            staged = {};
            added = {};
            history.push(snapshot());
            lastKey = '';
        },
        canUndo: () => history.canUndo(),
        canRedo: () => history.canRedo(),
        stagedCount: () => Object.keys(staged).length,
        /**
         * Write every staged change to the server.
         *
         * @returns {Promise<number>} How many changes were saved.
         */
        save: async() => {
            const keys = Object.keys(staged);
            for (const key of keys) {
                const draft = staged[key];
                const own = saved.get(key);
                if (draft === null || isEmpty(draft)) {
                    if (own) {
                        await repository.deleteRule(own.id);
                    }
                } else {
                    await repository.saveRule(toInput(draft, index.get(slotOf(key)).kind));
                }
            }
            return keys.length;
        },
    };
};
