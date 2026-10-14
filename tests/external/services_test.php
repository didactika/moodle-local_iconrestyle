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
 * Tests for the web services used by the designer.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\external;

use core_external\external_api;
use local_iconrestyle\service_factory;

#[\PHPUnit\Framework\Attributes\CoversNothing]
/**
 * Verify authorisation, validation, optimistic locking and the shape of every response.
 *
 * @coversNothing
 */
final class services_test extends \advanced_testcase {
    /** @var string Small valid icon. */
    private const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 22h20z"/></svg>';

    /**
     * Start from a fresh factory and an administrator.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
        $this->setAdminUser();
    }

    /**
     * Build the editable fields of a rule.
     *
     * @param array $values Fields to set.
     * @return array Fields following the input description.
     */
    private function input(array $values): array {
        return $values + [
            'slotkey' => 'core:a/setting', 'contextid' => \context_system::instance()->id, 'pages' => [], 'regions' => [],
            'painter' => 'color', 'assetid' => 0, 'fg' => '', 'bg' => '', 'design' => '',
            'enabled' => true, 'rev' => 0,
        ];
    }

    /**
     * Run a response through the declared structure, as Moodle does before sending it.
     *
     * @param string $function Class name of the function.
     * @param mixed $result What execute returned.
     * @return mixed The cleaned response.
     */
    private function clean(string $function, $result) {
        return external_api::clean_returnvalue($function::execute_returns(), $result);
    }

    /**
     * Save one rule through the batch service.
     *
     * @param array $input Fields following the input description.
     * @return array The stored rule.
     */
    private function save(array $input): array {
        return $this->clean(save_rules::class, save_rules::execute([$input], []))['rules'][0];
    }

    /**
     * Delete one rule through the batch service.
     *
     * @param int $id Rule id.
     * @return bool Whether a rule was deleted.
     */
    private function remove(int $id): bool {
        return save_rules::execute([], [$id])['deleted'] !== [];
    }

    /**
     * The catalogue is returned in the declared shape with a version key.
     */
    public function test_get_catalogue(): void {
        $result = $this->clean(get_catalogue::class, get_catalogue::execute());
        $this->assertSame(service_factory::instance()->version_hash(), $result['version']);
        $this->assertGreaterThan(300, count($result['icons']));
        $bykey = array_column($result['icons'], null, 'key');
        $this->assertSame('font', $bykey['core:a/setting']['kind']);
        $this->assertSame('', $bykey['core:a/setting']['imageurl']);
        $this->assertSame('image', $bykey['core:i/agg_mean']['kind']);
        $this->assertStringContainsString('agg_mean', $bykey['core:i/agg_mean']['imageurl']);
    }

    /**
     * The boxes around activity icons are listed with a preview image, and only their box and the colour of the glyph can be set.
     */
    public function test_activity_boxes(): void {
        $catalogue = $this->clean(get_catalogue::class, get_catalogue::execute());
        $bykey = array_column($catalogue['icons'], null, 'key');
        $this->assertSame('container', $bykey['purpose:assessment']['kind']);
        $this->assertStringContainsString('monologo', $bykey['purpose:assessment']['imageurl']);
        $this->assertStringContainsString('filtericon=1', $bykey['purpose:assessment']['imageurl']);
        $this->assertSame('assign', $bykey['activity:assign']['sample']);

        $saved = $this->save($this->input([
            'slotkey' => 'purpose:assessment', 'bg' => 'transparent', 'fg' => '#000000',
        ]));
        $this->assertSame(['none', 'transparent', '#000000'], [$saved['painter'], $saved['bg'], $saved['fg']]);

        $asset = add_asset::execute(base64_encode(self::ICON));
        $own = $this->save($this->input(['slotkey' => 'purpose:content', 'painter' => 'color', 'assetid' => $asset['id']]));
        $this->assertSame(['mask', $asset['id']], [$own['painter'], $own['assetid']]);
        $image = $this->save($this->input(['slotkey' => 'activity:assign', 'painter' => 'image', 'assetid' => $asset['id']]));
        $this->assertSame('image', $image['painter']);
    }

