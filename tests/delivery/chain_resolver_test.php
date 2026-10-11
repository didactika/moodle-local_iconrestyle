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
 * Tests for chain resolution on the page path.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\delivery;

use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(chain_resolver::class)]
/**
 * Verify cascade order, negative answers and the no-query guarantee of the page path.
 *
 * @covers \local_iconrestyle\delivery\chain_resolver
 */
final class chain_resolver_test extends \advanced_testcase {
    /**
     * Start from empty caches and a fresh factory.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
    }

    /**
     * Store a recolour rule.
     *
     * @param \context $context Context.
     */
    private function recolour(\context $context): void {
        service_factory::instance()->rule_service()->save(
            new rule(0, $context->id, slot_key::parse('core:a/setting'), ['fg' => '#1b6ec2']),
            2
        );
    }

    /**
     * Only contexts with rules appear, root first.
     */
    public function test_chain_lists_contexts_with_rules_root_first(): void {
        $category = $this->getDataGenerator()->create_category();
        $course = $this->getDataGenerator()->create_course(['category' => $category->id]);
        $system = \context_system::instance();
        $categorycontext = \context_coursecat::instance($category->id);
        $coursecontext = \context_course::instance($course->id);
        $this->recolour($coursecontext);
        $this->recolour($system);

        $chain = service_factory::instance()->chain_resolver()->chain($coursecontext->path);
        $this->assertSame([$system->id, $coursecontext->id], array_keys($chain));
        $this->assertArrayNotHasKey($categorycontext->id, $chain);
        $this->assertSame([], service_factory::instance()->chain_resolver()->chain(''));
    }

    /**
     * A path with no rules anywhere gives an empty chain.
     */
    public function test_empty_chain_when_nothing_is_customised(): void {
        $course = $this->getDataGenerator()->create_course();
        $path = \context_course::instance($course->id)->path;
        $this->assertSame([], service_factory::instance()->chain_resolver()->chain($path));
    }

    /**
     * With a warm cache the page path reads nothing from the database.
     */
    public function test_warm_path_makes_no_database_reads(): void {
        global $DB;
        $course = $this->getDataGenerator()->create_course();
        $coursecontext = \context_course::instance($course->id);
        $this->recolour(\context_system::instance());
        $resolver = service_factory::instance()->chain_resolver();
        $resolver->chain($coursecontext->path);

        service_factory::reset();
        $before = $DB->perf_get_reads();
        $chain = service_factory::instance()->chain_resolver()->chain($coursecontext->path);
        $this->assertSame($before, $DB->perf_get_reads(), 'The warm page path must not query the database');
        $this->assertNotEmpty($chain);
    }

    /**
     * A cold cache costs one query for the whole path and then warms up, including negative answers.
     */
    public function test_cold_path_costs_one_query_then_none(): void {
        global $DB;
        $course = $this->getDataGenerator()->create_course();
        $path = \context_course::instance($course->id)->path;
        \cache::make('local_iconrestyle', 'ctxrev')->purge();
        service_factory::reset();

        $before = $DB->perf_get_reads();
        service_factory::instance()->chain_resolver()->chain($path);
        $this->assertSame($before + 1, $DB->perf_get_reads());

        service_factory::reset();
        $before = $DB->perf_get_reads();
        service_factory::instance()->chain_resolver()->chain($path);
        $this->assertSame($before, $DB->perf_get_reads());
    }

    /**
     * Very deep paths are folded to a bounded number of contexts.
     */
    public function test_depth_is_bounded(): void {
        $revisions = service_factory::instance()->revisions();
        foreach ([1, 5, 40] as $contextid) {
            $revisions->bump($contextid, 1);
        }
        $chain = service_factory::instance()->chain_resolver()->chain('/' . implode('/', range(1, 40)));
        $this->assertSame([1, 40], array_keys($chain));
    }
}
