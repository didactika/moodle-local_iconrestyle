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
 * Tests for the event that says the customisations changed.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\event;

use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(rules_changed::class)]
/**
 * Verify that one event reports each saved change, with what it added, changed and removed.
 *
 * @covers \local_iconrestyle\event\rules_changed
 */
final class rules_changed_test extends \advanced_testcase {
    /**
     * Start from a fresh factory and an administrator.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
        $this->setAdminUser();
    }

    /**
     * Build a rule on the whole site.
     *
     * @param string $slot Slot key.
     * @param array $options Options.
     * @return rule Rule.
     */
    private function rule(string $slot, array $options = ['fg' => '#112233']): rule {
        return new rule(0, \context_system::instance()->id, slot_key::parse($slot), $options);
    }

    /**
     * A batch is one event with its counts.
     */
    public function test_one_event_for_each_change(): void {
        $sink = $this->redirectEvents();
        $service = service_factory::instance()->rule_service();
        $service->apply([$this->rule('core:a/setting'), $this->rule('core:t/delete'), $this->rule('core:t/edit')], [], 2);
        $service->apply([$this->rule('core:a/setting', ['fg' => '#445566'])], [], 2);
        $first = service_factory::instance()->rules()->find_all()[0];
        $service->apply([], [$first->id()], 2);
        $events = array_values(array_filter($sink->get_events(), function ($event) {
            return $event instanceof rules_changed;
        }));
        $this->assertCount(3, $events);
        $this->assertSame([3, 0, 0], [$events[0]->other['created'], $events[0]->other['updated'], $events[0]->other['deleted']]);
        $this->assertSame([0, 1, 0], [$events[1]->other['created'], $events[1]->other['updated'], $events[1]->other['deleted']]);
        $this->assertSame([0, 0, 1], [$events[2]->other['created'], $events[2]->other['updated'], $events[2]->other['deleted']]);
        $this->assertSame(\context_system::instance()->id, $events[0]->contextid);
        $this->assertStringContainsString('3 added', $events[0]->get_description());
    }

    /**
     * A refused change and a change that did nothing report nothing.
     */
    public function test_nothing_is_reported_when_nothing_changed(): void {
        $sink = $this->redirectEvents();
        $service = service_factory::instance()->rule_service();
        $service->apply([], [999999], 2);
        try {
            $service->apply([$this->rule('core:a/setting', ['design' => ['blur' => 20, 'shadow' => 'glow', 'saturate' => 200,
                'hue' => 30, 'brightness' => 150, 'contrast' => 150, 'grayscale' => 20]])], [], 2);
        } catch (\InvalidArgumentException $exception) {
            $this->assertInstanceOf(\InvalidArgumentException::class, $exception);
        }
        $this->assertCount(0, array_filter($sink->get_events(), function ($event) {
            return $event instanceof rules_changed;
        }));
    }
}
