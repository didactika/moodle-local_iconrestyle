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
 * A large site to measure against: many categories and courses, a very deep category, and hundreds of rules that are limited
 * by page, region and colour mode.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\performance;

use local_iconrestyle\rule\audience;
use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

/**
 * Builds the site through Moodle's own generators, so every context, path and course exists for real.
 *
 * The size comes from the environment, so the same tests run small on every build and large when a benchmark is wanted:
 * ICONRESTYLE_BENCH_CATEGORIES, ICONRESTYLE_BENCH_COURSES, ICONRESTYLE_BENCH_CONTEXT_RULES, ICONRESTYLE_BENCH_RULE_CONTEXTS
 * and ICONRESTYLE_BENCH_SYSTEM_RULES.
 */
class scale_dataset {
    /** @var int Levels of the deepest category. */
    public const DEEP_LEVELS = 30;

    /** @var int Most courses that are made with the course generator, which is slow for more. */
    public const GENERATOR_LIMIT = 300;

    /** @var \advanced_testcase Test that owns the generators. */
    private $test;

    /** @var int[] Category ids. */
    public $categories = [];

    /** @var int[] Course ids. */
    public $courses = [];

    /** @var int[] Category ids of the deep chain, from the top down. */
    public $deep = [];

    /** @var string[] Slot keys of the font icons that can be customised. */
    private $slots = [];

    /**
     * Create the dataset builder.
     *
     * @param \advanced_testcase $test Test that owns the generators.
     */
    public function __construct(\advanced_testcase $test) {
        $this->test = $test;
        foreach (service_factory::instance()->catalogue()->all() as $entry) {
            if ($entry['kind'] === 'font') {
                $this->slots[] = $entry['key'];
            }
        }
        sort($this->slots);
    }

    /**
     * A size from the environment.
     *
     * @param string $name Variable name without the prefix.
     * @param int $default Value when it is not set.
     * @return int Size.
     */
    public static function size(string $name, int $default): int {
        $value = getenv('ICONRESTYLE_BENCH_' . $name);
        return $value === false || $value === '' ? $default : max(0, (int)$value);
    }

    /**
     * Font icon keys, in a stable order.
     *
     * @return string[] Slot keys.
     */
    public function slots(): array {
        return $this->slots;
    }

    /**
     * Create the categories, the deep chain and the courses.
     */
    public function build_tree(): void {
        $generator = $this->test->getDataGenerator();
        $flat = self::size('CATEGORIES', 60);
        for ($i = 0; $i < $flat; $i++) {
            $parent = $i > 0 && $i % 5 !== 0 ? $this->categories[intdiv($i, 2)] : 0;
            $this->categories[] = (int)$generator->create_category(['parent' => $parent, 'name' => 'Cat ' . $i])->id;
        }
        $parent = 0;
        for ($level = 0; $level < self::DEEP_LEVELS; $level++) {
            $parent = (int)$generator->create_category(['parent' => $parent, 'name' => 'Deep ' . $level])->id;
            $this->deep[] = $parent;
        }
        $courses = self::size('COURSES', 150);
        $all = array_merge($this->categories, [$this->deep[self::DEEP_LEVELS - 1]]);
        for ($i = 0; $i < $courses; $i++) {
            $category = $all[$i % count($all)];
            $this->courses[] = $courses > self::GENERATOR_LIMIT ?
                $this->insert_course($category, $i) :
                (int)$generator->create_course(['category' => $category, 'shortname' => 'B' . $i, 'fullname' => 'Bench ' . $i])->id;
        }
    }

    /**
     * Create a course with one insert and its context.
     *
     * The course generator re-sorts every course of the site after each course it creates, which makes creating thousands of
     * them take hours, and sorting is not what this dataset measures.
     *
     * @param int $category Category of the course.
     * @param int $index Number of the course.
     * @return int Id of the course.
     */
    private function insert_course(int $category, int $index): int {
        global $DB;
        $now = time();
        $id = (int)$DB->insert_record('course', (object)[
            'category' => $category, 'sortorder' => 100000 + $index, 'fullname' => 'Bench ' . $index,
            'shortname' => 'B' . $index, 'idnumber' => '', 'format' => 'topics', 'visible' => 1, 'visibleold' => 1,
            'timecreated' => $now, 'timemodified' => $now, 'cacherev' => 0,
        ]);
        \context_course::instance($id);
        return $id;
    }

    /**
     * A rule with a look that is as heavy as a rule can reasonably be.
     *
     * @param int $contextid Context of the rule.
     * @param string $slot Slot key.
     * @param int $seed Number that decides how the rule is limited.
     * @return rule Rule.
     */
    public function rule(int $contextid, string $slot, int $seed): rule {
        $pages = array_values(array_filter(audience::PAGES, function (string $name, int $index) use ($seed): bool {
            return $seed % 4 === 0 || (($seed >> $index) & 1) === 1;
        }, ARRAY_FILTER_USE_BOTH));
        $regions = [];
        if ($seed % 3 !== 0) {
            $regions = array_values(array_filter(audience::REGIONS, function (string $name, int $index) use ($seed): bool {
                return (($seed >> $index) & 1) === 1;
            }, ARRAY_FILTER_USE_BOTH));
        }
        $modes = ['all', 'light', 'dark'];
        return new rule(0, $contextid, slot_key::parse($slot), [
            'fg' => sprintf('#%06x', ($seed * 2654435761) & 0xffffff),
            'bg' => $seed % 5 === 0 ? 'var:--bs-light' : '',
            'design' => ['shape' => 'rounded', 'pt' => 20, 'pr' => 20, 'pb' => 20, 'pl' => 20, 'shadow' => 'soft'],
            'pages' => $pages,
            'regions' => $regions,
            'mode' => $modes[$seed % 3],
        ]);
    }

    /**
     * Store rules in a context, a hundred in each request, as the designer does.
     *
     * @param int $contextid Context of the rules.
     * @param int $count How many rules.
     * @param int $offset Where in the list of icons to start, so contexts do not all restyle the same icons.
     * @return int Rules stored.
     */
    public function add_rules(int $contextid, int $count, int $offset = 0): int {
        $service = service_factory::instance()->rule_service();
        $stored = 0;
        $batch = [];
        $total = count($this->slots);
        for ($i = 0; $i < $count; $i++) {
            $batch[] = $this->rule($contextid, $this->slots[($offset + $i) % $total], $offset + $i + 1);
            if (count($batch) === 100 || $i === $count - 1) {
                $stored += count($service->apply($batch, [], 2)['saved']);
                $batch = [];
            }
        }
        return $stored;
    }

    /**
     * Give the site its rules: many on the whole site and a few in each of many categories and courses.
     *
     * @return int Contexts that have rules.
     */
    public function build_rules(): int {
        $this->add_rules(\context_system::instance()->id, self::size('SYSTEM_RULES', 150));
        $each = self::size('CONTEXT_RULES', 3);
        $contexts = 0;
        $limit = self::size('RULE_CONTEXTS', 50);
        foreach (array_slice($this->categories, 0, $limit) as $index => $categoryid) {
            $this->add_rules(\context_coursecat::instance($categoryid)->id, $each, $index * 7);
            $contexts++;
        }
        foreach (array_slice($this->courses, 0, $limit) as $index => $courseid) {
            $this->add_rules(\context_course::instance($courseid)->id, $each, $index * 11);
            $contexts++;
        }
        return $contexts;
    }
}
