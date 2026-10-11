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
 * Verify that each scope has its own capability and that nothing leaks between scopes.
 *
 * @covers \local_iconrestyle\rule\permissions
 */
final class permissions_test extends \advanced_testcase {
    /**
     * Administrators may customise every scope.
     */
    public function test_administrator_may_manage_every_scope(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $course = $this->getDataGenerator()->create_course();
        $page = $this->getDataGenerator()->create_module('page', ['course' => $course->id]);
        $permissions = new permissions();
        $contexts = [
            \context_system::instance(),
            \context_coursecat::instance($course->category),
            \context_course::instance($course->id),
            \context_module::instance($page->cmid),
        ];
        foreach ($contexts as $context) {
            $this->assertTrue($permissions->can_manage($context));
            $permissions->require_manage($context);
        }
    }

    /**
     * A category manager can restyle the category and what is below it, but not the site.
     */
    public function test_category_manager_is_limited_to_the_category(): void {
        global $DB;
        $this->resetAfterTest();
        $category = $this->getDataGenerator()->create_category();
        $other = $this->getDataGenerator()->create_category();
        $course = $this->getDataGenerator()->create_course(['category' => $category->id]);
        $user = $this->getDataGenerator()->create_user();
        $managerid = $DB->get_field('role', 'id', ['shortname' => 'manager']);
        $this->getDataGenerator()->role_assign($managerid, $user->id, \context_coursecat::instance($category->id)->id);
        $this->setUser($user);

        $permissions = new permissions();
        $this->assertTrue($permissions->can_manage(\context_coursecat::instance($category->id)));
        $this->assertFalse($permissions->can_manage(\context_system::instance()));
        $this->assertFalse($permissions->can_manage(\context_coursecat::instance($other->id)));
        $this->assertFalse(
            $permissions->can_manage(\context_course::instance($course->id)),
            'managecourse is a separate capability'
        );

        $this->expectException(\required_capability_exception::class);
        $permissions->require_manage(\context_system::instance());
    }

    /**
     * Teachers cannot restyle anything until the site grants the capability, and then only their own course.
     */
    public function test_teacher_needs_a_grant_and_only_in_their_course(): void {
        global $DB;
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $other = $this->getDataGenerator()->create_course();
        $teacher = $this->getDataGenerator()->create_and_enrol($course, 'editingteacher');
        $this->setUser($teacher);
        $permissions = new permissions();
        $coursecontext = \context_course::instance($course->id);
        $this->assertFalse($permissions->can_manage($coursecontext));

        $roleid = $DB->get_field('role', 'id', ['shortname' => 'editingteacher']);
        assign_capability('local/iconrestyle:managecourse', CAP_ALLOW, $roleid, \context_system::instance()->id);
        $this->assertTrue($permissions->can_manage($coursecontext));
        $this->assertFalse($permissions->can_manage(\context_course::instance($other->id)));
        $this->assertFalse($permissions->can_manage(\context_system::instance()));
    }

    /**
     * Contexts that cannot hold rules are refused.
     */
    public function test_unsupported_contexts(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $user = $this->getDataGenerator()->create_user();
        $context = \context_user::instance($user->id);
        $permissions = new permissions();
        $this->assertFalse($permissions->supports($context));
        $this->assertFalse($permissions->can_manage($context));
        $this->expectException(\InvalidArgumentException::class);
        $permissions->require_manage($context);
    }
}
