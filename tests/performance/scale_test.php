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
 * Benchmarks with budgets: the plugin must stay fast on a large site, and these tests fail when it does not.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\performance;

use local_iconrestyle\delivery\bundle_service;
use local_iconrestyle\delivery\chain_resolver;
use local_iconrestyle\hook\head_callbacks;
use local_iconrestyle\service_factory;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/../fixtures/scale_dataset.php');
require_once(__DIR__ . '/../fixtures/counting_compiler_factory.php');

#[\PHPUnit\Framework\Attributes\CoversNothing]
#[\PHPUnit\Framework\Attributes\Group('local_iconrestyle_performance')]
/**
 * One large site is built once and every scenario of the benchmark plan runs on it. Each scenario states its budget; the ones
 * that are exceeded are all reported together at the end, so a single run shows everything that is slow.
 *
 * Run it larger with ICONRESTYLE_BENCH_CATEGORIES, ICONRESTYLE_BENCH_COURSES, ICONRESTYLE_BENCH_SYSTEM_RULES and
 * ICONRESTYLE_BENCH_CONTEXT_RULES, and have the results written to a file with ICONRESTYLE_BENCH_REPORT.
 *
 * @coversNothing
 * @group local_iconrestyle_performance
 */
final class scale_test extends \advanced_testcase {
    /** @var string[] Budgets that were exceeded. */
    private $failures = [];

    /** @var array[] What was measured, by scenario. */
    private $report = [];

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
     * Note a measurement and check it against its budget.
     *
     * @param string $id Scenario, such as B-01.
     * @param string $name What was measured.
     * @param float|int $value Measured value.
     * @param float|int $max Most the budget allows.
     */
    private function budget(string $id, string $name, $value, $max): void {
        $this->report[$id][$name] = ['value' => round((float)$value, 3), 'budget' => $max];
        if ($value > $max) {
            $this->failures[] = $id . ' ' . $name . ': ' . round((float)$value, 3) . ' is over the budget of ' . $max;
        }
    }

    /**
     * Note a measurement that has no budget.
     *
     * @param string $id Scenario.
     * @param string $name What was measured.
     * @param float|int $value Measured value.
     */
    private function note(string $id, string $name, $value): void {
        $this->report[$id][$name] = ['value' => round((float)$value, 3), 'budget' => null];
    }

    /**
     * Milliseconds taken by a piece of work.
     *
     * @param callable $work Work to time.
     * @return float Milliseconds.
     */
    private function ms(callable $work): float {
        $start = hrtime(true);
        $work();
        return (hrtime(true) - $start) / 1e6;
    }

    /**
     * Database reads made by a piece of work.
     *
     * @param callable $work Work to run.
     * @return int Reads.
     */
    private function reads(callable $work): int {
        global $DB;
        $before = $DB->perf_get_reads();
        $work();
        return $DB->perf_get_reads() - $before;
    }

    /**
     * Give the deep category rules in some of its levels and return the context of a course at the bottom.
     *
     * @param scale_dataset $data Dataset.
     * @param int $levels How many contexts of the path have rules, the site included.
     * @return \context_course Context of a course below all of them.
     */
    private function course_with_chain(scale_dataset $data, int $levels): \context_course {
        $bottom = $data->deep[scale_dataset::DEEP_LEVELS - 1];
        $courseid = (int)$this->getDataGenerator()->create_course(['category' => $bottom, 'shortname' => 'CH' . $levels])->id;
        $step = intdiv(scale_dataset::DEEP_LEVELS, max(1, $levels - 1));
        for ($i = 0; $i < $levels - 1; $i++) {
            $level = min($i * $step, scale_dataset::DEEP_LEVELS - 1);
            $data->add_rules(\context_coursecat::instance($data->deep[$level])->id, 5, $i * 13);
        }
        return \context_course::instance($courseid);
    }

