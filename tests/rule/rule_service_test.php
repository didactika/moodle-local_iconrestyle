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
 * Tests for storing rules and tracking revisions.
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
 * Verify storage, optimistic locking, delta ownership, revisions and caps.
 *
 * @covers \local_iconrestyle\rule\rule_service
 * @covers \local_iconrestyle\rule\rule_store
 * @covers \local_iconrestyle\rule\revision_registry
 * @covers \local_iconrestyle\rule\delta_context
 */
final class rule_service_test extends \advanced_testcase {
    /**
     * Start from empty caches and a fresh factory.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
    }

    /**
     * Build a rule.
     *
     * @param int $contextid Context id.
     * @param string $key Slot key.
     * @param array $options Options.
     * @return rule Rule.
     */
    private function rule(int $contextid, string $key, array $options = ['fg' => '#1b6ec2']): rule {
        return new rule(0, $contextid, slot_key::parse($key), $options);
    }

    /**
     * A new rule starts the revision and appears in its delta stylesheet.
     */
    public function test_save_creates_rule_and_revision(): void {
        $system = \context_system::instance();
        $service = service_factory::instance()->rule_service();
        $stored = $service->save($this->rule($system->id, 'core:a/setting'), 2);
        $this->assertGreaterThan(0, $stored->id());
        $this->assertSame(1, $stored->rev());
        $this->assertSame([$system->id => 1], service_factory::instance()->revisions()->get_many([$system->id]));
        $this->assertCount(1, service_factory::instance()->rules()->find_by_delta($system->id));
    }

    /**
     * Updating bumps both the rule and the stylesheet revision.
     */
    public function test_update_bumps_revisions(): void {
        $system = \context_system::instance();
        $service = service_factory::instance()->rule_service();
        $first = $service->save($this->rule($system->id, 'core:a/setting'), 2);
        $second = $service->save(
            new rule($first->id(), $system->id, slot_key::parse('core:a/setting'), ['fg' => '#ff0000', 'rev' => $first->rev()]),
            2
        );
        $this->assertSame(2, $second->rev());
        $this->assertSame('#ff0000', $second->fg()->stored());
        $this->assertSame(2, service_factory::instance()->revisions()->get_many([$system->id])[$system->id]);
    }

    /**
     * A stale editor is refused instead of overwriting a newer change.
     */
    public function test_stale_update_is_a_conflict(): void {
        $system = \context_system::instance();
        $service = service_factory::instance()->rule_service();
        $first = $service->save($this->rule($system->id, 'core:a/setting'), 2);
        $service->save(
            new rule($first->id(), $system->id, slot_key::parse('core:a/setting'), ['fg' => '#00ff00', 'rev' => $first->rev()]),
            2
        );
        $this->expectException(rule_conflict_exception::class);
        $service->save(
            new rule($first->id(), $system->id, slot_key::parse('core:a/setting'), ['fg' => '#0000ff', 'rev' => $first->rev()]),
            3
        );
    }

    /**
     * Deleting the last rule hides the stylesheet but never reuses a revision number.
     */
    public function test_delete_hides_stylesheet_and_revisions_only_grow(): void {
        $system = \context_system::instance();
        $service = service_factory::instance()->rule_service();
        $service->save($this->rule($system->id, 'core:a/setting'), 2);
        $this->assertTrue($service->delete($system->id, slot_key::parse('core:a/setting')));
        $this->assertFalse($service->delete($system->id, slot_key::parse('core:a/setting')));
        $this->assertSame(0, service_factory::instance()->revisions()->get_many([$system->id])[$system->id]);
        $service->save($this->rule($system->id, 'core:a/setting'), 2);
        $this->assertSame(3, service_factory::instance()->revisions()->get_many([$system->id])[$system->id]);
    }

    /**
     * Activity rules belong to the stylesheet of their course.
     */
    public function test_module_rules_fold_into_the_course(): void {
        $course = $this->getDataGenerator()->create_course();
        $page = $this->getDataGenerator()->create_module('page', ['course' => $course->id]);
        $module = \context_module::instance($page->cmid);
        $coursecontext = \context_course::instance($course->id);
        service_factory::instance()->rule_service()->save($this->rule($module->id, 'core:a/setting'), 2);
        $this->assertCount(1, service_factory::instance()->rules()->find_by_delta($coursecontext->id));
        $this->assertSame(1, service_factory::instance()->revisions()->get_many([$coursecontext->id])[$coursecontext->id]);
        $this->assertSame(0, service_factory::instance()->revisions()->get_many([$module->id])[$module->id]);
    }

    /**
     * Rules are refused in contexts that cannot own a stylesheet.
     */
    public function test_rules_are_refused_in_other_contexts(): void {
        $user = $this->getDataGenerator()->create_user();
        $this->expectException(\InvalidArgumentException::class);
        service_factory::instance()->rule_service()->save($this->rule(\context_user::instance($user->id)->id, 'core:a/setting'), 2);
    }

    /**
     * The per-stylesheet cap is enforced for new rules only.
     */
    public function test_rule_cap(): void {
        set_config('maxrulespercontext', 2, 'local_iconrestyle');
        service_factory::reset();
        $system = \context_system::instance();
        $service = service_factory::instance()->rule_service();
        $service->save($this->rule($system->id, 'core:a/setting'), 2);
        $service->save($this->rule($system->id, 'core:t/edit'), 2);
        $service->save($this->rule($system->id, 'core:t/edit', ['fg' => '#123456']), 2);
        $this->expectException(\InvalidArgumentException::class);
        $service->save($this->rule($system->id, 'core:t/delete'), 2);
    }

    /**
     * A failed change leaves neither a rule nor a revision behind.
     */
    public function test_failed_change_is_rolled_back(): void {
        global $DB;
        $system = \context_system::instance();
        $service = service_factory::instance()->rule_service();
        try {
            $service->save($this->rule($system->id, 'core:a/setting'), 2);
            $service->save($this->rule($system->id, 'core:a/setting', ['fg' => '#fff', 'rev' => 1]), 2);
        } catch (\Throwable $exception) {
            $this->fail('Unexpected failure: ' . $exception->getMessage());
        }
        $before = $DB->count_records('local_iconrestyle_rule');
        try {
            $service->save(new rule(5, $system->id, slot_key::parse('core:a/setting'), ['fg' => '#000', 'rev' => 99]), 2);
            $this->fail('A stale rule was stored');
        } catch (rule_conflict_exception $exception) {
            $this->assertSame($before, $DB->count_records('local_iconrestyle_rule'));
        }
        $this->assertSame(2, (int)$DB->get_field('local_iconrestyle_ctxstate', 'rev', ['contextid' => $system->id]));
    }
}
