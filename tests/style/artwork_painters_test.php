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
 * Tests for the mask and image painters.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\glyph_signature_factory;
use local_iconrestyle\slot\icon_map;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(mask_painter::class)]
/**
 * Verify how artwork is drawn on font icons and on image icons, and that rules cannot claim artwork they do not have.
 *
 * @covers \local_iconrestyle\style\mask_painter
 * @covers \local_iconrestyle\style\image_painter
 * @covers \local_iconrestyle\style\stylesheet_compiler
 */
final class artwork_painters_test extends \advanced_testcase {
    /** @var string Small valid icon. */
    private const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 22h20z"/></svg>';

    /** @var int Asset used by the tests. */
    private $assetid;

    /**
     * Store the artwork once.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
        $this->assetid = service_factory::instance()->assets()->add(self::ICON, 2)->id();
    }

    /**
     * Compiler over a fixed icon map: one font icon and no entry for the image icon.
     *
     * @return stylesheet_compiler Compiler.
     */
    private function compiler(): stylesheet_compiler {
        $map = new class extends icon_map {
            /**
             * Fixed map.
             *
             * @return string[] Map.
             */
            public function all(): array {
                return ['core:a/setting' => 'fa fa-gear'];
            }
        };
        $urls = service_factory::instance()->asset_urls();
        return new stylesheet_compiler(
            new glyph_signature_factory($map),
            [
                rule::PAINTER_COLOR => new color_painter(),
                rule::PAINTER_MASK => new mask_painter($urls),
                rule::PAINTER_IMAGE => new image_painter($urls),
            ],
            new container_painter()
        );
    }

    /**
     * Build a rule.
     *
     * @param string $key Slot key.
     * @param array $options Options.
     * @return rule Rule.
     */
    private function rule(string $key, array $options): rule {
        return new rule(0, 1, slot_key::parse($key), $options);
    }

    /**
     * On a font icon the artwork is drawn by the pseudo-element, so the icon itself can carry a background.
     */
    public function test_mask_on_a_font_icon(): void {
        $css = $this->compiler()->compile([$this->rule('core:a/setting', [
            'painter' => 'mask', 'assetid' => $this->assetid, 'fg' => '#ff0000', 'bg' => '#eeeeee', 'shape' => 'circle',
        ])]);
        $this->assertStringContainsString("fa-gear:not(.fa-regular):not(.fa-brands):not(.fa-light):not(.fa-thin)" .
            ":not(.fa-duotone):not(.fa-sharp) {\n  background-color: #eeeeee;\n  border-radius: 50%;\n}\n", $css);
        $this->assertStringContainsString(
            ":not(.fa-sharp)::before {\n  content: \"\";\n  display: inline-block;\n  width: 1em;\n  height: 1em;\n" .
            "  vertical-align: -0.125em;\n" .
            "  background-color: #ff0000;\n  -webkit-mask: url(\"data:image/svg+xml;base64,",
            $css
        );
        $this->assertStringContainsString(' center / contain no-repeat;', $css);
        $this->assertStringNotContainsString('#ff0000', substr($css, 0, strpos($css, '::before')));
    }

    /**
     * Without a colour the artwork follows the text colour of its surroundings.
     */
    public function test_mask_defaults_to_the_current_colour(): void {
        $css = $this->compiler()->compile([$this->rule('core:a/setting', ['painter' => 'mask', 'assetid' => $this->assetid])]);
        $this->assertStringContainsString("  background-color: currentColor;\n", $css);
    }

    /**
     * An image icon is masked directly and its original image is moved out of view.
     */
    public function test_mask_on_an_image_icon(): void {
        $css = $this->compiler()->compile([$this->rule('core:i/groupn', [
            'painter' => 'mask', 'assetid' => $this->assetid, 'fg' => 'token:primary', 'bg' => '#eeeeee',
        ])]);
        $this->assertStringContainsString('body img[src*="/image.php/"][src*="/core/"][src$="/i/groupn"]', $css);
        $this->assertStringContainsString("  background-color: var(--bs-primary, var(--primary));\n", $css);
        $this->assertStringNotContainsString('#eeeeee', $css, 'An image icon cannot also carry a background colour');
        $this->assertStringContainsString("  object-fit: none;\n  object-position: -9999px 0;\n", $css);
        $this->assertStringNotContainsString('::before', $css);
    }

    /**
     * Multicolour artwork keeps its colours and leaves the background free.
     */
    public function test_image_painter(): void {
        $css = $this->compiler()->compile([$this->rule('core:a/setting', [
            'painter' => 'image', 'assetid' => $this->assetid, 'bg' => '#eeeeee',
        ])]);
        $this->assertStringContainsString("  background-color: #eeeeee;\n}", $css);
        $this->assertStringContainsString('::before {', $css);
        $this->assertStringContainsString("  background-image: url(\"data:image/svg+xml;base64,", $css);
        $this->assertStringContainsString("  background-size: contain;\n", $css);
        $this->assertStringNotContainsString('mask', $css);
    }

    /**
     * Artwork that no longer exists produces nothing instead of broken CSS.
     */
    public function test_missing_asset_produces_nothing(): void {
        global $DB;
        $rule = $this->rule('core:a/setting', ['painter' => 'mask', 'assetid' => $this->assetid]);
        $DB->delete_records('local_iconrestyle_asset');
        $this->assertSame('', $this->compiler()->compile([$rule]));
    }

    /**
     * Rules cannot claim artwork they do not have or carry artwork they do not use.
     */
    public function test_rules_and_artwork_must_agree(): void {
        $invalid = [
            ['painter' => 'mask'],
            ['painter' => 'image'],
            ['painter' => 'color', 'assetid' => 5],
            ['painter' => 'none', 'assetid' => 5],
        ];
        foreach ($invalid as $options) {
            try {
                $this->rule('core:a/setting', $options);
                $this->fail('Accepted: ' . json_encode($options));
            } catch (\InvalidArgumentException $exception) {
                $this->assertInstanceOf(\InvalidArgumentException::class, $exception);
            }
        }
    }
}
