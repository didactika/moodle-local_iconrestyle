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
use local_iconrestyle\rule\rule_store;
use local_iconrestyle\style\stylesheet_compiler;

/**
 * Concatenates cached delta stylesheets in cascade order, compiling any that are missing once.
 */
class bundle_service {
    /** @var revision_registry Revision source. */
    private $revisions;

    /** @var rule_store Rule storage. */
    private $rules;

    /** @var stylesheet_compiler Compiler. */
    private $compiler;

    /** @var compiled_cache Compiled CSS cache. */
    private $cache;

    /** @var compile_lock Compile lock. */
    private $lock;

    /**
     * Create the service.
     *
     * @param revision_registry $revisions Revision source.
     * @param rule_store $rules Rule storage.
     * @param stylesheet_compiler $compiler Compiler.
     * @param compiled_cache $cache Compiled CSS cache.
     * @param compile_lock $lock Compile lock.
     */
    public function __construct(
        revision_registry $revisions,
        rule_store $rules,
        stylesheet_compiler $compiler,
        compiled_cache $cache,
        compile_lock $lock
    ) {
        $this->revisions = $revisions;
        $this->rules = $rules;
        $this->compiler = $compiler;
        $this->cache = $cache;
        $this->lock = $lock;
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
     * @param string $hash Version hash that keys compiled output to the installed code.
     * @return array CSS under css and whether every revision was current under current.
     */
    public function assemble(array $chain, string $hash): array {
        $current = $this->revisions->get_many(array_keys($chain));
        $css = '';
        $iscurrent = true;
        foreach ($chain as $contextid => $rev) {
            $effective = $current[$contextid] ?? 0;
            if ($effective !== $rev) {
                $iscurrent = false;
            }
            if ($effective > 0) {
                $css .= $this->delta($contextid, $effective, $hash);
            }
        }
        return ['css' => $css, 'current' => $iscurrent];
    }

    /**
     * Read or compile one delta stylesheet.
     *
     * @param int $contextid Delta owner context.
     * @param int $rev Revision.
     * @param string $hash Version hash.
     * @return string CSS.
     */
    private function delta(int $contextid, int $rev, string $hash): string {
        $key = $hash . ':' . $contextid . ':' . $rev;
        $css = $this->cache->get($key);
        if ($css !== null) {
            return $css;
        }
        return $this->lock->run('delta_' . $contextid . '_' . $rev, function () use ($key, $contextid): string {
            $css = $this->cache->get($key);
            if ($css === null) {
                $css = $this->compiler->compile($this->rules->find_by_delta($contextid));
                $this->cache->set($key, $css);
            }
            return $css;
        });
    }
}
