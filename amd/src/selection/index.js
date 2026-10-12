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
 * Choosing icons in the grid itself, to export them or to copy the look of the open icon to them.
 *
 * While a choice is going on, a click on a card chooses it instead of opening it, a click with Shift chooses everything between
 * it and the last card chosen, and a bar floats over the grid with what can be done with the choice. Nothing is changed until
 * the person applies, and leaving the choice, with Esc or the cross, changes nothing.
 *
 * @module     local_iconrestyle/selection/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/selection/selectors';
import {bindSelectionListeners} from 'local_iconrestyle/selection/listeners';

const EXPORT = 'export';
const COPY = 'copy';
const MODES = 'modes';

/**
 * Create the selection.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} options text(name, value), defaults (the groups of a look that are copied at first, copyoverwrite and the
 *     rest of what the site chose in the settings), modeLabels (the colour modes of the site by name, none when it has none),
 *     currentMode(), onCopyModes(keys, from, to, overwrite), items() that lists the icons shown,
 *     isPickable(mode, key, source), onChange(),
 *     which is called when the choice or the mode changes, onStart(mode), which is called when a choice begins, onExport(keys),
 *     onCopy(keys, groups) and source(), which gives the key of the open icon. onExport and onCopy return a promise that
 *     resolves with true when the choice has been used and is done with.
 * @returns {{active: Function, mode: Function, isPicked: Function, isPickable: Function, toggle: Function, source: Function,
 *     start: Function, stop: Function}} Selection API.
 */
export const createSelection = (root, options) => {
    const {text, defaults, modeLabels, currentMode, items, isPickable, onChange, onStart, onExport, onCopy, onCopyModes, source} =
        options;
    const modeNames = Object.keys(modeLabels);
    const bar = root.querySelector(selectors.bar);
    let mode = null;
    let from = null;
    let last = null;
    let busy = false;
    const picked = new Set();

    const available = () => items().filter((icon) => isPickable(mode, icon.key, from));

    const showBar = () => {
        if (mode === null) {
            return;
        }
        const titles = {[COPY]: text('selectcopytitle', from), [MODES]: text('selectmodestitle')};
        bar.querySelector(selectors.title).textContent = titles[mode] || text('selectexporttitle');
        bar.querySelector(selectors.count).textContent = text('selectcount', picked.size);
        bar.querySelector(selectors.applyText).textContent = mode === EXPORT ? text('selectexport') : text('selectcopy');
        const apply = bar.querySelector(selectors.apply);
        const groups = bar.querySelectorAll(selectors.groupsChosen).length;
        const same = bar.querySelector(selectors.from).value === bar.querySelector(selectors.to).value;
        apply.disabled = busy || picked.size === 0 || (mode === COPY && groups === 0) || (mode === MODES && same);
        bar.querySelectorAll(selectors.parts).forEach((part) => {
            part.hidden = !part.dataset.for.split(' ').includes(mode);
        });
        const switcher = bar.querySelector(selectors.modes);
        switcher.hidden = switcher.hidden || modeNames.length < 2;
        switcher.disabled = picked.size === 0;
        window.requestAnimationFrame(() => root.style.setProperty('--irs-selbar', `${bar.offsetHeight}px`));
    };

    const markStart = () => {
        root.querySelectorAll(selectors.start).forEach((button) => {
            button.setAttribute('aria-pressed', mode === EXPORT || mode === MODES ? 'true' : 'false');
        });
    };

    const stop = () => {
        if (mode === null) {
            return;
        }
        mode = null;
        from = null;
        last = null;
        picked.clear();
        bar.hidden = true;
        root.classList.remove('irs-picking');
        markStart();
        onChange();
    };

    const applyDefaults = () => {
        bar.querySelectorAll(selectors.group).forEach((box) => {
            box.checked = defaults.copygroups.includes(box.value);
        });
        bar.querySelector(selectors.overwrite).checked = defaults.copyoverwrite;
    };

    const start = (kind) => {
        if (kind === COPY && source() === null) {
            return;
        }
        if (mode === null) {
            applyDefaults();
        }
        const wasActive = mode !== null;
        mode = kind;
        from = kind === COPY ? source() : null;
        last = null;
        picked.clear();
        bar.hidden = false;
        root.classList.add('irs-picking');
        markStart();
        if (!wasActive) {
            onStart(kind);
        }
        showBar();
        onChange();
    };

    const apply = async() => {
        if (busy || picked.size === 0) {
            return;
        }
        busy = true;
        showBar();
        const keys = [...picked];
        const groups = Array.from(bar.querySelectorAll(selectors.groupsChosen)).map((box) => box.value);
        const run = {
            [COPY]: () => onCopy(keys, groups),
            [MODES]: () => onCopyModes(
                keys,
                bar.querySelector(selectors.from).value,
                bar.querySelector(selectors.to).value,
                bar.querySelector(selectors.overwrite).checked
            ),
            [EXPORT]: () => onExport(keys),
        };
        const finished = await run[mode]();
        busy = false;
        if (finished) {
            stop();
        } else {
            showBar();
        }
    };

    const fillModes = () => {
        const from = bar.querySelector(selectors.from);
        const to = bar.querySelector(selectors.to);
        [from, to].forEach((select) => {
            select.replaceChildren(...modeNames.map((name) => new window.Option(modeLabels[name], name)));
        });
        const now = currentMode();
        from.value = modeNames.includes(now) ? now : modeNames[0];
        to.value = modeNames.find((name) => name !== from.value) || modeNames[0];
    };
    if (modeNames.length > 1) {
        fillModes();
    }

    bindSelectionListeners(root, {
        onStart: (kind) => (mode === kind ? stop() : start(kind)),
        onAll: () => {
            available().forEach((icon) => picked.add(icon.key));
            showBar();
            onChange();
        },
        onNone: () => {
            picked.clear();
            showBar();
            onChange();
        },
        onModes: () => {
            mode = MODES;
            showBar();
            onChange();
        },
        onBack: () => {
            mode = EXPORT;
            showBar();
            onChange();
        },
        onApply: apply,
        onCancel: stop,
        onGroups: showBar,
    });

    return {
        active: () => mode !== null,
        mode: () => mode,
        source: () => from,
        isPicked: (key) => picked.has(key),
        isPickable: (key) => mode !== null && isPickable(mode, key, from),
        /**
         * Choose or unchoose an icon, or the run of icons from the last one chosen when Shift is held.
         *
         * @param {string} key Slot key of the icon that was clicked.
         * @param {boolean} range Whether to take everything between the last click and this one.
         */
        toggle: (key, range = false) => {
            if (mode === null || !isPickable(mode, key, from)) {
                return;
            }
            const wanted = !picked.has(key);
            let keys = [key];
            if (range && last !== null) {
                const list = available().map((icon) => icon.key);
                const a = list.indexOf(last);
                const b = list.indexOf(key);
                if (a >= 0 && b >= 0) {
                    keys = list.slice(Math.min(a, b), Math.max(a, b) + 1);
                }
            }
            keys.forEach((one) => picked[wanted ? 'add' : 'delete'](one));
            last = key;
            showBar();
            onChange();
        },
        start,
        stop,
    };
};
