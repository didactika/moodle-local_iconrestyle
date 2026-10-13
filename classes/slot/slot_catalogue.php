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
 * The icons that can be customised on this site.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\slot;

/**
 * Lists font icons from the live icon map and image icons from the pix folders of core and plugins.
 *
 * The list is built from the running Moodle, never typed in, and is cached per installed code version.
 */
class slot_catalogue {
    /** @var string[] Image extensions that count as icons: every kind of image that Moodle serves from a pix folder. */
    private const EXTENSIONS = ['svg', 'png', 'gif', 'jpg', 'jpeg', 'webp', 'ico'];

    /** @var string[] Font Awesome families that do not need the generic prefix class. */
    private const FAMILIES = ['fa', 'fa-solid', 'fa-regular', 'fa-brands', 'fa-light', 'fa-thin', 'fa-duotone', 'fa-sharp'];

    /** @var icon_map Live icon map. */
    private $iconmap;

    /** @var glyph_signature_factory Signature source. */
    private $signatures;

    /** @var \cache|null Catalogue cache. */
    private $cache;

    /** @var string Key that changes whenever the installed code or plugins change. */
    private $version;

    /** @var activity_map|null Installed activity modules and their purposes. */
    private $activities;

    /**
     * Create the catalogue.
     *
     * @param icon_map $iconmap Live icon map.
     * @param glyph_signature_factory $signatures Signature source.
     * @param \cache|null $cache Catalogue cache, or null to build every time.
     * @param string $version Key that changes whenever the installed code or plugins change.
     * @param activity_map|null $activities Installed activity modules, or null to list no activity slots.
     */
    public function __construct(
        icon_map $iconmap,
        glyph_signature_factory $signatures,
        ?\cache $cache,
        string $version,
        ?activity_map $activities = null
    ) {
        $this->iconmap = $iconmap;
        $this->signatures = $signatures;
        $this->cache = $cache;
        $this->version = $version;
        $this->activities = $activities;
    }

    /**
     * Every customisable icon.
     *
     * @return array[] Entries sorted by key. Each has key, kind (font, image or container), classes for font icons and
     *     boxes, component and name, group, the number of icons that share its glyph, which is zero when it is alone, and
     *     purpose and sample, which describe the box of an activity slot.
     */
    public function all(): array {
        if ($this->cache) {
            $cached = $this->cache->get($this->version);
            if (is_array($cached)) {
                return $cached;
            }
        }
        $entries = $this->build();
        if ($this->cache) {
            $this->cache->set($this->version, $entries);
        }
        return $entries;
    }

    /**
     * Find one entry.
     *
     * @param string $key Slot key.
     * @return array|null Entry, or null when the slot does not exist on this site.
     */
    public function find(string $key): ?array {
        foreach ($this->all() as $entry) {
            if ($entry['key'] === $key) {
                return $entry;
            }
        }
        return null;
    }

    /**
     * Build the list.
     *
     * @return array[] Entries sorted by key.
     */
    private function build(): array {
        $entries = [];
        $groups = [];
        foreach ($this->iconmap->all() as $key => $classes) {
            if (!slot_key::is_valid($key)) {
                continue;
            }
            $signature = glyph_signature::from_font_classes($classes);
            if ($signature === null) {
                continue;
            }
            $slot = slot_key::parse($key);
            $entries[$key] = [
                'key' => $key,
                'kind' => glyph_signature::KIND_FONT,
                'classes' => $this->markup_classes($classes),
                'component' => $slot->component(),
                'name' => $slot->name(),
                'group' => 0,
                'purpose' => '',
                'sample' => '',
                'identity' => $signature->identity(),
            ];
            $groups[$signature->identity()][] = $key;
        }
        foreach ($this->image_icons() as $component => $names) {
            foreach ($names as $name) {
                $key = $component . ':' . $name;
                if (isset($entries[$key]) || !slot_key::is_valid($key)) {
                    continue;
                }
                $entries[$key] = [
                    'key' => $key,
                    'kind' => glyph_signature::KIND_IMAGE,
                    'classes' => '',
                    'component' => $component,
                    'name' => $name,
                    'group' => 0,
                    'purpose' => '',
                    'sample' => '',
                    'identity' => '',
                ];
            }
        }
        foreach ($this->activity_entries() as $key => $entry) {
            $entries[$key] = $entry;
        }
        foreach ($groups as $keys) {
            if (count($keys) > 1) {
                foreach ($keys as $key) {
                    $entries[$key]['group'] = count($keys);
                }
            }
        }
        ksort($entries);
        return array_values(array_map(function (array $entry): array {
            unset($entry['identity']);
            return $entry;
        }, $entries));
    }