    /**
     * Run every scenario and fail when any budget is exceeded.
     */
    public function test_budgets_on_a_large_site(): void {
        $data = new scale_dataset($this);
        $built = $this->ms(function () use ($data) {
            $data->build_tree();
        });
        $this->note('setup', 'tree ms', $built);
        $this->note('setup', 'categories', count($data->categories) + scale_dataset::DEEP_LEVELS);
        $this->note('setup', 'courses', count($data->courses));
        $rulesms = $this->ms(function () use ($data) {
            $this->note('setup', 'contexts with rules', $data->build_rules() + 1);
        });
        $this->note('setup', 'rules ms', $rulesms);

        $chains = [];
        foreach ([1 => null, 4 => 4, 8 => 8] as $length => $levels) {
            $chains[$length] = $levels === null ? \context_course::instance($data->courses[count($data->courses) - 1])
                : $this->course_with_chain($data, $levels);
        }

        $this->b01_hot_page($chains);
        $this->b02_cold_page($chains);
        $this->b03_stylesheet($chains);
        $this->b04_compile($data);
        $this->b05_catalogue();
        $this->cache_entries();
        $this->b08_disabled_and_enabled($chains[8]);
        $this->b06_import($data);

        $table = '';
        foreach ($this->report as $id => $metrics) {
            foreach ($metrics as $name => $item) {
                $table .= sprintf("%-6s %-46s %12s  budget %s\n", $id, $name, $item['value'], $item['budget'] ?? '-');
            }
        }
        fwrite(STDERR, "\n" . $table);
        $path = getenv('ICONRESTYLE_BENCH_REPORT');
        if ($path) {
            file_put_contents($path, json_encode($this->report, JSON_PRETTY_PRINT));
        }
        $this->assertSame([], $this->failures, implode("\n", $this->failures));
    }

    /**
     * B-01: a page whose stylesheets are cached reads nothing from the database and adds almost no time.
     *
     * @param \context[] $chains Page contexts by number of stylesheets in their chain.
     */
    private function b01_hot_page(array $chains): void {
        foreach ($chains as $length => $context) {
            head_callbacks::stylesheet_url($context);
            $reads = $this->reads(function () use ($context) {
                for ($i = 0; $i < 500; $i++) {
                    head_callbacks::stylesheet_url($context);
                }
            });
            $micros = $this->ms(function () use ($context) {
                for ($i = 0; $i < 500; $i++) {
                    head_callbacks::stylesheet_url($context);
                }
            }) * 1000 / 500;
            $this->budget('B-01', 'chain ' . $length . ' database reads', $reads, 0);
            $this->budget('B-01', 'chain ' . $length . ' microseconds per page', $micros, 1000);
        }
    }

    /**
     * B-02: when the revisions are not cached, a page costs one query and a few milliseconds.
     *
     * @param \context[] $chains Page contexts by number of stylesheets in their chain.
     */
    private function b02_cold_page(array $chains): void {
        foreach ($chains as $length => $context) {
            \cache::make('local_iconrestyle', 'ctxrev')->purge();
            service_factory::reset();
            $time = 0.0;
            $reads = $this->reads(function () use ($context, &$time) {
                $time = $this->ms(function () use ($context) {
                    head_callbacks::stylesheet_url($context);
                });
            });
            $this->budget('B-02', 'chain ' . $length . ' database reads', $reads, 1);
            $this->budget('B-02', 'chain ' . $length . ' milliseconds', $time, 25);
        }
    }

