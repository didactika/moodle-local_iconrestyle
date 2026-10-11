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
 * Tests for the rules that apply in a context.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(effective_rules::class)]
/**
 * Verify that the nearest context wins, as it does in the browser, and that the origin is reported.
 *
 * @covers \local_iconrestyle\rule\effective_rules
 * @covers \local_iconrestyle\rule\rule_store
 */
final class effective_rules_test extends \advanced_testcase {
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
     * @param string $colour Foreground.
     */
    private function rule(\context $context, string $key, string $colour): void {
        service_factory::instance()->rule_service()->save(
            new rule(0, $context->id, slot_key::parse($key), ['fg' => $colour]),
            2
        );
    }

    /**
     * Summarise the result as slot => colour (origin context level and ownership).
     *
     * @param \context $context Context being edited.
     * @return string[] Summary.
     */
    private function summary(\context $context): array {
        $summary = [];
        foreach (service_factory::instance()->effective_rules()->for_context($context) as $entry) {
            $summary[(string)$entry['rule']->slot()] = $entry['rule']->fg()->stored() . ' ' .
                \context::instance_by_id($entry['rule']->contextid())->contextlevel . ($entry['own'] ? ' own' : ' inherited');
        }
        return $summary;
    }

    /**
     * The deepest context wins for each icon and unrelated icons keep their own origin.
     */
    public function test_nearest_context_wins(): void {
        $category = $this->getDataGenerator()->create_category();
        $course = $this->getDataGenerator()->create_course(['category' => $category->id]);
        $system = \context_system::instance();
        $categorycontext = \context_coursecat::instance($category->id);
        $coursecontext = \context_course::instance($course->id);

        $this->rule($system, 'core:a/setting', '#111111');
        $this->rule($system, 'core:t/edit', '#222222');
        $this->rule($categorycontext, 'core:a/setting', '#333333');
        $this->rule($coursecontext, 'core:t/edit', '#444444');

        $this->assertSame([
            'core:a/setting' => '#333333 40 inherited',
            'core:t/edit' => '#444444 50 own',
        ], $this->summary($coursecontext));
        $this->assertSame([
            'core:a/setting' => '#333333 40 own',
            'core:t/edit' => '#222222 10 inherited',
        ], $this->summary($categorycontext));
        $this->assertSame([
            'core:a/setting' => '#111111 10 own',
            'core:t/edit' => '#222222 10 own',
        ], $this->summary($system));
    }

    /**
     * An activity sees the rules of its course and categories, and its own.
     */
    public function test_activity_scope(): void {
        $course = $this->getDataGenerator()->create_course();
        $page = $this->getDataGenerator()->create_module('page', ['course' => $course->id]);
        $module = \context_module::instance($page->cmid);
        $this->rule(\context_course::instance($course->id), 'core:a/setting', '#555555');
        $this->rule($module, 'core:a/setting', '#666666');
        $this->rule($module, 'core:t/delete', '#777777');

        $this->assertSame([
            'core:a/setting' => '#666666 70 own',
            'core:t/delete' => '#777777 70 own',
        ], $this->summary($module));
        $this->assertSame(['core:a/setting' => '#555555 50 own'], $this->summary(\context_course::instance($course->id)));
    }

    /**
     * Nothing is returned when no rule applies.
     */
    public function test_no_rules(): void {
        $course = $this->getDataGenerator()->create_course();
        $this->assertSame([], $this->summary(\context_course::instance($course->id)));
    }
}
