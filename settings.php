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
 * Administration settings for local_iconrestyle.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig || has_capability('local/iconrestyle:manage', context_system::instance())) {
    $ADMIN->add('appearance', new admin_externalpage(
        'local_iconrestyle_designer',
        get_string('designer', 'local_iconrestyle'),
        new moodle_url('/local/iconrestyle/designer.php'),
        'local/iconrestyle:manage'
    ));
}

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_iconrestyle', get_string('pluginname', 'local_iconrestyle'));
    $ADMIN->add('appearance', $settings);

    if ($ADMIN->fulltree) {
        $settings->add(new admin_setting_configcheckbox(
            'local_iconrestyle/enabled',
            get_string('enabled', 'local_iconrestyle'),
            get_string('enabled_desc', 'local_iconrestyle'),
            1
        ));
        $settings->add(new admin_setting_configtext(
            'local_iconrestyle/maxrulespercontext',
            get_string('maxrulespercontext', 'local_iconrestyle'),
            get_string('maxrulespercontext_desc', 'local_iconrestyle'),
            500,
            PARAM_INT
        ));
    }
}
