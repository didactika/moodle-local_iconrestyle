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
 * Names for places that mean the same on every site.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\exchange;

/**
 * The id of a context belongs to one database, so a package never carries it. A place is named by what people gave it: the
 * whole site, a category by its id number or by the names of its path, a course by its short name and an activity by the short
 * name of its course and its own id number. A place that has no such name cannot travel and is left out of the package.
 */
class place_keys {
    /** @var string Key of the whole site. */
    public const SITE = 'site';

    /** @var \moodle_database Database. */
    private $db;

    /** @var array<int, string|null> Keys already worked out, by context id. */
    private $keys = [];

    /** @var array<string, int|null> Contexts already looked up, by key. */
    private $contexts = [];

    /**
     * Create the helper.
     *
     * @param \moodle_database $db Database.
     */
    public function __construct(\moodle_database $db) {
        $this->db = $db;
    }

    /**
     * The key of a place.
     *
     * @param int $contextid Context id.
     * @return string|null Key, or null when the place has no name that can travel.
     */
    public function key_of(int $contextid): ?string {
        if (!array_key_exists($contextid, $this->keys)) {
            $context = \context::instance_by_id($contextid, IGNORE_MISSING);
            $this->keys[$contextid] = $context ? $this->describe($context) : null;
        }
        return $this->keys[$contextid];
    }

    /**
     * The place a key names on this site.
     *
     * @param string $key Key.
     * @return int|null Context id, or null when this site has no such place or the key means more than one.
     */
    public function resolve(string $key): ?int {
        if (!array_key_exists($key, $this->contexts)) {
            $this->contexts[$key] = $this->find($key);
        }
        return $this->contexts[$key];
    }

    /**
     * Name a context.
     *
     * @param \context $context Context.
     * @return string|null Key.
     */
    private function describe(\context $context): ?string {
        switch ($context->contextlevel) {
            case CONTEXT_SYSTEM:
                return self::SITE;
            case CONTEXT_COURSECAT:
                $category = $this->db->get_record('course_categories', ['id' => $context->instanceid], 'id, idnumber, name, path');
                if (!$category) {
                    return null;
                }
                if ((string)$category->idnumber !== '') {
                    return 'category:idnumber=' . rawurlencode($category->idnumber);
                }
                $names = [];
                foreach (array_filter(explode('/', $category->path)) as $id) {
                    $names[] = rawurlencode($this->db->get_field('course_categories', 'name', ['id' => $id], MUST_EXIST));
                }
                return 'category:path=' . implode('/', $names);
            case CONTEXT_COURSE:
                $shortname = $this->db->get_field('course', 'shortname', ['id' => $context->instanceid]);
                return $shortname === false ? null : 'course:shortname=' . rawurlencode($shortname);
            case CONTEXT_MODULE:
                $module = $this->db->get_record('course_modules', ['id' => $context->instanceid], 'id, course, idnumber');
                if (!$module || (string)$module->idnumber === '') {
                    return null;
                }
                $shortname = $this->db->get_field('course', 'shortname', ['id' => $module->course]);
                return $shortname === false ? null :
                    'activity:' . rawurlencode($shortname) . '/idnumber=' . rawurlencode($module->idnumber);
            default:
                return null;
        }
    }

    /**
     * Look a key up.
     *
     * @param string $key Key.
     * @return int|null Context id.
     */
    private function find(string $key): ?int {
        if ($key === self::SITE) {
            return \context_system::instance()->id;
        }
        if (preg_match('/^category:idnumber=(.+)$/', $key, $matches)) {
            $id = $this->db->get_field('course_categories', 'id', ['idnumber' => rawurldecode($matches[1])]);
            return $id === false ? null : $this->id_of(\context_coursecat::instance((int)$id, IGNORE_MISSING));
        }
        if (preg_match('/^category:path=(.+)$/', $key, $matches)) {
            return $this->find_category_by_path(array_map('rawurldecode', explode('/', $matches[1])));
        }
        if (preg_match('/^course:shortname=(.+)$/', $key, $matches)) {
            $id = $this->db->get_field('course', 'id', ['shortname' => rawurldecode($matches[1])]);
            return $id === false ? null : $this->id_of(\context_course::instance((int)$id, IGNORE_MISSING));
        }
        if (preg_match('/^activity:([^\/]+)\/idnumber=(.+)$/', $key, $matches)) {
            $course = $this->db->get_field('course', 'id', ['shortname' => rawurldecode($matches[1])]);
            if ($course === false) {
                return null;
            }
            $module = $this->db->get_field('course_modules', 'id', ['course' => $course, 'idnumber' => rawurldecode($matches[2])]);
            return $module === false ? null : $this->id_of(\context_module::instance((int)$module, IGNORE_MISSING));
        }
        return null;
    }

    /**
     * The id of a context that may be missing.
     *
     * @param \context|false $context Context.
     * @return int|null Id.
     */
    private function id_of($context): ?int {
        return $context ? (int)$context->id : null;
    }

    /**
     * Walk down the categories by name.
     *
     * @param string[] $names Names from the top category down.
     * @return int|null Context id, or null when a name is missing or is used by more than one sibling.
     */
    private function find_category_by_path(array $names): ?int {
        $parent = 0;
        $found = null;
        foreach ($names as $name) {
            $matches = $this->db->get_records('course_categories', ['parent' => $parent, 'name' => $name], '', 'id', 0, 2);
            if (count($matches) !== 1) {
                return null;
            }
            $found = (int)reset($matches)->id;
            $parent = $found;
        }
        return $found === null ? null : \context_coursecat::instance($found)->id;
    }
}
