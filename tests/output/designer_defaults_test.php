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
 * Tests for what the designer starts from.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\output;

#[\PHPUnit\Framework\Attributes\CoversClass(designer_defaults::class)]
/**
 * Verify that the defaults the site chose reach the designer, and that a value that is not valid is replaced.
 *
 * @covers \local_iconrestyle\output\designer_defaults
 */
final class designer_defaults_test extends \advanced_testcase {
    /**
     * Without settings, the plugin's own defaults apply.
     */
    public function test_the_shipped_defaults(): void {
        $this->resetAfterTest();
        $this->assertSame([
            'copygroups' => ['colours', 'shape', 'spacing', 'transform', 'effects'],
            'copyoverwrite' => false,
            'importmode' => 'merge',
            'importchoose' => 'all',
        ], designer_defaults::all());
    }

    /**
     * What the site chose is what the designer gets, in a fixed order and without anything that is not a group.
     */
    public function test_the_site_chooses(): void {
        $this->resetAfterTest();
        set_config('copygroups', 'icon,colours,nonsense', 'local_iconrestyle');
        set_config('copyoverwrite', 1, 'local_iconrestyle');
        set_config('importmode', 'replace', 'local_iconrestyle');
        set_config('importchoose', 'new', 'local_iconrestyle');
        $this->assertSame([
            'copygroups' => ['colours', 'icon'],
            'copyoverwrite' => true,
            'importmode' => 'replace',
            'importchoose' => 'new',
        ], designer_defaults::all());
    }

    /**
     * Nothing chosen is a valid choice, and an unknown mode or choice falls back to the shipped one.
     */
    public function test_nothing_chosen_and_invalid_values(): void {
        $this->resetAfterTest();
        set_config('copygroups', '', 'local_iconrestyle');
        set_config('importmode', 'destroy', 'local_iconrestyle');
        set_config('importchoose', 'everything', 'local_iconrestyle');
        $defaults = designer_defaults::all();
        $this->assertSame([], $defaults['copygroups']);
        $this->assertSame('merge', $defaults['importmode']);
        $this->assertSame('all', $defaults['importchoose']);
    }
}
