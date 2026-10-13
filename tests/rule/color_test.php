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
 * Tests for typed colours.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

#[\PHPUnit\Framework\Attributes\CoversClass(color::class)]
/**
 * Verify parsing, canonical form, theme tokens and rejection of anything that could reach CSS unvalidated.
 *
 * @covers \local_iconrestyle\rule\color
 */
final class color_test extends \basic_testcase {
    /**
     * Accepted notations reach one canonical form.
     *
     * @dataProvider canonical_provider
     * @param string $input Input.
     * @param string $stored Expected stored value.
     * @param string $css Expected CSS value.
     */
    public function test_canonical_form(string $input, string $stored, string $css): void {
        $color = color::parse($input);
        $this->assertSame($stored, $color->stored());
        $this->assertSame($css, $color->css());
    }

    /**
     * Valid inputs.
     *
     * @return array Cases.
     */
    public static function canonical_provider(): array {
        return [
            'short hex' => ['#FFF', '#ffffff', '#ffffff'],
            'short hex with alpha' => ['#f008', '#ff000088', '#ff000088'],
            'long hex' => ['#1B6EC2', '#1b6ec2', '#1b6ec2'],
            'opaque alpha dropped' => ['#1b6ec2ff', '#1b6ec2', '#1b6ec2'],
            'rgb' => ['rgb(27, 110, 194)', '#1b6ec2', '#1b6ec2'],
            'rgb modern' => ['rgb(27 110 194)', '#1b6ec2', '#1b6ec2'],
            'rgba' => ['rgba(255, 0, 0, 0.5)', '#ff000080', '#ff000080'],
            'rgb percent alpha' => ['rgb(255 0 0 / 50%)', '#ff000080', '#ff000080'],
            'hsl' => ['hsl(0, 100%, 50%)', '#ff0000', '#ff0000'],
            'hsl blue' => ['hsl(240, 100%, 50%)', '#0000ff', '#0000ff'],
            'current colour' => ['currentColor', 'currentcolor', 'currentColor'],
            'bootstrap token' => ['token:primary', 'token:primary', 'var(--bs-primary, var(--primary))'],
            'activity token' => ['token:activitycommunication', 'token:activitycommunication', 'var(--activitycommunication)'],
            'theme variable' => ['var:--bs-primary', 'var:--bs-primary', 'var(--bs-primary)'],
            'theme variable keeps its case' => ['var:--brandBlue_2', 'var:--brandBlue_2', 'var(--brandBlue_2)'],
            'surrounding space' => ['  #000  ', '#000000', '#000000'],
        ];
    }

    /**
     * Anything else is rejected.
     *
     * @dataProvider invalid_provider
     * @param string $input Input.
     */
    public function test_rejected(string $input): void {
        $this->assertFalse(color::is_valid($input));
        $this->expectException(\InvalidArgumentException::class);
        color::parse($input);
    }

    /**
     * Invalid inputs, including attempts to break out of a declaration.
     *
     * @return array Cases.
     */
    public static function invalid_provider(): array {
        return [
            'empty' => [''],
            'named colour' => ['red'],
            'bad hex length' => ['#12'],
            'bad hex digit' => ['#ggg'],
            'channel too large' => ['rgb(300, 0, 0)'],
            'alpha too large' => ['rgba(0, 0, 0, 2)'],
            'hue too large' => ['hsl(400, 10%, 10%)'],
            'url' => ['url(javascript:alert(1))'],
            'expression' => ['expression(alert(1))'],
            'declaration break out' => ['#fff;background:url(x)'],
            'brace break out' => ['#fff}body{display:none'],
            'unknown token' => ['token:evil'],
            'var injection' => ['var(--x)'],
            'variable without dashes' => ['var:primary'],
            'variable with a fallback' => ['var:--x, red'],
            'variable with a break out' => ['var:--x;background:url(x)'],
            'variable with a brace' => ['var:--x}body{display:none'],
            'variable name too long' => ['var:--' . str_repeat('a', 70)],
            'important' => ['#fff !important'],
        ];
    }

    /**
     * Only fixed colours have a luminance.
     */
    public function test_luminance(): void {
        $white = color::parse('#fff');
        $this->assertEqualsWithDelta(1.0, $white->luminance(), 0.001);
        $this->assertEqualsWithDelta(0.0, color::parse('#000')->luminance(), 0.001);
        $this->assertNull(color::parse('token:primary')->luminance());
        $this->assertNull(color::parse('currentcolor')->luminance());
        $this->assertTrue(color::parse('token:primary')->follows_theme());
        $this->assertTrue(color::parse('var:--bs-primary')->follows_theme());
        $this->assertNull(color::parse('var:--bs-primary')->luminance());
        $this->assertFalse($white->follows_theme());
    }
}
