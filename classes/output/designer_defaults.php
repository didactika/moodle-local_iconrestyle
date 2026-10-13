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
 * What the designer page shows.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\output;

/**
 * What the designer starts from when it offers a choice: the parts of a look that are copied, whether copying between modes
 * replaces, and how an import starts. The site sets them in the settings of the plugin and the person can change them in the
 * designer each time.
 */
final class designer_defaults {
    /** @var string[] Parts of a look that can be copied to other icons. */
    public const COPY_GROUPS = ['colours', 'shape', 'spacing', 'transform', 'effects', 'icon'];

    /** @var string[] Parts of a look that are copied unless the site says otherwise. */
    public const COPY_GROUPS_DEFAULT = ['colours', 'shape', 'spacing', 'transform', 'effects'];

    /** @var string[] Icons of an import that are chosen at first. */
    public const IMPORT_CHOICES = ['all', 'new', 'none'];

    /**
     * The defaults, with anything that is not valid replaced by what the plugin ships with.
     *
     * @return array copygroups, copyoverwrite, importmode and importchoose.
     */
    public static function all(): array {
        $groups = get_config('local_iconrestyle', 'copygroups');
        $mode = get_config('local_iconrestyle', 'importmode');
        $choose = get_config('local_iconrestyle', 'importchoose');
        return [
            'copygroups' => $groups === false || $groups === null ? self::COPY_GROUPS_DEFAULT :
                array_values(array_intersect(self::COPY_GROUPS, explode(',', (string)$groups))),
            'copyoverwrite' => (bool)get_config('local_iconrestyle', 'copyoverwrite'),
            'importmode' => in_array($mode, ['merge', 'replace'], true) ? $mode : 'merge',
            'importchoose' => in_array($choose, self::IMPORT_CHOICES, true) ? $choose : 'all',
        ];
    }
}
