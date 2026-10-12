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
 * Data for the designer page.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\output;

use local_iconrestyle\rule\audience;
use local_iconrestyle\rule\color;

/**
 * Prepares what the designer template and script need; the markup itself lives in templates.
 */
class designer_page implements \renderable, \templatable {
    /**
     * Data for the template.
     *
     * @param \renderer_base $output Renderer.
     * @return array Template context.
     */
    public function export_for_template(\renderer_base $output): array {
        $tokens = [];
        foreach (color::TOKENS as $token) {
            $tokens[] = ['value' => 'token:' . $token, 'label' => get_string('token_' . $token, 'local_iconrestyle')];
        }
        return [
            'config' => json_encode($this->script_config()),
            'pages' => $this->options('page', audience::PAGES),
            'regions' => $this->options('region', audience::REGIONS),
            'fgfield' => ['name' => 'fg', 'label' => get_string('foreground', 'local_iconrestyle'), 'tokens' => $tokens],
            'bgfield' => ['name' => 'bg', 'label' => get_string('background', 'local_iconrestyle'), 'tokens' => $tokens],
        ];
    }

    /**
     * Settings and text the script needs, which travel to it in a data attribute of the template.
     *
     * @return array Configuration for the AMD module.
     */
    public function script_config(): array {
        $names = [
            'stagedchanges', 'saved', 'saveerror', 'iconcount', 'originhere', 'originunsaved', 'origindefault',
            'sharedglyph', 'needsartwork', 'uploadfailed', 'contrastgood', 'contrastlow', 'nochanges',
            'artworkready', 'noartwork', 'themeinherits', 'wherechoose', 'wherechosen',
        ];
        $strings = [];
        foreach ($names as $name) {
            $strings[$name] = get_string($name, 'local_iconrestyle', '{n}');
        }
        $labels = ['everywhere' => get_string('everywhere', 'local_iconrestyle'), 'pages' => [], 'regions' => []];
        foreach (audience::PAGES as $page) {
            $labels['pages'][$page] = get_string('page_' . $page, 'local_iconrestyle');
        }
        foreach (audience::REGIONS as $region) {
            $labels['regions'][$region] = get_string('region_' . $region, 'local_iconrestyle');
        }
        $site = \context_system::instance();
        return [
            'everywhere' => [
                'contextid' => (int)$site->id,
                'contextname' => $site->get_context_name(false),
                'contextkind' => 'site',
                'pages' => [],
                'regions' => [],
            ],
            'labels' => $labels,
            'strings' => $strings,
        ];
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
