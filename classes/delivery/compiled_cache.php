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
 * Cache of compiled delta stylesheets.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\delivery;

/**
 * Stores compiled CSS by an immutable key. Keys contain a colon, which the simple-key cache does not accept, so they are hashed.
 */
class compiled_cache {
    /** @var \cache Compiled CSS cache. */
    private $cache;

    /**
     * Create the cache.
     *
     * @param \cache $cache Compiled CSS cache.
     */
    public function __construct(\cache $cache) {
        $this->cache = $cache;
    }

    /**
     * Key of one compiled stylesheet.
     *
     * @param string $hash Version hash of the installed code.
     * @param int $contextid Delta owner context.
     * @param int $rev Effective revision.
     * @return string Key.
     */
    public static function key(string $hash, int $contextid, int $rev): string {
        return $hash . ':' . $contextid . ':' . $rev;
    }

    /**
     * Read compiled CSS.
     *
     * @param string $key Cache key.
     * @return string|null CSS, or null when absent.
     */
    public function get(string $key): ?string {
        $value = $this->cache->get(sha1($key));
        return $value === false ? null : (string)$value;
    }

    /**
     * Whether compiled CSS is stored, without reading it.
     *
     * @param string $key Cache key.
     * @return bool True when stored.
     */
    public function has(string $key): bool {
        return $this->cache->has(sha1($key));
    }

    /**
     * Store compiled CSS.
     *
     * @param string $key Cache key.
     * @param string $css Compiled CSS.
     */
    public function set(string $key, string $css): void {
        $this->cache->set(sha1($key), $css);
    }

    /**
     * Remove compiled CSS.
     *
     * @param string $key Cache key.
     */
    public function delete(string $key): void {
        $this->cache->delete(sha1($key));
    }
}
