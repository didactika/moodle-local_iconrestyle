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
 * The colour modes of the site.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * Moodle decides which colour modes exist, and the plugin follows: it asks Boost for them instead of keeping a list of its own.
 * A site that has no colour modes, or has them turned off, has none here, and then nothing in the plugin talks about them.
 */
final class colour_modes {
    /** @var string The mode that follows the device, which is a choice and not a way of drawing the page. */
    private const FOLLOW_DEVICE = 'auto';

    /**
     * The modes the core of this Moodle defines, whether or not they are turned on.
     *
     * @return string[] Modes such as light and dark, empty when this Moodle has no colour modes.
     */
    public static function known(): array {
        if (!class_exists(\theme_boost\colour_mode::class)) {
            return [];
        }
        return array_values(array_diff(\theme_boost\colour_mode::get_modes(), [self::FOLLOW_DEVICE]));
    }

    /**
     * The modes the pages of this site are shown in.
     *
     * @return string[] Modes, empty when colour modes are not turned on, or do not exist in this Moodle.
     */
    public static function available(): array {
        if (!class_exists(\theme_boost\colour_mode::class) || !\theme_boost\colour_mode::is_enabled()) {
            return [];
        }
        return self::known();
    }
}
