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
    /** @var \cache_application Compiled CSS cache. */
    private $cache;

    /**
     * Create the cache.
     *
     * @param \cache_application $cache Compiled CSS cache.
     */
    public function __construct(\cache_application $cache) {
        $this->cache = $cache;
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
     * Store compiled CSS.
     *
     * @param string $key Cache key.
     * @param string $css Compiled CSS.
     */
    public function set(string $key, string $css): void {
        $this->cache->set(sha1($key), $css);
    }
}
