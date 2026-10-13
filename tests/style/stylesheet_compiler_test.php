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
 * Tests for the stylesheet compiler.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\rule\rule;
use local_iconrestyle\slot\glyph_signature_factory;
use local_iconrestyle\slot\icon_map;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(stylesheet_compiler::class)]
/**
 * Verify that CSS is deterministic, built from typed values and limited to what a painter can draw.
 *
 * @covers \local_iconrestyle\style\stylesheet_compiler
 * @covers \local_iconrestyle\style\color_painter
 * @covers \local_iconrestyle\style\container_painter
 */
final class stylesheet_compiler_test extends \basic_testcase {
    /**
     * Compiler over a fixed icon map.
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
                return [
                    'core:a/setting' => 'fa fa-gear',
                    'core:t/edit' => 'fa fa-pen',
                    'core:b/bookmark-new' => 'fa-regular fa-bookmark',
                ];
            }
        };
        return new stylesheet_compiler(
            new glyph_signature_factory($map),
            [rule::PAINTER_COLOR => new color_painter()],
            new container_painter()
        );
    }

    /**
     * Build a rule.
     *
     * @param string $key Slot key.
     * @param array $options Rule options.
     * @return rule Rule.
     */
    private function rule(string $key, array $options): rule {
        return new rule(0, 1, slot_key::parse($key), $options);
    }

    /**
     * A recolour produces one block for the glyph.
     */
    public function test_recolour(): void {
        $css = $this->compiler()->compile([$this->rule('core:a/setting', ['fg' => '#1b6ec2'])]);
        $this->assertSame(
            "body [class].fa-gear:not(.fa-regular):not(.fa-brands):not(.fa-light):not(.fa-thin):not(.fa-duotone):not(.fa-sharp) {\n" .
            "  color: #1b6ec2;\n}\n",
            $css
        );
    }

    /**
     * Foreground and container declarations land in one block.
     */
    public function test_recolour_and_container_are_merged(): void {
        $css = $this->compiler()->compile([$this->rule('core:b/bookmark-new', [
            'fg' => 'token:primary', 'bg' => '#fff', 'shape' => 'circle', 'padding' => 25, 'opacity' => 80,
        ])]);
        $this->assertSame(
            "body [class].fa-regular.fa-bookmark {\n" .
            "  background-color: #ffffff;\n" .
            "  border-radius: 50%;\n" .
            "  box-sizing: content-box;\n" .
            "  padding: 0.25em;\n" .
            "  opacity: 0.80;\n" .
            "  color: var(--bs-primary, var(--primary));\n}\n",
            $css
        );
    }

    /**
     * Output order does not depend on input order and disabled rules are skipped.
     */
    public function test_deterministic_and_disabled(): void {
        $first = $this->rule('core:t/edit', ['fg' => '#111']);
        $second = $this->rule('core:a/setting', ['fg' => '#222']);
        $disabled = $this->rule('core:b/bookmark-new', ['fg' => '#333', 'enabled' => false]);
        $compiler = $this->compiler();
        $css = $compiler->compile([$first, $second, $disabled]);
        $this->assertSame($css, $compiler->compile([$disabled, $second, $first]));
        $this->assertLessThan(strpos($css, 'fa-pen'), strpos($css, 'fa-gear'));
        $this->assertStringNotContainsString('fa-bookmark', $css);
    }

    /**
     * Image icons cannot be recoloured without artwork, and unknown slots produce nothing.
     */
    public function test_unsupported_combinations_produce_nothing(): void {
        $compiler = $this->compiler();
        $this->assertSame('', $compiler->compile([$this->rule('core:i/groupn', ['fg' => '#111'])]));
        $this->assertSame('', $compiler->compile([]));
    }

    /**
     * An image icon can still have its container styled.
     */
    public function test_image_container(): void {
        $css = $this->compiler()->compile([$this->rule('core:i/groupn', ['painter' => 'none', 'bg' => '#eee'])]);
        $this->assertStringContainsString('body img[src*="/image.php/"][src*="/core/"][src$="/i/groupn"]', $css);
        $this->assertStringContainsString("background-color: #eeeeee;\n", $css);
    }

    /**
     * Values outside the accepted ranges never reach the compiler.
     */
    public function test_rule_rejects_unsafe_values(): void {
        $unsafe = [['fg' => 'red;x'], ['shape' => 'blob'], ['padding' => 1000], ['opacity' => 101], ['painter' => 'js']];
        foreach ($unsafe as $options) {
            try {
                $this->rule('core:a/setting', $options);
                $this->fail('Unsafe value accepted: ' . json_encode($options));
            } catch (\InvalidArgumentException $exception) {
                $this->assertInstanceOf(\InvalidArgumentException::class, $exception);
            }
        }
    }
}
