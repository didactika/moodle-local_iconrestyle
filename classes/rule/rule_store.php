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
 * Rule storage.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

use local_iconrestyle\slot\slot_key;

/**
 * Persists rules with the DML API only, so every supported database behaves the same.
 */
class rule_store {
    /** @var string Table name. */
    private const TABLE = 'local_iconrestyle_rule';

    /** @var \moodle_database Database. */
    private $db;

    /**
     * Create the store.
     *
     * @param \moodle_database $db Database.
     */
    public function __construct(\moodle_database $db) {
        $this->db = $db;
    }

    /**
     * Rules compiled into one delta stylesheet.
     *
     * @param int $deltactxid Delta owner context.
     * @return rule[] Rules.
     */
    public function find_by_delta(int $deltactxid): array {
        $records = $this->db->get_records(self::TABLE, ['deltactxid' => $deltactxid], 'slotkey ASC, target ASC');
        return array_values(array_map([$this, 'to_rule'], $records));
    }

    /**
     * Rules of several delta stylesheets, grouped by stylesheet, with one query.
     *
     * @param int[] $deltas Delta owner contexts.
     * @return rule[][] Rules of each stylesheet, in the order the stylesheet is compiled in.
     */
    public function find_by_deltas(array $deltas): array {
        $grouped = array_fill_keys($deltas, []);
        if ($deltas === []) {
            return $grouped;
        }
        $records = $this->db->get_records_list(self::TABLE, 'deltactxid', array_values($deltas), 'slotkey ASC, target ASC');
        foreach ($records as $record) {
            $grouped[(int)$record->deltactxid][] = $this->to_rule($record);
        }
        return $grouped;
    }

    /**
     * Every rule of the site, in a stable order.
     *
     * @return rule[] Rules.
     */
    public function find_all(): array {
        $records = $this->db->get_records(self::TABLE, null, 'slotkey ASC, target ASC, contextid ASC, variant ASC');
        return array_values(array_map([$this, 'to_rule'], $records));
    }

    /**
     * Every rule of the site, one at a time, so that a site with very many rules never holds them all in memory.
     *
     * @return \Generator<rule> Rules.
     */
    public function each(): \Generator {
        $records = $this->db->get_recordset(self::TABLE, null, 'slotkey ASC, target ASC, contextid ASC, variant ASC');
        try {
            foreach ($records as $record) {
                yield $this->to_rule($record);
            }
        } finally {
            $records->close();
        }
    }

    /**
     * One rule by its id.
     *
     * @param int $id Rule id.
     * @return rule|null Rule or null.
     */
    public function find_by_id(int $id): ?rule {
        $record = $this->db->get_record(self::TABLE, ['id' => $id]);
        return $record ? $this->to_rule($record) : null;
    }

    /**
     * One rule by its natural key.
     *
     * @param int $contextid Context id.
     * @param string $slotkey Slot key.
     * @param string $target Target.
     * @param string $variant Identity of the rule's pages and regions.
     * @return rule|null Rule or null.
     */
    public function find(int $contextid, string $slotkey, string $target, string $variant = audience::UNLIMITED): ?rule {
        $record = $this->db->get_record(
            self::TABLE,
            ['contextid' => $contextid, 'slotkey' => $slotkey, 'target' => $target, 'variant' => $variant]
        );
        return $record ? $this->to_rule($record) : null;
    }

    /**
     * Create or update a rule.
     *
     * An existing rule is updated only when the given revision matches the stored one.
     *
     * @param int $deltactxid Delta owner context.
     * @param rule $rule Rule to store.
     * @param int $userid User making the change.
     * @return rule Stored rule.
     * @throws rule_conflict_exception When the stored revision differs from the given one.
     */
    public function save(int $deltactxid, rule $rule, int $userid): rule {
        $now = time();
        $values = $this->values_of($deltactxid, $rule, $userid, $now);
        $existing = $this->db->get_record(
            self::TABLE,
            [
                'contextid' => $rule->contextid(),
                'slotkey' => $values['slotkey'],
                'target' => $values['target'],
                'variant' => $values['variant'],
            ]
        );
        if ($existing) {
            if ($rule->id() > 0 && (int)$existing->rev !== $rule->rev()) {
                throw new rule_conflict_exception('The rule changed since it was read.');
            }
            $values['id'] = $existing->id;
            $values['rev'] = (int)$existing->rev + 1;
            $this->db->update_record(self::TABLE, (object)$values);
            return $this->to_rule((object)$values);
        }
        $values['rev'] = 1;
        $values['timecreated'] = $now;
        $values['id'] = $this->db->insert_record(self::TABLE, (object)$values);
        return $this->to_rule((object)$values);
    }

    /**
     * Create or update many rules at once, with one query to find the ones that exist and one to insert the new ones.
     *
     * A rule that appears twice keeps its last version. The rules that are written are not read back.
     *
     * @param array[] $items Pairs of delta owner context id and rule.
     * @param int $userid User making the change.
     * @throws rule_conflict_exception When a stored rule changed since it was read.
     */
    public function save_many(array $items, int $userid): void {
        if ($items === []) {
            return;
        }
        $now = time();
        $contextids = [];
        $wanted = [];
        foreach ($items as [$deltactxid, $rule]) {
            $contextids[$rule->contextid()] = true;
            $wanted[self::identity_of($rule->contextid(), (string)$rule->slot(), $rule->target(), $rule->variant())] =
                [$deltactxid, $rule];
        }
        $existing = [];
        $records = $this->db->get_records_list(
            self::TABLE,
            'contextid',
            array_keys($contextids),
            '',
            'id, contextid, slotkey, target, variant, rev'
        );
        foreach ($records as $record) {
            $existing[self::identity_of((int)$record->contextid, $record->slotkey, $record->target, $record->variant)] = $record;
        }
        $inserts = [];
        foreach ($wanted as $identity => [$deltactxid, $rule]) {
            $values = $this->values_of($deltactxid, $rule, $userid, $now);
            if (isset($existing[$identity])) {
                if ($rule->id() > 0 && (int)$existing[$identity]->rev !== $rule->rev()) {
                    throw new rule_conflict_exception('The rule changed since it was read.');
                }
                $values['id'] = $existing[$identity]->id;
                $values['rev'] = (int)$existing[$identity]->rev + 1;
                $this->db->update_record(self::TABLE, (object)$values);
            } else {
                $values['rev'] = 1;
                $values['timecreated'] = $now;
                $inserts[] = (object)$values;
            }
        }
        if ($inserts !== []) {
            $this->db->insert_records(self::TABLE, $inserts);
        }
    }

