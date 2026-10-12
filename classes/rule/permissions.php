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
 * Who may customise icons.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * Icons are customised in one place, the site administration, so one capability governs every rule wherever it applies.
 */
class permissions {
    /** @var string Capability that governs every rule. */
    public const CAPABILITY = 'local/iconrestyle:manage';

    /**
     * Whether a rule may apply in a kind of context at all.
     *
     * @param \context $context Context.
     * @return bool True for the site, categories, courses and activities.
     */
    public function supports(\context $context): bool {
        return in_array($context->contextlevel, [CONTEXT_SYSTEM, CONTEXT_COURSECAT, CONTEXT_COURSE, CONTEXT_MODULE], true);
    }

    /**
     * Whether a user may customise icons.
     *
     * @param int|null $userid User, or null for the current user.
     * @return bool True when allowed.
     */
    public function can_manage(?int $userid = null): bool {
        return has_capability(self::CAPABILITY, \context_system::instance(), $userid);
    }

    /**
     * Require permission to customise icons.
     *
     * @throws \required_capability_exception When the user lacks the capability.
     */
    public function require_manage(): void {
        require_capability(self::CAPABILITY, \context_system::instance());
    }
}
