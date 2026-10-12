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
 * Privacy API implementation for local_iconrestyle.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\transform;
use core_privacy\local\request\writer;

/**
 * The plugin keeps the configuration of a site, not data about people. The only personal data is who last changed a rule and who
 * added a piece of artwork. Erasing a person keeps the configuration and forgets who made it.
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\core_userlist_provider,
    \core_privacy\local\request\plugin\provider {
    /** @var string[] Tables that remember a user, with the column that holds the user and the one that holds the time. */
    private const TABLES = [
        'local_iconrestyle_rule' => ['usermodified', 'timemodified'],
        'local_iconrestyle_asset' => ['usermodified', 'timecreated'],
    ];

    /**
     * Describe what the plugin stores about people.
     *
     * @param collection $collection Collection to add to.
     * @return collection The collection.
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table('local_iconrestyle_rule', [
            'usermodified' => 'privacy:metadata:rule:usermodified',
            'timemodified' => 'privacy:metadata:rule:timemodified',
        ], 'privacy:metadata:rule');
        $collection->add_database_table('local_iconrestyle_asset', [
            'usermodified' => 'privacy:metadata:asset:usermodified',
            'timecreated' => 'privacy:metadata:asset:timecreated',
        ], 'privacy:metadata:asset');
        return $collection;
    }

    /**
     * The contexts that hold data about a user.
     *
     * @param int $userid User.
     * @return contextlist Contexts.
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        global $DB;
        $contextlist = new contextlist();
        foreach (self::TABLES as $table => [$column]) {
            if ($DB->record_exists($table, [$column => $userid])) {
                $contextlist->add_system_context();
                break;
            }
        }
        return $contextlist;
    }

    /**
     * The users that hold data in a context.
     *
     * @param userlist $userlist List to add to.
     */
    public static function get_users_in_context(userlist $userlist): void {
        global $DB;
        if (!$userlist->get_context() instanceof \context_system) {
            return;
        }
        foreach (self::TABLES as $table => [$column]) {
            $userlist->add_from_sql($column, "SELECT {$column} FROM {{$table}} WHERE {$column} > 0", []);
        }
    }

    /**
     * Export what the plugin knows about a user.
     *
     * @param approved_contextlist $contextlist Contexts to export.
     */
    public static function export_user_data(approved_contextlist $contextlist): void {
        global $DB;
        $userid = $contextlist->get_user()->id;
        foreach ($contextlist->get_contexts() as $context) {
            if (!$context instanceof \context_system) {
                continue;
            }
            $rules = [];
            $made = $DB->get_records('local_iconrestyle_rule', ['usermodified' => $userid], 'id ASC', 'id, slotkey, timemodified');
            foreach ($made as $rule) {
                $when = transform::datetime($rule->timemodified);
                $rules[] = ['icon' => $rule->slotkey, 'timemodified' => $when];
            }
            $assets = [];
            $added = $DB->get_records('local_iconrestyle_asset', ['usermodified' => $userid], 'id ASC', 'id, kind, timecreated');
            foreach ($added as $asset) {
                $assets[] = ['kind' => $asset->kind, 'timecreated' => transform::datetime($asset->timecreated)];
            }
            writer::with_context($context)->export_data(
                [get_string('pluginname', 'local_iconrestyle')],
                (object)['rules' => $rules, 'artwork' => $assets]
            );
        }
    }

    /**
     * Forget who made the rules and the artwork of a context.
     *
     * @param \context $context Context.
     */
    public static function delete_data_for_all_users_in_context(\context $context): void {
        global $DB;
        if (!$context instanceof \context_system) {
            return;
        }
        foreach (self::TABLES as $table => [$column]) {
            $DB->set_field($table, $column, 0);
        }
    }

    /**
     * Forget which rules and artwork a user made.
     *
     * @param approved_contextlist $contextlist Contexts to erase from.
     */
    public static function delete_data_for_user(approved_contextlist $contextlist): void {
        global $DB;
        foreach ($contextlist->get_contexts() as $context) {
            if ($context instanceof \context_system) {
                foreach (self::TABLES as $table => [$column]) {
                    $DB->set_field($table, $column, 0, [$column => $contextlist->get_user()->id]);
                }
            }
        }
    }

    /**
     * Forget which rules and artwork some users made.
     *
     * @param approved_userlist $userlist Users to erase.
     */
    public static function delete_data_for_users(approved_userlist $userlist): void {
        global $DB;
        if (!$userlist->get_context() instanceof \context_system || $userlist->get_userids() === []) {
            return;
        }
        [$insql, $params] = $DB->get_in_or_equal($userlist->get_userids(), SQL_PARAMS_NAMED);
        foreach (self::TABLES as $table => [$column]) {
            $DB->set_field_select($table, $column, 0, "{$column} {$insql}", $params);
        }
    }
}
