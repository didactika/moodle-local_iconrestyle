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
 * The icon designer: wires the state, the grid, the inspector and the preview to the page.
 *
 * @module     local_iconrestyle/designer
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Notification from 'core/notification';
import {add as addToast} from 'core/toast';
import selectors from 'local_iconrestyle/selectors';
import * as repository from 'local_iconrestyle/repository';
import {createState} from 'local_iconrestyle/state';
import {createGrid} from 'local_iconrestyle/grid';
import {createPreview} from 'local_iconrestyle/preview';
import {filterIcons} from 'local_iconrestyle/lib/filter';
import {colourNeedsArtwork, emptyDraft} from 'local_iconrestyle/lib/draft';
import {contrastRatio, normalise, parseHex} from 'local_iconrestyle/lib/color';

const MAX_UPLOAD_BASE64 = 360000;
const SURFACES = {light: {r: 255, g: 255, b: 255}, dark: {r: 33, g: 37, b: 41}};

/**
 * Start the designer.
 *
 * @param {{contextid: number, strings: Object<string, string>}} config Settings from the server.
 */
export const init = (config) => {
    const root = document.querySelector(selectors.root);
    if (!root) {
        return;
    }
    const text = (name, n = '') => (config.strings[name] || '').replace('{n}', n);
    const state = createState(config.contextid);
    const preview = createPreview(root, config.contextid);
    const find = (selector) => root.querySelector(selector);
    const filters = {query: '', kind: 'all', state: 'all'};
    let selected = null;
    let surface = 'light';
    let filtered = [];

    const refilter = () => {
        filtered = filterIcons(state.icons(), {...filters, modified: state.modifiedKeys()});
        find(selectors.count).textContent = text('iconcount', filtered.length);
        find(selectors.empty).hidden = filtered.length > 0;
    };

    const grid = createGrid(root, {
        items: () => filtered,
        isSelected: (key) => key === selected,
        isModified: (key) => state.modifiedKeys().has(key),
        onSelect: (key) => select(key),
    });

    const setColour = (name, value) => {
        const parts = selectors.colour(name);
        const picker = find(parts.picker);
        const hex = find(parts.hex);
        const token = find(parts.token);
        const isToken = value.startsWith('token:') || value === 'currentcolor';
        token.value = isToken && token.querySelector(`option[value="${value}"]`) ? value : '';
        if (document.activeElement !== hex) {
            hex.value = isToken ? '' : value;
            hex.removeAttribute('aria-invalid');
        }
        const hint = find(parts.hint);
        hint.hidden = true;
        hint.classList.remove('irs-error');
        const parsed = parseHex(isToken ? '' : value);
        const pair = (channel) => channel.toString(16).padStart(2, '0');
        picker.value = parsed ? `#${pair(parsed.r)}${pair(parsed.g)}${pair(parsed.b)}` : '#000000';
    };

    const showContrast = (draft) => {
        const target = find(selectors.contrast);
        const colour = parseHex(draft && draft.fg);
        if (!colour || colour.a < 255) {
            target.hidden = true;
            return;
        }
        const ratio = contrastRatio(colour, SURFACES[surface]);
        target.hidden = false;
        target.textContent = text(ratio >= 3 ? 'contrastgood' : 'contrastlow', ratio.toFixed(1));
    };

    const refreshInspector = () => {
        const icon = state.icon(selected);
        const inspector = find(selectors.inspector);
        find(selectors.placeholder).hidden = Boolean(icon);
        inspector.hidden = !icon;
        if (!icon) {
            preview.hide();
            return;
        }
        const draft = state.effective(selected) || emptyDraft(selected);
        find(selectors.title).textContent = icon.key;
        let origin = text('origindefault');
        if (state.isStaged(selected)) {
            origin = state.effective(selected) ? text('originhere') : text('originreset');
        } else if (state.savedRule(selected)) {
            const rule = state.savedRule(selected);
            origin = rule.own ? text('originhere') : text('origininherited', rule.contextname);
        }
        find(selectors.origin).textContent = origin;
        const notice = find(selectors.sharedNotice);
        notice.hidden = icon.group < 2;
        notice.textContent = icon.group < 2 ? '' : text('sharedglyph', icon.group);

        setColour('fg', draft.fg);
        setColour('bg', draft.bg);
        find(selectors.shape).value = draft.shape;
        find(selectors.padding).value = Math.max(0, draft.padding);
        find(selectors.paddingValue).textContent = draft.padding > 0 ? `${(draft.padding / 100).toFixed(2)}em` : '';
        find(selectors.opacity).value = draft.opacity < 0 ? 100 : draft.opacity;
        find(selectors.opacityValue).textContent = draft.opacity >= 0 ? `${draft.opacity}%` : '';

        const hasArtwork = draft.assetid > 0;
        find(selectors.action('remove-artwork')).hidden = !hasArtwork;
        const artworkName = hasArtwork ? text('artworkready', draft.assetkind.toUpperCase()) : text('noartwork');
        find(selectors.artworkName).textContent = artworkName;
        const hint = find(selectors.artworkHint);
        hint.hidden = !colourNeedsArtwork(draft, icon.kind);
        hint.classList.toggle('irs-error', !hint.hidden);
        hint.textContent = hint.hidden ? '' : text('needsartwork');

        showContrast(draft);
        const saved = state.savedRule(selected);
        preview.show(icon);
        preview.update(icon, saved ? state.effectiveSaved(selected) : null, state.effective(selected));
    };

    const refreshStaging = () => {
        const count = state.stagedCount();
        find(selectors.staged).textContent = count ? text('stagedchanges', count) : text('nochanges');
        find(selectors.action('undo')).disabled = !state.canUndo();
        find(selectors.action('redo')).disabled = !state.canRedo();
        find(selectors.action('discard')).disabled = count === 0;
        find(selectors.action('save')).disabled = count === 0;
    };

    const refresh = () => {
        refilter();
        refreshInspector();
        refreshStaging();
        grid.render();
    };

    const select = (key) => {
        selected = key;
        refreshInspector();
        grid.render();
    };

    const stage = (patch) => {
        if (!selected) {
            return;
        }
        state.stage(selected, patch);
        refresh();
    };

    const bindColour = (name) => {
        const parts = selectors.colour(name);
        find(parts.picker).addEventListener('input', (event) => stage({[name]: normalise(event.target.value)}));
        const hex = find(parts.hex);
        hex.addEventListener('input', (event) => {
            const value = event.target.value.trim();
            if (value === '') {
                event.target.removeAttribute('aria-invalid');
                stage({[name]: ''});
            } else if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)) {
                event.target.removeAttribute('aria-invalid');
                stage({[name]: normalise(value)});
            } else if (/[^#0-9a-f]/i.test(value) || value.length > 9) {
                event.target.setAttribute('aria-invalid', 'true');
            }
        });
        hex.addEventListener('change', (event) => {
            const value = event.target.value.trim();
            const valid = value === '' ? '' : normalise(value);
            if (valid === null) {
                event.target.setAttribute('aria-invalid', 'true');
            } else {
                event.target.removeAttribute('aria-invalid');
                stage({[name]: valid});
            }
        });
        find(parts.token).addEventListener('change', (event) => stage({[name]: event.target.value}));
        find(parts.clear).addEventListener('click', () => stage({[name]: ''}));
    };

    bindColour('fg');
    bindColour('bg');

    find(selectors.shape).addEventListener('change', (event) => stage({shape: event.target.value}));
    find(selectors.padding).addEventListener('input', (event) => {
        const value = parseInt(event.target.value, 10);
        stage({padding: value > 0 ? value : -1});
    });
    find(selectors.opacity).addEventListener('input', (event) => {
        const value = parseInt(event.target.value, 10);
        stage({opacity: value < 100 ? value : -1});
    });

    find(selectors.upload).addEventListener('change', (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = async() => {
            const content = String(reader.result).split(',')[1] || '';
            const hint = find(selectors.artworkHint);
            if (content.length > MAX_UPLOAD_BASE64) {
                hint.hidden = false;
                hint.classList.add('irs-error');
                hint.textContent = text('uploadfailed', file.name);
                return;
            }
            try {
                const asset = await repository.addAsset(config.contextid, content);
                stage({assetid: asset.id, asseturl: asset.url, assetkind: asset.kind, assetmono: asset.monochrome});
            } catch (error) {
                hint.hidden = false;
                hint.classList.add('irs-error');
                hint.textContent = text('uploadfailed', error.message || file.name);
            }
        };
        reader.readAsDataURL(file);
    });

    root.addEventListener('click', async(event) => {
        const button = event.target.closest('button[data-action]');
        if (!button || button.disabled) {
            return;
        }
        switch (button.dataset.action) {
            case 'remove-artwork':
                stage({assetid: 0, asseturl: '', assetkind: '', assetmono: false});
                break;
            case 'reset-rule':
                state.reset(selected);
                refresh();
                break;
            case 'undo':
                state.undo();
                refresh();
                break;
            case 'redo':
                state.redo();
                refresh();
                break;
            case 'discard':
                state.discard();
                refresh();
                break;
            case 'surface':
                surface = button.dataset.surface;
                preview.setSurface(surface);
                root.querySelectorAll(selectors.action('surface')).forEach((other) => {
                    const active = other === button;
                    other.classList.toggle('active', active);
                    other.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
                showContrast(selected ? state.effective(selected) : null);
                break;
            case 'save':
                await save();
                break;
            default:
                break;
        }
    });

    const save = async() => {
        const button = find(selectors.action('save'));
        button.disabled = true;
        try {
            const count = await state.save();
            await state.reloadRules();
            addToast(text('saved', count), {type: 'success'});
        } catch (error) {
            addToast(text('saveerror', error.message || ''), {type: 'danger', autohide: false, closeButton: true});
            await state.reloadRules();
        }
        refresh();
    };

    find(selectors.search).addEventListener('input', (event) => {
        filters.query = event.target.value;
        refilter();
        grid.render();
    });
    find(selectors.kind).addEventListener('change', (event) => {
        filters.kind = event.target.value;
        refilter();
        grid.render();
    });
    find(selectors.state).addEventListener('change', (event) => {
        filters.state = event.target.value;
        refilter();
        grid.render();
    });

    find(selectors.grid).addEventListener('keydown', (event) => {
        const direction = {ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down'}[event.key];
        if (!direction) {
            return;
        }
        event.preventDefault();
        const next = grid.neighbour(selected, direction);
        if (next) {
            select(next);
            grid.scrollTo(next);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (!(event.ctrlKey || event.metaKey) || event.target.matches('input[type="text"], input[type="search"]')) {
            return;
        }
        const key = event.key.toLowerCase();
        if (key === 'z') {
            event.preventDefault();
            (event.shiftKey ? state.redo : state.undo)();
            refresh();
        } else if (key === 's' && state.stagedCount() > 0) {
            event.preventDefault();
            save();
        }
    });

    state.load().then(() => {
        find(selectors.loading).hidden = true;
        refresh();
        return null;
    }).catch(Notification.exception);
};
