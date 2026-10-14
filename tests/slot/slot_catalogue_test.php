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
 * Tests for the catalogue of customisable icons.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\slot;

use local_iconrestyle\service_factory;

#[\PHPUnit\Framework\Attributes\CoversClass(slot_catalogue::class)]
/**
 * Verify that the catalogue is built from the running Moodle and is consistent with the glyph signatures.
 *
 * @covers \local_iconrestyle\slot\slot_catalogue
 */
final class slot_catalogue_test extends \advanced_testcase {
    /**
     * Start from a fresh factory and an empty cache.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
        \cache::make('local_iconrestyle', 'catalogue')->purge();
    }

    /**
     * Font icons carry the class attribute core would render, image icons carry their component and name.
     */
    public function test_font_and_image_entries(): void {
        $catalogue = service_factory::instance()->catalogue();
        $font = $catalogue->find('core:a/setting');
        $this->assertSame('font', $font['kind']);
        $this->assertSame(['icon', 'fa-fw'], [explode(' ', $font['classes'])[0], substr($font['classes'], -5)]);
        $this->assertMatchesRegularExpression('/\bfa(-solid)?\b/', $font['classes']);

        $image = $catalogue->find('core:i/agg_mean');
        $this->assertSame('image', $image['kind']);
        $this->assertSame(['core', 'i/agg_mean', ''], [$image['component'], $image['name'], $image['classes']]);
        $this->assertNull($catalogue->find('core:does/not-exist'));
    }

    /**
     * Plugins that ship icons in their pix folder are listed under their own component.
     */
    public function test_plugin_icons_are_listed(): void {
        $plugins = array_filter(service_factory::instance()->catalogue()->all(), function (array $entry): bool {
            return strpos($entry['component'], 'mod_') === 0 && $entry['kind'] === 'image';
        });
        $this->assertNotEmpty($plugins, 'No activity icon was found');
    }

    /**
     * Every image file of the pix folders of core and of the plugins is an icon of the list, whatever its extension or depth.
     */
    public function test_every_image_file_is_listed(): void {
        global $CFG;
        $catalogue = service_factory::instance()->catalogue();
        $listed = array_column($catalogue->all(), 'key');
        $extensions = ['svg', 'png', 'gif', 'jpg', 'jpeg', 'webp', 'ico'];
        $folders = ['core' => (is_dir($CFG->dirroot . '/pix') ? $CFG->dirroot : $CFG->dirroot . '/public') . '/pix'];
        foreach (\core_component::get_component_list() as $components) {
            foreach ($components as $component => $directory) {
                $folders[$component] = $directory . '/pix';
            }
        }
        $missing = [];
        $checked = 0;
        foreach ($folders as $component => $folder) {
            if (!is_dir($folder)) {
                continue;
            }
            $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($folder, \FilesystemIterator::SKIP_DOTS));
            foreach ($files as $file) {
                $extension = strtolower($file->getExtension());
                if (!$file->isFile() || !in_array($extension, $extensions, true)) {
                    continue;
                }
                $name = substr(substr($file->getPathname(), strlen($folder) + 1), 0, -strlen($extension) - 1);
                $key = $component . ':' . str_replace('\\', '/', $name);
                if (!\local_iconrestyle\slot\slot_key::is_valid($key)) {
                    continue;
                }
                $checked++;
                if (!in_array($key, $listed, true)) {
                    $missing[] = $key;
                }
            }
        }
        $this->assertGreaterThan(500, $checked);
        $this->assertSame([], array_slice($missing, 0, 20), 'Images of pix folders that the list does not have');
    }

    /**
     * Keys are unique, valid and sorted.
     */
    public function test_keys_are_unique_valid_and_sorted(): void {
        $keys = array_column(service_factory::instance()->catalogue()->all(), 'key');
        $this->assertGreaterThan(300, count($keys));
        $this->assertSame($keys, array_values(array_unique($keys)));
        $sorted = $keys;
        sort($sorted);
        $this->assertSame($sorted, $keys);
        foreach ($keys as $key) {
            $this->assertTrue(slot_key::is_valid($key), $key);
        }
    }

    /**
     * Icons that share a glyph are flagged with the size of their group, and the flag agrees with the signatures.
     */
    public function test_shared_glyphs_are_flagged(): void {
        $factory = service_factory::instance();
        $entries = $factory->catalogue()->all();
        $shared = array_filter($entries, function (array $entry): bool {
            return $entry['group'] > 1;
        });
        $this->assertNotEmpty($shared, 'Every Moodle release shares at least one glyph between icons');
        $counts = [];
        foreach ($shared as $entry) {
            $identity = $factory->signatures()->for_slot(slot_key::parse($entry['key']))->identity();
            $counts[$identity][] = $entry['group'];
        }
        foreach ($counts as $sizes) {
            $this->assertSame([count($sizes)], array_values(array_unique($sizes)));
        }
    }

    /**
     * The second read comes from the cache and is identical.
     */
    public function test_cache(): void {
        $first = service_factory::instance()->catalogue()->all();
        service_factory::reset();
        $cache = \cache::make('local_iconrestyle', 'catalogue');
        $this->assertSame($first, $cache->get(service_factory::instance()->version_hash()));
        $this->assertSame($first, service_factory::instance()->catalogue()->all());
    }
}