    /**
     * An image icon is recoloured through its own file, which the designer fetches as artwork.
     */
    public function test_icon_artwork(): void {
        $asset = $this->clean(use_icon_artwork::class, use_icon_artwork::execute('core:i/agg_mean'));
        $this->assertContains($asset['kind'], ['svg', 'png']);
        $this->assertGreaterThan(0, $asset['width']);

        $saved = $this->save($this->input([
            'slotkey' => 'core:i/agg_mean', 'painter' => 'mask', 'assetid' => $asset['id'], 'fg' => '#e83e8c',
        ]));
        $this->assertSame([$asset['id'], 'mask', '#e83e8c'], [$saved['assetid'], $saved['painter'], $saved['fg']]);

        $again = use_icon_artwork::execute('core:i/agg_mean');
        $this->assertSame($asset['id'], $again['id']);

        $module = use_icon_artwork::execute('activity:assign');
        $this->assertGreaterThan(0, $module['id']);
    }

    /**
     * Icons without a file of their own, and names that try to leave the icon folder, are refused.
     */
    public function test_icon_artwork_refusals(): void {
        try {
            use_icon_artwork::execute('purpose:assessment');
            $this->fail('A purpose has no file.');
        } catch (\moodle_exception $exception) {
            $this->assertSame('noiconfile', $exception->errorcode);
        }
        try {
            use_icon_artwork::execute('core:i/no-such-icon-anywhere');
            $this->fail('A missing file was accepted.');
        } catch (\moodle_exception $exception) {
            $this->assertSame('noiconfile', $exception->errorcode);
        }
        foreach (['core:../../config', 'core:i/../../config', 'x', ''] as $key) {
            try {
                use_icon_artwork::execute($key);
                $this->fail('Accepted ' . $key);
            } catch (\invalid_parameter_exception $exception) {
                $this->assertInstanceOf(\invalid_parameter_exception::class, $exception);
            }
        }
    }

    /**
     * The designer learns the new address of the site stylesheet after every save, and none when no rule is left.
     */
    public function test_stylesheet_address_follows_the_rules(): void {
        $this->assertSame('', get_stylesheet_url::execute());
        $saved = $this->save($this->input(['fg' => '#e83e8c']));
        $first = get_stylesheet_url::execute();
        $this->assertStringContainsString('/local/iconrestyle/styles.php/', $first);
        $this->save($this->input(['fg' => '#000000', 'rev' => $saved['rev']]));
        $this->assertNotSame($first, get_stylesheet_url::execute());
        $this->remove($saved['id']);
        $this->assertSame('', get_stylesheet_url::execute());
    }

    /**
     * Several rules are saved and deleted in one request, and the site stylesheet changes once.
     */
    public function test_save_rules_in_one_request(): void {
        $first = $this->clean(save_rules::class, save_rules::execute([
            $this->input(['fg' => '#111111']),
            $this->input(['slotkey' => 'core:t/delete', 'fg' => '#222222']),
            $this->input(['fg' => '#333333', 'pages' => ['admin']]),
        ], []));
        $this->assertCount(3, $first['rules']);
        $this->assertSame(['core:a/setting', 'core:t/delete', 'core:a/setting'], array_column($first['rules'], 'slotkey'));
        $this->assertSame([], $first['deleted']);
        $this->assertStringContainsString('/local/iconrestyle/styles.php/', $first['stylesheeturl']);
        $this->assertSame(3, $this->count_rules());

        $second = $this->clean(save_rules::class, save_rules::execute([
            $this->input(['fg' => '#444444', 'rev' => $first['rules'][0]['rev']]),
        ], [$first['rules'][1]['id'], $first['rules'][2]['id'], 999999]));
        $this->assertSame([$first['rules'][1]['id'], $first['rules'][2]['id']], $second['deleted']);
        $this->assertSame(1, $this->count_rules());
        $this->assertNotSame($first['stylesheeturl'], $second['stylesheeturl']);

        $last = save_rules::execute([], [$second['rules'][0]['id']]);
        $this->assertSame('', $last['stylesheeturl']);
    }

