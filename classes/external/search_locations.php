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
 * Finds the categories, courses and activities a rule can be limited to.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use local_iconrestyle\service_factory;

// The classes below use those of core_external, which Moodle 4.0 and 4.1 only have under their old names.
// phpcs:ignore moodle.Files.MoodleInternal.MoodleInternalGlobalState
\local_iconrestyle\compat\external_aliases::register();

/**
 * Backs the "where" picker of the designer with a small, bounded search.
 */
class search_locations extends external_api {
    /** @var string[] Kinds of place that can be searched. */
    public const KINDS = ['category', 'course', 'activity'];

    /** @var int Most results one search returns. */
    private const LIMIT = 20;

    /** @var int Most courses whose activities are listed for one activity search. */
    private const ACTIVITY_COURSES = 5;

    /**
     * Parameters.
     *
     * @return external_function_parameters Description.
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'kind' => new external_value(PARAM_ALPHA, 'category, course or activity'),
            'query' => new external_value(PARAM_TEXT, 'Text to look for in names', VALUE_DEFAULT, ''),
        ]);
    }

    /**
     * Search places.
     *
     * @param string $kind category, course or activity.
     * @param string $query Text to look for. Activities are found through the name of their course.
     * @return array Places with their context ids.
     */
    public static function execute(string $kind, string $query = ''): array {
        $params = self::validate_parameters(self::execute_parameters(), ['kind' => $kind, 'query' => $query]);
        if (!in_array($params['kind'], self::KINDS, true)) {
            throw new \invalid_parameter_exception('Unknown kind of place.');
        }
        self::validate_context(\context_system::instance());
        service_factory::instance()->permissions()->require_manage();
        $text = trim($params['query']);
        if ($params['kind'] === 'category') {
            return ['places' => self::categories($text)];
        }
        if (\core_text::strlen($text) < 2) {
            return ['places' => []];
        }
        return ['places' => $params['kind'] === 'course' ? self::courses($text) : self::activities($text)];
    }

    /**
     * Categories whose name contains the text.
     *
     * @param string $text Text, possibly empty.
     * @return array Places.
     */
    private static function categories(string $text): array {
        global $DB;
        $params = ['level' => CONTEXT_COURSECAT];
        $where = '';
        if ($text !== '') {
            $where = 'WHERE ' . $DB->sql_like('c.name', ':text', false);
            $params['text'] = '%' . $DB->sql_like_escape($text) . '%';
        }
        $sql = "SELECT c.id, c.name, ctx.id AS contextid
                  FROM {course_categories} c
                  JOIN {context} ctx ON ctx.instanceid = c.id AND ctx.contextlevel = :level
                  $where
              ORDER BY c.name ASC";
        $places = [];
        foreach ($DB->get_records_sql($sql, $params, 0, self::LIMIT) as $record) {
            $places[] = [
                'contextid' => (int)$record->contextid,
                'name' => format_string($record->name, true, ['context' => \context_system::instance()]),
                'detail' => '',
            ];
        }
        return $places;
    }

    /**
     * Courses whose full name, short name or id number contains the text.
     *
     * @param string $text Text.
     * @return array Places.
     */
    private static function courses(string $text): array {
        global $DB;
        $like = '%' . $DB->sql_like_escape($text) . '%';
        $sql = "SELECT c.id, c.fullname, c.shortname, ctx.id AS contextid
                  FROM {course} c
                  JOIN {context} ctx ON ctx.instanceid = c.id AND ctx.contextlevel = :level
                 WHERE c.id <> :site AND (" . $DB->sql_like('c.fullname', ':full', false) . '
                       OR ' . $DB->sql_like('c.shortname', ':short', false) . '
                       OR ' . $DB->sql_like('c.idnumber', ':idnumber', false) . ')
              ORDER BY c.fullname ASC';
        $params = ['level' => CONTEXT_COURSE, 'site' => SITEID, 'full' => $like, 'short' => $like, 'idnumber' => $like];
        $places = [];
        foreach ($DB->get_records_sql($sql, $params, 0, self::LIMIT) as $record) {
            $places[] = [
                'contextid' => (int)$record->contextid,
                'name' => format_string($record->fullname, true, ['context' => \context_system::instance()]),
                'detail' => s($record->shortname),
            ];
        }
        return $places;
    }

    /**
     * Activities of the courses whose name contains the text.
     *
     * @param string $text Text.
     * @return array Places.
     */
    private static function activities(string $text): array {
        global $DB;
        $like = '%' . $DB->sql_like_escape($text) . '%';
        $sql = 'SELECT c.id, c.fullname, c.shortname
                  FROM {course} c
                 WHERE c.id <> :site AND (' . $DB->sql_like('c.fullname', ':full', false) . '
                       OR ' . $DB->sql_like('c.shortname', ':short', false) . ')
              ORDER BY c.fullname ASC';
        $places = [];
        $courses = $DB->get_records_sql($sql, ['site' => SITEID, 'full' => $like, 'short' => $like], 0, self::ACTIVITY_COURSES);
        foreach ($courses as $course) {
            $coursename = format_string($course->fullname, true, ['context' => \context_system::instance()]);
            foreach (get_fast_modinfo($course->id)->get_cms() as $cm) {
                if (count($places) >= self::LIMIT) {
                    break 2;
                }
                $places[] = [
                    'contextid' => (int)\context_module::instance($cm->id)->id,
                    'name' => format_string($cm->name, true, ['context' => \context_system::instance()]),
                    'detail' => $cm->get_module_type_name() . ' · ' . s($course->shortname) . ' · ' . $coursename,
                ];
            }
        }
        return $places;
    }

    /**
     * Returned structure.
     *
     * @return external_single_structure Description.
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'places' => new external_multiple_structure(new external_single_structure([
                'contextid' => new external_value(PARAM_INT, 'Context id'),
                'name' => new external_value(PARAM_RAW, 'Name'),
                'detail' => new external_value(
                    PARAM_RAW,
                    'Extra text, such as the short name of a course or the course of an activity'
                ),
            ])),
        ]);
    }
}
