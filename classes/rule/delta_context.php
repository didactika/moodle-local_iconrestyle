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
 * Delta stylesheet owner resolution.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * System, category and course contexts own a stylesheet; a module is folded into its course.
 */
class delta_context {
    /**
     * Delta owner of a context.
     *
     * @param int $contextid Rule context.
     * @return int Delta owner context id.
     * @throws \InvalidArgumentException When rules are not allowed in that kind of context.
     */
    public function owner_of(int $contextid): int {
        $context = \context::instance_by_id($contextid, IGNORE_MISSING);
        if (!$context) {
            throw new \InvalidArgumentException('Unknown context.');
        }
        switch ($context->contextlevel) {
            case CONTEXT_SYSTEM:
            case CONTEXT_COURSECAT:
            case CONTEXT_COURSE:
                return (int)$context->id;
            case CONTEXT_MODULE:
                return (int)$context->get_course_context()->id;
            default:
                throw new \InvalidArgumentException('Rules are not allowed in this context.');
        }
    }
}
