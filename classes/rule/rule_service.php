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
 * Creates, updates and deletes rules.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

use local_iconrestyle\slot\slot_key;

/**
 * Every change bumps the revision of the affected delta stylesheet in the same transaction.
 */
class rule_service {
    /** @var \moodle_database Database. */
    private $db;

    /** @var rule_store Rule storage. */
    private $store;

    /** @var delta_context Delta owner resolver. */
    private $deltas;

    /** @var revision_registry Revision registry. */
    private $revisions;

    /** @var int Most rules one delta stylesheet may hold. */
    private $maxrules;

    /**
     * Create the service.
     *
     * @param \moodle_database $db Database used for the transaction.
     * @param rule_store $store Rule storage.
     * @param delta_context $deltas Delta owner resolver.
     * @param revision_registry $revisions Revision registry.
     * @param int $maxrules Most rules one delta stylesheet may hold.
     */
    public function __construct(
        \moodle_database $db,
        rule_store $store,
        delta_context $deltas,
        revision_registry $revisions,
        int $maxrules
    ) {
        $this->db = $db;
        $this->store = $store;
        $this->deltas = $deltas;
        $this->revisions = $revisions;
        $this->maxrules = $maxrules;
    }

    /**
     * Create or update a rule.
     *
     * @param rule $rule Rule to store.
     * @param int $userid User making the change.
     * @return rule Stored rule.
     * @throws rule_conflict_exception When the rule changed since it was read.
     * @throws \InvalidArgumentException When the context cannot hold rules or the cap is reached.
     */
    public function save(rule $rule, int $userid): rule {
        $delta = $this->deltas->owner_of($rule->contextid());
        $transaction = $this->db->start_delegated_transaction();
        try {
            $existing = $this->store->find($rule->contextid(), (string)$rule->slot(), $rule->target(), $rule->variant());
            if ($existing === null && $this->store->count_by_delta($delta) >= $this->maxrules) {
                throw new \InvalidArgumentException('Rule limit reached for this context.');
            }
            $stored = $this->store->save($delta, $rule, $userid);
            $this->revisions->bump($delta, $this->store->count_by_delta($delta));
        } catch (\Throwable $exception) {
            $transaction->rollback($exception);
        }
        $transaction->allow_commit();
        return $stored;
    }

    /**
     * Delete a rule.
     *
     * @param int $contextid Rule context.
     * @param slot_key $slot Slot.
     * @param string $target Target.
     * @param string $variant Identity of the rule's pages and regions.
     * @return bool True when a rule was deleted.
     */
    public function delete(int $contextid, slot_key $slot, string $target = rule::TARGET_ICON, string $variant = ''): bool {
        $delta = $this->deltas->owner_of($contextid);
        $transaction = $this->db->start_delegated_transaction();
        try {
            $deleted = $this->store->delete($contextid, (string)$slot, $target, $variant);
            if ($deleted) {
                $this->revisions->bump($delta, $this->store->count_by_delta($delta));
            }
        } catch (\Throwable $exception) {
            $transaction->rollback($exception);
        }
        $transaction->allow_commit();
        return $deleted;
    }

    /**
     * Delete a rule by its id.
     *
     * @param int $id Rule id.
     * @return bool True when a rule was deleted.
     */
    public function delete_by_id(int $id): bool {
        $rule = $this->store->find_by_id($id);
        if ($rule === null) {
            return false;
        }
        return $this->delete($rule->contextid(), $rule->slot(), $rule->target(), $rule->variant());
    }
}
