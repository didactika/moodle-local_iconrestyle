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
 * Tests for the CSS of the design properties.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\rule\rule;
use local_iconrestyle\slot\glyph_signature;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(container_painter::class)]
/**
 * Each design property becomes one declaration, and unset properties produce nothing.
 *
 * @covers \local_iconrestyle\style\container_painter
 */
final class design_painter_test extends \basic_testcase {
    /**
     * Declarations of a rule with the given design on a font icon.
     *
     * @param array $design Design properties.
     * @param array $options Other rule options.
     * @return array Declarations.
     */
    private function paint(array $design, array $options = []): array {
        $rule = new rule(0, 1, slot_key::parse('core:a/setting'), ['design' => $design] + $options);
        $signature = glyph_signature::from_font_classes('fa fa-gear');
        return (new container_painter())->paint($rule, $signature)[''] ?? [];
    }

    /**
     * Padding on one side writes only that side, and the same value on all four writes the shorthand.
     */
    public function test_padding_sides(): void {
        $this->assertSame(['box-sizing' => 'content-box', 'padding-top' => '0.50em'], $this->paint(['pt' => 50]));
        $this->assertSame(
            ['box-sizing' => 'content-box', 'padding-top' => '0.10em', 'padding-bottom' => '0.30em'],
            $this->paint(['pt' => 10, 'pb' => 30])
        );
        $this->assertSame(
            ['box-sizing' => 'content-box', 'padding' => '0.25em'],
            $this->paint(['pt' => 25, 'pr' => 25, 'pb' => 25, 'pl' => 25])
        );
        $this->assertSame(
            ['box-sizing' => 'content-box', 'padding-top' => '0.25em', 'padding-right' => '0.25em',
                'padding-bottom' => '0.25em', 'padding-left' => '0.00em'],
            $this->paint(['pt' => 25, 'pr' => 25, 'pb' => 25, 'pl' => 0])
        );
    }

    /**
     * Shapes and an exact radius.
     */
    public function test_shape_and_radius(): void {
        $this->assertSame(['border-radius' => '999px'], $this->paint(['shape' => 'pill']));
        $this->assertSame(['border-radius' => '50%'], $this->paint(['shape' => 'circle']));
        $this->assertSame(['border-radius' => '0'], $this->paint(['shape' => 'none']));
        $this->assertSame(['border-radius' => '12px'], $this->paint(['shape' => 'pill', 'radius' => 12]));
    }

    /**
     * Border width, style and colour, with sensible defaults for what is not set.
     */
    public function test_border(): void {
        $this->assertSame(['border' => '2px solid currentColor'], $this->paint(['bw' => 2]));
        $this->assertSame(['border' => '3px dashed #e83e8c'], $this->paint(['bw' => 3, 'bs' => 'dashed', 'bc' => '#e83e8c']));
        $this->assertSame(['border' => '1px double currentColor'], $this->paint(['bs' => 'double']));
        $this->assertSame(['border' => '0'], $this->paint(['bw' => 0]));
    }

    /**
     * Shadows have presets, take an optional colour, and can be removed.
     */
    public function test_shadow(): void {
        $this->assertSame(['box-shadow' => '0 1px 3px rgba(0, 0, 0, 0.25)'], $this->paint(['shadow' => 'soft']));
        $this->assertSame(['box-shadow' => '0 4px 10px #112233'], $this->paint(['shadow' => 'medium', 'sc' => '#123']));
        $this->assertSame(['box-shadow' => '0 0 10px 2px currentColor'], $this->paint(['shadow' => 'glow']));
        $this->assertSame(['box-shadow' => 'none'], $this->paint(['shadow' => 'none']));
    }

    /**
     * Rotation and scale share one transform, and opacity is a fraction.
     */
    public function test_transform_and_opacity(): void {
        $this->assertSame(['zoom' => '1.50', 'transform' => 'rotate(-30deg)'], $this->paint(['rotate' => -30, 'scale' => 150]));
        $this->assertSame(['zoom' => '0.25'], $this->paint(['scale' => 25]));
        $this->assertSame(['transform' => 'rotate(0deg)'], $this->paint(['rotate' => 0]));
        $this->assertSame(['transform' => 'scaleX(-1) scaleY(-1)'], $this->paint(['flipx' => 1, 'flipy' => 1]));
        $this->assertSame([], $this->paint(['flipx' => 0]));
        $this->assertSame(['opacity' => '0.00'], $this->paint(['opacity' => 0]));
    }