    /**
     * B-03: the stylesheet of a page is served from the cache, and a purge makes it compile once however many ask.
     *
     * @param \context[] $chains Page contexts by number of stylesheets in their chain.
     */
    private function b03_stylesheet(array $chains): void {
        $factory = service_factory::instance();
        $context = $chains[8];
        $chain = $factory->chain_resolver()->chain($context->path);
        $this->note('B-03', 'stylesheets in the longest chain', count($chain));
        $factory->bundles()->assemble($chain);

        $reads = $this->reads(function () use ($factory, $chain) {
            for ($i = 0; $i < 100; $i++) {
                $factory->bundles()->assemble($chain);
            }
        });
        $hit = $this->ms(function () use ($factory, $chain) {
            for ($i = 0; $i < 100; $i++) {
                $factory->bundles()->assemble($chain);
            }
        }) / 100;
        $this->budget('B-03', 'hit database reads', $reads, 0);
        $this->budget('B-03', 'hit milliseconds', $hit, 5);
        $this->note('B-03', 'longest chain bytes', strlen($factory->bundles()->assemble($chain)['css']));
        $this->budget('B-03', 'longest chain bytes', strlen($factory->bundles()->assemble($chain)['css']), 400 * 1024);

        \cache::make('local_iconrestyle', 'compiled')->purge();
        service_factory::reset();
        $counting = new counting_compiler_factory();
        $sheets = $counting->sheets(service_factory::instance());
        $bundles = new bundle_service(service_factory::instance()->revisions(), $sheets);
        $miss = $this->ms(function () use ($bundles, $chain) {
            $bundles->assemble($chain);
        });
        for ($i = 0; $i < 100; $i++) {
            $bundles->assemble($chain);
        }
        $this->budget('B-03', 'miss compiles for 101 requests', $counting->compiles(), count($chain));
        $this->note('B-03', 'miss milliseconds for the whole chain', $miss);
        $this->budget('B-03', 'miss milliseconds for the whole chain', $miss, 2000);

        \cache::make('local_iconrestyle', 'compiled')->purge();
        $warm = $this->ms(function () {
            service_factory::instance()->delta_sheets()->warm_all();
        });
        $this->note('B-03', 'warm every stylesheet of the site, ms', $warm);
        $reads = $this->reads(function () use ($bundles, $chain) {
            for ($i = 0; $i < 100; $i++) {
                $bundles->assemble($chain);
            }
        });
        $this->budget('B-03', 'database reads after the warm-up', $reads, 0);
    }

    /**
     * B-04: compiling the most rules a stylesheet may hold is fast and stays inside the size cap.
     *
     * @param scale_dataset $data Dataset.
     */
    private function b04_compile(scale_dataset $data): void {
        $factory = service_factory::instance();
        $slots = $data->slots();
        $system = \context_system::instance()->id;
        foreach ([500, 2000] as $count) {
            $rules = [];
            for ($i = 0; $i < $count; $i++) {
                $rules[] = $data->rule($system, $slots[$i % count($slots)], $i + 1);
            }
            $css = '';
            $time = $this->ms(function () use ($factory, $rules, &$css) {
                $css = $factory->delta_sheets()->compile($rules);
            });
            $this->budget('B-04', $count . ' rules milliseconds', $time, $count === 500 ? 400 : 1600);
            $this->note('B-04', $count . ' rules bytes', strlen($css));
        }
        $worst = [];
        for ($i = 0; $i < 150; $i++) {
            $worst[] = $data->rule($system, $slots[$i % count($slots)], 4 * ($i + 1));
        }
        $this->budget('B-04', '150 rules bytes against the cap', strlen($factory->delta_sheets()->compile($worst)), 256 * 1024);
    }

    /**
     * B-05: the catalogue is built once per code version and then read from the cache.
     */
    private function b05_catalogue(): void {
        \cache::make('local_iconrestyle', 'catalogue')->purge();
        service_factory::reset();
        $cold = $this->ms(function () {
            $entries = service_factory::instance()->catalogue()->all();
            $this->note('B-05', 'icons in the catalogue', count($entries));
        });
        $warm = $this->ms(function () {
            service_factory::instance()->catalogue()->all();
        });
        $this->budget('B-05', 'cold build milliseconds', $cold, 3000);
        $this->budget('B-05', 'cached read milliseconds', $warm, 50);
    }

