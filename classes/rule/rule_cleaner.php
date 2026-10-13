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
 * Removes the rules of contexts that have been deleted.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * Works from context ids alone, because by the time a deletion event arrives the context may already be gone.
 */
class rule_cleaner {
    /** @var \moodle_database Database used for the transaction. */
    private $db;

    /** @var rule_store Rule storage. */
    private $store;

    /** @var revision_registry Revision registry. */
    private $revisions;

    /** @var sheet_store|null Compiled stylesheets, which are dropped with the rules they were made from. */
    private $sheets;

    /**
     * Create the cleaner.
     *
     * @param \moodle_database $db Database used for the transaction.
     * @param rule_store $store Rule storage.
     * @param revision_registry $revisions Revision registry.
     * @param sheet_store|null $sheets Compiled stylesheets.
     */
    public function __construct(
        \moodle_database $db,
        rule_store $store,
        revision_registry $revisions,
        ?sheet_store $sheets = null
    ) {
        $this->db = $db;
        $this->store = $store;
        $this->revisions = $revisions;
        $this->sheets = $sheets;
    }

    /**
     * Forget a category or course that no longer exists, together with the activity rules folded into it.
     *
     * @param int $contextid Delta owner context of the deleted category or course.
     * @return int Number of rules removed.
     */
    public function forget_delta(int $contextid): int {
        $previous = $this->revisions->get_many([$contextid])[$contextid] ?? 0;
        $transaction = $this->db->start_delegated_transaction();
        try {
            $removed = $this->store->delete_by_delta($contextid) + $this->store->delete_by_context($contextid);
            $this->revisions->forget($contextid);
        } catch (\Throwable $exception) {
            $transaction->rollback($exception);
        }
        $transaction->allow_commit();
        if ($this->sheets !== null) {
            $this->sheets->forget($contextid, $previous);
        }
        return $removed;
    }

    /**
     * Forget the rules of a deleted activity and refresh the stylesheet of its course.
     *
     * @param int $modulecontextid Context of the deleted activity.
     * @param int $coursecontextid Context of the course, which owns the stylesheet the rules were compiled into.
     * @return int Number of rules removed.
     */
    public function forget_module(int $modulecontextid, int $coursecontextid): int {
        $previous = $this->revisions->get_many([$coursecontextid])[$coursecontextid] ?? 0;
        $transaction = $this->db->start_delegated_transaction();
        try {
            $removed = $this->store->delete_by_context($modulecontextid);
            if ($removed > 0) {
                $this->revisions->bump($coursecontextid, $this->store->count_by_delta($coursecontextid));
            }
        } catch (\Throwable $exception) {
            $transaction->rollback($exception);
        }
        $transaction->allow_commit();
        if ($removed > 0 && $this->sheets !== null) {
            $this->sheets->forget($coursecontextid, $previous);
        }
        return $removed;
    }
}
