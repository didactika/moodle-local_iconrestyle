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
 * Tests for dropping rules when their context is deleted.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\hook;

use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(deletion_observer::class)]
/**
 * Deleting a course, a category or an activity takes its rules with it and leaves everything else alone.
 *
 * @covers \local_iconrestyle\hook\deletion_observer
 * @covers \local_iconrestyle\rule\rule_cleaner
 */
final class deletion_observer_test extends \advanced_testcase {
    /**
     * Start from a fresh factory.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
    }

    /**
     * Store a rule.
     *
     * @param \context $context Context.
     * @param string $key Slot key.
     */
    private function rule(\context $context, string $key = 'core:a/setting'): void {
        service_factory::instance()->rule_service()->save(new rule(0, $context->id, slot_key::parse($key), ['fg' => '#e83e8c']), 2);
    }

    /**
     * Number of stored rules.
     *
     * @return int Count.
     */
    private function rules(): int {
        global $DB;
        return $DB->count_records('local_iconrestyle_rule');
    }

    /**
     * Delete an activity the way the running Moodle expects.
     *
     * @param int $cmid Course module id.
     * @param int $courseid Course id.
     */
    private function delete_module(int $cmid, int $courseid): void {
        $actions = class_exists(\core_courseformat\formatactions::class) ? \core_courseformat\formatactions::cm($courseid) : null;
        if ($actions && method_exists($actions, 'delete')) {
            $actions->delete($cmid);
        } else {
            course_delete_module($cmid);
        }
    }

    /**
     * A deleted course loses its rules, those of its activities and its revision row.
     */
    public function test_course_deletion_removes_course_and_activity_rules(): void {
        global $DB;
        $this->setAdminUser();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $assign = $generator->create_module('assign', ['course' => $course->id]);
        $other = $generator->create_course();
        $coursectxid = \context_course::instance($course->id)->id;
        $this->rule(\context_course::instance($course->id));
        $this->rule(\context_module::instance($assign->cmid), 'core:t/delete');
        $this->rule(\context_course::instance($other->id));
        $this->rule(\context_system::instance());
        $this->assertSame(4, $this->rules());

        delete_course($course, false);

        $this->assertSame(2, $this->rules());
        $this->assertFalse($DB->record_exists('local_iconrestyle_ctxstate', ['contextid' => $coursectxid]));
        $otherctxid = \context_course::instance($other->id)->id;
        $this->assertTrue($DB->record_exists('local_iconrestyle_ctxstate', ['contextid' => $otherctxid]));
    }

    /**
     * A deleted activity loses its rules and the stylesheet of its course is refreshed.
     */
    public function test_module_deletion_removes_its_rules_and_refreshes_the_course(): void {
        $this->setAdminUser();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $assign = $generator->create_module('assign', ['course' => $course->id]);
        $coursecontext = \context_course::instance($course->id);
        $this->rule($coursecontext);
        $this->rule(\context_module::instance($assign->cmid), 'core:t/delete');
        $before = service_factory::instance()->revisions()->get_many([$coursecontext->id])[$coursecontext->id];

        $this->delete_module((int)$assign->cmid, (int)$course->id);

        $this->assertSame(1, $this->rules());
        $after = service_factory::instance()->revisions()->get_many([$coursecontext->id])[$coursecontext->id];
        $this->assertGreaterThan($before, $after);
    }

    /**
     * A deleted category loses its rules.
     */
    public function test_category_deletion_removes_its_rules(): void {
        $this->setAdminUser();
        $category = $this->getDataGenerator()->create_category();
        $this->rule(\context_coursecat::instance($category->id));
        $this->rule(\context_system::instance());
        $this->assertSame(2, $this->rules());

        $category->delete_full(false);

        $this->assertSame(1, $this->rules());
    }

    /**
     * Deleting a course without rules does not touch the revisions of others.
     */
    public function test_deleting_a_course_without_rules_changes_nothing(): void {
        $this->setAdminUser();
        $this->rule(\context_system::instance());
        $course = $this->getDataGenerator()->create_course();

        delete_course($course, false);

        $this->assertSame(1, $this->rules());
    }
}
