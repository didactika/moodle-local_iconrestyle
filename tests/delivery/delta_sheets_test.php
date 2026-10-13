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
 * Tests for the compiled stylesheets and their cache.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\delivery;

use local_iconrestyle\performance\counting_compiler_factory;
use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/../fixtures/counting_compiler_factory.php');

#[\PHPUnit\Framework\Attributes\CoversClass(delta_sheets::class)]
/**
 * Verify that a stylesheet is compiled once, kept once and prepared before anybody asks for it.
 *
 * @covers \local_iconrestyle\delivery\delta_sheets
 * @covers \local_iconrestyle\delivery\compiled_cache
 * @covers \local_iconrestyle\delivery\bundle_service
 * @covers \local_iconrestyle\task\warm_stylesheets
 */
final class delta_sheets_test extends \advanced_testcase {
    /**
     * Start from empty caches and a fresh factory.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
    }

    /**
     * Save one rule in a context.
     *
     * @param int $contextid Context id.
     * @param string $color Colour of the rule.
     * @return rule The stored rule.
     */
    private function save(int $contextid, string $color = '#1b6ec2'): rule {
        $existing = service_factory::instance()->rules()->find($contextid, 'core:a/setting', rule::TARGET_ICON);
        $options = ['fg' => $color];
        if ($existing) {
            $options += ['rev' => $existing->rev()];
        }
        return service_factory::instance()->rule_service()->save(
            new rule($existing ? $existing->id() : 0, $contextid, slot_key::parse('core:a/setting'), $options),
            2
        );
    }

    /**
     * A stylesheet is put in the cache when it is saved, so the first visitor does not wait for it.
     */
    public function test_a_saved_stylesheet_is_already_cached(): void {
        $system = \context_system::instance()->id;
        $this->save($system);
        $sheets = service_factory::instance()->delta_sheets();
        $this->assertTrue($sheets->is_cached($system, 1));
        $counting = new counting_compiler_factory();
        $bundles = new bundle_service(service_factory::instance()->revisions(), $counting->sheets(service_factory::instance()));
        $css = $bundles->assemble([$system => 1]);
        $this->assertSame(0, $counting->compiles());
        $this->assertStringContainsString('#1b6ec2', $css['css']);
    }

    /**
     * However many times a stylesheet is saved, the cache keeps only the newest one.
     */
    public function test_each_context_keeps_only_its_newest_stylesheet(): void {
        $system = \context_system::instance()->id;
        foreach (['#111111', '#222222', '#333333', '#444444', '#555555'] as $color) {
            $this->save($system, $color);
        }
        $sheets = service_factory::instance()->delta_sheets();
        $this->assertTrue($sheets->is_cached($system, 5));
        foreach ([1, 2, 3, 4] as $old) {
            $this->assertFalse($sheets->is_cached($system, $old), 'Revision ' . $old . ' is still cached.');
        }
    }

    /**
     * Deleting the last rule of a context drops its stylesheet too.
     */
    public function test_a_stylesheet_without_rules_is_dropped(): void {
        $system = \context_system::instance()->id;
        $this->save($system);
        service_factory::instance()->rule_service()->delete($system, slot_key::parse('core:a/setting'));
        $this->assertFalse(service_factory::instance()->delta_sheets()->is_cached($system, 1));
    }

    /**
     * After the caches are purged, a hundred requests compile each stylesheet once.
     */
    public function test_a_purge_makes_each_stylesheet_compile_once(): void {
        $system = \context_system::instance()->id;
        $course = \context_course::instance($this->getDataGenerator()->create_course()->id)->id;
        $this->save($system);
        $this->save($course);
        \cache::make('local_iconrestyle', 'compiled')->purge();
        $counting = new counting_compiler_factory();
        $bundles = new bundle_service(service_factory::instance()->revisions(), $counting->sheets(service_factory::instance()));
        for ($i = 0; $i < 100; $i++) {
            $bundles->assemble([$system => 1, $course => 1]);
        }
        $this->assertSame(2, $counting->compiles());
    }

    /**
     * The warm-up compiles what is missing and nothing else, and then a page reads nothing from the database.
     */
    public function test_the_warm_up_prepares_every_stylesheet(): void {
        global $DB;
        $system = \context_system::instance()->id;
        $course = \context_course::instance($this->getDataGenerator()->create_course()->id)->id;
        $this->save($system);
        $this->save($course);
        \cache::make('local_iconrestyle', 'compiled')->purge();
        $sheets = service_factory::instance()->delta_sheets();
        $this->assertSame(['compiled' => 2, 'cached' => 0], $sheets->warm_all());
        $this->assertSame(['compiled' => 0, 'cached' => 2], $sheets->warm_all());

        $bundles = service_factory::instance()->bundles();
        $bundles->assemble([$system => 1, $course => 1]);
        $before = $DB->perf_get_reads();
        $bundles->assemble([$system => 1, $course => 1]);
        $this->assertSame($before, $DB->perf_get_reads(), 'A cached page read from the database.');
    }

    /**
     * The scheduled task does the same as the warm-up.
     */
    public function test_the_scheduled_task_warms_the_stylesheets(): void {
        $system = \context_system::instance()->id;
        $this->save($system);
        \cache::make('local_iconrestyle', 'compiled')->purge();
        $this->expectOutputRegex('/1 compiled, 0 already cached/');
        (new \local_iconrestyle\task\warm_stylesheets())->execute();
        $this->assertTrue(service_factory::instance()->delta_sheets()->is_cached($system, 1));
    }
}
