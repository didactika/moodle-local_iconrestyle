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
 * Resolves the stylesheets that apply to a page.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\delivery;

use local_iconrestyle\rule\revision_registry;
use local_iconrestyle\rule\rule_limits;

/**
 * Reads only the revisions of the contexts on the page's path.
 */
class chain_resolver {
    /** @var int Most stylesheets one page may load: the site and the nearest contexts below it that have rules. */
    public const MAX_DEPTH = rule_limits::MAX_CHAIN;

    /** @var int Most contexts of a path that are looked at, which is far deeper than a category tree is meant to be. */
    public const MAX_PATH = 64;

    /** @var revision_registry Revision source. */
    private $revisions;

    /**
     * Create the resolver.
     *
     * @param revision_registry $revisions Revision source.
     */
    public function __construct(revision_registry $revisions) {
        $this->revisions = $revisions;
    }

    /**
     * Stylesheets that apply to a context path, root first.
     *
     * Every context of the path is looked at, so a deep category tree does not hide the rules of a category in the middle. When
     * more than MAX_DEPTH of them have rules, the site and the ones nearest to the page stay.
     *
     * @param string $path Context path such as /1/3/45.
     * @return int[] Effective revision keyed by context id, only contexts that have rules.
     */
    public function chain(string $path): array {
        $ids = array_values(array_unique(array_filter(array_map('intval', explode('/', $path)))));
        if (count($ids) > self::MAX_PATH) {
            $ids = array_merge([$ids[0]], array_slice($ids, -(self::MAX_PATH - 1)));
        }
        if ($ids === []) {
            return [];
        }
        $revisions = $this->revisions->get_many($ids);
        $chain = [];
        foreach ($ids as $id) {
            if (($revisions[$id] ?? 0) > 0) {
                $chain[$id] = $revisions[$id];
            }
        }
        if (count($chain) > self::MAX_DEPTH) {
            $first = array_slice($chain, 0, 1, true);
            $chain = $first + array_slice($chain, -(self::MAX_DEPTH - 1), null, true);
        }
        return $chain;
    }
}