    /**
     * A batch is all or nothing: one conflict undoes every other change of the request.
     */
    public function test_save_rules_is_atomic(): void {
        $saved = save_rules::execute([$this->input(['fg' => '#111111'])], []);
        try {
            save_rules::execute([
                $this->input(['slotkey' => 'core:t/delete', 'fg' => '#222222']),
                $this->input(['fg' => '#333333', 'rev' => $saved['rules'][0]['rev'] + 5]),
            ], []);
            $this->fail('A stale revision was accepted.');
        } catch (\moodle_exception $exception) {
            $this->assertSame('ruleconflict', $exception->errorcode);
        }
        $this->assertSame(1, $this->count_rules());
        $this->assertSame($saved['stylesheeturl'], get_stylesheet_url::execute());
    }

    /**
     * A request cannot carry an unbounded number of changes.
     */
    public function test_save_rules_is_bounded(): void {
        $this->expectException(\invalid_parameter_exception::class);
        save_rules::execute([], range(1, save_rules::MAX_CHANGES + 1));
    }

    /**
     * Saving, reading back, updating and deleting a rule.
     */
    public function test_rule_life_cycle(): void {
        $input = $this->input(['fg' => '#E83E8C', 'design' => '{"shape":"circle","pt":25}']);
        $saved = $this->save($input);
        $this->assertSame(['core:a/setting', '#e83e8c', 'circle', 1, 'site'], [
            $saved['slotkey'], $saved['fg'], json_decode($saved['design'], true)['shape'], $saved['rev'], $saved['contextkind'],
        ]);

        $listed = $this->clean(get_rules::class, get_rules::execute());
        $this->assertCount(1, $listed['rules']);
        $this->assertSame($saved['rev'], $listed['rules'][0]['rev']);

        $updated = $this->save($this->input(['fg' => '#000', 'rev' => $saved['rev']]));
        $this->assertSame([2, '#000000', ''], [$updated['rev'], $updated['fg'], $updated['design']]);

        $this->assertTrue($this->remove($saved['id']));
        $this->assertFalse($this->remove($saved['id']));
        $this->assertSame([], get_rules::execute()['rules']);
    }

    /**
     * One icon can have a variant for each place and each combination of pages and regions.
     */
    public function test_variants_of_one_icon(): void {
        $category = $this->getDataGenerator()->create_category();
        $categoryid = \context_coursecat::instance($category->id)->id;
        $this->save($this->input(['fg' => '#111111']));
        $this->save($this->input(['fg' => '#222222', 'pages' => ['admin']]));
        $this->save($this->input(['fg' => '#333333', 'pages' => ['admin'], 'regions' => ['navbar', 'footer']]));
        $stored = $this->save($this->input(['fg' => '#444444', 'contextid' => $categoryid]));

        $this->assertSame(['category', $category->name], [$stored['contextkind'], $stored['contextname']]);
        $listed = $this->clean(get_rules::class, get_rules::execute());
        $this->assertCount(4, $listed['rules']);
        $regions = array_column($listed['rules'], 'regions');
        $this->assertContains(['navbar', 'footer'], $regions);

        $again = $this->save($this->input(['fg' => '#555555', 'pages' => ['admin'], 'rev' => 1]));
        $this->assertSame(['#555555', 2], [$again['fg'], $again['rev']]);
        $this->assertCount(4, get_rules::execute()['rules']);
    }

