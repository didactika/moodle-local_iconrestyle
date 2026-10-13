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
 * Names of the web service classes on every supported Moodle version.
 *
 * Moodle 4.0 declares them globally, from 4.2 they live in core_external and the global names were removed in
 * 5.3. This file gives them one name inside the plugin: api, parameters, structure, listof and value.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\external;

defined('MOODLE_INTERNAL') || die();

if (!class_exists(__NAMESPACE__ . '\api', false)) {
    $prefix = class_exists('core_external\external_api') ? 'core_external\\' : '';
    if ($prefix === '') {
        global $CFG;
        require_once($CFG->libdir . '/externallib.php');
    }
    $names = [
        'api' => 'external_api',
        'parameters' => 'external_function_parameters',
        'structure' => 'external_single_structure',
        'listof' => 'external_multiple_structure',
        'value' => 'external_value',
    ];
    foreach ($names as $alias => $name) {
        class_alias($prefix . $name, __NAMESPACE__ . '\\' . $alias);
    }
}
