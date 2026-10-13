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
 * Tests for exporting and importing the customisations of a site.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\exchange;

use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(importer::class)]
/**
 * Verify that a package travels between sites, names places instead of ids, and is never trusted.
 *
 * @covers \local_iconrestyle\exchange\importer
 * @covers \local_iconrestyle\exchange\exporter
 * @covers \local_iconrestyle\exchange\place_keys
 * @covers \local_iconrestyle\exchange\import_report
 */
final class exchange_test extends \advanced_testcase {
    /** @var \stdClass Course used by the tests. */
    private $course;

    /** @var int Context of a category with an id number. */
    private $faculty;

    /** @var int Context of a category without one, inside the first. */
    private $department;

    /** @var int Context of an activity with an id number. */
    private $activity;

    /**
     * Build a small site with a place of every kind.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
        $this->setAdminUser();
        $generator = $this->getDataGenerator();
        $faculty = $generator->create_category(['name' => 'Faculty', 'idnumber' => 'FAC']);
        $department = $generator->create_category(['name' => 'Department of Arts', 'parent' => $faculty->id]);
        $this->course = $generator->create_course(['shortname' => 'ART101', 'category' => $department->id]);
        $this->faculty = \context_coursecat::instance($faculty->id)->id;
        $this->department = \context_coursecat::instance($department->id)->id;
        $assign = $generator->create_module('assign', ['course' => $this->course->id, 'idnumber' => 'ESSAY']);
        $this->activity = \context_module::instance($assign->cmid)->id;
    }

    /**
     * Save rules in every kind of place, one of them with artwork and one limited by page, region and mode.
     *
     * @return int Number of rules saved.
     */
    private function customise(): int {
        $factory = service_factory::instance();
        $asset = $factory->assets()->add(file_get_contents(__DIR__ . '/../fixtures/triangle.svg'), 2);
        $rules = [
            new rule(0, \context_system::instance()->id, slot_key::parse('core:a/setting'), ['fg' => '#112233']),
            new rule(0, $this->faculty, slot_key::parse('core:a/setting'), ['fg' => '#223344', 'bg' => 'var:--bs-light']),
            new rule(0, $this->department, slot_key::parse('core:t/delete'), ['design' => ['shape' => 'circle', 'pt' => 20]]),
            new rule(0, \context_course::instance($this->course->id)->id, slot_key::parse('core:a/setting'), [
                'fg' => '#334455', 'pages' => ['course', 'admin'], 'regions' => ['navbar'], 'mode' => 'dark',
            ]),
            new rule(0, $this->activity, slot_key::parse('core:a/setting'), ['fg' => '#445566']),
            new rule(0, \context_system::instance()->id, slot_key::parse('core:i/agg_mean'), [
                'painter' => 'mask', 'assetid' => $asset->id(), 'fg' => '#556677',
            ]),
        ];
        $factory->rule_service()->apply($rules, [], 2);
        return count($rules);
    }

    /**
     * Every rule of the site as comparable text.
     *
     * @return string[] One entry for each rule, sorted.
     */
    private function snapshot(): array {
        $lines = [];
        foreach (service_factory::instance()->rules()->find_all() as $rule) {
            $lines[] = implode('|', [
                $rule->contextid(), $rule->slot(), $rule->painter(), $rule->fg() ? $rule->fg()->stored() : '',
                $rule->bg() ? $rule->bg()->stored() : '', $rule->design()->json(), implode(',', $rule->pages()),
                implode(',', $rule->regions()), $rule->mode(), (int)$rule->enabled(),
            ]);
        }
        sort($lines);
        return $lines;
    }

    /**
     * Export the site as lines.
     *
     * @return string[] Lines.
     */
    private function export(): array {
        return iterator_to_array(service_factory::instance()->exporter()->lines(), false);
    }

    /**
     * Remove every rule of the site.
     */
    private function wipe(): void {
        $ids = [];
        foreach (service_factory::instance()->rules()->find_all() as $rule) {
            $ids[] = $rule->id();
        }
        service_factory::instance()->rule_service()->apply([], $ids, 2);
    }

