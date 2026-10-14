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
 * Draws multicolour artwork.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\asset\asset_urls;
use local_iconrestyle\rule\rule;
use local_iconrestyle\slot\glyph_signature;

/**
 * The artwork keeps its own colours as a background image, so it cannot be recoloured.
 */
final class image_painter implements painter {
    /** @var asset_urls Artwork addresses. */
    private $urls;

    /**
     * Create the painter.
     *
     * @param asset_urls $urls Artwork addresses.
     */
    public function __construct(asset_urls $urls) {
        $this->urls = $urls;
    }

    /**
     * Declarations for a rule on a signature.
     *
     * @param rule $rule Rule to paint.
     * @param glyph_signature $signature Markup signature of the slot.
     * @return array Declarations keyed by selector suffix.
     */
    public function paint(rule $rule, glyph_signature $signature): array {
        $url = $rule->assetid() === null ? null : $this->urls->css_url($rule->assetid());
        if ($url === null) {
            return [];
        }
        $drawing = [
            'background-image' => $url,
            'background-position' => 'center',
            'background-size' => 'contain',
            'background-repeat' => 'no-repeat',
        ];
        if ($signature->kind() === glyph_signature::KIND_CONTAINER) {
            return icon_in_box::blocks($drawing);
        }
        if ($signature->kind() === glyph_signature::KIND_FONT) {
            return ['::before' => [
                'content' => '""', 'display' => 'inline-block', 'width' => '1em', 'height' => '1em', 'vertical-align' => '-0.125em',
            ] + $drawing];
        }
        return ['' => $drawing + ['object-fit' => 'none', 'object-position' => '-9999px 0']];
    }
}
