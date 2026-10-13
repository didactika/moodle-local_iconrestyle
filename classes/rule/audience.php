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
 * The pages and page regions a rule is limited to.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * Pages and regions are chosen from fixed lists, never typed, so no selector ever comes from user input.
 *
 * Together with the context a rule belongs to this says where the rule applies. An empty list means everywhere.
 */
final class audience {
    /** @var string Identity of a rule that is limited to no page and no region. */
    public const UNLIMITED = '0';

    /** @var string[] Colour modes that every site knows, all meaning every mode. */
    public const MODES = ['all', 'light', 'dark'];

    /** @var string[] Kinds of page a rule can be limited to. */
    public const PAGES = ['dashboard', 'sitehome', 'course', 'activity', 'admin', 'profile', 'calendar', 'grades', 'login'];

    /** @var string[] Regions of a page a rule can be limited to. */
    public const REGIONS = ['navbar', 'primarynav', 'secondarynav', 'courseindex', 'blocks', 'content', 'footer'];

    /**
     * Check a list of tokens against the fixed list and put it in a stable order.
     *
     * @param string[] $tokens Tokens to check.
     * @param string[] $allowed Tokens that are accepted.
     * @return string[] Unique tokens in the order of the fixed list.
     * @throws \InvalidArgumentException When a token is not in the fixed list.
     */
    public static function normalise(array $tokens, array $allowed): array {
        $tokens = array_values(array_unique(array_map('strval', $tokens)));
        foreach ($tokens as $token) {
            if (!in_array($token, $allowed, true)) {
                throw new \InvalidArgumentException('Unknown page or region.');
            }
        }
        return array_values(array_intersect($allowed, $tokens));
    }

    /**
     * Check a colour mode.
     *
     * @param string $mode Candidate mode.
     * @return string The mode.
     * @throws \InvalidArgumentException When the mode is not accepted.
     */
    public static function check_mode(string $mode): string {
        if (!in_array($mode, self::modes(), true)) {
            throw new \InvalidArgumentException('Unknown colour mode.');
        }
        return $mode;
    }

    /**
     * The colour modes a rule can be limited to: every mode, light and dark, and any other mode this Moodle defines.
     *
     * @return string[] Modes.
     */
    public static function modes(): array {
        return array_values(array_unique(array_merge(self::MODES, colour_modes::known())));
    }

    /**
     * Split a stored comma separated list.
     *
     * @param string|null $stored Stored value.
     * @return string[] Tokens.
     */
    public static function split(?string $stored): array {
        return $stored === null || $stored === '' ? [] : explode(',', $stored);
    }

    /**
     * Short identity of a combination of pages, regions and colour mode, UNLIMITED for everywhere.
     *
     * @param string[] $pages Normalised pages.
     * @param string[] $regions Normalised regions.
     * @param string $mode Colour mode, all when the rule applies in both.
     * @return string Identity that tells variants of one icon in one context apart.
     */
    public static function variant(array $pages, array $regions, string $mode = 'all'): string {
        if ($pages === [] && $regions === [] && $mode === 'all') {
            return self::UNLIMITED;
        }
        return substr(sha1(implode(',', $pages) . '|' . implode(',', $regions) . '|' . $mode), 0, 16);
    }
}
