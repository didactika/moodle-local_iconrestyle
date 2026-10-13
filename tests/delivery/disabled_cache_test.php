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
 * Tests for the plugin on a site where caching is disabled.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\delivery;

use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversNothing]
/**
 * Moodle hands out a different cache object when caching is disabled, which happens on development sites and during
 * installation and upgrade. The plugin must work there, only without the speed-up.
 *
 * @coversNothing
 */
final class disabled_cache_test extends \advanced_testcase {
    /**
     * Disable caching for this test and start from a fresh factory.
     */
    protected function setUp(): void {
        global $CFG;
        parent::setUp();
        $this->resetAfterTest();
        require_once($CFG->dirroot . '/cache/tests/fixtures/lib.php');
        \cache_phpunit_factory::phpunit_disable();
        service_factory::reset();
    }

    /**
     * Give the following tests their normal caches back.
     */
    protected function tearDown(): void {
        $instance = new \ReflectionProperty(\cache_factory::class, 'instance');
        $instance->setAccessible(true);
        $instance->setValue(null, null);
        \cache_factory::reset();
        service_factory::reset();
        parent::tearDown();
    }

    /**
     * Caches really are the disabled kind here, so this test would have caught a type that only fits application caches.
     */
    public function test_the_caches_are_disabled(): void {
        $cache = \cache::make('local_iconrestyle', 'ctxrev');
        $this->assertNotInstanceOf(\cache_application::class, $cache);
        $this->assertInstanceOf(\cache::class, $cache);
    }

    /**
     * Every path that uses a cache works, reading from the database each time.
     */
    public function test_everything_works_without_caching(): void {
        $factory = service_factory::instance();
        $system = \context_system::instance();
        $factory->rule_service()->save(new rule(0, $system->id, slot_key::parse('core:a/setting'), ['fg' => '#e83e8c']), 2);

        $chain = $factory->chain_resolver()->chain($system->path);
        $this->assertSame([$system->id => 1], $chain);
        $bundle = $factory->bundles()->assemble($chain, $factory->version_hash());
        $this->assertStringContainsString('color: #e83e8c;', $bundle['css']);
        $this->assertTrue($bundle['current']);
        $this->assertNotNull($factory->catalogue()->find('core:a/setting'));
    }

    /**
     * Moodle also runs with its stores disabled, as it does while installing and upgrading, and the plugin copes.
     */
    public function test_everything_works_with_the_stores_disabled(): void {
        $this->tearDown();
        $this->setUp();
        \cache_factory::disable_stores();
        service_factory::reset();
        $factory = service_factory::instance();
        $system = \context_system::instance();
        $factory->rule_service()->save(new rule(0, $system->id, slot_key::parse('core:a/setting'), ['fg' => '#e83e8c']), 2);
        $chain = $factory->chain_resolver()->chain($system->path);
        $this->assertSame([$system->id => 1], $chain);
        $this->assertStringContainsString('color: #e83e8c;', $factory->bundles()->assemble($chain, 'abcdef12')['css']);
        \cache_factory::reset();
    }

    /**
     * The hook that adds the stylesheet to every page does not complain.
     */
    public function test_the_page_hook_does_not_complain(): void {
        global $PAGE;
        $factory = service_factory::instance();
        $system = \context_system::instance();
        $factory->rule_service()->save(new rule(0, $system->id, slot_key::parse('core:a/setting'), ['fg' => '#e83e8c']), 2);
        $PAGE->set_url('/');
        $PAGE->set_context($system);
        \local_iconrestyle\hook\head_callbacks::inject();
        $this->assertDebuggingNotCalled();
    }
}
