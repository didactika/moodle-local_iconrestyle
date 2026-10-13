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
 * Remembers which stylesheets apply to a context path.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\delivery;

/**
 * The encoded chain of a context path, kept as one cache entry for the path.
 *
 * A page that is served from here makes one cache read, whatever the depth of its path, where resolving the chain reads one
 * revision for each context on the path. The entries are dropped whenever a revision changes, and they expire on their own, so
 * one that was written while a change was being saved cannot outlive the next change by more than the lifetime of the cache.
 */
class chain_addresses {
    /** @var string What is kept for a path that has no stylesheet, because the cache cannot tell an empty string from a miss. */
    private const NONE = '-';

    /** @var int Longest key that is used as it is; longer paths are hashed. */
    private const MAX_KEY = 120;

    /** @var \cache Cache of encoded chains by path. */
    private $cache;

    /** @var callable Gives the resolver, which is only needed when the path is not in the cache. */
    private $resolver;

    /**
     * Create the addresses.
     *
     * @param \cache $cache Cache of encoded chains by path.
     * @param callable $resolver Gives the chain resolver when it is needed.
     */
    public function __construct(\cache $cache, callable $resolver) {
        $this->cache = $cache;
        $this->resolver = $resolver;
    }

    /**
     * Encoded chain that applies to a context path.
     *
     * @param string $path Context path such as /1/3/45.
     * @return string Encoded chain such as 1-3.45-7, empty when no stylesheet applies.
     */
    public function encoded(string $path): string {
        $key = self::key($path);
        $kept = $this->cache->get($key);
        if ($kept !== false) {
            return $kept === self::NONE ? '' : (string)$kept;
        }
        $encoded = bundle_service::encode_chain(($this->resolver)()->chain($path));
        $this->cache->set($key, $encoded === '' ? self::NONE : $encoded);
        return $encoded;
    }

    /**
     * Cache key of a path, made of characters that every store accepts.
     *
     * @param string $path Context path.
     * @return string Key.
     */
    private static function key(string $path): string {
        $key = strtr($path, '/', '_');
        return strlen($key) > self::MAX_KEY ? 'h' . md5($path) : 'p' . $key;
    }
}
