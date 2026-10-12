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
 * A change is checked against the limits of the site before anything is written, by working out what the stylesheets would be
 * afterwards. A change that would make a stylesheet too big or too costly to paint is refused whole, and one that is accepted
 * bumps the revision of each stylesheet it touches once, in the same transaction that stores the rules.
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

    /** @var rule_limits What the rules of a site may add up to. */
    private $limits;

    /** @var sheet_store|null Compiled stylesheets, or null when they are not kept. */
    private $sheets;

    /**
     * Create the service.
     *
     * @param \moodle_database $db Database used for the transaction.
     * @param rule_store $store Rule storage.
     * @param delta_context $deltas Delta owner resolver.
     * @param revision_registry $revisions Revision registry.
     * @param rule_limits $limits What the rules of a site may add up to.
     * @param sheet_store|null $sheets Compiled stylesheets, which are checked against the limits and stored on every change.
     */
    public function __construct(
        \moodle_database $db,
        rule_store $store,
        delta_context $deltas,
        revision_registry $revisions,
        rule_limits $limits,
        ?sheet_store $sheets = null
    ) {
        $this->db = $db;
        $this->store = $store;
        $this->deltas = $deltas;
        $this->revisions = $revisions;
        $this->limits = $limits;
        $this->sheets = $sheets;
    }

    /**
     * Create or update a rule.
     *
     * @param rule $rule Rule to store.
     * @param int $userid User making the change.
     * @return rule Stored rule.
     * @throws rule_conflict_exception When the rule changed since it was read.
     * @throws \InvalidArgumentException When the context cannot hold rules or a limit is reached.
     */
    public function save(rule $rule, int $userid): rule {
        return $this->apply([$rule], [], $userid)['saved'][0];
    }

    /**
     * Create, update and delete several rules in one transaction.
     *
     * Either every change is kept or none is. The revision of a delta stylesheet goes up once however many of its rules
     * changed, so one batch never makes the site build the same stylesheet twice, and the stylesheet that replaces the old
     * one is put in the cache straight away, so the first visitor does not have to wait for it.
     *
     * @param rule[] $rules Rules to store.
     * @param int[] $deleteids Ids of the rules to delete.
     * @param int $userid User making the change.
     * @return array The stored rules, in the order they were given, under saved, and the ids that were deleted, under deleted.
     * @throws rule_conflict_exception When a rule changed since it was read.
     * @throws \InvalidArgumentException When a context cannot hold rules or a limit is reached.
     */
    public function apply(array $rules, array $deleteids, int $userid): array {
        $doomed = [];
        foreach ($deleteids as $id) {
            $existing = $this->store->find_by_id((int)$id);
            if ($existing !== null) {
                $doomed[(int)$id] = $existing;
            }
        }
        $counts = $this->check($rules, $doomed);

        $transaction = $this->db->start_delegated_transaction();
        $touched = [];
        $saved = [];
        $deleted = [];
        $updates = [];
        try {
            foreach ($doomed as $id => $existing) {
                $slot = (string)$existing->slot();
                if ($this->store->delete($existing->contextid(), $slot, $existing->target(), $existing->variant())) {
                    $touched[$this->deltas->owner_of($existing->contextid())] = true;
                    $deleted[] = $id;
                }
            }
            foreach ($rules as $rule) {
                $delta = $this->deltas->owner_of($rule->contextid());
                $saved[] = $this->store->save($delta, $rule, $userid);
                $touched[$delta] = true;
            }
            $updates = $this->publish(array_keys($touched));
        } catch (\Throwable $exception) {
            $transaction->rollback($exception);
        }
        $transaction->allow_commit();
        if ($this->sheets !== null) {
            foreach ($updates as $delta => $update) {
                $this->sheets->replace($delta, $update['rev'], $update['css'], $update['previous']);
            }
        }
        if ($saved !== [] || $deleted !== []) {
            \local_iconrestyle\event\rules_changed::for_change($counts['created'], $counts['updated'], count($deleted))->trigger();
        }
        return ['saved' => $saved, 'deleted' => $deleted];
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
    public function delete(
        int $contextid,
        slot_key $slot,
        string $target = rule::TARGET_ICON,
        string $variant = audience::UNLIMITED
    ): bool {
        $existing = $this->store->find($contextid, (string)$slot, $target, $variant);
        if ($existing === null) {
            return false;
        }
        return $this->apply([], [$existing->id()], 0)['deleted'] !== [];
    }

    /**
     * Identity of a rule within its stylesheet.
     *
     * @param rule $rule Rule.
     * @return string Identity.
     */
    private function identity(rule $rule): string {
        return $rule->contextid() . '|' . $rule->slot() . '|' . $rule->target() . '|' . $rule->variant();
    }

    /**
     * Work out what each touched stylesheet would be and refuse the change when one would go past a limit.
     *
     * Nothing is written here, so a refusal costs nothing and leaves nothing behind.
     *
     * @param rule[] $rules Rules to store.
     * @param rule[] $doomed Rules to delete.
     * @return int[] How many of the rules are new, under created, and how many replace a stored rule, under updated.
     * @throws \InvalidArgumentException When a limit is reached.
     */
    private function check(array $rules, array $doomed): array {
        $counts = ['created' => 0, 'updated' => 0];
        $after = [];
        $before = [];
        $stored = [];
        foreach ($doomed as $existing) {
            $delta = $this->deltas->owner_of($existing->contextid());
            $this->load($delta, $after, $before, $stored);
            unset($after[$delta][$this->identity($existing)]);
        }
        foreach ($rules as $rule) {
            if ($rule->design()->cost() > design::MAX_COST) {
                throw new \InvalidArgumentException('The effects of this rule are too expensive to paint.');
            }
            $delta = $this->deltas->owner_of($rule->contextid());
            $this->load($delta, $after, $before, $stored);
            $was = $stored[$delta][$this->identity($rule)] ?? null;
            if ($was !== null && $rule->id() > 0 && $was->rev() !== $rule->rev()) {
                throw new rule_conflict_exception('The rule changed since it was read.');
            }
            $counts[$was === null ? 'created' : 'updated']++;
            $after[$delta][$this->identity($rule)] = $rule;
        }
        $newdeltas = 0;
        foreach ($after as $delta => $set) {
            if (count($set) > $this->limits->rules()) {
                throw new \InvalidArgumentException('Rule limit reached for this context.');
            }
            if ($before[$delta] === 0 && $set !== []) {
                $this->check_new_delta($delta, $newdeltas++);
            }
            $this->check_sheet($set);
        }
        return $counts;
    }

    /**
     * Read the rules a stylesheet has now, once.
     *
     * @param int $delta Delta owner context.
     * @param rule[][] $after Rules of each stylesheet by identity, which this fills.
     * @param int[] $before How many rules each stylesheet has now, which this fills.
     * @param rule[][] $stored Rules of each stylesheet by identity as they are stored, which this fills.
     */
    private function load(int $delta, array &$after, array &$before, array &$stored): void {
        if (isset($after[$delta])) {
            return;
        }
        $stored[$delta] = [];
        foreach ($this->store->find_by_delta($delta) as $existing) {
            $stored[$delta][$this->identity($existing)] = $existing;
        }
        $after[$delta] = $stored[$delta];
        $before[$delta] = count($stored[$delta]);
    }

    /**
     * Refuse a first rule in a context when the site already serves as many stylesheets as it is allowed to.
     *
     * The site context is always allowed. Other contexts are limited in number, and by how many of their parents already
     * have rules, because the stylesheet of a page is made of every one of them and the address has room for a few.
     *
     * @param int $delta Delta owner context that is getting its first rule.
     * @param int $others Contexts that get their first rule in the same change.
     * @throws \InvalidArgumentException When a limit is reached.
     */
    private function check_new_delta(int $delta, int $others): void {
        $context = \context::instance_by_id($delta);
        if ($context->contextlevel === CONTEXT_SYSTEM) {
            return;
        }
        if ($this->revisions->count_active() + $others >= $this->limits->contexts()) {
            throw new \InvalidArgumentException('Too many categories and courses have rules of their own.');
        }
        $parents = array_filter($this->revisions->get_many($context->get_parent_context_ids()));
        if (count($parents) >= rule_limits::MAX_CHAIN) {
            throw new \InvalidArgumentException('Too many parents of this context have rules of their own.');
        }
    }

    /**
     * Refuse the rules of one stylesheet when its effects would cost too much or its CSS would be too big.
     *
     * @param rule[] $set Rules the stylesheet would have.
     * @throws \InvalidArgumentException When a limit is reached.
     */
    private function check_sheet(array $set): void {
        $cost = 0;
        foreach ($set as $each) {
            $cost += $each->design()->cost();
        }
        if ($cost > $this->limits->cost()) {
            throw new \InvalidArgumentException('The effects of the rules of this context are too expensive to paint.');
        }
        if ($this->sheets === null || $set === []) {
            return;
        }
        if (strlen($this->sheets->compile(array_values($set))) > $this->limits->sheet_bytes()) {
            throw new \InvalidArgumentException('The stylesheet of this context would be too big.');
        }
    }

    /**
     * Raise the revision of every stylesheet that changed and compile the new ones.
     *
     * @param int[] $deltas Delta owner contexts that changed.
     * @return array[] For each one the new effective revision as rev, its compiled CSS as css and the effective revision it
     *     replaces as previous.
     */
    private function publish(array $deltas): array {
        $previous = $this->revisions->get_many($deltas);
        $updates = [];
        foreach ($deltas as $delta) {
            $rules = $this->store->find_by_delta($delta);
            $updates[$delta] = [
                'rev' => $this->revisions->bump($delta, count($rules)),
                'css' => $rules === [] || $this->sheets === null ? '' : $this->sheets->compile($rules),
                'previous' => $previous[$delta] ?? 0,
            ];
        }
        return $updates;
    }
}
