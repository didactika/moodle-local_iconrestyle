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
 * The installed activity modules and the purpose each one declares.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\slot;

/**
 * Reads the modules and their purposes from core, so activities added by plugins need no separate handling.
 */
class activity_map {
    /** @var string[] Purposes Moodle gives activities, each of which colours the box around the icon. */
    public const PURPOSES = ['administration', 'assessment', 'collaboration', 'communication', 'content', 'interactivecontent'];

    /** @var string[]|null Map loaded on first use. */
    private $map = null;

    /**
     * Purpose of every installed activity module.
     *
     * @return string[] Purpose keyed by module name, other for modules without one.
     */
    public function all(): array {
        if ($this->map === null) {
            $this->map = [];
            foreach (array_keys(\core_component::get_plugin_list('mod')) as $name) {
                $this->map[$name] = (string)plugin_supports('mod', $name, FEATURE_MOD_PURPOSE, 'other');
            }
            ksort($this->map);
        }
        return $this->map;
    }
}
