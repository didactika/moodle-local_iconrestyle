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
 * Writes the customisations of the site as a package.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\exchange;

use local_iconrestyle\asset\asset_store;
use local_iconrestyle\rule\rule;
use local_iconrestyle\rule\rule_store;

/**
 * A package is a text file with one JSON object on each line. The first line says what the file is, the next ones carry the
 * artwork that rules use, each once, and the rest are the rules. Reading it takes one line of memory at a time, so a site with
 * hundreds of thousands of rules exports and imports in the same room as one with ten.
 */
class exporter {
    /** @var string Name of the format, which the first line carries. */
    public const FORMAT = 'local_iconrestyle';

    /** @var int Version of the format. */
    public const VERSION = 1;

    /** @var rule_store Rule storage. */
    private $rules;

    /** @var asset_store Artwork storage. */
    private $assets;

    /** @var place_keys Names of places. */
    private $places;

    /** @var string[] Rules that could not travel and why. */
    private $skipped = [];

    /**
     * Create the exporter.
     *
     * @param rule_store $rules Rule storage.
     * @param asset_store $assets Artwork storage.
     * @param place_keys $places Names of places.
     */
    public function __construct(rule_store $rules, asset_store $assets, place_keys $places) {
        $this->rules = $rules;
        $this->assets = $assets;
        $this->places = $places;
    }

    /**
     * The lines of the package.
     *
     * @param string[]|null $only Slot keys of the icons to export, or null for every icon that has customisations.
     * @return \Generator<string> Lines without the line break.
     */
    public function lines(?array $only = null): \Generator {
        $chosen = $only === null ? null : array_fill_keys($only, true);
        $this->skipped = [];
        yield json_encode(['type' => 'header', 'format' => self::FORMAT, 'version' => self::VERSION, 'exported' => time()]);
        $sent = [];
        $pending = [];
        foreach ($this->rules->each() as $rule) {
            if ($chosen !== null && !isset($chosen[(string)$rule->slot()])) {
                continue;
            }
            $key = $this->places->key_of($rule->contextid());
            if ($key === null) {
                $this->skipped[] = (string)$rule->slot() . ' in a place that has no name that can travel';
                continue;
            }
            $hash = null;
            if ($rule->assetid() !== null) {
                $asset = $this->assets->find($rule->assetid());
                if (!$asset) {
                    $this->skipped[] = (string)$rule->slot() . ' with artwork that is missing';
                    continue;
                }
                $hash = $asset->hash();
                if (!isset($sent[$hash])) {
                    $sent[$hash] = true;
                    yield json_encode([
                        'type' => 'asset', 'hash' => $hash, 'kind' => $asset->kind(),
                        'content' => base64_encode($this->assets->content($asset)),
                    ]);
                }
            }
            yield json_encode($this->line_of($rule, $key, $hash), JSON_UNESCAPED_SLASHES);
        }
        unset($pending);
    }

    /**
     * Rules that were left out of the last package, and why.
     *
     * @return string[] Reasons.
     */
    public function skipped(): array {
        return $this->skipped;
    }

    /**
     * One rule as a line.
     *
     * @param rule $rule Rule.
     * @param string $key Key of its place.
     * @param string|null $hash Hash of its artwork.
     * @return array Line.
     */
    private function line_of(rule $rule, string $key, ?string $hash): array {
        return [
            'type' => 'rule',
            'place' => $key,
            'slot' => (string)$rule->slot(),
            'painter' => $rule->painter(),
            'asset' => $hash,
            'fg' => $rule->fg() ? $rule->fg()->stored() : null,
            'bg' => $rule->bg() ? $rule->bg()->stored() : null,
            'design' => $rule->design()->to_array(),
            'pages' => $rule->pages(),
            'regions' => $rule->regions(),
            'mode' => $rule->mode(),
            'enabled' => $rule->enabled(),
        ];
    }
}
