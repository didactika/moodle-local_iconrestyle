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
 * Who may customise icons where.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * Each kind of context has its own capability, so a manager of a category can restyle it without touching the site.
 */
class permissions {
    /** @var string[] Capability that governs each context level. */
    private const CAPABILITIES = [
        CONTEXT_SYSTEM => 'local/iconrestyle:managesite',
        CONTEXT_COURSECAT => 'local/iconrestyle:managecategory',
        CONTEXT_COURSE => 'local/iconrestyle:managecourse',
        CONTEXT_MODULE => 'local/iconrestyle:managemodule',
    ];

    /**
     * Whether rules may exist in a kind of context at all.
     *
     * @param \context $context Context.
     * @return bool True for system, category, course and activity contexts.
     */
    public function supports(\context $context): bool {
        return isset(self::CAPABILITIES[$context->contextlevel]);
    }

    /**
     * Whether a user may customise icons in a context.
     *
     * @param \context $context Context.
     * @param int|null $userid User, or null for the current user.
     * @return bool True when allowed.
     */
    public function can_manage(\context $context, ?int $userid = null): bool {
        return $this->supports($context) && has_capability(self::CAPABILITIES[$context->contextlevel], $context, $userid);
    }

    /**
     * Require permission to customise icons in a context.
     *
     * @param \context $context Context.
     * @throws \required_capability_exception When the user lacks the capability.
     * @throws \InvalidArgumentException When rules are not allowed in that kind of context.
     */
    public function require_manage(\context $context): void {
        if (!$this->supports($context)) {
            throw new \InvalidArgumentException('Rules are not allowed in this context.');
        }
        require_capability(self::CAPABILITIES[$context->contextlevel], $context);
    }
}
