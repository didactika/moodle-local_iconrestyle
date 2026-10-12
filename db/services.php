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
        'description' => 'List every icon rule of the site and where each one applies.',
        'type' => 'read',
        'ajax' => true,
    ],
    'local_iconrestyle_save_rules' => [
        'classname' => 'local_iconrestyle\external\save_rules',
        'methodname' => 'execute',
        'description' => 'Create, change and delete several icon rules in one step.',
        'type' => 'write',
        'ajax' => true,
    ],
    'local_iconrestyle_use_icon_artwork' => [
        'classname' => 'local_iconrestyle\external\use_icon_artwork',
        'methodname' => 'execute',
        'description' => 'Use the file of an icon that Moodle ships as artwork, so the icon can be recoloured.',
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
    'local_iconrestyle_get_stylesheet_url' => [
        'classname' => 'local_iconrestyle\external\get_stylesheet_url',
        'methodname' => 'execute',
        'description' => 'Get the address of the stylesheet that the pages of the site load.',
        'type' => 'read',
        'ajax' => true,
    ],
    'local_iconrestyle_export_rules' => [
        'classname' => 'local_iconrestyle\external\export_rules',
        'methodname' => 'execute',
        'description' => 'Export every icon rule of the site as a package that other sites can import.',
        'type' => 'read',
        'capabilities' => 'local/iconrestyle:exchange',
        'ajax' => true,
    ],
    'local_iconrestyle_import_rules' => [
        'classname' => 'local_iconrestyle\external\import_rules',
        'methodname' => 'execute',
        'description' => 'Import icon rules from a package, or say what importing it would do.',
        'type' => 'write',
        'capabilities' => 'local/iconrestyle:exchange',
        'ajax' => true,
    ],
    'local_iconrestyle_search_locations' => [
        'classname' => 'local_iconrestyle\external\search_locations',
        'methodname' => 'execute',
        'description' => 'Find the categories, courses and activities an icon rule can be limited to.',
        'type' => 'read',
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
