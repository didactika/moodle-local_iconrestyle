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
 * Web service that compiles a look that is not saved yet.
 *
 * @module     local_iconrestyle/preview/services
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {call} from 'local_iconrestyle/common/ajax';

/**
 * Compile rules that are not saved yet.
 *
 * @param {Array} rules Rule inputs.
 * @param {string} scope Preview area, current or new.
 * @returns {Promise<string>} CSS scoped to the area.
 */
export const previewCss = (rules, scope) => call('local_iconrestyle_preview_css', {rules, scope});
