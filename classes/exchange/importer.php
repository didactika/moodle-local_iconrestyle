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
 * Reads a package and applies it to the site.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\exchange;

use local_iconrestyle\asset\asset_rejected_exception;
use local_iconrestyle\asset\asset_service;
use local_iconrestyle\rule\design;
use local_iconrestyle\rule\rule;
use local_iconrestyle\rule\rule_service;
use local_iconrestyle\rule\rule_store;
use local_iconrestyle\slot\slot_catalogue;
use local_iconrestyle\slot\slot_key;

/**
 * Nothing in a package is trusted. Every rule goes through the same checks as a rule made in the designer, its place is
 * looked up on this site, and its artwork is sanitised again as if it had been uploaded. A rule that does not pass is left out
 * and said so, and the rest go on, so one bad line does not lose a package.
 */
class importer {
    /** @var string Add the rules of the package and leave the other rules of the site alone. */
    public const MERGE = 'merge';

    /** @var string Make the site have exactly the rules of the package. */
    public const REPLACE = 'replace';

    /** @var int Rules stored in one transaction. */
    private const CHUNK = 500;

    /** @var rule_service Rule service. */
    private $service;

    /** @var rule_store Rule storage. */
    private $store;

    /** @var asset_service Artwork intake. */
    private $assets;

    /** @var place_keys Names of places. */
    private $places;

    /** @var slot_catalogue Icons that can be customised. */
    private $catalogue;

    /**
     * Create the importer.
     *
     * @param rule_service $service Rule service.
     * @param rule_store $store Rule storage.
     * @param asset_service $assets Artwork intake.
     * @param place_keys $places Names of places.
     * @param slot_catalogue $catalogue Icons that can be customised.
     */
    public function __construct(
        rule_service $service,
        rule_store $store,
        asset_service $assets,
        place_keys $places,
        slot_catalogue $catalogue
    ) {
        $this->service = $service;
        $this->store = $store;
        $this->assets = $assets;
        $this->places = $places;
        $this->catalogue = $catalogue;
    }

    /**
     * Apply a package, or work out what applying it would do.
     *
     * @param iterable $lines Lines of the package, without line breaks.
     * @param string $mode MERGE or REPLACE.
     * @param bool $dryrun True to change nothing and only report.
     * @param int $userid User making the change.
     * @param string[]|null $only Slot keys of the icons to take from the package, or null for all of them. With a choice,
     *     replace only removes the rules of those icons that the package does not have.
     * @return import_report What was done, or what would be.
     * @throws \moodle_exception When the text is not a package this plugin can read.
     */
    public function run(iterable $lines, string $mode, bool $dryrun, int $userid, ?array $only = null): import_report {
        if (!in_array($mode, [self::MERGE, self::REPLACE], true)) {
            throw new \coding_exception('Unknown import mode.');
        }
        $chosen = $only === null ? null : array_fill_keys($only, true);
        if ($chosen !== null) {
            $lines = is_array($lines) ? $lines : iterator_to_array($lines, false);
            $wanted = $this->artwork_of($lines, $chosen);
        }
        $report = new import_report();
        $assetids = [];
        $batch = [];
        $kept = [];
        $first = true;
        foreach ($lines as $text) {
            if (trim($text) === '') {
                continue;
            }
            $line = json_decode($text, true);
            if (!is_array($line) || !isset($line['type'])) {
                if ($first) {
                    throw new \moodle_exception('invalidpackage', 'local_iconrestyle');
                }
                $report->skip('A line that is not part of a package.');
                continue;
            }
            if ($first) {
                $this->check_header($line);
                $first = false;
                continue;
            }
            if ($line['type'] === 'asset') {
                if ($chosen !== null && !isset($wanted[(string)($line['hash'] ?? '')])) {
                    continue;
                }
                $this->take_asset($line, $assetids, $dryrun, $userid, $report);
            } else if ($line['type'] === 'rule') {
                if ($chosen !== null && !isset($chosen[(string)($line['slot'] ?? '')])) {
                    continue;
                }
                $rule = $this->to_rule($line, $assetids, $report);
                if ($rule === null) {
                    continue;
                }
                $kept[$this->identity($rule)] = true;
                $this->store_rule($rule, $batch, $dryrun, $userid, $report);
            }
        }
        if ($first) {
            throw new \moodle_exception('invalidpackage', 'local_iconrestyle');
        }
        $this->flush($batch, $dryrun, $userid, $report);
        if ($mode === self::REPLACE) {
            $this->delete_the_rest($kept, $chosen, $dryrun, $userid, $report);
        }
        return $report;
    }

