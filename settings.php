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

use local_iconrestyle\rule\rule_limits;

$context = context_system::instance();
if ($hassiteconfig || has_capability('local/iconrestyle:manage', $context)) {
    // One section of its own with every page of the plugin: under Local plugins for administrators, who are the only ones
    // that have that category, and at the top of the tree for people who hold only the capability of the plugin.
    $parent = $hassiteconfig ? 'localplugins' : 'root';
    $ADMIN->add($parent, new admin_category('local_iconrestyle_category', get_string('pluginsection', 'local_iconrestyle')));
    $ADMIN->add('local_iconrestyle_category', new admin_externalpage(
        'local_iconrestyle_designer',
        get_string('designer', 'local_iconrestyle'),
        new moodle_url('/local/iconrestyle/designer.php'),
        'local/iconrestyle:manage'
    ));
}

if ($hassiteconfig && $ADMIN->locate('appearance')) {
    // The same designer is also reachable from Appearance, in a section that is not part of Appearance itself.
    $ADMIN->add('appearance', new admin_category('local_iconrestyle_appearance', get_string('pluginsection', 'local_iconrestyle')));
    $ADMIN->add('local_iconrestyle_appearance', new admin_externalpage(
        'local_iconrestyle_designer_appearance',
        get_string('designer', 'local_iconrestyle'),
        new moodle_url('/local/iconrestyle/designer.php'),
        'local/iconrestyle:manage'
    ));
}

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_iconrestyle', get_string('settings', 'local_iconrestyle'));
    $ADMIN->add('local_iconrestyle_category', $settings);

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
            rule_limits::DEFAULT_RULES,
            PARAM_INT
        ));
        $settings->add(new admin_setting_configtext(
            'local_iconrestyle/maxsheetkb',
            get_string('maxsheetkb', 'local_iconrestyle'),
            get_string('maxsheetkb_desc', 'local_iconrestyle'),
            rule_limits::DEFAULT_SHEET_KB,
            PARAM_INT
        ));
        $settings->add(new admin_setting_configtext(
            'local_iconrestyle/maxcontextswithrules',
            get_string('maxcontextswithrules', 'local_iconrestyle'),
            get_string('maxcontextswithrules_desc', 'local_iconrestyle'),
            rule_limits::DEFAULT_CONTEXTS,
            PARAM_INT
        ));
        $settings->add(new admin_setting_heading(
            'local_iconrestyle/defaultsheading',
            get_string('defaultsheading', 'local_iconrestyle'),
            get_string('defaultsheading_desc', 'local_iconrestyle')
        ));
        $settings->add(new admin_setting_configmulticheckbox(
            'local_iconrestyle/copygroups',
            get_string('copygroups', 'local_iconrestyle'),
            get_string('copygroups_desc', 'local_iconrestyle'),
            array_fill_keys(\local_iconrestyle\output\designer_defaults::COPY_GROUPS_DEFAULT, 1),
            array_combine(
                \local_iconrestyle\output\designer_defaults::COPY_GROUPS,
                array_map(function (string $group): string {
                    return get_string('copygroup' . $group, 'local_iconrestyle');
                }, \local_iconrestyle\output\designer_defaults::COPY_GROUPS)
            )
        ));
        $settings->add(new admin_setting_configcheckbox(
            'local_iconrestyle/copyoverwrite',
            get_string('copyoverwrite', 'local_iconrestyle'),
            get_string('copyoverwrite_desc', 'local_iconrestyle'),
            0
        ));
        $settings->add(new admin_setting_configselect(
            'local_iconrestyle/importmode',
            get_string('importmodedefault', 'local_iconrestyle'),
            get_string('importmodedefault_desc', 'local_iconrestyle'),
            'merge',
            [
                'merge' => get_string('importmodemerge', 'local_iconrestyle'),
                'replace' => get_string('importmodereplace', 'local_iconrestyle'),
            ]
        ));
        $settings->add(new admin_setting_configselect(
            'local_iconrestyle/importchoose',
            get_string('importchoosedefault', 'local_iconrestyle'),
            get_string('importchoosedefault_desc', 'local_iconrestyle'),
            'all',
            [
                'all' => get_string('importchooseall', 'local_iconrestyle'),
                'new' => get_string('importchoosenew', 'local_iconrestyle'),
                'none' => get_string('importchoosenone', 'local_iconrestyle'),
            ]
        ));
        $settings->add(new admin_setting_configtext(
            'local_iconrestyle/maxeffectcost',
            get_string('maxeffectcost', 'local_iconrestyle'),
            get_string('maxeffectcost_desc', 'local_iconrestyle'),
            rule_limits::DEFAULT_COST,
            PARAM_INT
        ));
    }
}
