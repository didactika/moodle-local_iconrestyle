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
        require_once(__DIR__ . '/../../classes/external/compat.php');
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
            'slotkey' => 'core:a/setting', 'painter' => 'color', 'assetid' => 0, 'fg' => '', 'bg' => '', 'shape' => '',
            'padding' => -1, 'opacity' => -1, 'enabled' => true, 'rev' => 0,
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
        return api::clean_returnvalue($function::execute_returns(), $result);
    }

    /**
     * The catalogue is returned in the declared shape with a version key.
     */
    public function test_get_catalogue(): void {
        $system = \context_system::instance();
        $result = $this->clean(get_catalogue::class, get_catalogue::execute($system->id));
        $this->assertSame(service_factory::instance()->version_hash(), $result['version']);
        $this->assertGreaterThan(300, count($result['icons']));
        $bykey = array_column($result['icons'], null, 'key');
        $this->assertSame('font', $bykey['core:a/setting']['kind']);
        $this->assertSame('', $bykey['core:a/setting']['imageurl']);
        $this->assertSame('image', $bykey['core:i/agg_mean']['kind']);
        $this->assertStringContainsString('agg_mean', $bykey['core:i/agg_mean']['imageurl']);
    }

    /**
     * Saving, reading back, updating and deleting a rule.
     */
    public function test_rule_life_cycle(): void {
        $system = \context_system::instance();
        $input = $this->input(['fg' => '#E83E8C', 'shape' => 'circle']);
        $saved = $this->clean(save_rule::class, save_rule::execute($system->id, $input));
        $this->assertSame(['core:a/setting', '#e83e8c', 'circle', 1, true], [
            $saved['slotkey'], $saved['fg'], $saved['shape'], $saved['rev'], $saved['own'],
        ]);

        $listed = $this->clean(get_rules::class, get_rules::execute($system->id));
        $this->assertCount(1, $listed['rules']);
        $this->assertSame($saved['rev'], $listed['rules'][0]['rev']);

        $updated = save_rule::execute($system->id, $this->input(['fg' => '#000', 'rev' => $saved['rev']]));
        $this->assertSame([2, '#000000', ''], [$updated['rev'], $updated['fg'], $updated['shape']]);

        $this->assertTrue(delete_rule::execute($system->id, 'core:a/setting'));
        $this->assertFalse(delete_rule::execute($system->id, 'core:a/setting'));
        $this->assertSame([], get_rules::execute($system->id)['rules']);
    }

    /**
     * A stale editor gets a clear conflict instead of overwriting a newer change.
     */
    public function test_conflict(): void {
        $system = \context_system::instance();
        $first = save_rule::execute($system->id, $this->input(['fg' => '#111111']));
        save_rule::execute($system->id, $this->input(['fg' => '#222222', 'rev' => $first['rev']]));
        try {
            save_rule::execute($system->id, $this->input(['fg' => '#333333', 'rev' => $first['rev']]));
            $this->fail('A stale save was accepted.');
        } catch (\moodle_exception $exception) {
            $this->assertSame('ruleconflict', $exception->errorcode);
        }
        try {
            save_rule::execute($system->id, $this->input(['fg' => '#444444', 'rev' => 0]));
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
            save_rule::execute(\context_system::instance()->id, $this->input($values));
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
            'bad shape' => [['shape' => 'blob']],
            'padding too big' => [['padding' => 1000]],
            'opacity too big' => [['opacity' => 101]],
            'bad painter' => [['painter' => 'script']],
            'mask without artwork' => [['painter' => 'mask']],
            'unknown artwork' => [['painter' => 'mask', 'assetid' => 99999]],
        ];
    }

    /**
     * Artwork is uploaded as base64, sanitised, and can then be used by a rule.
     */
    public function test_add_asset_and_use_it(): void {
        $system = \context_system::instance();
        $asset = $this->clean(add_asset::class, add_asset::execute($system->id, base64_encode(self::ICON)));
        $this->assertSame(['svg', 24, 24, true], [$asset['kind'], $asset['width'], $asset['height'], $asset['monochrome']]);
        $this->assertStringContainsString('/local/iconrestyle/asset.php/', $asset['url']);

        $saved = save_rule::execute($system->id, $this->input(['painter' => 'mask', 'assetid' => $asset['id'], 'fg' => '#ff0000']));
        $this->assertSame([$asset['id'], 'svg', $asset['url']], [$saved['assetid'], $saved['assetkind'], $saved['asseturl']]);
    }

    /**
     * Hostile or broken uploads are refused with a reason the interface can show.
     */
    public function test_add_asset_refusals(): void {
        $system = \context_system::instance();
        $hostile = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><script>alert(1)</script><path d="M0 0z"/></svg>';
        $cases = [
            [base64_encode($hostile), 'asset_rejected_forbidden'],
            [base64_encode('hello'), 'asset_rejected_unsupported'],
        ];
        foreach ($cases as $case) {
            try {
                add_asset::execute($system->id, $case[0]);
                $this->fail('Accepted');
            } catch (\moodle_exception $exception) {
                $this->assertSame($case[1], $exception->errorcode);
            }
        }
        foreach (['not base64 !!!', '', str_repeat('A', 360001)] as $content) {
            try {
                add_asset::execute($system->id, $content);
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
        $system = \context_system::instance();
        $css = $this->clean(preview_css::class, preview_css::execute($system->id, [$this->input(['fg' => '#e83e8c'])]));
        $this->assertStringStartsWith('.irs-preview-new .icon.fa-', $css);
        $this->assertStringContainsString('color: #e83e8c;', $css);
        $this->assertStringNotContainsString('body ', $css);
        $this->assertSame(0, $DB->count_records('local_iconrestyle_rule'));

        $current = preview_css::execute($system->id, [$this->input(['fg' => '#e83e8c'])], 'current');
        $this->assertStringStartsWith('.irs-preview-current .icon.fa-', $current);

        foreach ([[array_fill(0, 201, $this->input([])), 'new'], [[], 'body']] as $case) {
            try {
                preview_css::execute($system->id, $case[0], $case[1]);
                $this->fail('An invalid preview request was accepted.');
            } catch (\invalid_parameter_exception $exception) {
                $this->assertInstanceOf(\invalid_parameter_exception::class, $exception);
            }
        }
    }

    /**
     * Every function checks the capability of the context it is called for.
     */
    public function test_authorisation(): void {
        global $DB;
        $category = $this->getDataGenerator()->create_category();
        $categorycontext = \context_coursecat::instance($category->id);
        $system = \context_system::instance();
        $user = $this->getDataGenerator()->create_user();
        $managerid = $DB->get_field('role', 'id', ['shortname' => 'manager']);
        $this->getDataGenerator()->role_assign($managerid, $user->id, $categorycontext->id);
        $this->setUser($user);

        $this->assertSame([], get_rules::execute($categorycontext->id)['rules']);
        $saved = save_rule::execute($categorycontext->id, $this->input(['fg' => '#123456']));
        $this->assertSame($categorycontext->id, $saved['contextid']);

        $calls = [
            function () use ($system) {
                return get_catalogue::execute($system->id);
            },
            function () use ($system) {
                return get_rules::execute($system->id);
            },
            function () use ($system) {
                return save_rule::execute($system->id, $this->input([]));
            },
            function () use ($system) {
                return delete_rule::execute($system->id, 'core:a/setting');
            },
            function () use ($system) {
                return add_asset::execute($system->id, base64_encode(self::ICON));
            },
            function () use ($system) {
                return preview_css::execute($system->id, []);
            },
        ];
        foreach ($calls as $call) {
            try {
                $call();
                $this->fail('A call outside the allowed scope succeeded.');
            } catch (\required_capability_exception $exception) {
                $this->assertInstanceOf(\required_capability_exception::class, $exception);
            }
        }
        $this->assertSame(1, $this->count_rules());
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