    /**
     * A package names places and carries no id of this database.
     */
    public function test_a_package_has_no_database_ids(): void {
        $this->customise();
        $lines = $this->export();
        $header = json_decode($lines[0], true);
        $this->assertSame(['header', 'local_iconrestyle', 1], [$header['type'], $header['format'], $header['version']]);
        $text = implode("\n", $lines);
        $this->assertStringNotContainsString('contextid', $text);
        $this->assertStringContainsString('"place":"site"', $text);
        $this->assertStringContainsString('"place":"category:idnumber=FAC"', $text);
        $this->assertStringContainsString('"place":"category:path=Faculty/Department%20of%20Arts"', $text);
        $this->assertStringContainsString('"place":"course:shortname=ART101"', $text);
        $this->assertStringContainsString('"place":"activity:ART101/idnumber=ESSAY"', $text);
        $types = array_count_values(array_map(function (string $line): string {
            return json_decode($line, true)['type'];
        }, $lines));
        ksort($types);
        $this->assertSame(['asset' => 1, 'header' => 1, 'rule' => 6], $types);
        $decoded = array_map(function (string $line): array {
            return json_decode($line, true);
        }, $lines);
        $assetat = array_keys(array_filter($decoded, function (array $line): bool {
            return $line['type'] === 'asset';
        }))[0];
        $userat = array_keys(array_filter($decoded, function (array $line): bool {
            return ($line['asset'] ?? null) !== null;
        }))[0];
        $this->assertLessThan($userat, $assetat);
    }

    /**
     * Exporting, clearing the site and importing gives back the same rules.
     */
    public function test_a_round_trip_restores_every_rule(): void {
        $this->customise();
        $before = $this->snapshot();
        $lines = $this->export();
        $this->wipe();
        $this->assertSame([], $this->snapshot());

        $report = service_factory::instance()->importer()->run($lines, importer::MERGE, false, 2);
        $this->assertSame([6, 0, 0, 0, 1], [
            $report->get('created'), $report->get('updated'), $report->get('deleted'), $report->get('skipped'),
            $report->get('assets'),
        ]);
        $this->assertSame($before, $this->snapshot());
    }

    /**
     * A dry run says what would happen and changes nothing.
     */
    public function test_a_dry_run_changes_nothing(): void {
        $this->customise();
        $lines = $this->export();
        $before = $this->snapshot();
        $revision = service_factory::instance()->revisions()->get_many([\context_system::instance()->id]);
        $report = service_factory::instance()->importer()->run($lines, importer::REPLACE, true, 2);
        $this->assertSame([0, 6, 0], [$report->get('created'), $report->get('updated'), $report->get('deleted')]);
        $this->assertSame($before, $this->snapshot());
        $this->assertSame($revision, service_factory::instance()->revisions()->get_many([\context_system::instance()->id]));
    }

    /**
     * Merging keeps the other rules of the site, and replacing removes them.
     */
    public function test_merge_keeps_and_replace_removes(): void {
        $this->customise();
        $lines = $this->export();
        $extra = new rule(0, \context_system::instance()->id, slot_key::parse('core:t/edit'), ['fg' => '#abcdef']);
        service_factory::instance()->rule_service()->save($extra, 2);
        $this->assertCount(7, $this->snapshot());

        service_factory::instance()->importer()->run($lines, importer::MERGE, false, 2);
        $this->assertCount(7, $this->snapshot());

        $report = service_factory::instance()->importer()->run($lines, importer::REPLACE, false, 2);
        $this->assertSame(1, $report->get('deleted'));
        $this->assertCount(6, $this->snapshot());
    }

    /**
     * Only the icons that were chosen are exported, and only the artwork they use travels with them.
     */
    public function test_an_export_can_be_limited_to_some_icons(): void {
        $this->customise();
        $lines = iterator_to_array(service_factory::instance()->exporter()->lines(['core:t/delete']), false);
        $types = array_count_values(array_map(function (string $line): string {
            return json_decode($line, true)['type'];
        }, $lines));
        $this->assertSame(['header' => 1, 'rule' => 1], $types);

        $lines = iterator_to_array(service_factory::instance()->exporter()->lines(['core:i/agg_mean']), false);
        $types = array_count_values(array_map(function (string $line): string {
            return json_decode($line, true)['type'];
        }, $lines));
        $this->assertSame(['header' => 1, 'asset' => 1, 'rule' => 1], $types);

        $none = iterator_to_array(service_factory::instance()->exporter()->lines(['core:t/edit']), false);
        $this->assertCount(1, $none);
    }

