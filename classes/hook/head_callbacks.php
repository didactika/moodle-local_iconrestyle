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
 * Adds the icon stylesheet to the page head.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\hook;

use local_iconrestyle\delivery\bundle_service;
use local_iconrestyle\service_factory;

/**
 * Single entry for the 4.4+ hook and the legacy callback of older cores.
 *
 * The stylesheet is registered through the page requirements, which Moodle emits after theme CSS.
 * A failure here must never break a page, so it is reported to developers and swallowed.
 */
final class head_callbacks {
    /**
     * Hook callback for Moodle 4.4 and later.
     *
     * @param \core\hook\output\before_standard_head_html_generation $hook The hook.
     */
    public static function before_standard_head_html_generation(
        \core\hook\output\before_standard_head_html_generation $hook
    ): void {
        self::inject();
    }

    /**
     * Address of the stylesheet that customises the pages of a context.
     *
     * @param \context $context Context of the page.
     * @return \moodle_url|null Address, or null when no rule applies there.
     */
    public static function stylesheet_url(\context $context): ?\moodle_url {
        $factory = service_factory::instance();
        $chain = $factory->chain_resolver()->chain($context->path);
        if ($chain === []) {
            return null;
        }
        $url = new \moodle_url('/local/iconrestyle/styles.php');
        $url->set_slashargument('/' . $factory->version_hash() . '/' . bundle_service::encode_chain($chain) . '/all.css');
        return $url;
    }

    /**
     * Register the stylesheet for the current page when it has rules.
     */
    public static function inject(): void {
        global $PAGE;
        try {
            if (!self::applicable()) {
                return;
            }
            $url = self::stylesheet_url($PAGE->context);
            if ($url !== null) {
                $PAGE->requires->css($url);
            }
        } catch (\Throwable $exception) {
            debugging('local_iconrestyle: ' . $exception->getMessage(), DEBUG_DEVELOPER);
        }
    }

    /**
     * Whether the plugin should act on this request.
     *
     * @return bool True when installed, enabled and not in install, upgrade or CLI.
     */
    private static function applicable(): bool {
        global $CFG;
        if (during_initial_install() || !empty($CFG->upgraderunning) || !empty($CFG->local_iconrestyle_disabled)) {
            return false;
        }
        $config = get_config('local_iconrestyle');
        return isset($config->version) && (!isset($config->enabled) || (int)$config->enabled === 1);
    }
}
