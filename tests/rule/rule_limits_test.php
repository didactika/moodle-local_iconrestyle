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
 * Tests for the limits that keep a site fast.
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
 * Verify that a change that would make the site slow is refused, and that a refusal leaves nothing behind.
 *
 * @covers \local_iconrestyle\rule\rule_service
 * @covers \local_iconrestyle\rule\rule_limits
 */
final class rule_limits_test extends \advanced_testcase {
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
     * Keys of font icons that can be customised.
     *
     * @param int $count How many.
     * @return string[] Slot keys.
     */
    private function slots(int $count): array {
        $keys = [];
        foreach (service_factory::instance()->catalogue()->all() as $entry) {
            if ($entry['kind'] === 'font') {
                $keys[] = $entry['key'];
            }
        }
        sort($keys);
        return array_slice($keys, 0, $count);
    }

    /**
     * The categories and courses that have rules of their own are limited, and the whole site is not counted.
     */
    public function test_contexts_with_rules_are_limited(): void {
        set_config('maxcontextswithrules', 3, 'local_iconrestyle');
        service_factory::reset();
        $service = service_factory::instance()->rule_service();
        $service->save($this->rule(\context_system::instance()->id, 'core:a/setting'), 2);
        $courses = [];
        for ($i = 0; $i < 4; $i++) {
            $courses[] = \context_course::instance($this->getDataGenerator()->create_course()->id);
        }
        for ($i = 0; $i < 3; $i++) {
            $service->save($this->rule($courses[$i]->id, 'core:a/setting'), 2);
        }
        $this->assertSame(3, service_factory::instance()->revisions()->count_active());
        try {
            $service->save($this->rule($courses[3]->id, 'core:a/setting'), 2);
            $this->fail('A fourth context with rules was accepted.');
        } catch (\InvalidArgumentException $exception) {
            $this->assertStringContainsString('Too many categories and courses', $exception->getMessage());
        }
        $service->save($this->rule($courses[0]->id, 'core:t/delete'), 2);
        $this->assertSame(0, service_factory::instance()->rules()->count_by_delta($courses[3]->id));
    }

    /**
     * A context whose parents already have as many stylesheets as a page can load is refused.
     */
    public function test_a_page_cannot_gather_more_stylesheets_than_it_can_load(): void {
        $parent = 0;
        $contexts = [];
        for ($i = 0; $i < rule_limits::MAX_CHAIN + 2; $i++) {
            $parent = (int)$this->getDataGenerator()->create_category(['parent' => $parent])->id;
            $contexts[] = \context_coursecat::instance($parent);
        }
        $revisions = service_factory::instance()->revisions();
        $revisions->bump(\context_system::instance()->id, 1);
        for ($i = 0; $i < rule_limits::MAX_CHAIN - 2; $i++) {
            $revisions->bump($contexts[$i]->id, 1);
        }
        $service = service_factory::instance()->rule_service();
        $service->save($this->rule($contexts[rule_limits::MAX_CHAIN - 2]->id, 'core:a/setting'), 2);
        try {
            $service->save($this->rule($contexts[rule_limits::MAX_CHAIN - 1]->id, 'core:a/setting'), 2);
            $this->fail('A context below too many stylesheets was accepted.');
        } catch (\InvalidArgumentException $exception) {
            $this->assertStringContainsString('Too many parents', $exception->getMessage());
        }
    }

    /**
     * A stylesheet that would be bigger than the cap is refused, and nothing of the change is kept.
     */
    public function test_a_stylesheet_over_the_cap_is_refused_whole(): void {
        set_config('maxsheetkb', 1, 'local_iconrestyle');
        service_factory::reset();
        $system = \context_system::instance()->id;
        $service = service_factory::instance()->rule_service();
        $service->save($this->rule($system, 'core:a/setting'), 2);
        $before = service_factory::instance()->revisions()->get_many([$system])[$system];
        $batch = [];
        foreach ($this->slots(40) as $key) {
            $batch[] = $this->rule($system, $key, ['fg' => '#112233', 'pages' => ['admin', 'course'], 'regions' => ['navbar']]);
        }
        try {
            $service->apply($batch, [], 2);
            $this->fail('A stylesheet over the cap was accepted.');
        } catch (\InvalidArgumentException $exception) {
            $this->assertStringContainsString('too big', $exception->getMessage());
        }
        $this->assertSame(1, service_factory::instance()->rules()->count_by_delta($system));
        $this->assertSame($before, service_factory::instance()->revisions()->get_many([$system])[$system]);
    }

    /**
     * One rule cannot stack every expensive effect.
     */
    public function test_a_rule_with_too_many_effects_is_refused(): void {
        $system = \context_system::instance()->id;
        $service = service_factory::instance()->rule_service();
        $heavy = ['blur' => 20, 'shadow' => 'glow', 'brightness' => 150, 'contrast' => 150, 'saturate' => 200, 'hue' => 30,
            'grayscale' => 10, 'scale' => 150, 'opacity' => 90];
        $this->assertGreaterThan(design::MAX_COST, design::from_array($heavy)->cost());
        $this->expectException(\InvalidArgumentException::class);
        $service->save($this->rule($system, 'core:a/setting', ['design' => $heavy]), 2);
    }

    /**
     * The effects of all the rules of a context are limited together.
     */
    public function test_the_effects_of_a_context_are_limited_together(): void {
        set_config('maxeffectcost', 10, 'local_iconrestyle');
        service_factory::reset();
        $system = \context_system::instance()->id;
        $service = service_factory::instance()->rule_service();
        $keys = $this->slots(4);
        $glow = ['design' => ['shadow' => 'glow']];
        $service->save($this->rule($system, $keys[0], $glow), 2);
        $service->save($this->rule($system, $keys[1], $glow), 2);
        try {
            $service->save($this->rule($system, $keys[2], $glow), 2);
            $this->fail('Effects past the budget were accepted.');
        } catch (\InvalidArgumentException $exception) {
            $this->assertStringContainsString('too expensive', $exception->getMessage());
        }
        $this->assertSame(2, service_factory::instance()->rules()->count_by_delta($system));
    }

    /**
     * A batch with one refused rule stores none of its rules and raises no revision.
     */
    public function test_a_batch_is_all_or_nothing(): void {
        $system = \context_system::instance()->id;
        $service = service_factory::instance()->rule_service();
        $keys = $this->slots(3);
        try {
            $service->apply([
                $this->rule($system, $keys[0]),
                $this->rule($system, $keys[1], ['design' => ['blur' => 20, 'shadow' => 'glow', 'saturate' => 200, 'hue' => 30,
                    'brightness' => 150, 'contrast' => 150, 'grayscale' => 20]]),
            ], [], 2);
            $this->fail('A batch with a refused rule was accepted.');
        } catch (\InvalidArgumentException $exception) {
            $this->assertInstanceOf(\InvalidArgumentException::class, $exception);
        }
        $this->assertSame(0, service_factory::instance()->rules()->count_by_delta($system));
        $this->assertSame([$system => 0], service_factory::instance()->revisions()->get_many([$system]));
    }

    /**
     * Saving many rules at once raises the revision of the stylesheet once.
     */
    public function test_a_batch_raises_each_revision_once(): void {
        $system = \context_system::instance()->id;
        $service = service_factory::instance()->rule_service();
        $batch = [];
        foreach ($this->slots(30) as $key) {
            $batch[] = $this->rule($system, $key);
        }
        $service->apply($batch, [], 2);
        $this->assertSame([$system => 1], service_factory::instance()->revisions()->get_many([$system]));
    }
}