    /**
     * A stale editor gets a clear conflict instead of overwriting a newer change.
     */
    public function test_conflict(): void {
        $first = $this->save($this->input(['fg' => '#111111']));
        $this->save($this->input(['fg' => '#222222', 'rev' => $first['rev']]));
        try {
            $this->save($this->input(['fg' => '#333333', 'rev' => $first['rev']]));
            $this->fail('A stale save was accepted.');
        } catch (\moodle_exception $exception) {
            $this->assertSame('ruleconflict', $exception->errorcode);
        }
        try {
            $this->save($this->input(['fg' => '#444444', 'rev' => 0]));
            $this->fail('Saving as new over an existing rule was accepted.');
        } catch (\moodle_exception $exception) {
            $this->assertSame('ruleconflict', $exception->errorcode);
        }
    }

    /**
     * Values outside what a rule may hold are refused before anything is stored.
     *
     * @dataProvider invalid_provider
     * @param array $values Invalid fields.
     */
    public function test_invalid_input(array $values): void {
        global $DB;
        $this->expectException(\invalid_parameter_exception::class);
        try {
            $this->save($this->input($values));
        } finally {
            $this->assertSame(0, $DB->count_records('local_iconrestyle_rule'));
        }
    }

    /**
     * Invalid rule fields.
     *
     * @return array Cases.
     */
    public static function invalid_provider(): array {
        return [
            'unknown icon' => [['slotkey' => 'core:does/not-exist']],
            'bad slot key' => [['slotkey' => 'core:../x']],
            'bad colour' => [['fg' => 'red; background:url(x)']],
            'bad shape' => [['design' => '{"shape":"blob"}']],
            'padding too big' => [['design' => '{"pt":1000}']],
            'opacity too big' => [['design' => '{"opacity":101}']],
            'unknown property' => [['design' => '{"content":"x"}']],
            'not an object' => [['design' => '[1,2]']],
            'broken json' => [['design' => '{shape:']],
            'bad border colour' => [['design' => '{"bc":"red;x"}']],
            'bad painter' => [['painter' => 'script']],
            'unknown page' => [['pages' => ['everything']]],
            'unknown region' => [['regions' => ['body > div']]],
            'unknown place' => [['contextid' => 987654]],
            'mask without artwork' => [['painter' => 'mask']],
            'unknown artwork' => [['painter' => 'mask', 'assetid' => 99999]],
        ];
    }

    /**
     * Artwork is uploaded as base64, sanitised, and can then be used by a rule.
     */
    public function test_add_asset_and_use_it(): void {
        $asset = $this->clean(add_asset::class, add_asset::execute(base64_encode(self::ICON)));
        $this->assertSame(['svg', 24, 24, true], [$asset['kind'], $asset['width'], $asset['height'], $asset['monochrome']]);
        $this->assertStringContainsString('/local/iconrestyle/asset.php/', $asset['url']);

        $saved = $this->save($this->input(['painter' => 'mask', 'assetid' => $asset['id'], 'fg' => '#ff0000']));
        $this->assertSame([$asset['id'], 'svg', $asset['url']], [$saved['assetid'], $saved['assetkind'], $saved['asseturl']]);
    }

    /**
     * Hostile or broken uploads are refused with a reason the interface can show.
     */
    public function test_add_asset_refusals(): void {
        $hostile = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><script>alert(1)</script><path d="M0 0z"/></svg>';
        $cases = [
            [base64_encode($hostile), 'asset_rejected_forbidden'],
            [base64_encode('hello'), 'asset_rejected_unsupported'],
        ];
        foreach ($cases as $case) {
            try {
                add_asset::execute($case[0]);
                $this->fail('Accepted');
            } catch (\moodle_exception $exception) {
                $this->assertSame($case[1], $exception->errorcode);
            }
        }
        foreach (['not base64 !!!', '', str_repeat('A', 360001)] as $content) {
            try {
                add_asset::execute($content);
                $this->fail('Accepted');
            } catch (\invalid_parameter_exception $exception) {
                $this->assertInstanceOf(\invalid_parameter_exception::class, $exception);
            }
        }
    }

