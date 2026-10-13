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
 * Tests for the chains that are kept for the pages.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\delivery;

use local_iconrestyle\hook\head_callbacks;
use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(chain_addresses::class)]
/**
 * Verify that a page makes one cache read, that a change is seen at once and that nothing stale is served.
 *
 * @covers \local_iconrestyle\delivery\chain_addresses
 */
final class chain_addresses_test extends \advanced_testcase {
    /**
     * Start from empty caches and a fresh factory.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
    }

    /**
     * Store a recolour rule.
     *
     * @param \context $context Context.
     * @param string $colour Colour.
     */
    private function recolour(\context $context, string $colour = '#1b6ec2'): void {
        service_factory::instance()->rule_service()->save(
            new rule(0, $context->id, slot_key::parse('core:a/setting'), ['fg' => $colour]),
            2
        );
    }

    /**
     * A path without rules answers nothing, and the answer is kept too.
     */
    public function test_a_path_without_rules_is_empty_and_remembered(): void {
        global $DB;
        $course = $this->getDataGenerator()->create_course();
        $path = \context_course::instance($course->id)->path;
        $addresses = service_factory::instance()->chain_addresses();

        $this->assertSame('', $addresses->encoded($path));
        $reads = $DB->perf_get_reads();
        $this->assertSame('', $addresses->encoded($path));
        $this->assertSame($reads, $DB->perf_get_reads());
    }

    /**
     * The encoded chain is the one of the resolver, and a second page reads nothing but the one entry.
     */
    public function test_a_path_is_resolved_once_and_then_read_from_the_cache(): void {
        global $DB;
        $category = $this->getDataGenerator()->create_category();
        $course = $this->getDataGenerator()->create_course(['category' => $category->id]);
        $coursecontext = \context_course::instance($course->id);
        $this->recolour(\context_system::instance());
        $this->recolour(\context_coursecat::instance($category->id));
        $this->recolour($coursecontext);
        $factory = service_factory::instance();

        $expected = bundle_service::encode_chain($factory->chain_resolver()->chain($coursecontext->path));
        $this->assertSame($expected, $factory->chain_addresses()->encoded($coursecontext->path));

        service_factory::reset();
        $reads = $DB->perf_get_reads();
        $this->assertSame($expected, service_factory::instance()->chain_addresses()->encoded($coursecontext->path));
        $this->assertSame($reads, $DB->perf_get_reads());
    }

    /**
     * A change to any context of the path is in the address of the next page.
     */
    public function test_a_change_is_seen_by_the_next_page(): void {
        $course = $this->getDataGenerator()->create_course();
        $coursecontext = \context_course::instance($course->id);
        $system = \context_system::instance();
        $this->recolour($system);
        $addresses = service_factory::instance()->chain_addresses();
        $before = $addresses->encoded($coursecontext->path);
        $this->assertSame($system->id . '-1', $before);

        $this->recolour($coursecontext);
        $this->assertSame($system->id . '-1.' . $coursecontext->id . '-1', $addresses->encoded($coursecontext->path));

        $this->recolour($system, '#e83e8c');
        $this->assertSame($system->id . '-2.' . $coursecontext->id . '-1', $addresses->encoded($coursecontext->path));
    }

    /**
     * Taking the last rule away, or forgetting a context, drops what was kept.
     */
    public function test_removing_rules_and_forgetting_a_context_are_seen(): void {
        $course = $this->getDataGenerator()->create_course();
        $coursecontext = \context_course::instance($course->id);
        $this->recolour($coursecontext);
        $factory = service_factory::instance();
        $this->assertSame($coursecontext->id . '-1', $factory->chain_addresses()->encoded($coursecontext->path));

        $factory->revisions()->bump($coursecontext->id, 0);
        $this->assertSame('', $factory->chain_addresses()->encoded($coursecontext->path));

        $factory->revisions()->bump($coursecontext->id, 1);
        $this->assertSame($coursecontext->id . '-3', $factory->chain_addresses()->encoded($coursecontext->path));
        $factory->revisions()->forget($coursecontext->id);
        $this->assertSame('', $factory->chain_addresses()->encoded($coursecontext->path));
    }

    /**
     * The address of the stylesheet of a page comes from the kept chain and is the same as before.
     */
    public function test_the_stylesheet_url_uses_the_kept_chain(): void {
        global $CFG;
        $course = $this->getDataGenerator()->create_course();
        $coursecontext = \context_course::instance($course->id);
        $this->assertNull(head_callbacks::stylesheet_url($coursecontext));
        $this->recolour($coursecontext);
        $hash = service_factory::instance()->version_hash();

        $CFG->slasharguments = 1;
        $url = head_callbacks::stylesheet_url($coursecontext);
        $this->assertSame(
            $CFG->wwwroot . '/local/iconrestyle/styles.php/' . $hash . '/' . $coursecontext->id . '-1/all.css',
            $url->out(false)
        );
        $CFG->slasharguments = 0;
        $url = head_callbacks::stylesheet_url($coursecontext);
        $this->assertSame(
            $CFG->wwwroot . '/local/iconrestyle/styles.php?file='
                . rawurlencode('/' . $hash . '/' . $coursecontext->id . '-1/all.css'),
            $url->out(false)
        );
    }

    /**
     * A path too long for a key, and the odd ones, still work.
     */
    public function test_a_very_deep_path_is_kept_under_a_short_key(): void {
        $addresses = service_factory::instance()->chain_addresses();
        $path = '/' . implode('/', range(1000000, 1000040));
        $this->assertSame('', $addresses->encoded($path));
        $this->assertSame('', $addresses->encoded($path));
        $this->assertSame('', $addresses->encoded(''));
    }

    /**
     * The tag of a bundle changes with the revisions and with the code, and not with anything else.
     */
    public function test_the_entity_tag_follows_the_revisions_and_the_code(): void {
        $one = bundle_service::etag('abcdef12', [3 => 1]);
        $this->assertSame($one, bundle_service::etag('abcdef12', [3 => 1]));
        $this->assertNotSame($one, bundle_service::etag('abcdef12', [3 => 2]));
        $this->assertNotSame($one, bundle_service::etag('abcdef13', [3 => 1]));
        $this->assertNotSame($one, bundle_service::etag('abcdef12', [3 => 1, 4 => 1]));
    }

    /**
     * What the bundle is made of now is known without reading a stylesheet.
     */
    public function test_the_effective_chain_needs_no_stylesheet(): void {
        $course = $this->getDataGenerator()->create_course();
        $coursecontext = \context_course::instance($course->id);
        $this->recolour($coursecontext);
        $this->recolour($coursecontext, '#e83e8c');
        $bundles = service_factory::instance()->bundles();

        $state = $bundles->effective([$coursecontext->id => 2]);
        $this->assertSame([$coursecontext->id => 2], $state['chain']);
        $this->assertTrue($state['current']);

        $state = $bundles->effective([$coursecontext->id => 1]);
        $this->assertSame([$coursecontext->id => 2], $state['chain']);
        $this->assertFalse($state['current']);

        $state = $bundles->effective([999999 => 1]);
        $this->assertSame([], $state['chain']);
        $this->assertFalse($state['current']);
    }
}
