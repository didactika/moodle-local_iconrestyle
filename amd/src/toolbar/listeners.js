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
 * Everything the person does in the toolbar: searching, filtering, undo and redo, the actions menu and the keyboard shortcuts.
 *
 * @module     local_iconrestyle/toolbar/listeners
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/toolbar/selectors';
import {follow} from 'local_iconrestyle/lib/follow';

/**
 * Open the actions menu below its button, or close it.
 *
 * @param {HTMLElement} button The button that opens the menu.
 * @param {Function} closeMenu Function that closes every menu.
 */
const toggleMenu = (button, closeMenu) => {
    const list = button.closest(selectors.menu).querySelector(selectors.menuList);
    const open = list.hidden;
    closeMenu();
    list.hidden = !open;
    if (open) {
        const place = () => {
            const rect = button.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) {
                closeMenu();
                return;
            }
            list.style.top = `${rect.bottom + 4}px`;
            list.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
        };
        place();
        follow(() => !list.hidden, place, list);
    }
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
};

/**
 * Go to the page the person came from, or to the administration page when there is none.
 *
 * @param {HTMLElement} button The back button.
 */
const goBack = (button) => {
    if (window.history.length > 1 && document.referrer !== '') {
        window.history.back();
    } else {
        window.location.href = button.dataset.fallback;
    }
};

/**
 * Bind the toolbar.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} handlers onFilter(patch), onUndo(), onRedo(), onSave() and closeMenu().
 */
export const bindToolbarListeners = (root, handlers) => {
    const {onFilter, onUndo, onRedo, onSave, closeMenu} = handlers;
    const find = (selector) => root.querySelector(selector);

    const mark = (control, active) => control.classList.toggle('irs-active', active);

    find(selectors.search).addEventListener('input', (event) => {
        mark(event.target, event.target.value.trim() !== '');
        onFilter({query: event.target.value});
    });

    root.addEventListener('click', (event) => {
        if (!event.target.closest(selectors.menu)) {
            closeMenu();
        }
        const button = event.target.closest(selectors.button);
        if (!button || button.disabled) {
            return;
        }
        if (button.closest(selectors.menuList)) {
            closeMenu();
        }
        switch (button.dataset.action) {
            case 'undo':
                closeMenu();
                onUndo();
                break;
            case 'redo':
                closeMenu();
                onRedo();
                break;
            case 'menu-toggle':
                toggleMenu(button, closeMenu);
                break;
            case 'history-back':
                goBack(button);
                break;
            default:
                break;
        }
    });

    root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (!(event.ctrlKey || event.metaKey) || event.target.matches('input[type="text"], input[type="search"], textarea')) {
            return;
        }
        const key = event.key.toLowerCase();
        if (key === 'z' && !event.shiftKey) {
            event.preventDefault();
            onUndo();
        } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
            event.preventDefault();
            onRedo();
        } else if (key === 's') {
            event.preventDefault();
            onSave();
        }
    });
};
