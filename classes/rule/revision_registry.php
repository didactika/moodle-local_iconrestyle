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
 * Revisions of delta stylesheets.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * Tracks the revision of each delta stylesheet.
 *
 * The database holds the authoritative revision, which only grows. Readers get the effective revision,
 * which is zero while a context has no rules, and it is served from the cache including negative answers.
 */
class revision_registry {
    /** @var string Table name. */
    private const TABLE = 'local_iconrestyle_ctxstate';

    /** @var \moodle_database Database. */
    private $db;

    /** @var \cache Revision cache. */
    private $cache;

    /**
     * Create the registry.
     *
     * @param \moodle_database $db Database.
     * @param \cache $cache Revision cache.
     */
    public function __construct(\moodle_database $db, \cache $cache) {
        $this->db = $db;
        $this->cache = $cache;
    }

    /**
     * Effective revisions of several contexts.
     *
     * @param int[] $contextids Context ids.
     * @return int[] Effective revision keyed by context id, zero when a context has no rules.
     */
    public function get_many(array $contextids): array {
        $found = $this->cache->get_many(array_map('strval', $contextids));
        $result = [];
        $missing = [];
        foreach ($contextids as $contextid) {
            $value = $found[(string)$contextid] ?? false;
            if ($value === false) {
                $missing[] = $contextid;
            } else {
                $result[$contextid] = (int)$value;
            }
        }
        if ($missing !== []) {
            $toset = [];
            foreach ($this->load($missing) as $contextid => $rev) {
                $result[$contextid] = $rev;
                $toset[(string)$contextid] = $rev;
            }
            $this->cache->set_many($toset);
        }
        return $result;
    }

    /**
     * Record a change to a delta stylesheet.
     *
     * @param int $contextid Delta owner context.
     * @param int $rulecount Rules now in the stylesheet.
     * @return int New effective revision.
     */
    public function bump(int $contextid, int $rulecount): int {
        $now = time();
        $record = $this->db->get_record(self::TABLE, ['contextid' => $contextid]);
        if ($record) {
            $record->rev = (int)$record->rev + 1;
            $record->rulecount = $rulecount;
            $record->timemodified = $now;
            $this->db->update_record(self::TABLE, $record);
        } else {
            $record = (object)['contextid' => $contextid, 'rev' => 1, 'rulecount' => $rulecount, 'timemodified' => $now];
            $this->db->insert_record(self::TABLE, $record);
        }
        $effective = $rulecount > 0 ? (int)$record->rev : 0;
        $this->cache->set((string)$contextid, $effective);
        return $effective;
    }

    /**
     * Every delta stylesheet that has rules, with its effective revision.
     *
     * @return int[] Effective revision keyed by context id.
     */
    public function active(): array {
        $result = [];
        foreach ($this->db->get_records_select(self::TABLE, 'rulecount > 0', null, '', 'contextid, rev') as $record) {
            $result[(int)$record->contextid] = (int)$record->rev;
        }
        return $result;
    }

    /**
     * How many delta stylesheets have rules, not counting the one of the whole site.
     *
     * @return int Number of categories and courses.
     */
    public function count_active(): int {
        return $this->db->count_records_select(
            self::TABLE,
            'rulecount > 0 AND contextid <> :site',
            ['site' => \context_system::instance()->id]
        );
    }

    /**
     * Forget a context for good, because the context itself no longer exists.
     *
     * @param int $contextid Delta owner context.
     */
    public function forget(int $contextid): void {
        $this->db->delete_records(self::TABLE, ['contextid' => $contextid]);
        $this->cache->delete((string)$contextid);
    }

    /**
     * Read effective revisions from the database.
     *
     * @param int[] $contextids Context ids.
     * @return int[] Effective revision keyed by context id.
     */
    private function load(array $contextids): array {
        $result = array_fill_keys($contextids, 0);
        foreach ($this->db->get_records_list(self::TABLE, 'contextid', $contextids) as $record) {
            $result[(int)$record->contextid] = (int)$record->rulecount > 0 ? (int)$record->rev : 0;
        }
        return $result;
    }
}
