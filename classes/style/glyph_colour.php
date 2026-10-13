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
 * The colour of the icon inside an activity box.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\rule\color;
use local_iconrestyle\rule\rule;

/**
 * The same choice is needed by the painter of the box, which recolours Moodle's own icon, and by the painters of artwork, which
 * draw an icon of the person's own, so it lives in one place.
 */
final class glyph_colour {
    /** @var float Relative luminance above which a dark icon reads better than a white one. */
    private const DARK_ON_LIGHT = 0.179;

    /**
     * Colour of the icon inside the box of a rule.
     *
     * The colour of the rule when it has one. A box with no colour at all lets the icon follow the text colour of the page, so
     * it reads on a light page and on a dark one. Otherwise, a box with a fixed background gets the icon that reads best on it,
     * because Moodle draws its icon in the purpose colour (Moodle 5) or in white (Moodle 4), and either can vanish on the
     * colour that was chosen.
     *
     * @param rule $rule Rule to paint.
     * @return color|null Colour, or null to leave Moodle's own icon as it is.
     */
    public static function of(rule $rule): ?color {
        if ($rule->fg() !== null) {
            return $rule->fg();
        }
        if ($rule->bg() !== null && $rule->bg()->stored() === color::TRANSPARENT) {
            return color::parse('currentcolor');
        }
        $luminance = $rule->bg() === null ? null : $rule->bg()->luminance();
        if ($luminance === null) {
            return null;
        }
        return color::parse($luminance > self::DARK_ON_LIGHT ? '#000000' : '#ffffff');
    }
}