    /**
     * Which of the identities of some rules are already stored.
     *
     * @param int[] $contextids Contexts that hold the rules.
     * @return bool[] True for each identity, as identity_of() writes it, that has a stored rule.
     */
    public function stored_identities(array $contextids): array {
        if ($contextids === []) {
            return [];
        }
        $stored = [];
        $records = $this->db->get_records_list(
            self::TABLE,
            'contextid',
            array_values($contextids),
            '',
            'id, contextid, slotkey, target, variant'
        );
        foreach ($records as $record) {
            $stored[self::identity_of((int)$record->contextid, $record->slotkey, $record->target, $record->variant)] = true;
        }
        return $stored;
    }

    /**
     * Identity of a rule within its context.
     *
     * @param int $contextid Context id.
     * @param string $slotkey Slot key.
     * @param string $target Target.
     * @param string $variant Identity of the rule's pages and regions.
     * @return string Identity.
     */
    public static function identity_of(int $contextid, string $slotkey, string $target, string $variant): string {
        return $contextid . '|' . $slotkey . '|' . $target . '|' . $variant;
    }

    /**
     * The columns that a rule is stored in.
     *
     * @param int $deltactxid Delta owner context.
     * @param rule $rule Rule.
     * @param int $userid User making the change.
     * @param int $now Time of the change.
     * @return array Values by column.
     */
    private function values_of(int $deltactxid, rule $rule, int $userid, int $now): array {
        return [
            'contextid' => $rule->contextid(),
            'deltactxid' => $deltactxid,
            'slotkey' => (string)$rule->slot(),
            'painter' => $rule->painter(),
            'assetid' => $rule->assetid(),
            'fg' => $rule->fg() ? $rule->fg()->stored() : null,
            'bg' => $rule->bg() ? $rule->bg()->stored() : null,
            'design' => $rule->design()->json(),
            'target' => $rule->target(),
            'pages' => implode(',', $rule->pages()),
            'regions' => implode(',', $rule->regions()),
            'mode' => $rule->mode(),
            'variant' => $rule->variant(),
            'enabled' => (int)$rule->enabled(),
            'usermodified' => $userid,
            'timemodified' => $now,
        ];
    }

    /**
     * Delete a rule.
     *
     * @param int $contextid Context id.
     * @param string $slotkey Slot key.
     * @param string $target Target.
     * @param string $variant Identity of the rule's pages and regions.
     * @return bool True when a rule was deleted.
     */
    public function delete(int $contextid, string $slotkey, string $target, string $variant = audience::UNLIMITED): bool {
        $conditions = ['contextid' => $contextid, 'slotkey' => $slotkey, 'target' => $target, 'variant' => $variant];
        if (!$this->db->record_exists(self::TABLE, $conditions)) {
            return false;
        }
        $this->db->delete_records(self::TABLE, $conditions);
        return true;
    }

    /**
     * Delete every rule that belongs to one context.
     *
     * @param int $contextid Context id.
     * @return int Number of rules deleted.
     */
    public function delete_by_context(int $contextid): int {
        $count = $this->db->count_records(self::TABLE, ['contextid' => $contextid]);
        if ($count > 0) {
            $this->db->delete_records(self::TABLE, ['contextid' => $contextid]);
        }
        return $count;
    }

    /**
     * Delete every rule compiled into one delta stylesheet.
     *
     * @param int $deltactxid Delta owner context.
     * @return int Number of rules deleted.
     */
    public function delete_by_delta(int $deltactxid): int {
        $count = $this->db->count_records(self::TABLE, ['deltactxid' => $deltactxid]);
        if ($count > 0) {
            $this->db->delete_records(self::TABLE, ['deltactxid' => $deltactxid]);
        }
        return $count;
    }

    /**
     * Number of rules in a delta stylesheet.
     *
     * @param int $deltactxid Delta owner context.
     * @return int Count.
     */
    public function count_by_delta(int $deltactxid): int {
        return $this->db->count_records(self::TABLE, ['deltactxid' => $deltactxid]);
    }

    /**
     * Convert a database row to a rule.
     *
     * @param \stdClass $record Row.
     * @return rule Rule.
     */
    private function to_rule(\stdClass $record): rule {
        return new rule((int)$record->id, (int)$record->contextid, slot_key::parse($record->slotkey), [
            'painter' => $record->painter,
            'assetid' => $record->assetid,
            'fg' => $record->fg,
            'bg' => $record->bg,
            'design' => design::from_json($record->design),
            'target' => $record->target,
            'pages' => audience::split($record->pages),
            'regions' => audience::split($record->regions),
            'mode' => $record->mode,
            'enabled' => (bool)$record->enabled,
            'rev' => (int)$record->rev,
        ]);
    }
}