    /**
     * The boxes Moodle draws around activity icons: one for each purpose and one for each installed activity module.
     *
     * @return array[] Entries keyed by slot key.
     */
    private function activity_entries(): array {
        if ($this->activities === null) {
            return [];
        }
        $modules = $this->activities->all();
        $entries = [];
        foreach (activity_map::PURPOSES as $purpose) {
            $members = array_keys($modules, $purpose, true);
            $entries['purpose:' . $purpose] = [
                'key' => 'purpose:' . $purpose,
                'kind' => glyph_signature::KIND_CONTAINER,
                'classes' => 'activityiconcontainer ' . $purpose,
                'component' => 'purpose',
                'name' => $purpose,
                'group' => 0,
                'purpose' => $purpose,
                'sample' => $members === [] ? '' : $members[0],
            ];
        }
        foreach ($modules as $module => $purpose) {
            if (glyph_signature::from_activity_type($module) === null) {
                continue;
            }
            $entries['activity:' . $module] = [
                'key' => 'activity:' . $module,
                'kind' => glyph_signature::KIND_CONTAINER,
                'classes' => 'activityiconcontainer ' . $purpose,
                'component' => 'activity',
                'name' => $module,
                'group' => 0,
                'purpose' => $purpose,
                'sample' => $module,
            ];
        }
        return $entries;
    }

    /**
     * Class attribute core would write for a mapped font icon, so previews match real pages on every Moodle version.
     *
     * @param string $mapped Mapped classes.
     * @return string Classes of the icon element.
     */
    private function markup_classes(string $mapped): string {
        $tokens = preg_split('/\s+/', trim($mapped));
        $prefix = array_intersect($tokens, self::FAMILIES) === [] ? 'fa ' : '';
        return 'icon ' . $prefix . implode(' ', $tokens) . ' fa-fw';
    }

    /**
     * Image icons of core, of its subsystems, of every plugin and of the themes that bring images for other components.
     *
     * Every image file of a pix folder is an icon that a page can show, at any depth: the names keep their folders, as Moodle writes
     * them (a/setting, f/pdf, icons/book).
     *
     * @return string[][] Names grouped by component.
     */
    private function image_icons(): array {
        global $CFG;
        $root = is_dir($CFG->dirroot . '/pix') ? $CFG->dirroot : $CFG->dirroot . '/public';
        $found = ['core' => $this->images_in($root . '/pix')];
        foreach (\core_component::get_component_list() as $type => $components) {
            foreach ($components as $component => $directory) {
                $found[$component] = array_merge($found[$component] ?? [], $this->images_in($directory . '/pix'));
                if ($type === 'theme') {
                    // A theme can bring images for core and for plugins in these folders; they are icons that its pages show.
                    $found['core'] = array_merge($found['core'], $this->images_in($directory . '/pix_core'));
                    foreach (glob($directory . '/pix_plugins/*/*', GLOB_ONLYDIR) ?: [] as $folder) {
                        $owner = basename(dirname($folder)) . '_' . basename($folder);
                        $found[$owner] = array_merge($found[$owner] ?? [], $this->images_in($folder));
                    }
                }
            }
        }
        foreach ($found as $component => $names) {
            $found[$component] = array_values(array_unique($names));
            sort($found[$component]);
        }
        return $found;
    }

    /**
     * The image files of a folder, at any depth.
     *
     * @param string $directory Folder to look in.
     * @return string[] Path of each image relative to the folder, without its extension.
     */
    private function images_in(string $directory): array {
        if (!is_dir($directory)) {
            return [];
        }
        $names = [];
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS));
        foreach ($files as $file) {
            if (!$file->isFile() || !in_array(strtolower($file->getExtension()), self::EXTENSIONS, true)) {
                continue;
            }
            $relative = substr($file->getPathname(), strlen($directory) + 1);
            $names[] = str_replace('\\', '/', substr($relative, 0, -strlen($file->getExtension()) - 1));
        }
        return $names;
    }
}
