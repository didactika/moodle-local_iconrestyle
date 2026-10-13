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
 * Tells which activity a rule is limited to.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * Activity rules are compiled into the stylesheet of their course, so the CSS itself must keep them on their activity.
 */
class module_scope {
    /** @var array<int, int|null> Answers already worked out, keyed by context id. */
    private $known = [];

    /**
     * The activity a rule's context belongs to.
     *
     * @param int $contextid Context id of the rule.
     * @return int|null Course module id, or null when the context is not an activity.
     */
    public function cmid_of(int $contextid): ?int {
        if (!array_key_exists($contextid, $this->known)) {
            $context = \context::instance_by_id($contextid, IGNORE_MISSING);
            $this->known[$contextid] = $context && $context->contextlevel === CONTEXT_MODULE ? (int)$context->instanceid : null;
        }
        return $this->known[$contextid];
    }
}
