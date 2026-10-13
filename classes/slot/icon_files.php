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
 * Finds the files of the icons that Moodle and its plugins ship.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\slot;

/**
 * An image icon can be recoloured by using its own file as the artwork, so the file has to be found safely.
 */
class icon_files {
    /** @var string[] Extensions of icon files, in order of preference. */
    private const EXTENSIONS = ['svg', 'png', 'webp', 'gif', 'jpg', 'jpeg'];

    /**
     * The file of an icon.
     *
     * @param slot_key $slot Slot.
     * @return string|null Absolute path inside the pix folder of the icon's component, or null when there is no file.
     */
    public function path_of(slot_key $slot): ?string {
        if ($slot->kind() === slot_key::KIND_PURPOSE) {
            return null;
        }
        $component = $slot->kind() === slot_key::KIND_ACTIVITY ? 'mod_' . $slot->name() : $slot->component();
        $image = $slot->kind() === slot_key::KIND_ACTIVITY ? 'monologo' : $slot->name();
        $directory = $this->pix_directory($component);
        if ($directory === null) {
            return null;
        }
        foreach (self::EXTENSIONS as $extension) {
            $path = realpath($directory . '/' . $image . '.' . $extension);
            if ($path !== false && strpos($path, $directory . DIRECTORY_SEPARATOR) === 0 && is_file($path)) {
                return $path;
            }
        }
        return null;
    }

    /**
     * The bytes of an icon, ready for the artwork pipeline.
     *
     * Many icons that Moodle ships carry the document type declaration that Illustrator writes, which the sanitiser refuses
     * in uploads. These files come from the Moodle installation itself, so the declaration is removed here and everything
     * else still goes through the sanitiser.
     *
     * @param slot_key $slot Slot.
     * @return string|null File contents, or null when the icon has no file.
     */
    public function contents(slot_key $slot): ?string {
        $path = $this->path_of($slot);
        if ($path === null) {
            return null;
        }
        $bytes = (string)file_get_contents($path);
        if (substr($path, -4) === '.svg') {
            $bytes = (string)preg_replace('/<!DOCTYPE[^\[>]*(\[.*?\])?\s*>/is', '', $bytes);
        }
        return $bytes;
    }

    /**
     * The pix folder of a component.
     *
     * @param string $component core, or a plugin name such as mod_forum.
     * @return string|null Real path of the folder, or null when there is none.
     */
    private function pix_directory(string $component): ?string {
        global $CFG;
        if ($component === 'core') {
            $base = is_dir($CFG->dirroot . '/pix') ? $CFG->dirroot : $CFG->dirroot . '/public';
        } else {
            $base = \core_component::get_component_directory($component);
        }
        $directory = $base ? realpath($base . '/pix') : false;
        return $directory === false ? null : $directory;
    }
}
