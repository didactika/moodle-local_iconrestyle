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
 * What an import did, or would do.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\exchange;

/**
 * Counts and the reasons rules were left out. Only the first few reasons are kept, so a package with thousands of problems does
 * not grow the answer.
 */
final class import_report {
    /** @var int Most reasons that are kept. */
    public const MAX_ISSUES = 50;

    /** @var int[] Counts by name. */
    private $counts = ['created' => 0, 'updated' => 0, 'deleted' => 0, 'skipped' => 0, 'assets' => 0];

    /** @var string[] Why rules were left out. */
    private $issues = [];

    /** @var array[] What happens to each icon of the package, by slot key. */
    private $entries = [];

    /**
     * Count one more of something.
     *
     * @param string $name created, updated, deleted, skipped or assets.
     * @param int $by How many.
     * @param string|null $slot Icon the count belongs to, so the report can say what happens to each icon.
     */
    public function count(string $name, int $by = 1, ?string $slot = null): void {
        $this->counts[$name] += $by;
        if ($slot !== null && in_array($name, ['created', 'updated'], true)) {
            $this->entry($slot);
            $this->entries[$slot][$name] += $by;
        }
    }

    /**
     * Note why a rule was left out.
     *
     * @param string $reason Reason.
     * @param string|null $slot Icon the rule belongs to.
     */
    public function skip(string $reason, ?string $slot = null): void {
        $this->counts['skipped']++;
        if (count($this->issues) < self::MAX_ISSUES) {
            $this->issues[] = $reason;
        }
        if ($slot !== null) {
            $this->entry($slot);
            $this->entries[$slot]['skipped']++;
        }
    }

    /**
     * Make sure an icon has an entry.
     *
     * @param string $slot Slot key.
     */
    private function entry(string $slot): void {
        if (!isset($this->entries[$slot])) {
            $this->entries[$slot] = ['slot' => $slot, 'created' => 0, 'updated' => 0, 'skipped' => 0];
        }
    }

    /**
     * What happens to each icon of the package.
     *
     * @return array[] One entry for each icon: slot, created, updated and skipped, in the order the package has them.
     */
    public function entries(): array {
        return array_values($this->entries);
    }

    /**
     * One of the counts.
     *
     * @param string $name created, updated, deleted, skipped or assets.
     * @return int Count.
     */
    public function get(string $name): int {
        return $this->counts[$name];
    }

    /**
     * The reasons that were kept.
     *
     * @return string[] Reasons.
     */
    public function issues(): array {
        return $this->issues;
    }

    /**
     * The report as plain data.
     *
     * @return array Counts by name, the reasons under issues and what happens to each icon under entries.
     */
    public function to_array(): array {
        return $this->counts + ['issues' => $this->issues, 'entries' => $this->entries()];
    }
}
