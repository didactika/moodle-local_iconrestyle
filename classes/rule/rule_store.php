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
     * One rule by its natural key.
     *
     * @param int $contextid Context id.
     * @param string $slotkey Slot key.
     * @param string $target Target.
     * @return rule|null Rule or null.
     */
    public function find(int $contextid, string $slotkey, string $target): ?rule {
        $record = $this->db->get_record(self::TABLE, ['contextid' => $contextid, 'slotkey' => $slotkey, 'target' => $target]);
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
        $values = [
            'contextid' => $rule->contextid(),
            'deltactxid' => $deltactxid,
            'slotkey' => (string)$rule->slot(),
            'painter' => $rule->painter(),
            'assetid' => $rule->assetid(),
            'fg' => $rule->fg() ? $rule->fg()->stored() : null,
            'bg' => $rule->bg() ? $rule->bg()->stored() : null,
            'shape' => $rule->shape(),
            'padding' => $rule->padding(),
            'opacity' => $rule->opacity(),
            'target' => $rule->target(),
            'enabled' => (int)$rule->enabled(),
            'usermodified' => $userid,
            'timemodified' => $now,
        ];
        $existing = $this->db->get_record(
            self::TABLE,
            ['contextid' => $rule->contextid(), 'slotkey' => $values['slotkey'], 'target' => $values['target']]
        );
        if ($existing) {
            if ($rule->id() > 0 && (int)$existing->rev !== $rule->rev()) {
                throw new rule_conflict_exception('The rule changed since it was read.');
            }
            $values['id'] = $existing->id;
            $values['rev'] = (int)$existing->rev + 1;
            $this->db->update_record(self::TABLE, (object)$values);
            return $this->to_rule($this->db->get_record(self::TABLE, ['id' => $existing->id], '*', MUST_EXIST));
        }
        $values['rev'] = 1;
        $values['timecreated'] = $now;
        $id = $this->db->insert_record(self::TABLE, (object)$values);
        return $this->to_rule($this->db->get_record(self::TABLE, ['id' => $id], '*', MUST_EXIST));
    }

    /**
     * Delete a rule.
     *
     * @param int $contextid Context id.
     * @param string $slotkey Slot key.
     * @param string $target Target.
     * @return bool True when a rule was deleted.
     */
    public function delete(int $contextid, string $slotkey, string $target): bool {
        $conditions = ['contextid' => $contextid, 'slotkey' => $slotkey, 'target' => $target];
        if (!$this->db->record_exists(self::TABLE, $conditions)) {
            return false;
        }
        $this->db->delete_records(self::TABLE, $conditions);
        return true;
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
            'shape' => $record->shape,
            'padding' => $record->padding,
            'opacity' => $record->opacity,
            'target' => $record->target,
            'enabled' => (bool)$record->enabled,
            'rev' => (int)$record->rev,
        ]);
    }
}