    /**
     * Margin works like padding, can be negative, and filters are written in a fixed order.
     */
    public function test_margin_and_filters(): void {
        $this->assertSame(['margin-top' => '-0.20em', 'margin-left' => '0.50em'], $this->paint(['mt' => -20, 'ml' => 50]));
        $this->assertSame(['margin' => '0.10em'], $this->paint(['mt' => 10, 'mr' => 10, 'mb' => 10, 'ml' => 10]));
        $this->assertSame(
            ['filter' => 'brightness(1.20) contrast(0.80) saturate(1.50) grayscale(0.30) hue-rotate(-40deg) blur(2px)'],
            $this->paint(['blur' => 2, 'hue' => -40, 'grayscale' => 30, 'saturate' => 150, 'contrast' => 80, 'brightness' => 120])
        );
    }

    /**
     * Declarations come out in a fixed order, so the stylesheet is the same every time.
     */
    public function test_declaration_order_is_stable(): void {
        $declarations = $this->paint(
            ['opacity' => 50, 'scale' => 120, 'shadow' => 'soft', 'bw' => 1, 'pt' => 5, 'shape' => 'circle'],
            ['bg' => '#ffffff']
        );
        $this->assertSame(
            ['background-color', 'border-radius', 'box-sizing', 'padding-top', 'border', 'box-shadow', 'zoom', 'opacity'],
            array_keys($declarations)
        );
    }

    /**
     * No design and no background paint nothing.
     */
    public function test_nothing_set_paints_nothing(): void {
        $this->assertSame([], $this->paint([]));
    }

    /**
     * A gradient runs from the background colour, or from nothing, to a second colour.
     */
    public function test_gradient(): void {
        $this->assertSame(
            ['background-image' => 'linear-gradient(135deg, transparent, #112233)'],
            $this->paint(['bg2' => '#123'])
        );
        $this->assertSame(
            ['background-color' => '#ff0000', 'background-image' => 'linear-gradient(90deg, #ff0000, #0000ff)'],
            $this->paint(['bg2' => '#0000ff', 'gd' => 90], ['bg' => '#ff0000'])
        );
    }

    /**
     * An outline has a width, a colour and an offset, and can be removed.
     */
    public function test_outline(): void {
        $this->assertSame(['outline' => '2px solid currentColor', 'outline-offset' => '0px'], $this->paint(['oo' => 0]));
        $this->assertSame(
            ['outline' => '3px solid #e83e8c', 'outline-offset' => '4px'],
            $this->paint(['ow' => 3, 'oc' => '#e83e8c', 'oo' => 4])
        );
        $this->assertSame(['outline' => '0'], $this->paint(['ow' => 0]));
    }

    /**
     * Skew joins the transform, and the extra shadows, the filters that follow the glyph and blending are written.
     */
    public function test_skew_shadows_filters_and_blend(): void {
        $this->assertSame(
            ['transform' => 'rotate(10deg) skewX(-15deg) skewY(5deg) scaleX(-1)'],
            $this->paint(['rotate' => 10, 'skx' => -15, 'sky' => 5, 'flipx' => 1])
        );
        $this->assertSame(['box-shadow' => 'inset 0 2px 6px rgba(0, 0, 0, 0.35)'], $this->paint(['shadow' => 'inner']));
        $this->assertSame(['box-shadow' => '3px 3px 0 #000000'], $this->paint(['shadow' => 'hard', 'sc' => '#000']));
        $this->assertSame(
            ['filter' => 'sepia(0.40) invert(1.00) drop-shadow(0 3px 5px rgba(0, 0, 0, 0.4))'],
            $this->paint(['sepia' => 40, 'invert' => 100, 'ds' => 'medium'])
        );
        $this->assertSame(['filter' => 'drop-shadow(0 0 6px #112233)'], $this->paint(['ds' => 'glow', 'sc' => '#123']));
        $this->assertSame(['mix-blend-mode' => 'multiply'], $this->paint(['blend' => 'multiply']));
        $this->assertSame([], $this->paint(['blend' => 'normal', 'ds' => 'none', 'hover' => 'none']));
    }

    /**
     * A hover effect adds a transition to the icon and a block for the hovered icon that keeps what the icon already does.
     */
    public function test_hover(): void {
        $rule = new rule(0, 1, slot_key::parse('core:a/setting'), ['design' => ['hover' => 'grow', 'rotate' => 10]]);
        $blocks = (new container_painter())->paint($rule, glyph_signature::from_font_classes('fa fa-gear'));
        $this->assertSame('transform 0.2s ease, opacity 0.2s ease', $blocks['']['transition']);
        $this->assertSame(['transform' => 'rotate(10deg) scale(1.15)'], $blocks[':hover']);
        $rule = new rule(0, 1, slot_key::parse('core:a/setting'), ['design' => ['hover' => 'fade']]);
        $blocks = (new container_painter())->paint($rule, glyph_signature::from_font_classes('fa fa-gear'));
        $this->assertSame(['opacity' => '0.6'], $blocks[':hover']);
    }
}