    /**
     * The artwork that the chosen icons use, so that the artwork of the others is not stored.
     *
     * @param array $lines Lines of the package.
     * @param bool[] $chosen Chosen slot keys as keys.
     * @return bool[] Hashes of the artwork as keys.
     */
    private function artwork_of(array $lines, array $chosen): array {
        $hashes = [];
        foreach ($lines as $text) {
            if (strpos($text, '"rule"') === false) {
                continue;
            }
            $line = json_decode($text, true);
            if (is_array($line) && isset($chosen[(string)($line['slot'] ?? '')]) && !empty($line['asset'])) {
                $hashes[(string)$line['asset']] = true;
            }
        }
        return $hashes;
    }

    /**
     * Check the first line.
     *
     * @param array $line First line.
     * @throws \moodle_exception When it does not say this is a package of this plugin, in a version that can be read.
     */
    private function check_header(array $line): void {
        if ($line['type'] !== 'header' || ($line['format'] ?? '') !== exporter::FORMAT) {
            throw new \moodle_exception('invalidpackage', 'local_iconrestyle');
        }
        if ((int)($line['version'] ?? 0) !== exporter::VERSION) {
            throw new \moodle_exception('unsupportedpackage', 'local_iconrestyle');
        }
    }

    /**
     * Take in the artwork of one line, sanitising it as an upload.
     *
     * @param array $line Line.
     * @param int[] $assetids Asset ids by the hash the package gave them, which this fills.
     * @param bool $dryrun Whether nothing is stored.
     * @param int $userid User making the change.
     * @param import_report $report Report.
     */
    private function take_asset(array $line, array &$assetids, bool $dryrun, int $userid, import_report $report): void {
        $hash = (string)($line['hash'] ?? '');
        $bytes = base64_decode((string)($line['content'] ?? ''), true);
        if (!preg_match('/^[0-9a-f]{64}$/', $hash) || $bytes === false || $bytes === '') {
            $report->skip('Artwork that cannot be read.');
            return;
        }
        $report->count('assets');
        if ($dryrun) {
            $assetids[$hash] = 0;
            return;
        }
        try {
            $assetids[$hash] = $this->assets->add($bytes, $userid, 'import')->id();
        } catch (asset_rejected_exception $exception) {
            $report->skip('Artwork that was refused: ' . $exception->getMessage());
        }
    }

    /**
     * Turn a line into a rule of this site.
     *
     * @param array $line Line.
     * @param int[] $assetids Asset ids by hash.
     * @param import_report $report Report.
     * @return rule|null Rule, or null when it was left out.
     */
    private function to_rule(array $line, array $assetids, import_report $report): ?rule {
        $slot = (string)($line['slot'] ?? '');
        try {
            if (!slot_key::is_valid($slot) || !$this->catalogue->find($slot)) {
                $report->skip($slot . ': this site has no such icon.', $slot);
                return null;
            }
            $contextid = $this->places->resolve((string)($line['place'] ?? ''));
            if ($contextid === null) {
                $report->skip($slot . ': this site has no place named ' . s((string)($line['place'] ?? '')) . '.', $slot);
                return null;
            }
            $hash = $line['asset'] ?? null;
            if ($hash !== null && !isset($assetids[$hash])) {
                $report->skip($slot . ': its artwork is not in the package or was refused.', $slot);
                return null;
            }
            return new rule(0, $contextid, slot_key::parse($slot), [
                'painter' => (string)($line['painter'] ?? rule::PAINTER_COLOR),
                'assetid' => $hash === null ? null : $assetids[$hash],
                'fg' => $line['fg'] ?? null,
                'bg' => $line['bg'] ?? null,
                'design' => design::from_array((array)($line['design'] ?? [])),
                'pages' => (array)($line['pages'] ?? []),
                'regions' => (array)($line['regions'] ?? []),
                'mode' => (string)($line['mode'] ?? 'all'),
                'enabled' => (bool)($line['enabled'] ?? true),
            ]);
        } catch (\InvalidArgumentException $exception) {
            $report->skip($slot . ': ' . $exception->getMessage(), $slot);
            return null;
        }
    }

