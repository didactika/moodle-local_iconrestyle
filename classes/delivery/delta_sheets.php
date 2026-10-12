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
 * The compiled stylesheet of each context that has rules.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\delivery;

use local_iconrestyle\rule\revision_registry;
use local_iconrestyle\rule\rule;
use local_iconrestyle\rule\rule_store;
use local_iconrestyle\rule\sheet_store;
use local_iconrestyle\style\stylesheet_compiler;

/**
 * Reads a compiled stylesheet, compiles it when it is missing, and keeps the cache free of stylesheets nobody asks for.
 *
 * A stylesheet is identified by the code version, its context and its revision. Revisions only grow, so a stylesheet never
 * changes once it is stored and the one it replaces can be dropped at once: each context holds at most one stylesheet in the
 * cache. Compiling is single-flight across web nodes, so a purge of the caches or an upgrade makes the site compile each
 * stylesheet once, not once per visitor, and the scheduled warm-up does it before anybody visits.
 */
class delta_sheets implements sheet_store {
    /** @var rule_store Rule storage. */
    private $rules;

    /** @var stylesheet_compiler Compiler. */
    private $compiler;

    /** @var compiled_cache Cache of compiled stylesheets. */
    private $cache;

    /** @var compile_lock Single-flight lock. */
    private $lock;

    /** @var revision_registry Revisions. */
    private $revisions;

    /** @var string Version hash that keys compiled output to the installed code. */
    private $hash;

    /**
     * Create the sheets.
     *
     * @param rule_store $rules Rule storage.
     * @param stylesheet_compiler $compiler Compiler.
     * @param compiled_cache $cache Cache of compiled stylesheets.
     * @param compile_lock $lock Single-flight lock.
     * @param revision_registry $revisions Revisions.
     * @param string $hash Version hash that keys compiled output to the installed code.
     */
    public function __construct(
        rule_store $rules,
        stylesheet_compiler $compiler,
        compiled_cache $cache,
        compile_lock $lock,
        revision_registry $revisions,
        string $hash
    ) {
        $this->rules = $rules;
        $this->compiler = $compiler;
        $this->cache = $cache;
        $this->lock = $lock;
        $this->revisions = $revisions;
        $this->hash = $hash;
    }

    /**
     * The compiled stylesheet of a context at a revision, compiled now if nobody has yet.
     *
     * @param int $contextid Delta owner context.
     * @param int $rev Effective revision.
     * @return string CSS.
     */
    public function css(int $contextid, int $rev): string {
        $key = compiled_cache::key($this->hash, $contextid, $rev);
        $css = $this->cache->get($key);
        if ($css !== null) {
            return $css;
        }
        return $this->lock->run('delta_' . $contextid . '_' . $rev, function () use ($key, $contextid, $rev): string {
            $css = $this->cache->get($key);
            if ($css === null) {
                $css = $this->compile($this->rules->find_by_delta($contextid));
                $this->cache->set($key, $css);
            }
            return $css;
        });
    }

    /**
     * Compile rules.
     *
     * @param rule[] $rules Rules of one delta stylesheet.
     * @return string CSS.
     */
    public function compile(array $rules): string {
        return $this->compiler->compile($rules);
    }

    /**
     * Keep a stylesheet that was just compiled, and drop the one it replaces.
     *
     * @param int $contextid Delta owner context.
     * @param int $rev New effective revision, zero when the context has no rules left.
     * @param string $css Compiled CSS of that revision.
     * @param int $previous Effective revision it replaces, zero when there was none.
     */
    public function replace(int $contextid, int $rev, string $css, int $previous): void {
        if ($previous > 0 && $previous !== $rev) {
            $this->cache->delete(compiled_cache::key($this->hash, $contextid, $previous));
        }
        if ($rev > 0) {
            $this->cache->set(compiled_cache::key($this->hash, $contextid, $rev), $css);
        }
    }

    /**
     * Drop the stylesheet of a context at a revision.
     *
     * @param int $contextid Delta owner context.
     * @param int $rev Effective revision.
     */
    public function forget(int $contextid, int $rev): void {
        if ($rev > 0) {
            $this->cache->delete(compiled_cache::key($this->hash, $contextid, $rev));
        }
    }

    /**
     * Whether a stylesheet is in the cache.
     *
     * @param int $contextid Delta owner context.
     * @param int $rev Effective revision.
     * @return bool True when it is cached.
     */
    public function is_cached(int $contextid, int $rev): bool {
        return $this->cache->has(compiled_cache::key($this->hash, $contextid, $rev));
    }

    /**
     * Compile every stylesheet that is not in the cache, so no visitor has to.
     *
     * @return int[] How many stylesheets were compiled, under compiled, and how many were already cached, under cached.
     */
    public function warm_all(): array {
        $compiled = 0;
        $cached = 0;
        foreach ($this->revisions->active() as $contextid => $rev) {
            if ($this->is_cached($contextid, $rev)) {
                $cached++;
                continue;
            }
            $this->css($contextid, $rev);
            $compiled++;
        }
        return ['compiled' => $compiled, 'cached' => $cached];
    }
}
