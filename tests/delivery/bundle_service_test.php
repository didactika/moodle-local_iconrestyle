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
 * Tests for bundle assembly and URL parsing.
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

#[\PHPUnit\Framework\Attributes\CoversClass(bundle_service::class)]
/**
 * Verify chain encoding, cascade order, caching and stale revisions.
 *
 * @covers \local_iconrestyle\delivery\bundle_service
 * @covers \local_iconrestyle\delivery\compiled_cache
 * @covers \local_iconrestyle\delivery\compile_lock
 */
final class bundle_service_test extends \advanced_testcase {
    /**
     * Start from empty caches and a fresh factory.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
    }

    /**
     * Valid chains survive an encode and decode round trip.
     */
    public function test_chain_round_trip(): void {
        $chain = [1 => 3, 45 => 7];
        $this->assertSame('1-3.45-7', bundle_service::encode_chain($chain));
        $this->assertSame($chain, bundle_service::decode_chain('1-3.45-7'));
    }

    /**
     * Malformed chains are rejected before anything is read.
     *
     * @dataProvider malformed_provider
     * @param string $encoded Encoded chain.
     */
    public function test_malformed_chains(string $encoded): void {
        $this->assertNull(bundle_service::decode_chain($encoded));
    }

    /**
     * Malformed chains.
     *
     * @return array Cases.
     */
    public static function malformed_provider(): array {
        return [
            'empty' => [''],
            'no revision' => ['1'],
            'zero context' => ['0-1'],
            'zero revision' => ['1-0'],
            'duplicate context' => ['1-1.1-2'],
            'letters' => ['a-b'],
            'traversal' => ['../../etc/passwd'],
            'trailing dot' => ['1-1.'],
            'too long number' => ['12345678901-1'],
            'too many contexts' => [implode('.', array_map(function (int $id): string {
                return $id . '-1';
            }, range(1, 13)))],
        ];
    }

    /**
     * The version hash must be eight hex characters.
     */
    public function test_hash_validation(): void {
        $this->assertTrue(bundle_service::is_valid_hash(service_factory::instance()->version_hash()));
        $this->assertFalse(bundle_service::is_valid_hash('../abcde'));
        $this->assertFalse(bundle_service::is_valid_hash('ABCDEF12'));
        $this->assertFalse(bundle_service::is_valid_hash('abc'));
    }

    /**
     * Store a recolour rule.
     *
     * @param \context $context Context.
     * @param string $colour Colour.
     */
    private function recolour(\context $context, string $colour): void {
        service_factory::instance()->rule_service()->save(
            new rule(0, $context->id, slot_key::parse('core:a/setting'), ['fg' => $colour]),
            2
        );
    }

    /**
     * Deeper contexts come later in the bundle, so the nearest context wins in the browser.
     */
    public function test_cascade_order(): void {
        $course = $this->getDataGenerator()->create_course();
        $system = \context_system::instance();
        $coursecontext = \context_course::instance($course->id);
        $this->recolour($coursecontext, '#00ff00');
        $this->recolour($system, '#ff0000');

        $chain = service_factory::instance()->chain_resolver()->chain($coursecontext->path);
        $result = service_factory::instance()->bundles()->assemble($chain, service_factory::instance()->version_hash());
        $this->assertTrue($result['current']);
        $this->assertLessThan(strpos($result['css'], '#00ff00'), strpos($result['css'], '#ff0000'));
    }

    /**
     * A second assembly is served from the cache without touching the rule table.
     */
    public function test_second_assembly_is_cached(): void {
        global $DB;
        $system = \context_system::instance();
        $this->recolour($system, '#ff0000');
        $hash = service_factory::instance()->version_hash();
        $chain = service_factory::instance()->chain_resolver()->chain($system->path);
        $first = service_factory::instance()->bundles()->assemble($chain, $hash);

        service_factory::reset();
        $before = $DB->perf_get_reads();
        $second = service_factory::instance()->bundles()->assemble($chain, $hash);
        $this->assertSame($before, $DB->perf_get_reads());
        $this->assertSame($first['css'], $second['css']);
        $this->assertNotSame('', $second['css']);
    }

    /**
     * An old URL still renders the latest icons, but is not marked immutable.
     */
    public function test_stale_revision_serves_latest_and_is_not_current(): void {
        $system = \context_system::instance();
        $this->recolour($system, '#ff0000');
        $oldchain = service_factory::instance()->chain_resolver()->chain($system->path);
        $this->recolour($system, '#0000ff');

        $result = service_factory::instance()->bundles()
            ->assemble($oldchain, service_factory::instance()->version_hash());
        $this->assertFalse($result['current']);
        $this->assertStringContainsString('#0000ff', $result['css']);
        $this->assertStringNotContainsString('#ff0000', $result['css']);
    }

    /**
     * A context whose rules were all removed contributes nothing.
     */
    public function test_removed_rules_contribute_nothing(): void {
        $system = \context_system::instance();
        $this->recolour($system, '#ff0000');
        $oldchain = service_factory::instance()->chain_resolver()->chain($system->path);
        service_factory::instance()->rule_service()->delete($system->id, slot_key::parse('core:a/setting'));

        $result = service_factory::instance()->bundles()
            ->assemble($oldchain, service_factory::instance()->version_hash());
        $this->assertSame('', $result['css']);
        $this->assertFalse($result['current']);
    }
}
