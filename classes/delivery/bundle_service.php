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
 * Assembles the stylesheet bundle of a page.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\delivery;

use local_iconrestyle\rule\revision_registry;

/**
 * Concatenates the compiled stylesheets of a chain in cascade order. A page that is served from the cache reads nothing from
 * the database: the revisions and the stylesheets both come from the cache.
 */
class bundle_service {
    /** @var revision_registry Revision source. */
    private $revisions;

    /** @var delta_sheets Compiled stylesheets. */
    private $sheets;

    /**
     * Create the service.
     *
     * @param revision_registry $revisions Revision source.
     * @param delta_sheets $sheets Compiled stylesheets.
     */
    public function __construct(revision_registry $revisions, delta_sheets $sheets) {
        $this->revisions = $revisions;
        $this->sheets = $sheets;
    }

    /**
     * Encode a chain for use in a URL path segment.
     *
     * @param int[] $chain Effective revision keyed by context id.
     * @return string Encoded chain such as 1-3.45-7.
     */
    public static function encode_chain(array $chain): string {
        $pairs = [];
        foreach ($chain as $contextid => $rev) {
            $pairs[] = (int)$contextid . '-' . (int)$rev;
        }
        return implode('.', $pairs);
    }

    /**
     * Decode and validate a chain from a URL path segment.
     *
     * @param string $encoded Encoded chain.
     * @return int[]|null Revision keyed by context id, or null when malformed.
     */
    public static function decode_chain(string $encoded): ?array {
        $pattern = '/^[0-9]{1,10}-[0-9]{1,10}(\.[0-9]{1,10}-[0-9]{1,10}){0,' . (chain_resolver::MAX_DEPTH - 1) . '}$/';
        if (!preg_match($pattern, $encoded)) {
            return null;
        }
        $chain = [];
        foreach (explode('.', $encoded) as $pair) {
            [$contextid, $rev] = array_map('intval', explode('-', $pair));
            if ($contextid < 1 || $rev < 1 || isset($chain[$contextid])) {
                return null;
            }
            $chain[$contextid] = $rev;
        }
        return $chain;
    }

    /**
     * Whether a version hash has the accepted shape.
     *
     * @param string $hash Candidate hash.
     * @return bool True when valid.
     */
    public static function is_valid_hash(string $hash): bool {
        return (bool)preg_match('/^[0-9a-f]{8}$/', $hash);
    }

    /**
     * Assemble a bundle.
     *
     * Stale revisions are replaced by the current ones, so an old page still renders the latest icons.
     *
     * @param int[] $chain Revision keyed by context id, as found in a URL.
     * @return array CSS under css and whether every revision was current under current.
     */
    public function assemble(array $chain): array {
        $state = $this->effective($chain);
        return ['css' => $this->css($state['chain']), 'current' => $state['current']];
    }

    /**
     * The revisions that a bundle is made of now, which needs no stylesheet to be read.
     *
     * @param int[] $chain Revision keyed by context id, as found in a URL.
     * @return array The current revision of each context that has rules, under chain, and whether every revision of the
     *     request was current, under current.
     */
    public function effective(array $chain): array {
        $current = $this->revisions->get_many(array_keys($chain));
        $effective = [];
        $iscurrent = true;
        foreach ($chain as $contextid => $rev) {
            $now = $current[$contextid] ?? 0;
            if ($now !== $rev) {
                $iscurrent = false;
            }
            if ($now > 0) {
                $effective[$contextid] = $now;
            }
        }
        return ['chain' => $effective, 'current' => $iscurrent];
    }

    /**
     * The stylesheets of a chain in cascade order.
     *
     * @param int[] $chain Current revision keyed by context id, as effective() gives it.
     * @return string CSS.
     */
    public function css(array $chain): string {
        $css = '';
        foreach ($chain as $contextid => $rev) {
            $css .= $this->sheets->css($contextid, $rev);
        }
        return $css;
    }

    /**
     * Entity tag of a bundle. A revision is never reused for different rules, so the revisions and the version of the code say
     * what the bundle holds, and a browser that has it can be answered before any stylesheet is read.
     *
     * @param string $version Version hash of the code.
     * @param int[] $chain Current revision keyed by context id, as effective() gives it.
     * @return string Tag without quotes.
     */
    public static function etag(string $version, array $chain): string {
        return $version . '-' . substr(sha1(self::encode_chain($chain)), 0, 16);
    }
}
