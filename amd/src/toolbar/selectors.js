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
 * The markup of the toolbar that the script depends on.
 *
 * @module     local_iconrestyle/toolbar/selectors
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {action, region} from 'local_iconrestyle/common/selectors';

export default {
    search: region('search'),
    count: region('count'),
    empty: region('empty'),
    loading: region('loading'),
    status: region('status'),
    statusText: region('status-text'),
    menu: '.irs-menu',
    menuList: '.irs-menu-list',
    undo: action('undo'),
    redo: action('redo'),
    menuToggle: action('menu-toggle'),
    button: 'button[data-action]',
};
