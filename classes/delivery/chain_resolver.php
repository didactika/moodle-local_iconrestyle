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

/**
 * Reads only the revisions of the contexts on the page's path.
 */
class chain_resolver {
    /** @var int Longest context path that is considered. */
    public const MAX_DEPTH = 12;

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
     * @param string $path Context path such as /1/3/45.
     * @return int[] Effective revision keyed by context id, only contexts that have rules.
     */
    public function chain(string $path): array {
        $ids = array_values(array_unique(array_filter(array_map('intval', explode('/', $path)))));
        if (count($ids) > self::MAX_DEPTH) {
            $ids = array_merge([$ids[0]], array_slice($ids, -(self::MAX_DEPTH - 1)));
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
        return $chain;
    }
}
