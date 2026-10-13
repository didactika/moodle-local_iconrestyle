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
 * The markup of the places tab and of the modal that adds places, which the script depends on.
 *
 * @module     local_iconrestyle/places/selectors
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {region} from 'local_iconrestyle/common/selectors';

export default {
    variants: region('variants'),
    count: region('places-count'),
    addPlaces: 'button[data-action="add-places"]',
    copyMode: 'button[data-action="copy-mode"]',
    copyModeLabel: region('copy-mode-label'),
    pickVariant: 'button[data-action="pick-variant"]',
    removeChip: 'button[data-action="remove-chip"]',
    form: region('places-form'),
    error: region('places-error'),
    copy: region('places-copy'),
    kindRadios: 'input[name="irs-kind"]',
    kindChosen: 'input[name="irs-kind"]:checked',
    modeChosen: 'input[name="irs-mode"]:checked',
    kindField: '[data-kind-field]',
    pageBoxes: 'input[data-region="where-page"]',
    regionBoxes: 'input[data-region="where-region"]',
    placesSelect: (kind) => `#irs-places-${kind}`,
};
