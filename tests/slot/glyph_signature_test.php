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
 * Tests for glyph signatures.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\slot;

#[\PHPUnit\Framework\Attributes\CoversClass(glyph_signature::class)]
/**
 * Tests for glyph signatures.
 *
 * @covers \local_iconrestyle\slot\glyph_signature
 */
final class glyph_signature_test extends \basic_testcase {
    /**
     * A solid glyph is recognised with or without the explicit solid family and rejects other families.
     */
    public function test_solid_font_signature(): void {
        $signature = glyph_signature::from_font_classes('fa fa-gear');
        $this->assertSame(glyph_signature::KIND_FONT, $signature->kind());
        $this->assertTrue($signature->matches(['icon', 'fa', 'fa-gear', 'fa-fw']));
        $this->assertTrue($signature->matches(['icon', 'fa-solid', 'fa-gear', 'fa-fw', 'text-info']));
        $this->assertFalse($signature->matches(['icon', 'fa-regular', 'fa-gear']));
        $this->assertFalse($signature->matches(['icon', 'fa-brands', 'fa-gear']));
        $this->assertFalse($signature->matches(['icon', 'fa', 'fa-pen']));
        $this->assertFalse($signature->matches(['fa', 'fa-gear']));
        $this->assertSame(
            ['body .icon.fa-gear:not(.fa-regular):not(.fa-brands):not(.fa-light):not(.fa-thin):not(.fa-duotone):not(.fa-sharp)'],
            $signature->selectors('body ')
        );
    }

    /**
     * A named family is required.
     */
    public function test_regular_font_signature(): void {
        $signature = glyph_signature::from_font_classes('fa-regular fa-bookmark');
        $this->assertTrue($signature->matches(['icon', 'fa-regular', 'fa-bookmark', 'fa-fw']));
        $this->assertFalse($signature->matches(['icon', 'fa', 'fa-bookmark']));
        $this->assertSame(['body .icon.fa-regular.fa-bookmark'], $signature->selectors('body '));
    }

    /**
     * Font Awesome 4.7 names, as used by Moodle 4.0, are recognised.
     */
    public function test_font_awesome_four_signature(): void {
        $signature = glyph_signature::from_font_classes('fa-cog');
        $this->assertTrue($signature->matches(['icon', 'fa', 'fa-cog', 'fa-fw']));
    }

    /**
     * Modifiers do not identify a glyph and a string with no glyph has no signature.
     */
    public function test_modifiers_are_not_identity(): void {
        $spinner = glyph_signature::from_font_classes('fa-circle-notch fa-spin');
        $this->assertTrue($spinner->matches(['icon', 'fa', 'fa-circle-notch', 'fa-fw']));
        $this->assertNull(glyph_signature::from_font_classes('fa-spin'));
        $this->assertNull(glyph_signature::from_font_classes('text-info'));
        $this->assertNull(glyph_signature::from_font_classes(''));
    }

    /**
     * Slots with the same glyph share an identity.
     */
    public function test_shared_glyphs_share_identity(): void {
        $this->assertSame(
            glyph_signature::from_font_classes('fa fa-pen')->identity(),
            glyph_signature::from_font_classes('fa-pen fa')->identity()
        );
        $this->assertNotSame(
            glyph_signature::from_font_classes('fa fa-pen')->identity(),
            glyph_signature::from_font_classes('fa-regular fa-pen')->identity()
        );
    }

    /**
     * Image icons produce the slash-argument and the query-string selectors.
     */
    public function test_image_selectors(): void {
        $selectors = glyph_signature::from_image('moodle', 'a/setting')->selectors('body ');
        $this->assertCount(3, $selectors);
        $this->assertSame('body img.icon[src*="/image.php/"][src*="/core/"][src$="/a/setting"]', $selectors[0]);
        $this->assertSame('body img.icon[src*="component=core"][src$="image=a%2Fsetting"]', $selectors[1]);
        $this->assertSame('body img.icon[src*="component=core"][src*="image=a%2Fsetting&"]', $selectors[2]);
        $this->assertFalse(glyph_signature::from_image('core', 'a/setting')->matches(['icon']));
    }
}
