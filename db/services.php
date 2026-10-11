<?php
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
 * Web service functions of local_iconrestyle.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_iconrestyle_get_catalogue' => [
        'classname' => 'local_iconrestyle\external\get_catalogue',
        'methodname' => 'execute',
        'description' => 'List the icons that can be customised on this site.',
        'type' => 'read',
        'ajax' => true,
    ],
    'local_iconrestyle_get_rules' => [
        'classname' => 'local_iconrestyle\external\get_rules',
        'methodname' => 'execute',
        'description' => 'List the icon rules that apply in a context and where each comes from.',
        'type' => 'read',
        'ajax' => true,
    ],
    'local_iconrestyle_save_rule' => [
        'classname' => 'local_iconrestyle\external\save_rule',
        'methodname' => 'execute',
        'description' => 'Create or change an icon rule in a context.',
        'type' => 'write',
        'ajax' => true,
    ],
    'local_iconrestyle_delete_rule' => [
        'classname' => 'local_iconrestyle\external\delete_rule',
        'methodname' => 'execute',
        'description' => 'Delete an icon rule so the icon inherits again.',
        'type' => 'write',
        'ajax' => true,
    ],
    'local_iconrestyle_add_asset' => [
        'classname' => 'local_iconrestyle\external\add_asset',
        'methodname' => 'execute',
        'description' => 'Sanitise and store uploaded icon artwork.',
        'type' => 'write',
        'ajax' => true,
    ],
    'local_iconrestyle_preview_css' => [
        'classname' => 'local_iconrestyle\external\preview_css',
        'methodname' => 'execute',
        'description' => 'Compile icon rules that are not saved yet, scoped to the preview area.',
        'type' => 'read',
        'ajax' => true,
    ],
];
