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
 * Core callbacks for local_iconrestyle.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Legacy head callback for cores that predate the output hooks.
 *
 * Moodle 4.4 and later still call this function, so it does nothing when the hook class exists.
 *
 * @return string Empty string; the stylesheet is registered through the page requirements.
 */
function local_iconrestyle_before_standard_html_head() {
    if (!class_exists(\core\hook\output\before_standard_head_html_generation::class)) {
        \local_iconrestyle\hook\head_callbacks::inject();
    }
    return '';
}

/**
 * The icons of the plugin that Moodle does not have, mapped to the Font Awesome glyph that draws them.
 *
 * Moodle adds this map to its own, so the icons are drawn with the pix helper like any other and appear in the designer, where a
 * site can restyle them. A glyph that is written as a class and is not in a map is not an icon of Moodle and cannot be found.
 *
 * @return string[] Glyph of each icon, by the key of the icon.
 */
function local_iconrestyle_get_fontawesome_icon_map() {
    global $CFG;

    return [
        // The half circle that changes the colour mode; the name that Font Awesome 4 knows is also an alias in the later ones.
        'local_iconrestyle:colour_mode' => 'fa-adjust',
        'local_iconrestyle:moon' => $CFG->branch < 402 ? 'fa-moon-o' : 'fa-moon',
    ];
}
