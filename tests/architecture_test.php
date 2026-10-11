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
 * Tests for the dependency direction between feature packages.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle;

/**
 * Feature packages may only depend on the packages listed for them, so there are never cycles.
 *
 * @coversNothing
 */
final class architecture_test extends \basic_testcase {
    /** @var string[][] Packages each package may use. Entry points under other folders may use any package. */
    private const ALLOWED = [
        'slot' => [],
        'rule' => ['slot'],
        'style' => ['slot', 'rule'],
        'delivery' => ['rule', 'style'],
    ];

    /**
     * No class in a feature package imports from a package it is not allowed to depend on.
     */
    public function test_packages_depend_only_on_allowed_packages(): void {
        $violations = [];
        foreach (self::ALLOWED as $package => $allowed) {
            foreach (glob(__DIR__ . '/../classes/' . $package . '/*.php') as $file) {
                $code = file_get_contents($file);
                preg_match_all('/\\\\?local_iconrestyle\\\\([a-z_]+)\\\\/', $code, $matches);
                foreach (array_unique($matches[1]) as $used) {
                    if ($used !== $package && !in_array($used, $allowed, true)) {
                        $violations[] = basename($file) . " in '{$package}' uses '{$used}'";
                    }
                }
            }
        }
        $this->assertSame([], $violations);
    }

    /**
     * There is one class per file, named after the file.
     */
    public function test_one_class_per_file_named_after_the_file(): void {
        $problems = [];
        $files = array_merge(glob(__DIR__ . '/../classes/*.php'), glob(__DIR__ . '/../classes/*/*.php'));
        foreach ($files as $file) {
            $pattern = '/^(?:final\s+|abstract\s+)?(?:class|interface|trait)\s+([a-z_0-9]+)/mi';
            preg_match_all($pattern, file_get_contents($file), $matches);
            if ($matches[1] !== [basename($file, '.php')]) {
                $problems[] = basename($file) . ' declares ' . json_encode($matches[1]);
            }
        }
        $this->assertSame([], $problems);
    }
}
