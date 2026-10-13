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
 * Tests for the colour modes the plugin follows.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

#[\PHPUnit\Framework\Attributes\CoversClass(colour_modes::class)]
/**
 * The plugin asks Moodle which colour modes exist and has none of its own, so it works with the modes of every Moodle line.
 *
 * @covers \local_iconrestyle\rule\colour_modes
 * @covers \local_iconrestyle\rule\audience
 */
final class colour_modes_test extends \advanced_testcase {
    /**
     * Moodle lines without colour modes have none here, and the ones with them list the modes that draw the page.
     */
    public function test_the_known_modes_come_from_moodle(): void {
        $known = colour_modes::known();
        if (!class_exists(\theme_boost\colour_mode::class)) {
            $this->assertSame([], $known);
            return;
        }
        $this->assertContains('light', $known);
        $this->assertContains('dark', $known);
        $this->assertNotContains('auto', $known);
    }

    /**
     * The modes are only offered while the site has colour modes turned on.
     */
    public function test_modes_are_available_only_when_turned_on(): void {
        $this->resetAfterTest();
        if (!class_exists(\theme_boost\colour_mode::class)) {
            $this->assertSame([], colour_modes::available());
            return;
        }
        set_config('enablecolourmodes', 0, 'theme_boost');
        $this->assertSame([], colour_modes::available());
        set_config('enablecolourmodes', 1, 'theme_boost');
        $this->assertSame(colour_modes::known(), colour_modes::available());
    }

    /**
     * A rule can be limited to any mode Moodle has, and to no other.
     */
    public function test_a_rule_accepts_the_modes_moodle_has(): void {
        foreach (array_merge(['all', 'light', 'dark'], colour_modes::known()) as $mode) {
            $this->assertSame($mode, audience::check_mode($mode));
        }
        $this->expectException(\InvalidArgumentException::class);
        audience::check_mode('sepia');
    }
}
