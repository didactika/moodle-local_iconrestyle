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
 * Tests for the box Moodle draws around activity icons.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\rule\color;
use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\glyph_signature;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(container_painter::class)]
/**
 * Purposes and activity types are styled through the box around the icon, and the glyph inside it takes any colour.
 *
 * @covers \local_iconrestyle\style\container_painter
 * @covers \local_iconrestyle\slot\glyph_signature
 * @covers \local_iconrestyle\slot\glyph_signature_factory
 * @covers \local_iconrestyle\slot\activity_map
 * @covers \local_iconrestyle\slot\slot_catalogue
 * @covers \local_iconrestyle\rule\color
 */
final class activity_boxes_test extends \advanced_testcase {
    /**
     * Start from a fresh factory.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
    }

    /**
     * Build a rule on an activity slot.
     *
     * @param string $key Slot key.
     * @param array $options Rule options.
     * @return rule Rule.
     */
    private function rule(string $key, array $options): rule {
        return new rule(0, \context_system::instance()->id, slot_key::parse($key), $options);
    }

    /**
     * A purpose is matched through the class Moodle gives the box, whatever the markup around it.
     */
    public function test_purpose_selector(): void {
        $signature = glyph_signature::from_purpose('assessment');
        $this->assertSame(glyph_signature::KIND_CONTAINER, $signature->kind());
        $this->assertSame(['body .activityiconcontainer.assessment'], $signature->selectors('body '));
        $this->assertFalse($signature->matches(['icon', 'fa-gear']));
    }

    /**
     * An activity type is matched through the class its list item carries.
     */
    public function test_activity_type_selector(): void {
        $signature = glyph_signature::from_activity_type('assign');
        $this->assertSame(
            ['body .modtype_assign .activityiconcontainer', 'body .activityiconcontainer.modicon_assign'],
            $signature->selectors('body ')
        );
    }

    /**
     * Names that could not be classes give no signature, so no selector is ever built from them.
     */
    public function test_hostile_names_give_no_signature(): void {
        foreach (['a b', 'x{}', 'A', 'a.b', 'x/y', ''] as $name) {
            $this->assertNull(glyph_signature::from_purpose($name), $name);
            $this->assertNull(glyph_signature::from_activity_type($name), $name);
        }
    }

    /**
     * Removing Moodle's colour makes the box transparent and the glyph follow the text of the page, so it stays visible.
     */
    public function test_flat_look(): void {
        $css = service_factory::instance()->compiler()->compile([
            $this->rule('purpose:assessment', ['bg' => 'transparent']),
        ]);
        $this->assertSame(
            "body .activityiconcontainer.assessment {\n  background-color: transparent;\n  overflow: hidden;\n}\n" .
            "body .activityiconcontainer.assessment .activityicon:not(.nofilter) {\n" .
            "  transform: translateX(-1000px) !important;\n  filter: drop-shadow(1000px 0 0 currentColor) !important;\n}\n",
            $css
        );
    }

    /**
     * The glyph takes any colour, a theme token included, by moving the image out of its box and bringing back its shadow.
     */
    public function test_glyph_colour(): void {
        $compiler = service_factory::instance()->compiler();
        $css = $compiler->compile([$this->rule('purpose:content', ['fg' => '#e83e8c'])]);
        $this->assertStringContainsString('filter: drop-shadow(1000px 0 0 #e83e8c) !important;', $css);
        $this->assertStringContainsString("overflow: hidden;", $css);
        $token = $compiler->compile([$this->rule('purpose:content', ['fg' => 'token:primary'])]);
        $this->assertStringContainsString('drop-shadow(1000px 0 0 var(--bs-primary, var(--primary))) !important', $token);
    }

    /**
     * A box can be given a colour, a shape, padding and a border.
     */
    public function test_boxed_look(): void {
        $css = service_factory::instance()->compiler()->compile([
            $this->rule('purpose:communication', ['bg' => '#0a6b3d', 'shape' => 'rounded', 'padding' => 20]),
        ]);
        $this->assertStringContainsString("background-color: #0a6b3d;\n  border-radius: 0.375em;", $css);
        $this->assertStringContainsString("padding: 0.20em;", $css);
        $this->assertStringContainsString('drop-shadow(1000px 0 0 #ffffff) !important', $css);
    }

    /**
     * A box with a fixed colour gets the glyph that reads best on it, so a background can never hide the icon.
     */
    public function test_glyph_follows_the_background(): void {
        $compiler = service_factory::instance()->compiler();
        $light = $compiler->compile([$this->rule('purpose:content', ['bg' => '#ffe08a'])]);
        $this->assertStringContainsString('drop-shadow(1000px 0 0 #000000) !important', $light);
        $dark = $compiler->compile([$this->rule('purpose:content', ['bg' => '#0a6b3d'])]);
        $this->assertStringContainsString('drop-shadow(1000px 0 0 #ffffff) !important', $dark);
        $chosen = $compiler->compile([$this->rule('purpose:content', ['bg' => '#ffe08a', 'fg' => '#e83e8c'])]);
        $this->assertStringContainsString('drop-shadow(1000px 0 0 #e83e8c) !important', $chosen);
    }

