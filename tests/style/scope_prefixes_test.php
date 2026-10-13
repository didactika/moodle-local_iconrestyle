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
 * Tests for the selector prefixes of rules limited to pages and regions.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\rule\audience;
use local_iconrestyle\rule\rule;
use local_iconrestyle\slot\slot_key;

#[\PHPUnit\Framework\Attributes\CoversClass(scope_prefixes::class)]
/**
 * Pages and regions only ever come from fixed lists, and limiting a rule makes its selectors more specific.
 *
 * @covers \local_iconrestyle\style\scope_prefixes
 * @covers \local_iconrestyle\rule\audience
 */
final class scope_prefixes_test extends \basic_testcase {
    /**
     * Build a rule limited to pages and regions.
     *
     * @param array $options Options such as pages and regions.
     * @return rule Rule.
     */
    private function rule(array $options): rule {
        return new rule(0, 1, slot_key::parse('core:a/setting'), ['fg' => '#111111'] + $options);
    }

    /**
     * A rule that applies everywhere keeps the plain body prefix.
     */
    public function test_everywhere(): void {
        $this->assertSame(['body '], (new scope_prefixes())->for_rule($this->rule([]), 'body ', true));
    }

    /**
     * Pages are alternatives, regions are alternatives, and the two limits combine, each written once as a list, ids first.
     */
    public function test_pages_and_regions_combine(): void {
        $prefixes = (new scope_prefixes())->for_rule($this->rule([
            'pages' => ['admin', 'course'], 'regions' => ['navbar', 'footer'],
        ]), 'body ', true);
        $this->assertSame([
            'body:is(.path-admin, .path-course-view) #page-footer ',
            'body:is(.path-admin, .path-course-view) .navbar ',
        ], $prefixes);
    }

    /**
     * A list never joins an id with a class, because the list would take the specificity of the id for both.
     */
    public function test_ids_and_classes_are_listed_apart(): void {
        $prefixes = (new scope_prefixes())->for_rule($this->rule([
            'pages' => ['dashboard', 'sitehome', 'course'], 'regions' => ['blocks'],
        ]), 'body ', true);
        $this->assertSame([
            'body:is(#page-my-index, #page-site-index) .block-region ',
            'body.path-course-view .block-region ',
        ], $prefixes);
    }

    /**
     * However many pages and regions a rule has, it needs at most four prefixes.
     */
    public function test_a_rule_limited_to_everything_needs_four_prefixes(): void {
        $prefixes = (new scope_prefixes())->for_rule(
            $this->rule(['pages' => audience::PAGES, 'regions' => audience::REGIONS, 'mode' => 'dark']),
            'body ',
            true
        );
        $this->assertCount(4, $prefixes);
        foreach ($prefixes as $prefix) {
            $this->assertStringStartsWith('html[data-bs-theme="dark"] body:is(', $prefix);
        }
    }

    /**
     * The preview ignores the limits, because its cells are not on any page.
     */
    public function test_unscoped_keeps_the_prefix_it_is_given(): void {
        $rule = $this->rule(['pages' => ['admin'], 'regions' => ['navbar']]);
        $this->assertSame(['.irs-preview-new '], (new scope_prefixes())->for_rule($rule, '.irs-preview-new ', false));
    }

    /**
     * A page or region outside the fixed lists is refused, so no selector can come from input.
     */
    public function test_unknown_pages_and_regions_are_refused(): void {
        foreach ([['pages' => ['body > *']], ['regions' => ['.x']]] as $options) {
            try {
                $this->rule($options);
                $this->fail('Accepted ' . json_encode($options));
            } catch (\InvalidArgumentException $exception) {
                $this->assertInstanceOf(\InvalidArgumentException::class, $exception);
            }
        }
    }

    /**
     * Order and repeats do not matter, and the variant tells combinations apart.
     */
    public function test_variant_identity(): void {
        $first = $this->rule(['pages' => ['course', 'admin', 'admin']]);
        $second = $this->rule(['pages' => ['admin', 'course']]);
        $this->assertSame(['course', 'admin'], $first->pages());
        $this->assertSame($first->variant(), $second->variant());
        $this->assertNotSame($first->variant(), $this->rule(['pages' => ['admin']])->variant());
        $this->assertNotSame($first->variant(), $this->rule(['regions' => ['navbar']])->variant());
        $this->assertSame(audience::UNLIMITED, $this->rule([])->variant());
        $this->assertSame(audience::PAGES, array_keys(array_flip(audience::PAGES)));
    }

    /**
     * A rule for one colour mode starts at the html element, where Boost writes the mode, and still combines with pages.
     */
    public function test_colour_mode(): void {
        $builder = new scope_prefixes();
        $this->assertSame(['html[data-bs-theme="dark"] body '], $builder->for_rule($this->rule(['mode' => 'dark']), 'body ', true));
        $this->assertSame(
            ['html:not([data-bs-theme]:not([data-bs-theme="light"])) body.path-admin '],
            $builder->for_rule($this->rule(['mode' => 'light', 'pages' => ['admin']]), 'body ', true)
        );
        $this->assertSame(['body '], $builder->for_rule($this->rule(['mode' => 'all']), 'body ', true));
        $this->assertSame(['.irs-preview-new '], $builder->for_rule($this->rule(['mode' => 'dark']), '.irs-preview-new ', false));
    }

    /**
     * The colour mode is part of the identity of a variant, and anything but the three modes is refused.
     */
    public function test_colour_mode_identity_and_validation(): void {
        $this->assertSame(audience::UNLIMITED, $this->rule([])->variant());
        $this->assertNotSame(audience::UNLIMITED, $this->rule(['mode' => 'dark'])->variant());
        $this->assertNotSame($this->rule(['mode' => 'dark'])->variant(), $this->rule(['mode' => 'light'])->variant());
        $this->assertSame('dark', $this->rule(['mode' => 'dark'])->mode());
        $this->expectException(\InvalidArgumentException::class);
        $this->rule(['mode' => 'sepia']);
    }
}
