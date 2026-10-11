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
 * Styles the box around an icon.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\rule\rule;
use local_iconrestyle\slot\glyph_signature;

/**
 * Applies background, shape, padding and opacity to the icon element.
 */
final class container_painter implements painter {
    /** @var string[] Border radius of each shape. */
    private const RADIUS = ['none' => '0', 'square' => '0', 'rounded' => '0.375em', 'circle' => '50%'];

    /**
     * Declarations for a rule on a signature.
     *
     * @param rule $rule Rule to paint.
     * @param glyph_signature $signature Markup signature of the slot.
     * @return array Declarations keyed by selector suffix.
     */
    public function paint(rule $rule, glyph_signature $signature): array {
        $declarations = [];
        if ($rule->bg() !== null) {
            $declarations['background-color'] = $rule->bg()->css();
        }
        if ($rule->shape() !== null) {
            $declarations['border-radius'] = self::RADIUS[$rule->shape()];
        }
        if ($rule->padding() !== null) {
            $declarations['box-sizing'] = 'content-box';
            $declarations['padding'] = number_format($rule->padding() / 100, 2, '.', '') . 'em';
        }
        if ($rule->opacity() !== null) {
            $declarations['opacity'] = number_format($rule->opacity() / 100, 2, '.', '');
        }
        return $declarations === [] ? [] : ['' => $declarations];
    }
}