    /**
     * B-06: a package is imported one line at a time, so the memory it takes does not depend on how big it is.
     *
     * The package is a generator, never a list, and is written to the courses of the dataset. ICONRESTYLE_BENCH_IMPORT says
     * how many rules it has.
     *
     * @param scale_dataset $data Dataset.
     */
    private function b06_import(scale_dataset $data): void {
        set_config('maxcontextswithrules', 100000, 'local_iconrestyle');
        service_factory::reset();
        $total = scale_dataset::size('IMPORT', 3000);
        $slots = $data->slots();
        $courses = count($data->courses);
        $each = min(count($slots), max(1, (int)ceil($total / $courses)));
        $lines = (function () use ($total, $slots, $each): \Generator {
            yield json_encode(['type' => 'header', 'format' => 'local_iconrestyle', 'version' => 1]);
            for ($i = 0; $i < $total; $i++) {
                yield json_encode([
                    'type' => 'rule', 'place' => 'course:shortname=B' . intdiv($i, $each), 'slot' => $slots[$i % $each],
                    'painter' => 'color', 'asset' => null, 'fg' => sprintf('#%06x', ($i * 2654435761) & 0xffffff), 'bg' => null,
                    'design' => [], 'pages' => [], 'regions' => [], 'mode' => 'all', 'enabled' => true,
                ]);
            }
        })();
        gc_collect_cycles();
        $before = memory_get_usage();
        $peak = memory_get_peak_usage();
        $report = null;
        $time = $this->ms(function () use ($lines, &$report) {
            $report = service_factory::instance()->importer()->run($lines, 'merge', false, (int)get_admin()->id);
        });
        $growth = max(0, memory_get_peak_usage() - max($peak, $before)) / 1048576;
        $this->note('B-06', 'rules in the package', $total);
        $this->note('B-06', 'rules created', $report->get('created'));
        $this->note('B-06', 'seconds', $time / 1000);
        $this->note('B-06', 'rules per second', $total / max(0.001, $time / 1000));
        $this->budget('B-06', 'memory the import added to the peak, MB', $growth, 64);
        $this->budget('B-06', 'rules left out', $report->get('skipped'), 0);
    }

    /**
     * Every context keeps exactly one compiled stylesheet in the cache, however many times it was saved.
     */
    private function cache_entries(): void {
        $sheets = service_factory::instance()->delta_sheets();
        $sheets->warm_all();
        $kept = 0;
        $stale = 0;
        $active = service_factory::instance()->revisions()->active();
        foreach ($active as $contextid => $rev) {
            $kept += $sheets->is_cached($contextid, $rev) ? 1 : 0;
            for ($old = 1; $old < $rev; $old++) {
                $stale += $sheets->is_cached($contextid, $old) ? 1 : 0;
            }
        }
        $this->note('cache', 'contexts with rules', count($active));
        $this->budget('cache', 'stylesheets cached for them', count($active) - $kept, 0);
        $this->budget('cache', 'stale entries left behind', $stale, 0);
    }

    /**
     * B-08: what the plugin adds to a page, with and without rules, compared with it being off.
     *
     * @param \context $context Page context with the longest chain.
     */
    private function b08_disabled_and_enabled(\context $context): void {
        global $PAGE;
        $PAGE->set_url('/');
        $PAGE->set_context($context);
        set_config('enabled', 0, 'local_iconrestyle');
        $off = $this->ms(function () {
            for ($i = 0; $i < 300; $i++) {
                head_callbacks::inject();
            }
        }) * 1000 / 300;
        set_config('enabled', 1, 'local_iconrestyle');
        service_factory::reset();
        head_callbacks::inject();
        $on = $this->ms(function () {
            for ($i = 0; $i < 300; $i++) {
                head_callbacks::inject();
            }
        }) * 1000 / 300;
        $this->note('B-08', 'disabled microseconds per page', $off);
        $this->budget('B-08', 'enabled microseconds per page', $on, 1000);
        $this->budget('B-08', 'enabled over disabled, microseconds', $on - $off, 1000);
    }
}
