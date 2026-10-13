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
 * The Font Awesome icon map of the running core.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\slot;

/**
 * Reads the map from core, so Font Awesome 4.7 and 6 need no separate handling.
 */
class icon_map {
    /** @var string[]|null Map loaded on first use. */
    private $map = null;

    /**
     * Mapping of keys such as core:a/setting to class strings such as "fa fa-gear".
     *
     * @return string[] Map keyed by icon key.
     */
    public function all(): array {
        if ($this->map === null) {
            $system = \core\output\icon_system::instance(\core\output\icon_system::FONTAWESOME);
            $this->map = $system->get_icon_name_map();
        }
        return $this->map;
    }
}
