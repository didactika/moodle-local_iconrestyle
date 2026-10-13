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
 * Where an icon of the person's own goes inside the box of an activity.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

/**
 * Moodle draws the icon of an activity as an image inside a box. Replacing it means hiding that image and drawing the new icon
 * on a pseudo-element of the box, centred and a little smaller than the box, so the box keeps its colour, shape and padding.
 * Both painters of artwork do it the same way and differ only in how they fill the pseudo-element.
 */
final class icon_in_box {
    /** @var string Share of the box the new icon takes, on each side. */
    private const SIZE = '55%';

    /**
     * Declarations that put an icon in the box.
     *
     * @param array $drawing Declarations that fill the pseudo-element with the icon.
     * @return array Declarations keyed by selector suffix.
     */
    public static function blocks(array $drawing): array {
        return [
            '' => ['position' => 'relative'],
            '::after' => [
                'content' => '""',
                'position' => 'absolute',
                'top' => '0',
                'right' => '0',
                'bottom' => '0',
                'left' => '0',
                'margin' => 'auto',
                'width' => self::SIZE,
                'height' => self::SIZE,
            ] + $drawing,
            ' .activityicon:not(.nofilter)' => ['visibility' => 'hidden'],
        ];
    }
}
