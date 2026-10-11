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
 * Tests for slot keys.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\slot;

#[\PHPUnit\Framework\Attributes\CoversClass(slot_key::class)]
/**
 * Tests for slot keys.
 *
 * @covers \local_iconrestyle\slot\slot_key
 */
final class slot_key_test extends \basic_testcase {
    /**
     * Keys inside the grammar are accepted and keep their parts.
     *
     * @dataProvider valid_provider
     * @param string $key Key.
     * @param string $component Expected component.
     * @param string $name Expected name.
     * @param string $kind Expected kind.
     */
    public function test_valid_keys(string $key, string $component, string $name, string $kind): void {
        $slot = slot_key::parse($key);
        $this->assertSame($component, $slot->component());
        $this->assertSame($name, $slot->name());
        $this->assertSame($kind, $slot->kind());
        $this->assertSame($key, (string)$slot);
    }

    /**
     * Keys that are valid.
     *
     * @return array Cases.
     */
    public static function valid_provider(): array {
        return [
            'core icon' => ['core:a/setting', 'core', 'a/setting', slot_key::KIND_ICON],
            'plugin icon' => ['mod_forum:monologo', 'mod_forum', 'monologo', slot_key::KIND_ICON],
            'theme icon' => ['theme:fp/folder', 'theme', 'fp/folder', slot_key::KIND_ICON],
            'activity' => ['activity:forum', 'activity', 'forum', slot_key::KIND_ACTIVITY],
            'purpose' => ['purpose:communication', 'purpose', 'communication', slot_key::KIND_PURPOSE],
            'dots and dashes' => ['core:e/align-left.v2', 'core', 'e/align-left.v2', slot_key::KIND_ICON],
        ];
    }

    /**
     * Keys outside the grammar are rejected.
     *
     * @dataProvider invalid_provider
     * @param string $key Key.
     */
    public function test_invalid_keys(string $key): void {
        $this->assertFalse(slot_key::is_valid($key));
        $this->expectException(\InvalidArgumentException::class);
        slot_key::parse($key);
    }

    /**
     * Keys that are invalid.
     *
     * @return array Cases.
     */
    public static function invalid_provider(): array {
        return [
            'empty' => [''],
            'no component' => ['a/setting'],
            'no name' => ['core:'],
            'uppercase component' => ['Core:a/setting'],
            'unknown bare component' => ['forum:icon'],
            'traversal' => ['core:../etc/passwd'],
            'leading slash' => ['core:/a/setting'],
            'trailing slash' => ['core:a/'],
            'space' => ['core:a b'],
            'quote' => ['core:a"b'],
            'bracket' => ['core:a]b'],
            'semicolon' => ['core:a;b'],
            'too long' => ['core:' . str_repeat('a', 201)],
        ];
    }
}
