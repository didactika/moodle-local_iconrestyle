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
 * The filters panel: one button with the number of filters that are on, and a panel to choose them.
 *
 * Besides the search of the toolbar, the icons can be narrowed by type, by status, by component, by purpose, by what they
 * customise, by the kind of place of the customisation and by colour mode, and sorted. The panel keeps what was chosen and
 * tells the designer in one object each time it changes. What is on is shown by the number on the button and by the boxes of
 * the panel, so many filters never take room from the icons.
 *
 * @module     local_iconrestyle/filters/index
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import selectors from 'local_iconrestyle/filters/selectors';
import {bindFilterListeners} from 'local_iconrestyle/filters/listeners';
import {follow} from 'local_iconrestyle/lib/follow';
import {showComponents, showPurposes} from 'local_iconrestyle/filters/templates';

const SHOWN = 80;
const GROUPS = ['kinds', 'components', 'purposes', 'traits', 'places', 'modes'];
const STATUS = ['untouched', 'modified', 'shared'];

/**
 * Words with a capital letter.
 *
 * @param {string} value Token.
 * @returns {string} Token with its first letter in capitals.
 */
const capital = (value) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Create the filters.
 *
 * @param {HTMLElement} root Designer root element.
 * @param {object} options text(name, value), modeLabels (names of the colour modes the site has, by mode) and
 *     onChange(filters), which receives components, purposes, traits, places, modes and sort whenever any of them changes.
 * @returns {{populate: Function}} Filters API. populate(icons) lists the components and purposes of the catalogue.
 */
export const createFilters = (root, options) => {
    const {text, modeLabels, onChange} = options;
    const find = (selector) => root.querySelector(selector);
    const chosen = Object.fromEntries(GROUPS.map((group) => [group, new Set()]));
    let sort = 'catalogue';
    let search = '';
    const counts = {components: new Map(), purposes: new Map()};

    const total = () => GROUPS.reduce((sum, group) => sum + chosen[group].size, 0) + (sort === 'catalogue' ? 0 : 1);

    const drawCount = () => {
        const badge = find(selectors.count);
        badge.textContent = total() > 0 ? String(total()) : '';
        badge.hidden = total() === 0;
        find(selectors.toggle).classList.toggle('irs-active', total() > 0);
        find(selectors.clear).disabled = total() === 0;
    };

    const drawComponents = async() => {
        const words = search.toLowerCase().split(/\s+/).filter((word) => word !== '');
        const matches = (name) => words.every((word) => name.toLowerCase().includes(word));
        const found = [...counts.components.keys()].sort().filter(matches);
        await showComponents(find(selectors.components), {
            rows: found.slice(0, SHOWN).map((name) => ({
                name, count: counts.components.get(name), checked: chosen.components.has(name),
            })),
            more: found.length > SHOWN ? text('filtmore', SHOWN) : '',
            none: found.length === 0,
        });
    };

    const syncInputs = () => {
        root.querySelectorAll(selectors.inputs).forEach((input) => {
            input.checked = chosen[input.dataset.filter].has(input.value);
        });
        find(selectors.sort).value = sort;
    };

    const emit = () => {
        drawCount();
        onChange({
            kinds: [...chosen.kinds], components: [...chosen.components], purposes: [...chosen.purposes],
            traits: [...chosen.traits],
            places: [...chosen.places], modes: [...chosen.modes], sort,
        });
    };

    let stopFollowing = () => null;

    const close = () => {
        find(selectors.panel).hidden = true;
        find(selectors.toggle).setAttribute('aria-expanded', 'false');
        stopFollowing();
    };

    const place = () => {
        const panel = find(selectors.panel);
        const rect = find(selectors.toggle).getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
            close();
            return;
        }
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - Math.min(24 * 16, window.innerWidth - 16) - 8));
        panel.style.top = `${rect.bottom + 6}px`;
        panel.style.left = `${left}px`;
        panel.style.maxHeight = `${Math.max(240, window.innerHeight - rect.bottom - 24)}px`;
    };

    const open = () => {
        const panel = find(selectors.panel);
        place();
        panel.hidden = false;
        find(selectors.toggle).setAttribute('aria-expanded', 'true');
        stopFollowing();
        stopFollowing = follow(() => !panel.hidden, place, panel);
    };

    const clearAll = () => {
        GROUPS.forEach((group) => chosen[group].clear());
        sort = 'catalogue';
        syncInputs();
        drawComponents();
        emit();
    };

    bindFilterListeners(root, {
        onToggle: () => (find(selectors.panel).hidden ? open() : close()),
        onClose: close,
        onChoose: (group, value, checked) => {
            chosen[group][checked ? 'add' : 'delete'](value);
            if (group === 'traits' && value === 'untouched' && checked) {
                chosen.traits.forEach((trait) => {
                    if (trait !== 'untouched' && trait !== 'shared') {
                        chosen.traits.delete(trait);
                    }
                });
                chosen.traits.delete('modified');
                syncInputs();
            } else if (group === 'traits' && checked && !STATUS.includes(value) || (value === 'modified' && checked)) {
                chosen.traits.delete('untouched');
                syncInputs();
            }
            emit();
        },
        onSort: (value) => {
            sort = value;
            emit();
        },
        onSearch: (query) => {
            search = query;
            drawComponents();
        },
        onClear: clearAll,
    });

    find(selectors.modeSection).hidden = Object.keys(modeLabels).length === 0;
    drawCount();

    return {
        /**
         * List the components and purposes of the catalogue.
         *
         * @param {Array<{component: string, purpose: string}>} icons Catalogue entries.
         */
        populate: async(icons) => {
            counts.components.clear();
            counts.purposes.clear();
            icons.forEach((icon) => {
                counts.components.set(icon.component, (counts.components.get(icon.component) || 0) + 1);
                if (icon.purpose) {
                    counts.purposes.set(icon.purpose, (counts.purposes.get(icon.purpose) || 0) + 1);
                }
            });
            const purposes = [...counts.purposes.keys()].sort();
            find(selectors.purposeSection).hidden = purposes.length === 0;
            await showPurposes(find(selectors.purposes), {
                rows: purposes.map((value) => ({
                    value, label: capital(value), count: counts.purposes.get(value), checked: chosen.purposes.has(value),
                })),
            });
            await drawComponents();
        },
    };
};
