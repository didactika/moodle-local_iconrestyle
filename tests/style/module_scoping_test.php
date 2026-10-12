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
 * Tests that an activity rule stays on its activity.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(stylesheet_compiler::class)]
/**
 * Activity rules are compiled into the stylesheet of their course, so their selectors must name the activity.
 *
 * @covers \local_iconrestyle\style\stylesheet_compiler
 * @covers \local_iconrestyle\rule\module_scope
 */
final class module_scoping_test extends \advanced_testcase {
    /**
     * Start from a fresh factory.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
    }

    /**
     * An activity rule is limited to the activity's block on the course page and to the activity's own page.
     */
    public function test_activity_rule_is_limited_to_its_activity(): void {
        $course = $this->getDataGenerator()->create_course();
        $assign = $this->getDataGenerator()->create_module('assign', ['course' => $course->id]);
        $context = \context_module::instance($assign->cmid);
        $rule = new rule(0, $context->id, slot_key::parse('core:a/setting'), ['fg' => '#0a6b3d']);

        $css = service_factory::instance()->compiler()->compile([$rule]);

        $this->assertStringContainsString("body #module-{$assign->cmid} ", $css);
        $this->assertStringContainsString("body.cmid-{$assign->cmid} ", $css);
        $this->assertStringContainsString('color: #0a6b3d;', $css);
    }

    /**
     * Rules of a course or the site keep the plain prefix, and the preview leaves activity rules unscoped.
     */
    public function test_other_rules_and_the_preview_are_not_scoped(): void {
        $course = $this->getDataGenerator()->create_course();
        $assign = $this->getDataGenerator()->create_module('assign', ['course' => $course->id]);
        $compiler = service_factory::instance()->compiler();
        $options = ['fg' => '#0a6b3d'];

        $site = new rule(0, \context_system::instance()->id, slot_key::parse('core:a/setting'), $options);
        $this->assertStringNotContainsString('#module-', $compiler->compile([$site]));

        $module = new rule(0, \context_module::instance($assign->cmid)->id, slot_key::parse('core:a/setting'), $options);
        $preview = $compiler->compile([$module], '.irs-preview-new ', false);
        $this->assertStringNotContainsString('#module-', $preview);
        $this->assertStringNotContainsString('cmid-', $preview);
        $this->assertStringContainsString('.irs-preview-new ', $preview);
    }
}