    /**
     * An import can take only some icons of a package, leaves the artwork of the others out, and says what happens to each.
     */
    public function test_an_import_can_take_only_some_icons(): void {
        $this->customise();
        $lines = $this->export();
        $this->wipe();

        $report = service_factory::instance()->importer()->run($lines, importer::MERGE, true, 2, ['core:t/delete']);
        $this->assertSame([1, 0], [$report->get('created'), $report->get('assets')]);
        $this->assertCount(0, $this->snapshot());

        $everything = service_factory::instance()->importer()->run($lines, importer::MERGE, true, 2);
        $entries = array_column($everything->entries(), null, 'slot');
        $slots = array_keys($entries);
        sort($slots);
        $this->assertSame(['core:a/setting', 'core:i/agg_mean', 'core:t/delete'], $slots);
        $this->assertSame([4, 0, 0], [$entries['core:a/setting']['created'], $entries['core:a/setting']['updated'],
            $entries['core:a/setting']['skipped']]);

        $report = service_factory::instance()->importer()->run($lines, importer::MERGE, false, 2, ['core:a/setting']);
        $this->assertSame(4, $report->get('created'));
        $this->assertCount(4, $this->snapshot());
        $this->assertSame(0, $report->get('assets'));
    }

    /**
     * Replacing with a choice of icons only replaces those icons and leaves the others of the site as they are.
     */
    public function test_replace_with_a_choice_leaves_the_other_icons_alone(): void {
        $this->customise();
        $lines = $this->export();
        $extra = new rule(0, \context_system::instance()->id, slot_key::parse('core:t/edit'), ['fg' => '#abcdef']);
        service_factory::instance()->rule_service()->save($extra, 2);
        $stray = new rule(0, $this->faculty, slot_key::parse('core:t/delete'), ['fg' => '#010203']);
        service_factory::instance()->rule_service()->save($stray, 2);
        $this->assertCount(8, $this->snapshot());

        $report = service_factory::instance()->importer()->run($lines, importer::REPLACE, false, 2, ['core:t/delete']);
        $this->assertSame(1, $report->get('deleted'));
        $this->assertCount(7, $this->snapshot());
        $this->assertStringContainsString('#abcdef', implode(' ', $this->snapshot()));
    }

    /**
     * A place that this site does not have is left out and named, and the rest of the package is imported.
     */
    public function test_a_missing_place_is_left_out_and_named(): void {
        $this->customise();
        $lines = $this->export();
        $this->wipe();
        global $DB;
        $DB->set_field('course', 'shortname', 'RENAMED', ['id' => $this->course->id]);
        $report = service_factory::instance()->importer()->run($lines, importer::MERGE, false, 2);
        $this->assertSame(2, $report->get('skipped'));
        $this->assertCount(4, $this->snapshot());
        $this->assertStringContainsString('course:shortname=ART101', implode(' ', $report->issues()));
    }

    /**
     * Nothing in a package is trusted.
     */
    public function test_a_hostile_package_is_refused_line_by_line(): void {
        $header = json_encode(['type' => 'header', 'format' => 'local_iconrestyle', 'version' => 1]);
        $rule = ['type' => 'rule', 'place' => 'site', 'slot' => 'core:a/setting', 'painter' => 'color'];
        $lines = [
            $header,
            json_encode($rule + ['fg' => 'url(javascript:alert(1))']),
            json_encode(['slot' => 'core:../../config'] + $rule),
            json_encode(['slot' => 'core:no/such/icon'] + $rule),
            json_encode($rule + ['design' => ['pt' => 999999]]),
            json_encode($rule + ['design' => ['behavior' => 'url(x)']]),
            json_encode(array_merge($rule, ['painter' => 'mask'])),
            json_encode($rule + ['asset' => str_repeat('a', 64)]),
            json_encode($rule + ['mode' => 'sepia']),
            json_encode(['place' => 'category:idnumber=nothing'] + $rule),
            'not json at all',
            json_encode($rule + ['fg' => '#112233']),
        ];
        $report = service_factory::instance()->importer()->run($lines, importer::MERGE, false, 2);
        $this->assertSame(1, $report->get('created'));
        $this->assertSame(10, $report->get('skipped'));
        $this->assertCount(1, $this->snapshot());
    }

    /**
     * Artwork is checked again on the way in, whatever the package says it is: hostile artwork is refused, and so is the rule
     * that needed it.
     */
    public function test_hostile_artwork_is_refused_on_import(): void {
        global $DB;
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><script>alert(1)</script>' .
            '<path onload="x()" d="M12 2L2 22h20z"/></svg>';
        $lines = [
            json_encode(['type' => 'header', 'format' => 'local_iconrestyle', 'version' => 1]),
            json_encode(['type' => 'asset', 'hash' => str_repeat('b', 64), 'kind' => 'svg', 'content' => base64_encode($svg)]),
            json_encode([
                'type' => 'rule', 'place' => 'site', 'slot' => 'core:i/agg_mean', 'painter' => 'mask',
                'asset' => str_repeat('b', 64), 'fg' => '#112233',
            ]),
        ];
        $report = service_factory::instance()->importer()->run($lines, importer::MERGE, false, 2);
        $this->assertSame([0, 2], [$report->get('created'), $report->get('skipped')]);
        $this->assertSame(0, $DB->count_records('local_iconrestyle_asset'));
        $this->assertSame([], $this->snapshot());
    }

