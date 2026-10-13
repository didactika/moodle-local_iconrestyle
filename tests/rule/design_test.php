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
 * Tests for the design properties of a rule.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(design::class)]
/**
 * Every design property has a fixed type and range, and nothing else can be stored or reach the CSS.
 *
 * @covers \local_iconrestyle\rule\design
 * @covers \local_iconrestyle\rule\rule
 */
final class design_test extends \basic_testcase {
    /**
     * Valid properties are kept in a stable order, colours are written canonically and empty values mean not set.
     */
    public function test_valid_properties(): void {
        $design = design::from_array([
            'shadow' => 'glow', 'bc' => ' #E83E8C ', 'pt' => '25', 'rotate' => -45, 'shape' => 'pill', 'scale' => 150,
            'bw' => 0, 'bs' => '', 'sc' => null, 'opacity' => 80,
        ]);
        $this->assertSame(
            [
                'bc' => '#e83e8c', 'bw' => 0, 'opacity' => 80, 'pt' => 25, 'rotate' => -45, 'scale' => 150, 'shadow' => 'glow',
                'shape' => 'pill',
            ],
            $design->to_array()
        );
        $this->assertSame(25, $design->get('pt'));
        $this->assertSame('#e83e8c', $design->get('bc')->stored());
        $this->assertNull($design->get('radius'));
        $this->assertTrue($design->has_padding());
        $this->assertFalse($design->is_empty());
    }

    /**
     * Zero is a value, not an absence, for every number.
     */
    public function test_zero_is_a_value(): void {
        $design = design::from_array(['bw' => 0, 'pt' => 0, 'opacity' => 0, 'rotate' => 0]);
        $this->assertSame(['bw' => 0, 'opacity' => 0, 'pt' => 0, 'rotate' => 0], $design->to_array());
    }

    /**
     * What is stored comes back the same, and nothing stored is the same as no design.
     */
    public function test_json_round_trip(): void {
        $design = design::from_array(['shape' => 'circle', 'pt' => 30, 'pb' => 10]);
        $this->assertSame($design->to_array(), design::from_json($design->json())->to_array());
        $this->assertNull(design::none()->json());
        $this->assertTrue(design::from_json('')->is_empty());
        $this->assertTrue(design::from_json(null)->is_empty());
        $this->assertTrue(design::from_json('{}')->is_empty());
    }

    /**
     * Anything outside the fixed types, lists and ranges is refused, so it can never reach a stylesheet.
     *
     * @dataProvider invalid_provider
     * @param string $json Design as sent by the designer.
     */
    public function test_invalid_designs_are_refused(string $json): void {
        $this->expectException(\InvalidArgumentException::class);
        design::from_json($json);
    }

    /**
     * Invalid designs.
     *
     * @return array Cases.
     */
    public static function invalid_provider(): array {
        return [
            'unknown property' => ['{"content":"x"}'],
            'unknown shape' => ['{"shape":"blob"}'],
            'unknown border style' => ['{"bs":"groove"}'],
            'unknown shadow' => ['{"shadow":"huge"}'],
            'unknown drop shadow' => ['{"ds":"inner"}'],
            'unknown blend' => ['{"blend":"exclusion"}'],
            'unknown hover' => ['{"hover":"spin"}'],
            'skew too big' => ['{"skx":46}'],
            'outline too wide' => ['{"ow":13}'],
            'gradient angle too big' => ['{"gd":361}'],
            'hostile gradient colour' => ['{"bg2":"red;background:url(x)"}'],
            'hostile outline colour' => ['{"oc":"red;x"}'],
            'padding too big' => ['{"pt":301}'],
            'margin too negative' => ['{"mt":-101}'],
            'flip is a switch' => ['{"flipx":2}'],
            'blur too strong' => ['{"blur":21}'],
            'brightness too high' => ['{"brightness":201}'],
            'negative padding' => ['{"pl":-1}'],
            'scale too small' => ['{"scale":10}'],
            'rotation too big' => ['{"rotate":181}'],
            'opacity too big' => ['{"opacity":101}'],
            'border too wide' => ['{"bw":13}'],
            'fraction' => ['{"pt":1.5}'],
            'text for a number' => ['{"radius":"wide"}'],
            'hostile colour' => ['{"bc":"red;background:url(x)"}'],
            'list' => ['[1,2]'],
            'text' => ['"shape"'],
            'broken' => ['{shape:'],
        ];
    }

    /**
     * Rules written with the first flat options still work, and padding sets all four sides.
     */
    public function test_rule_accepts_flat_options_and_json(): void {
        $slot = slot_key::parse('core:a/setting');
        $flat = new rule(0, 1, $slot, ['shape' => 'circle', 'padding' => 25, 'opacity' => 80]);
        $this->assertSame(
            ['opacity' => 80, 'pb' => 25, 'pl' => 25, 'pr' => 25, 'pt' => 25, 'shape' => 'circle'],
            $flat->design()->to_array()
        );
        $json = new rule(0, 1, $slot, ['design' => '{"bw":2,"bs":"dashed"}']);
        $this->assertSame(['bs' => 'dashed', 'bw' => 2], $json->design()->to_array());
        $this->assertTrue($json->styles_container());
        $this->assertFalse((new rule(0, 1, $slot, ['fg' => '#111111']))->styles_container());
    }
}
