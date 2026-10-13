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
 * Tests for storing many rules at once, which is what an import does.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(rule_service::class)]
/**
 * Verify that the bulk path stores, bumps, caches and refuses as the single path does, with a handful of queries.
 *
 * @covers \local_iconrestyle\rule\rule_service
 * @covers \local_iconrestyle\rule\rule_store
 * @covers \local_iconrestyle\rule\revision_registry
 */
final class bulk_apply_test extends \advanced_testcase {
    /**
     * Start from empty caches and a fresh factory.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
    }

    /**
     * A recolour rule.
     *
     * @param \context $context Context.
     * @param string $slot Slot key.
     * @param string $colour Colour.
     * @return rule Rule.
     */
    private function recolour(\context $context, string $slot, string $colour): rule {
        return new rule(0, $context->id, slot_key::parse($slot), ['fg' => $colour]);
    }

    /**
     * New rules are stored, each stylesheet is bumped once and compiled, and the queries do not grow with the rules.
     */
    public function test_many_rules_are_stored_with_few_queries(): void {
        global $DB;
        $generator = $this->getDataGenerator();
        $rules = [];
        $contexts = [];
        for ($i = 0; $i < 6; $i++) {
            $contexts[$i] = \context_course::instance($generator->create_course()->id);
            foreach (['core:a/setting', 'core:t/delete', 'core:t/edit'] as $slot) {
                $rules[] = $this->recolour($contexts[$i], $slot, '#1b6ec2');
            }
        }
        $factory = service_factory::instance();
        $factory->rule_service();

        $writes = $DB->perf_get_writes();
        $factory->rule_service()->apply_bulk($rules, 2);
        $this->assertLessThan(20, $DB->perf_get_writes() - $writes);

        foreach ($contexts as $context) {
            $this->assertCount(3, $factory->rules()->find_by_delta($context->id));
            $rev = $factory->revisions()->get_many([$context->id])[$context->id];
            $this->assertSame(1, $rev);
            $this->assertStringContainsString('#1b6ec2', $factory->delta_sheets()->css($context->id, $rev));
        }
    }

    /**
     * A rule that exists is updated, its revision goes up and the stylesheet is bumped again.
     */
    public function test_a_second_import_updates_what_exists(): void {
        $course = \context_course::instance($this->getDataGenerator()->create_course()->id);
        $service = service_factory::instance()->rule_service();
        $service->apply_bulk([$this->recolour($course, 'core:a/setting', '#1b6ec2')], 2);
        $service->apply_bulk([
            $this->recolour($course, 'core:a/setting', '#e83e8c'),
            $this->recolour($course, 'core:t/delete', '#1b6ec2'),
        ], 2);

        $stored = service_factory::instance()->rules()->find_by_delta($course->id);
        $this->assertCount(2, $stored);
        $this->assertSame(2, service_factory::instance()->revisions()->get_many([$course->id])[$course->id]);
        $setting = service_factory::instance()->rules()->find($course->id, 'core:a/setting', rule::TARGET_ICON);
        $this->assertSame(2, $setting->rev());
        $this->assertSame('#e83e8c', $setting->fg()->stored());
    }

    /**
     * The page of the context sees the new stylesheet at once.
     */
    public function test_the_page_address_follows_an_import(): void {
        $course = \context_course::instance($this->getDataGenerator()->create_course()->id);
        $addresses = service_factory::instance()->chain_addresses();
        $this->assertSame('', $addresses->encoded($course->path));

        service_factory::instance()->rule_service()->apply_bulk([$this->recolour($course, 'core:a/setting', '#1b6ec2')], 2);

        $this->assertSame($course->id . '-1', $addresses->encoded($course->path));
    }

    /**
     * The limit of contexts with rules is applied to the whole batch, in the order the contexts are reached.
     */
    public function test_the_limit_of_contexts_is_applied_to_the_batch(): void {
        $generator = $this->getDataGenerator();
        set_config('maxcontextswithrules', 2, 'local_iconrestyle');
        service_factory::reset();
        $rules = [];
        foreach ([0, 1, 2] as $unused) {
            $rules[] = $this->recolour(\context_course::instance($generator->create_course()->id), 'core:a/setting', '#1b6ec2');
        }
        try {
            service_factory::instance()->rule_service()->apply_bulk($rules, 2);
            $this->fail('The third stylesheet should have been refused.');
        } catch (\InvalidArgumentException $exception) {
            $this->assertStringContainsString('Too many categories and courses', $exception->getMessage());
        }
        $this->assertSame(0, service_factory::instance()->revisions()->count_active());
    }

    /**
     * A rule that appears twice in the batch keeps its last version, and it is stored once.
     */
    public function test_a_rule_twice_in_a_batch_keeps_the_last(): void {
        $course = \context_course::instance($this->getDataGenerator()->create_course()->id);
        service_factory::instance()->rule_service()->apply_bulk([
            $this->recolour($course, 'core:a/setting', '#1b6ec2'),
            $this->recolour($course, 'core:a/setting', '#e83e8c'),
        ], 2);
        $stored = service_factory::instance()->rules()->find_by_delta($course->id);
        $this->assertCount(1, $stored);
        $this->assertSame('#e83e8c', $stored[0]->fg()->stored());
    }
}
