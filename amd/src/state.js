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
 * @module     local_iconrestyle/state
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import * as repository from 'local_iconrestyle/repository';
import {createHistory} from 'local_iconrestyle/lib/history';
import {emptyDraft, fromRule, isEmpty, sameDraft, toInput} from 'local_iconrestyle/lib/draft';

const COALESCE_MS = 700;

/**
 * Create the state of one designer session.
 *
 * Changes are staged: nothing reaches the server until save() is called, and every staged change can be undone.
 *
 * @param {number} contextid Context being edited.
 * @returns {object} State API.
 */
export const createState = (contextid) => {
    let icons = [];
    let index = new Map();
    let saved = new Map();
    let staged = {};
    let contextname = '';
    const history = createHistory('{}');
    let lastKey = '';
    let lastTime = 0;

    const snapshot = () => JSON.stringify(staged);

    const effective = (key) => {
        if (Object.prototype.hasOwnProperty.call(staged, key)) {
            return staged[key];
        }
        const rule = saved.get(key);
        return rule ? fromRule(rule) : null;
    };

    const ownSaved = (key) => {
        const rule = saved.get(key);
        return rule && rule.own ? rule : null;
    };

    return {
        /**
         * Load the catalogue and the rules of the context.
         *
         * @returns {Promise<void>} Resolves when both are loaded.
         */
        load: async() => {
            const [catalogue, rules] = await Promise.all([repository.getCatalogue(contextid), repository.getRules(contextid)]);
            icons = catalogue.icons;
            index = new Map(icons.map((icon) => [icon.key, icon]));
            saved = new Map(rules.rules.map((rule) => [rule.slotkey, rule]));
            contextname = rules.contextname;
            staged = {};
            history.reset(snapshot());
        },
        /**
         * Reload the rules after a save.
         *
         * @returns {Promise<void>} Resolves when the rules are reloaded.
         */
        reloadRules: async() => {
            const rules = await repository.getRules(contextid);
            saved = new Map(rules.rules.map((rule) => [rule.slotkey, rule]));
            staged = {};
            history.reset(snapshot());
        },
        icons: () => icons,
        icon: (key) => index.get(key) || null,
        contextname: () => contextname,
        effective,
        /**
         * The draft that applies today, ignoring anything staged.
         *
         * @param {string} key Slot key.
         * @returns {object|null} Draft, or null when no rule applies.
         */
        effectiveSaved: (key) => (saved.has(key) ? fromRule(saved.get(key)) : null),
        /**
         * The saved rule of an icon, which may come from a parent context.
         *
         * @param {string} key Slot key.
         * @returns {object|null} Saved rule.
         */
        savedRule: (key) => saved.get(key) || null,
        ownSaved,
        /**
         * Keys of icons that have a rule that applies here, saved or staged.
         *
         * @returns {Set<string>} Keys.
         */
        modifiedKeys: () => {
            const keys = new Set(saved.keys());
            for (const key of Object.keys(staged)) {
                if (staged[key] === null && !saved.has(key)) {
                    continue;
                }
                if (staged[key] === null) {
                    keys.delete(key);
                } else {
                    keys.add(key);
                }
            }
            return keys;
        },
        /**
         * Stage a change to one icon.
         *
         * Changes to the same icon in quick succession, such as dragging a slider, share one undo step.
         *
         * @param {string} key Slot key.
         * @param {object} patch Fields to change.
         */
        stage: (key, patch) => {
            const base = effective(key) || emptyDraft(key);
            const own = ownSaved(key);
            const draft = {...base, ...patch, slotkey: key, rev: own ? own.rev : 0};
            const original = own ? fromRule(own) : emptyDraft(key);
            if (sameDraft(draft, original) || (isEmpty(draft) && !own)) {
                delete staged[key];
            } else {
                staged[key] = draft;
            }
            const now = Date.now();
            if (key === lastKey && now - lastTime < COALESCE_MS && history.canUndo()) {
                history.undo();
            }
            history.push(snapshot());
            lastKey = key;
            lastTime = now;
        },
        /**
         * Remove the rule of this context for an icon, so it inherits again.
         *
         * @param {string} key Slot key.
         */
        reset: (key) => {
            if (ownSaved(key)) {
                staged[key] = null;
            } else {
                delete staged[key];
            }
            history.push(snapshot());
            lastKey = '';
        },
        undo: () => {
            staged = JSON.parse(history.undo());
            lastKey = '';
        },
        redo: () => {
            staged = JSON.parse(history.redo());
            lastKey = '';
        },
        discard: () => {
            staged = {};
            history.push(snapshot());
            lastKey = '';
        },
        canUndo: () => history.canUndo(),
        canRedo: () => history.canRedo(),
        stagedCount: () => Object.keys(staged).length,
        isStaged: (key) => Object.prototype.hasOwnProperty.call(staged, key),
        /**
         * Write every staged change to the server.
         *
         * @returns {Promise<number>} How many changes were saved.
         */
        save: async() => {
            const keys = Object.keys(staged);
            for (const key of keys) {
                const draft = staged[key];
                if (draft === null || isEmpty(draft)) {
                    await repository.deleteRule(contextid, key);
                } else {
                    await repository.saveRule(contextid, toInput(draft, index.get(key).kind));
                }
            }
            return keys.length;
        },
    };
};
