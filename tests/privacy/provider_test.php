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
 * Tests for the privacy API implementation.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;
use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(provider::class)]
/**
 * Verify that the plugin says what it keeps about people, exports it and forgets it while keeping the configuration.
 *
 * @covers \local_iconrestyle\privacy\provider
 */
final class provider_test extends \core_privacy\tests\provider_testcase {
    /**
     * Start from a fresh factory.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
    }

    /**
     * Save a rule as a user.
     *
     * @param int $userid User.
     * @param string $slot Slot key.
     */
    private function save_as(int $userid, string $slot): void {
        service_factory::instance()->rule_service()->save(
            new rule(0, \context_system::instance()->id, slot_key::parse($slot), ['fg' => '#112233']),
            $userid
        );
    }

    /**
     * The metadata names both tables.
     */
    public function test_metadata(): void {
        $items = provider::get_metadata(new collection('local_iconrestyle'))->get_collection();
        $this->assertSame(['local_iconrestyle_rule', 'local_iconrestyle_asset'], array_map(function ($item) {
            return $item->get_name();
        }, $items));
    }

    /**
     * Only users who made a rule have a context.
     */
    public function test_contexts_and_users(): void {
        $author = $this->getDataGenerator()->create_user();
        $other = $this->getDataGenerator()->create_user();
        $this->save_as($author->id, 'core:a/setting');
        $this->assertEquals([\context_system::instance()->id], provider::get_contexts_for_userid($author->id)->get_contextids());
        $this->assertEquals([], provider::get_contexts_for_userid($other->id)->get_contextids());

        $list = new userlist(\context_system::instance(), 'local_iconrestyle');
        provider::get_users_in_context($list);
        $this->assertSame([(int)$author->id], array_map('intval', $list->get_userids()));
    }

    /**
     * What a user made is exported.
     */
    public function test_export(): void {
        $author = $this->getDataGenerator()->create_user();
        $this->save_as($author->id, 'core:a/setting');
        $contextlist = new approved_contextlist($author, 'local_iconrestyle', [\context_system::instance()->id]);
        provider::export_user_data($contextlist);
        $data = writer::with_context(\context_system::instance())->get_data([get_string('pluginname', 'local_iconrestyle')]);
        $this->assertSame('core:a/setting', $data->rules[0]['icon']);
    }

    /**
     * Erasing a user keeps the rule and forgets who made it.
     */
    public function test_erasing_keeps_the_configuration(): void {
        global $DB;
        $author = $this->getDataGenerator()->create_user();
        $other = $this->getDataGenerator()->create_user();
        $this->save_as($author->id, 'core:a/setting');
        $this->save_as($other->id, 'core:t/delete');
        provider::delete_data_for_user(new approved_contextlist($author, 'local_iconrestyle', [\context_system::instance()->id]));
        $this->assertSame(2, $DB->count_records('local_iconrestyle_rule'));
        $this->assertSame(0, $DB->count_records('local_iconrestyle_rule', ['usermodified' => $author->id]));
        $this->assertSame(1, $DB->count_records('local_iconrestyle_rule', ['usermodified' => $other->id]));

        provider::delete_data_for_users(new approved_userlist(\context_system::instance(), 'local_iconrestyle', [$other->id]));
        $this->assertSame(0, $DB->count_records_select('local_iconrestyle_rule', 'usermodified > 0'));

        $this->save_as($author->id, 'core:t/edit');
        provider::delete_data_for_all_users_in_context(\context_system::instance());
        $this->assertSame(0, $DB->count_records_select('local_iconrestyle_rule', 'usermodified > 0'));
        $this->assertSame(3, $DB->count_records('local_iconrestyle_rule'));
    }
}
