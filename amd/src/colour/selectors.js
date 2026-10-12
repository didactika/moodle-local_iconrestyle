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
 * The markup of the colour fields that the script depends on.
 *
 * @module     local_iconrestyle/colour/selectors
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {action, region} from 'local_iconrestyle/common/selectors';

export default {
    field: (name) => `[data-colour="${name}"]`,
    label: (name) => `[data-colour="${name}"] .irs-label`,
    picker: (name) => region(`${name}-picker`),
    hex: (name) => region(`${name}-hex`),
    hint: (name) => region(`${name}-hint`),
    clear: (name) => action(`clear-${name}`),
    contrast: region('contrast'),
};
