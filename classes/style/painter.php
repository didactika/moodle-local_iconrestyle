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
 * Turns a rule into CSS declarations.
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
 * A painter returns declarations grouped by the selector suffix they apply to.
 *
 * New ways of drawing an icon are new painters; the compiler is not edited.
 */
interface painter {
    /**
     * Declarations for a rule on a signature.
     *
     * @param rule $rule Rule to paint.
     * @param glyph_signature $signature Markup signature of the slot.
     * @return array Declarations keyed by selector suffix, each a list of property => value.
     */
    public function paint(rule $rule, glyph_signature $signature): array;
}
