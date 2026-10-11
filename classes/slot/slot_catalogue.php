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
    /** @var string[] Image extensions that count as icons. */
    private const EXTENSIONS = ['svg', 'png'];

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

    /**
     * Create the catalogue.
     *
     * @param icon_map $iconmap Live icon map.
     * @param glyph_signature_factory $signatures Signature source.
     * @param \cache|null $cache Catalogue cache, or null to build every time.
     * @param string $version Key that changes whenever the installed code or plugins change.
     */
    public function __construct(
        icon_map $iconmap,
        glyph_signature_factory $signatures,
        ?\cache $cache,
        string $version
    ) {
        $this->iconmap = $iconmap;
        $this->signatures = $signatures;
        $this->cache = $cache;
        $this->version = $version;
    }

    /**
     * Every customisable icon.
     *
     * @return array[] Entries sorted by key. Each has key, kind (font or image), classes for font icons, component and
     *     name for image icons, and group, the number of icons that share its glyph, which is zero when it is alone.
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
                    'identity' => '',
                ];
            }
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
     * Image icons of core and of every plugin that ships any.
     *
     * @return string[][] Names grouped by component.
     */
    private function image_icons(): array {
        global $CFG;
        $root = is_dir($CFG->dirroot . '/pix') ? $CFG->dirroot : $CFG->dirroot . '/public';
        $found = ['core' => []];
        foreach (glob($root . '/pix/*/*.{' . implode(',', self::EXTENSIONS) . '}', GLOB_BRACE) ?: [] as $file) {
            $found['core'][] = basename(dirname($file)) . '/' . pathinfo($file, PATHINFO_FILENAME);
        }
        foreach (\core_component::get_plugin_types() as $type => $unused) {
            foreach (\core_component::get_plugin_list($type) as $name => $directory) {
                $files = glob($directory . '/pix/*.{' . implode(',', self::EXTENSIONS) . '}', GLOB_BRACE) ?: [];
                foreach ($files as $file) {
                    $found[$type . '_' . $name][] = pathinfo($file, PATHINFO_FILENAME);
                }
            }
        }
        foreach ($found as $component => $names) {
            $found[$component] = array_values(array_unique($names));
            sort($found[$component]);
        }
        return $found;
    }
}
