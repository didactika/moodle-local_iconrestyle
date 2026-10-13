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
 * What the icon designer needs to start: the settings and the text.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\output;

use core\output\react_component_renderable;
use local_iconrestyle\rule\audience;
use local_iconrestyle\rule\colour_modes;
use local_iconrestyle\rule\design;

/**
 * The designer is drawn by the React component local_iconrestyle/Designer, which gets everything it needs here.
 */
class designer_page implements react_component_renderable, \renderable {
    /**
     * The React component that draws the designer.
     *
     * @return string Name of the component inside the plugin.
     */
    #[\Override]
    public function get_react_component_name(): string {
        return 'local_iconrestyle/Designer';
    }

    /**
     * The settings and the text the component starts from.
     *
     * @param \renderer_base $renderer Renderer.
     * @return \stdClass Properties of the component.
     */
    #[\Override]
    public function get_react_component_props(\renderer_base $renderer): \stdClass {
        $site = \context_system::instance();
        $labels = ['everywhere' => get_string('everywhere', 'local_iconrestyle'), 'pages' => [], 'regions' => [], 'modes' => []];
        foreach (['light', 'dark'] as $mode) {
            $labels['modes'][$mode] = get_string('mode_' . $mode, 'local_iconrestyle');
        }
        foreach (audience::PAGES as $page) {
            $labels['pages'][$page] = get_string('page_' . $page, 'local_iconrestyle');
        }
        foreach (audience::REGIONS as $region) {
            $labels['regions'][$region] = get_string('region_' . $region, 'local_iconrestyle');
        }
        return (object)[
            'adminurl' => (new \moodle_url('/admin/search.php'))->out(false),
            'everywhere' => [
                'contextid' => (int)$site->id,
                'contextname' => $site->get_context_name(false),
                'contextkind' => 'site',
                'pages' => [],
                'regions' => [],
                'mode' => 'all',
            ],
            'labels' => $labels,
            'pages' => $this->options('page', audience::PAGES),
            'regions' => $this->options('region', audience::REGIONS),
            'colourmodes' => colour_modes::available(),
            'ranges' => design::RANGES,
            'defaults' => designer_defaults::all(),
            'specials' => ['bg' => [['value' => 'transparent', 'label' => get_string('nocolour', 'local_iconrestyle')]]],
            'strings' => $this->strings(),
        ];
    }

    /**
     * What holds the place of the designer until its component is there: the bar and the cards as grey blocks.
     *
     * Moodle writes an empty element and the script fills it in once it has loaded, which leaves the page blank for a moment. The
     * placeholder is written inside that element and is replaced when the component mounts.
     *
     * @return string The HTML.
     */
    public static function placeholder(): string {
        $bar = '<div class="irs-sk-bar">' .
            '<span class="irs-sk irs-sk-pill" style="width:5rem"></span>' .
            '<span class="irs-sk irs-sk-pill" style="width:14rem"></span>' .
            str_repeat('<span class="irs-sk irs-sk-pill" style="width:6rem"></span>', 2) . '</div>';
        $grid = '<div class="irs-sk-grid">' . str_repeat('<span class="irs-sk irs-sk-cell"></span>', 40) . '</div>';
        return '<div class="irs" aria-hidden="true"><div class="irs-layout"><section class="irs-browser">' . $bar . $grid .
            '</section></div></div><span class="sr-only visually-hidden" role="status">' .
            get_string('loading', 'local_iconrestyle') . '</span>';
    }

    /**
     * Every string of the plugin, in the language of the person, with the places of the values written the way the script fills.
     *
     * A value that stands alone is written {n} and the fields of an object {name}, so the script has one way to put them in.
     *
     * @return string[] Texts by name.
     */
    private function strings(): array {
        $strings = get_string_manager()->load_component_strings('local_iconrestyle', current_language());
        foreach ($strings as $name => $value) {
            $strings[$name] = preg_replace(['/\{\$a->([a-z]+)\}/', '/\{\$a\}/'], ['{$1}', '{n}'], $value);
        }
        return $strings;
    }

    /**
     * Checkbox options for a fixed list of tokens.
     *
     * @param string $prefix Prefix of the language strings, page or region.
     * @param string[] $tokens Tokens.
     * @return array Options with value and label.
     */
    private function options(string $prefix, array $tokens): array {
        return array_map(function (string $token) use ($prefix): array {
            return ['value' => $token, 'label' => get_string($prefix . '_' . $token, 'local_iconrestyle')];
        }, $tokens);
    }
}