    /**
     * The preview is compiled by the real compiler, scoped to the preview area, and stores nothing.
     */
    public function test_preview(): void {
        global $DB;
        $css = $this->clean(preview_css::class, preview_css::execute([$this->input(['fg' => '#e83e8c'])]));
        $this->assertStringStartsWith('.irs-preview-new [class].fa-', $css);
        $this->assertStringContainsString('color: #e83e8c;', $css);
        $this->assertStringNotContainsString('body ', $css);
        $this->assertSame(0, $DB->count_records('local_iconrestyle_rule'));

        $current = preview_css::execute([$this->input(['fg' => '#e83e8c'])], 'current');
        $this->assertStringStartsWith('.irs-preview-current [class].fa-', $current);

        foreach ([[array_fill(0, 201, $this->input([])), 'new'], [[], 'body']] as $case) {
            try {
                preview_css::execute($case[0], $case[1]);
                $this->fail('An invalid preview request was accepted.');
            } catch (\invalid_parameter_exception $exception) {
                $this->assertInstanceOf(\invalid_parameter_exception::class, $exception);
            }
        }
    }

    /**
     * Places can be searched by name, and only people who may customise icons can search.
     */
    public function test_search_locations(): void {
        $category = $this->getDataGenerator()->create_category(['name' => 'Faculty of Arts']);
        $course = $this->getDataGenerator()->create_course(['fullname' => 'Introduction to design', 'shortname' => 'DES101']);
        $this->getDataGenerator()->create_module('page', ['course' => $course->id, 'name' => 'Welcome page']);

        $categories = $this->clean(search_locations::class, search_locations::execute('category', 'arts'))['places'];
        $this->assertSame('Faculty of Arts', $categories[0]['name']);
        $this->assertSame(\context_coursecat::instance($category->id)->id, $categories[0]['contextid']);

        $courses = $this->clean(search_locations::class, search_locations::execute('course', 'DES1'))['places'];
        $this->assertSame(['Introduction to design', 'DES101'], [$courses[0]['name'], $courses[0]['detail']]);

        $activities = search_locations::execute('activity', 'introduction')['places'];
        $this->assertSame('Welcome page', $activities[0]['name']);
        $this->assertStringContainsString('DES101', $activities[0]['detail']);
        $this->assertStringContainsString('Introduction to design', $activities[0]['detail']);

        $this->assertSame([], search_locations::execute('course', 'x')['places']);
        $this->expectException(\invalid_parameter_exception::class);
        search_locations::execute('block', 'abc');
    }

    /**
     * Every function needs the capability to customise icons, whatever the place it is called for.
     */
    public function test_authorisation(): void {
        global $DB;
        $category = $this->getDataGenerator()->create_category();
        $user = $this->getDataGenerator()->create_user();
        $managerid = $DB->get_field('role', 'id', ['shortname' => 'manager']);
        $this->getDataGenerator()->role_assign($managerid, $user->id, \context_coursecat::instance($category->id)->id);
        $this->setUser($user);

        $calls = [
            function () {
                return get_catalogue::execute();
            },
            function () {
                return get_rules::execute();
            },
            function () {
                return $this->save($this->input([]));
            },
            function () {
                return $this->remove(1);
            },
            function () {
                return save_rules::execute([$this->input([])], []);
            },
            function () {
                return add_asset::execute(base64_encode(self::ICON));
            },
            function () {
                return use_icon_artwork::execute('core:i/agg_mean');
            },
            function () {
                return get_stylesheet_url::execute();
            },
            function () {
                return preview_css::execute([]);
            },
            function () {
                return search_locations::execute('category', '');
            },
        ];
        foreach ($calls as $call) {
            try {
                $call();
                $this->fail('A call without the capability succeeded.');
            } catch (\required_capability_exception $exception) {
                $this->assertInstanceOf(\required_capability_exception::class, $exception);
            }
        }
        $this->assertSame(0, $this->count_rules());
    }

    /**
     * Number of stored rules.
     *
     * @return int Count.
     */
    private function count_rules(): int {
        global $DB;
        return $DB->count_records('local_iconrestyle_rule');
    }
}
