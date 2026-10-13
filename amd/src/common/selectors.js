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
 * Builders of the selectors every component uses to find the markup of its templates.
 *
 * @module     local_iconrestyle/common/selectors
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Selector of a named region.
 *
 * @param {string} name Region name.
 * @returns {string} CSS selector.
 */
export const region = (name) => `[data-region="${name}"]`;

/**
 * Selector of a named action.
 *
 * @param {string} name Action name.
 * @returns {string} CSS selector.
 */
export const action = (name) => `[data-action="${name}"]`;
