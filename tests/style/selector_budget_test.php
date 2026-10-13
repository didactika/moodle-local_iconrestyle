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
 * Tests for the size of the stylesheet of rules limited by page, region and colour mode.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\rule\audience;
use local_iconrestyle\rule\rule;
use local_iconrestyle\rule\rule_limits;
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(stylesheet_compiler::class)]
/**
 * Limiting a rule by page, region and mode must not multiply its selectors: the number of selectors is bounded however many
 * pages and regions the rule lists, so a site cannot make its stylesheet grow by combining them.
 *
 * @covers \local_iconrestyle\style\stylesheet_compiler
 * @covers \local_iconrestyle\style\scope_prefixes
 */
final class selector_budget_test extends \advanced_testcase {
    /**
     * Start from a fresh factory.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
    }

    /**
     * Keys of the icons of one kind.
     *
     * @param string $kind font or image.
     * @return string[] Slot keys, in a stable order.
     */
    private function slots(string $kind): array {
        $keys = [];
        foreach (service_factory::instance()->catalogue()->all() as $entry) {
            if ($entry['kind'] === $kind) {
                $keys[] = $entry['key'];
            }
        }
        sort($keys);
        return $keys;
    }

    /**
     * A rule limited to every page and region, in dark mode.
     *
     * @param string $key Slot key.
     * @param int $seed Number that makes the colour different.
     * @return rule Rule.
     */
    private function everything(string $key, int $seed = 1): rule {
        return new rule(0, \context_system::instance()->id, slot_key::parse($key), [
            'fg' => sprintf('#%06x', $seed * 4099 & 0xffffff),
            'design' => ['shape' => 'rounded', 'pt' => 20, 'pr' => 20, 'pb' => 20, 'pl' => 20, 'shadow' => 'soft'],
            'pages' => audience::PAGES,
            'regions' => audience::REGIONS,
            'mode' => 'dark',
        ]);
    }

    /**
     * Selectors written in a stylesheet.
     *
     * @param string $css CSS.
     * @return int Number of selectors, counting each one of a list.
     */
    private function selector_count(string $css): int {
        $count = 0;
        foreach (explode("}\n", $css) as $block) {
            $selectors = substr($block, 0, (int)strpos($block, '{'));
            $selectors = preg_replace('/:is\([^)]*\)/', ':is()', $selectors);
            $count += $selectors === '' ? 0 : substr_count($selectors, ',') + 1;
        }
        return $count;
    }

    /**
     * A font icon limited to every page and every region has four selectors per block, not sixty-three.
     */
    public function test_a_font_icon_does_not_multiply_its_selectors(): void {
        $css = service_factory::instance()->compiler()->compile([$this->everything($this->slots('font')[0])]);
        $blocks = substr_count($css, "}\n");
        $this->assertGreaterThan(0, $blocks);
        $this->assertSame(4 * $blocks, $this->selector_count($css));
        $this->assertLessThan(2500, strlen($css));
    }

    /**
     * An image icon, which needs three selectors to be found, has twelve.
     */
    public function test_an_image_icon_does_not_multiply_its_selectors(): void {
        $css = service_factory::instance()->compiler()->compile([$this->everything($this->slots('image')[0])]);
        $blocks = substr_count($css, "}\n");
        $this->assertSame(12 * $blocks, $this->selector_count($css));
        $this->assertLessThan(6000, strlen($css));
    }

    /**
     * A hundred and fifty rules, each one limited as much as a rule can be, fit inside the default size cap.
     */
    public function test_many_heavily_limited_rules_fit_inside_the_size_cap(): void {
        $slots = $this->slots('font');
        $rules = [];
        for ($i = 0; $i < 150; $i++) {
            $rules[] = $this->everything($slots[$i % count($slots)], $i + 1);
        }
        $css = service_factory::instance()->compiler()->compile($rules);
        $this->assertLessThan(rule_limits::DEFAULT_SHEET_KB * 1024, strlen($css));
    }

    /**
     * The stylesheet does not depend on the order the rules come in.
     */
    public function test_output_does_not_depend_on_the_order_of_the_rules(): void {
        $slots = $this->slots('font');
        $first = $this->everything($slots[0], 1);
        $second = $this->everything($slots[1], 2);
        $compiler = service_factory::instance()->compiler();
        $this->assertSame($compiler->compile([$first, $second]), $compiler->compile([$second, $first]));
    }
}
