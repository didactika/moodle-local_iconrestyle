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
 * The only place that names the markup the designer script depends on.
 *
 * @module     local_iconrestyle/selectors
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
/**
 * Selector of a named region.
 *
 * @param {string} name Region name.
 * @returns {string} CSS selector.
 */
const region = (name) => `[data-region="${name}"]`;

/**
 * Selector of a named action.
 *
 * @param {string} name Action name.
 * @returns {string} CSS selector.
 */
const action = (name) => `[data-action="${name}"]`;

export default {
    root: region('designer'),
    search: region('search'),
    kind: region('kind'),
    state: region('state'),
    count: region('count'),
    grid: region('grid'),
    gridSpacer: region('grid-spacer'),
    gridWindow: region('grid-window'),
    empty: region('empty'),
    loading: region('loading'),
    placeholder: region('placeholder'),
    inspector: region('inspector'),
    title: region('title'),
    origin: region('origin'),
    sharedNotice: region('shared-notice'),
    upload: region('upload'),
    artworkName: region('artwork-name'),
    artworkHint: region('artwork-hint'),
    shape: region('shape'),
    padding: region('padding'),
    paddingValue: region('padding-value'),
    opacity: region('opacity'),
    opacityValue: region('opacity-value'),
    preview: region('preview'),
    previewSurface: region('preview-surface'),
    contrast: region('contrast'),
    staged: region('staged'),
    colour: (name) => ({
        picker: region(`${name}-picker`),
        hex: region(`${name}-hex`),
        token: region(`${name}-token`),
        hint: region(`${name}-hint`),
        clear: action(`clear-${name}`),
    }),
    previewCells: (area) => region(`cells-${area}`),
    action,
    card: '[data-action="select"]',
};
