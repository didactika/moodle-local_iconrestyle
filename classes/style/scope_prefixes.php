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
 * Turns the place a rule applies into the selector prefixes its CSS starts with.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\rule\module_scope;
use local_iconrestyle\rule\rule;

/**
 * The pages and regions come from fixed lists, so every selector here is written by the plugin, never by a user.
 *
 * A page limits the rule through a class or id of the body, a region through the element that holds it, and an activity
 * through its id on the course page and its class on its own page. The more a rule is limited, the more specific its
 * selectors are, so a limited rule wins over an unlimited one without any priority setting.
 */
class scope_prefixes {
    /** @var string Prefix of rules that apply on every page, which raises specificity above theme rules. */
    public const BASE = 'body';

    /** @var string[] Qualifier added to the body for each kind of page. */
    private const PAGES = [
        'dashboard' => '#page-my-index',
        'sitehome' => '#page-site-index',
        'course' => '.path-course-view',
        'activity' => '.path-mod',
        'admin' => '.path-admin',
        'profile' => '.path-user',
        'calendar' => '.path-calendar',
        'grades' => '.path-grade',
        'login' => '#page-login-index',
    ];

    /** @var string[] Selector of the element that holds each region. */
    private const REGIONS = [
        'navbar' => '.navbar',
        'primarynav' => '.primary-navigation',
        'secondarynav' => '.secondary-navigation',
        'courseindex' => '#courseindex',
        'blocks' => '.block-region',
        'content' => '#region-main',
        'footer' => '#page-footer',
    ];

    /** @var module_scope|null Tells which activity an activity rule belongs to, or null to leave rules unscoped. */
    private $modules;

    /**
     * Create the builder.
     *
     * @param module_scope|null $modules Scope resolver for activity rules.
     */
    public function __construct(?module_scope $modules = null) {
        $this->modules = $modules;
    }

    /**
     * Prefixes the selectors of a rule start with.
     *
     * @param rule $rule Rule.
     * @param string $prefix Prefix of the stylesheet, used as it is when the rule is not scoped.
     * @param bool $scoped Whether the rule is limited to its place, which only makes sense on real pages.
     * @return string[] Prefixes, each ending in a space.
     */
    public function for_rule(rule $rule, string $prefix, bool $scoped): array {
        if (!$scoped) {
            return [$prefix];
        }
        $bodies = [];
        foreach ($rule->pages() === [] ? [''] : $rule->pages() as $page) {
            $bodies[] = self::BASE . ($page === '' ? '' : self::PAGES[$page]);
        }
        $cmid = $this->modules !== null ? $this->modules->cmid_of($rule->contextid()) : null;
        $prefixes = [];
        foreach ($bodies as $body) {
            if ($cmid === null) {
                $prefixes[] = $body . ' ';
            } else {
                $prefixes[] = $body . ' #module-' . $cmid . ' ';
                $prefixes[] = $body . '.cmid-' . $cmid . ' ';
            }
        }
        if ($rule->regions() === []) {
            return $prefixes;
        }
        $result = [];
        foreach ($prefixes as $each) {
            foreach ($rule->regions() as $region) {
                $result[] = $each . self::REGIONS[$region] . ' ';
            }
        }
        return $result;
    }
}
