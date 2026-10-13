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
 * Event observers that drop rules when their context is deleted.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\hook;

use local_iconrestyle\service_factory;

/**
 * Deletions are rare, so these handlers do the work directly instead of queueing it.
 */
class deletion_observer {
    /**
     * A course was deleted.
     *
     * @param \core\event\course_deleted $event The event.
     */
    public static function course_deleted(\core\event\course_deleted $event): void {
        service_factory::instance()->rule_cleaner()->forget_delta((int)$event->contextid);
    }

    /**
     * A course category was deleted.
     *
     * @param \core\event\course_category_deleted $event The event.
     */
    public static function category_deleted(\core\event\course_category_deleted $event): void {
        service_factory::instance()->rule_cleaner()->forget_delta((int)$event->contextid);
    }

    /**
     * An activity was deleted.
     *
     * @param \core\event\course_module_deleted $event The event.
     */
    public static function module_deleted(\core\event\course_module_deleted $event): void {
        $course = \context_course::instance((int)$event->courseid, IGNORE_MISSING);
        if (!$course) {
            return;
        }
        service_factory::instance()->rule_cleaner()->forget_module((int)$event->contextid, (int)$course->id);
    }
}
