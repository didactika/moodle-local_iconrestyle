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
 * Tests for who may customise icons.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

#[\PHPUnit\Framework\Attributes\CoversClass(permissions::class)]
/**
 * Icons are customised in one place, so one capability governs every rule.
 *
 * @covers \local_iconrestyle\rule\permissions
 */
final class permissions_test extends \advanced_testcase {
    /**
     * Administrators and site managers may customise icons.
     */
    public function test_administrator_and_manager_may_customise(): void {
        global $DB;
        $this->resetAfterTest();
        $permissions = new permissions();
        $this->setAdminUser();
        $this->assertTrue(has_capability(permissions::CAPABILITY, \context_system::instance()));
        $permissions->require_manage();

        $user = $this->getDataGenerator()->create_user();
        $managerid = $DB->get_field('role', 'id', ['shortname' => 'manager']);
        $this->getDataGenerator()->role_assign($managerid, $user->id, \context_system::instance()->id);
        $this->setUser($user);
        $this->assertTrue(has_capability(permissions::CAPABILITY, \context_system::instance()));
    }

    /**
     * A manager of a category or a teacher of a course cannot customise icons, because nothing is customised there.
     */
    public function test_category_managers_and_teachers_cannot(): void {
        global $DB;
        $this->resetAfterTest();
        $category = $this->getDataGenerator()->create_category();
        $course = $this->getDataGenerator()->create_course(['category' => $category->id]);
        $manager = $this->getDataGenerator()->create_user();
        $managerid = $DB->get_field('role', 'id', ['shortname' => 'manager']);
        $this->getDataGenerator()->role_assign($managerid, $manager->id, \context_coursecat::instance($category->id)->id);
        $teacher = $this->getDataGenerator()->create_and_enrol($course, 'editingteacher');
        $permissions = new permissions();

        foreach ([$manager, $teacher] as $user) {
            $this->setUser($user);
            $this->assertFalse(has_capability(permissions::CAPABILITY, \context_system::instance()));
        }
        $this->expectException(\required_capability_exception::class);
        $permissions->require_manage();
    }

    /**
     * A rule may apply in the site, a category, a course or an activity, and nowhere else.
     */
    public function test_places_a_rule_may_apply(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $page = $this->getDataGenerator()->create_module('page', ['course' => $course->id]);
        $user = $this->getDataGenerator()->create_user();
        $permissions = new permissions();
        $contexts = [
            \context_system::instance(),
            \context_coursecat::instance($course->category),
            \context_course::instance($course->id),
            \context_module::instance($page->cmid),
        ];
        foreach ($contexts as $context) {
            $this->assertTrue($permissions->supports($context));
        }
        $this->assertFalse($permissions->supports(\context_user::instance($user->id)));
    }
}