    /**
     * Without a foreground the glyph keeps Moodle's own filter, and an empty rule paints nothing.
     */
    public function test_no_foreground_leaves_the_glyph_alone(): void {
        $compiler = service_factory::instance()->compiler();
        foreach (['token:primary'] as $background) {
            $this->assertStringNotContainsString('filter', $compiler->compile([
                $this->rule('purpose:content', ['bg' => $background]),
            ]));
        }
        $this->assertStringNotContainsString('filter', $compiler->compile([
            $this->rule('purpose:content', ['design' => '{"shape":"circle"}']),
        ]));
        $this->assertSame('', $compiler->compile([$this->rule('purpose:content', [])]));
    }

    /**
     * A rule on an activity type reaches only that type, and the preview leaves the page prefix to the caller.
     */
    public function test_activity_type_rule_and_preview(): void {
        $compiler = service_factory::instance()->compiler();
        $rule = $this->rule('activity:forum', ['bg' => '#e83e8c']);
        $this->assertStringContainsString('body .activityiconcontainer.modicon_forum {', $compiler->compile([$rule]));
        $this->assertStringContainsString(
            ".irs-preview-new .modtype_forum .activityiconcontainer,
.irs-preview-new .activityiconcontainer.modicon_forum {",
            $compiler->compile([$rule], '.irs-preview-new ', false)
        );
    }

    /**
     * No colour at all is a colour: it follows the theme and is written as transparent.
     */
    public function test_transparent_colour(): void {
        $colour = color::parse(' Transparent ');
        $this->assertSame('transparent', $colour->stored());
        $this->assertSame('transparent', $colour->css());
        $this->assertTrue($colour->follows_theme());
        $this->assertNull($colour->luminance());
    }

    /**
     * The catalogue lists a box for every purpose and for every installed activity, from the running core.
     */
    public function test_catalogue_lists_boxes(): void {
        $catalogue = service_factory::instance()->catalogue();
        $purpose = $catalogue->find('purpose:assessment');
        $this->assertSame('container', $purpose['kind']);
        $this->assertSame('activityiconcontainer assessment', $purpose['classes']);
        $this->assertSame('assessment', $purpose['purpose']);
        $this->assertNotSame('', $purpose['sample']);

        $assign = $catalogue->find('activity:assign');
        $this->assertSame(['container', 'assessment', 'assign'], [$assign['kind'], $assign['purpose'], $assign['sample']]);
        $this->assertNotNull($catalogue->find('activity:forum'));
        $this->assertNull($catalogue->find('activity:nosuchmodule'));
    }

    /**
     * An icon of the person's own goes inside the box, which keeps its colour, and hides Moodle's icon.
     */
    public function test_an_icon_of_its_own_in_the_box(): void {
        $asset = service_factory::instance()->assets()->add(file_get_contents(__DIR__ . '/../fixtures/triangle.svg'), 2);
        $css = service_factory::instance()->compiler()->compile([
            $this->rule('purpose:assessment', ['painter' => 'mask', 'assetid' => $asset->id(), 'bg' => '#e83e8c']),
        ]);
        $this->assertStringContainsString("body .activityiconcontainer.assessment {\n  background-color: #e83e8c;\n", $css);
        $this->assertStringContainsString(
            "body .activityiconcontainer.assessment::after {\n  content: \"\";\n  position: absolute;",
            $css
        );
        $this->assertStringContainsString("  background-color: #000000;\n  -webkit-mask: url(", $css);
        $this->assertStringContainsString(
            "body .activityiconcontainer.assessment .activityicon:not(.nofilter) {\n  visibility: hidden;\n}\n",
            $css
        );
        $this->assertStringNotContainsString('drop-shadow', $css);
        $this->assertStringContainsString('position: relative', $css);
    }

    /**
     * Artwork with its own colours is drawn as an image in the box and is not recoloured.
     */
    public function test_a_multicolour_icon_in_the_box(): void {
        $asset = service_factory::instance()->assets()->add(file_get_contents(__DIR__ . '/../fixtures/triangle.svg'), 2);
        $css = service_factory::instance()->compiler()->compile([
            $this->rule('activity:assign', ['painter' => 'image', 'assetid' => $asset->id()]),
        ]);
        $this->assertStringContainsString('body .modtype_assign .activityiconcontainer::after', $css);
        $this->assertStringContainsString('background-image: url(', $css);
        $this->assertStringNotContainsString('mask', $css);
    }
}
