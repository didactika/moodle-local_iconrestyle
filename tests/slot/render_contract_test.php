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
 * Checks signatures against the markup the running core really renders.
 *
 * This is the guard against core changing its icon map or markup between releases.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\slot;

#[\PHPUnit\Framework\Attributes\CoversClass(glyph_signature_factory::class)]
/**
 * Checks signatures against the markup the running core really renders.
 *
 * @covers \local_iconrestyle\slot\glyph_signature_factory
 * @covers \local_iconrestyle\slot\glyph_signature
 */
final class render_contract_test extends \advanced_testcase {
    /**
     * Every mapped icon renders an element its signature matches.
     */
    public function test_every_mapped_icon_matches_its_rendered_markup(): void {
        global $OUTPUT, $PAGE;
        $this->resetAfterTest();
        $PAGE->set_url('/');
        $factory = new glyph_signature_factory(new icon_map());
        $checked = 0;
        $failures = [];
        foreach (array_keys((new icon_map())->all()) as $key) {
            $this->assertTrue(slot_key::is_valid($key), "Map key {$key} is outside the slot grammar");
            $slot = slot_key::parse($key);
            $signature = $factory->for_slot($slot);
            if ($signature === null || $signature->kind() !== glyph_signature::KIND_FONT) {
                continue;
            }
            $component = $slot->component() === 'core' ? 'moodle' : $slot->component();
            $html = $OUTPUT->pix_icon($slot->name(), 'Example', $component);
            if (!preg_match('/<i\s[^>]*class="([^"]*)"/', $html, $matches)) {
                continue;
            }
            $checked++;
            if (!$signature->matches(preg_split('/\s+/', trim($matches[1])))) {
                $failures[] = $key . ' => ' . $matches[1];
            }
        }
        $this->assertGreaterThan(100, $checked, 'Too few font icons were checked');
        $this->assertSame([], $failures, 'Signatures that do not match the rendered markup');
    }

    /**
     * Image icons are matched by the real image URL in both URL forms.
     */
    public function test_image_selectors_match_real_urls(): void {
        global $CFG, $OUTPUT;
        $this->resetAfterTest();
        $signature = glyph_signature::from_image('core', 'i/groupn');
        foreach ([1, 0] as $slasharguments) {
            $CFG->slasharguments = $slasharguments;
            $url = $OUTPUT->image_url('i/groupn', 'core')->out(false);
            $matched = array_filter($signature->selectors(''), function (string $selector) use ($url): bool {
                return self::attributes_match($selector, $url);
            });
            $this->assertNotEmpty($matched, "No selector matches {$url}");
        }
    }

    /**
     * Evaluate the attribute conditions of an img selector against a URL.
     *
     * @param string $selector Selector made of [src*=""] and [src$=""] conditions.
     * @param string $url Image URL.
     * @return bool True when every condition holds.
     */
    private static function attributes_match(string $selector, string $url): bool {
        preg_match_all('/\[src(\*|\$)="((?:[^"\\\\]|\\\\.)*)"\]/', $selector, $conditions, PREG_SET_ORDER);
        if ($conditions === []) {
            return false;
        }
        foreach ($conditions as $condition) {
            $value = stripcslashes($condition[2]);
            if ($condition[1] === '*' && strpos($url, $value) === false) {
                return false;
            }
            if ($condition[1] === '$' && substr($url, -strlen($value)) !== $value) {
                return false;
            }
        }
        return true;
    }
}