    /**
     * Identity of a rule on this site.
     *
     * @param rule $rule Rule.
     * @return string Identity.
     */
    private function identity(rule $rule): string {
        return $rule->contextid() . '|' . $rule->slot() . '|' . $rule->target() . '|' . $rule->variant();
    }

    /**
     * Queue a rule, and store the queue when it is full.
     *
     * @param rule $rule Rule.
     * @param rule[] $batch Queue.
     * @param bool $dryrun Whether nothing is stored.
     * @param int $userid User making the change.
     * @param import_report $report Report.
     */
    private function store_rule(rule $rule, array &$batch, bool $dryrun, int $userid, import_report $report): void {
        $batch[] = $rule;
        if (count($batch) >= self::CHUNK) {
            $this->flush($batch, $dryrun, $userid, $report);
        }
    }

    /**
     * Store the queued rules, one by one when a limit stops the batch, so that only the rules that break it are left out.
     *
     * @param rule[] $batch Queue of rules, which this empties.
     * @param bool $dryrun Whether nothing is stored.
     * @param int $userid User making the change.
     * @param import_report $report Report.
     */
    private function flush(array &$batch, bool $dryrun, int $userid, import_report $report): void {
        if ($batch === []) {
            return;
        }
        // One query tells which of the queued rules the site already has.
        $contextids = [];
        foreach ($batch as $rule) {
            $contextids[$rule->contextid()] = true;
        }
        $stored = $this->store->stored_identities(array_keys($contextids));
        $exists = [];
        foreach ($batch as $index => $rule) {
            $exists[$index] = isset($stored[rule_store::identity_of(
                $rule->contextid(),
                (string)$rule->slot(),
                $rule->target(),
                $rule->variant()
            )]);
            $report->count($exists[$index] ? 'updated' : 'created', 1, (string)$rule->slot());
        }
        if ($dryrun) {
            $batch = [];
            return;
        }
        try {
            $this->service->apply_bulk($batch, $userid);
        } catch (\InvalidArgumentException $exception) {
            foreach ($batch as $index => $rule) {
                try {
                    $this->service->apply([$rule], [], $userid);
                } catch (\InvalidArgumentException $single) {
                    $report->count($exists[$index] ? 'updated' : 'created', -1, (string)$rule->slot());
                    $report->skip($rule->slot() . ': ' . $single->getMessage(), (string)$rule->slot());
                }
            }
        }
        $batch = [];
    }

    /**
     * Remove the rules of the site that the package does not have.
     *
     * @param bool[] $kept Identities of the rules of the package.
     * @param bool[]|null $chosen Slot keys as keys when only some icons were chosen, and then only their rules can be removed.
     * @param bool $dryrun Whether nothing is stored.
     * @param int $userid User making the change.
     * @param import_report $report Report.
     */
    private function delete_the_rest(array $kept, ?array $chosen, bool $dryrun, int $userid, import_report $report): void {
        $doomed = [];
        foreach ($this->store->each() as $rule) {
            if (!isset($kept[$this->identity($rule)]) && ($chosen === null || isset($chosen[(string)$rule->slot()]))) {
                $doomed[] = $rule->id();
            }
        }
        foreach (array_chunk($doomed, self::CHUNK) as $chunk) {
            if (!$dryrun) {
                $this->service->apply([], $chunk, $userid);
            }
            $report->count('deleted', count($chunk));
        }
    }
}