    /**
     * Text that is not a package of this plugin, or is from a newer one, is refused.
     */
    public function test_other_files_are_refused(): void {
        $importer = service_factory::instance()->importer();
        $other = json_encode(['type' => 'header', 'format' => 'something_else', 'version' => 1]);
        foreach ([[], [''], ['not json'], [$other]] as $lines) {
            try {
                $importer->run($lines, importer::MERGE, false, 2);
                $this->fail('A file that is not a package was accepted.');
            } catch (\moodle_exception $exception) {
                $this->assertSame('invalidpackage', $exception->errorcode);
            }
        }
        try {
            $newer = json_encode(['type' => 'header', 'format' => 'local_iconrestyle', 'version' => 99]);
            $importer->run([$newer], importer::MERGE, false, 2);
            $this->fail('A package from a newer version was accepted.');
        } catch (\moodle_exception $exception) {
            $this->assertSame('unsupportedpackage', $exception->errorcode);
        }
    }

    /**
     * The limits of the site apply to an import, and only the rules that break them are left out.
     */
    public function test_limits_leave_out_only_the_rules_that_break_them(): void {
        set_config('maxrulespercontext', 2, 'local_iconrestyle');
        service_factory::reset();
        $header = json_encode(['type' => 'header', 'format' => 'local_iconrestyle', 'version' => 1]);
        $lines = [$header];
        foreach (['core:a/setting', 'core:t/delete', 'core:t/edit'] as $slot) {
            $lines[] = json_encode(['type' => 'rule', 'place' => 'site', 'slot' => $slot, 'painter' => 'color', 'fg' => '#112233']);
        }
        $report = service_factory::instance()->importer()->run($lines, importer::MERGE, false, 2);
        $this->assertSame([2, 1], [$report->get('created'), $report->get('skipped')]);
        $this->assertCount(2, $this->snapshot());
    }

    /**
     * Only people who may exchange customisations can export and import.
     */
    public function test_exchange_needs_its_capability(): void {
        $this->setUser($this->getDataGenerator()->create_user());
        $this->expectException(\required_capability_exception::class);
        \local_iconrestyle\external\export_rules::execute();
    }

    /**
     * The services return the package and the report in their declared shape.
     */
    public function test_the_services_round_trip(): void {
        $this->customise();
        $export = \core_external\external_api::clean_returnvalue(
            \local_iconrestyle\external\export_rules::execute_returns(),
            \local_iconrestyle\external\export_rules::execute()
        );
        $this->assertStringEndsWith('.iconrestyle', $export['filename']);
        $this->wipe();
        $dry = \local_iconrestyle\external\import_rules::execute($export['content'], 'merge', true);
        $this->assertSame([6, 0], [$dry['created'], count($this->snapshot())]);
        $done = \local_iconrestyle\external\import_rules::execute($export['content'], 'merge', false);
        $this->assertSame(6, $done['created']);
        $this->assertStringContainsString('/local/iconrestyle/styles.php/', $done['stylesheeturl']);
        $this->assertCount(6, $this->snapshot());
    }

    /**
     * The services take a choice of icons, and the answer lists what happens to each icon in its declared shape.
     */
    public function test_the_services_take_a_choice_of_icons(): void {
        $this->customise();
        $export = \local_iconrestyle\external\export_rules::execute(['core:a/setting']);
        $this->assertCount(5, explode("\n", trim($export['content'])));
        $this->wipe();
        $dry = \core_external\external_api::clean_returnvalue(
            \local_iconrestyle\external\import_rules::execute_returns(),
            \local_iconrestyle\external\import_rules::execute($export['content'], 'merge', true)
        );
        $this->assertSame([['slot' => 'core:a/setting', 'created' => 4, 'updated' => 0, 'skipped' => 0]], $dry['entries']);
        $done = \local_iconrestyle\external\import_rules::execute($export['content'], 'merge', false, ['core:a/setting']);
        $this->assertSame(4, $done['created']);
        $this->expectException(\invalid_parameter_exception::class);
        \local_iconrestyle\external\export_rules::execute(['not an icon']);
    }
}
