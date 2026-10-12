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
 * What the designer page shows.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\output;

use local_iconrestyle\rule\audience;
use local_iconrestyle\rule\colour_modes;
use local_iconrestyle\rule\design;

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
        return [
            'config' => json_encode($this->script_config()),
            'adminurl' => (new \moodle_url('/admin/search.php'))->out(false),
            'fgfield' => $this->colour('fg', 'foreground'),
            'bgfield' => $this->colour('bg', 'background'),
            'bcfield' => $this->colour('bc', 'bordercolour'),
            'scfield' => $this->colour('sc', 'shadowcolour'),
            'bg2field' => $this->colour('bg2', 'gradientcolour'),
            'ocfield' => $this->colour('oc', 'outlinecolour'),
            'gradientangle' => $this->slider('gd', 'gradientangle', 5, 135),
            'outlinewidth' => $this->slider('ow', 'outlinewidth', 1, 0),
            'outlineoffset' => $this->slider('oo', 'outlineoffset', 1, 0),
            'skewx' => $this->slider('skx', 'skewx', 1, 0),
            'skewy' => $this->slider('sky', 'skewy', 1, 0),
            'sepia' => $this->slider('sepia', 'sepia', 5, 0),
            'invert' => $this->slider('invert', 'invert', 5, 0),
            'padding' => $this->sides('padding', 'padding', 'resetpadding', 'p', 0),
            'margin' => $this->sides('margin', 'margin', 'resetmargin', 'm', -1),
            'radius' => $this->slider('radius', 'radius', 1, 0),
            'borderwidth' => $this->slider('bw', 'borderwidth', 1, 0),
            'scale' => $this->slider('scale', 'scale', 5, 100),
            'rotate' => $this->slider('rotate', 'rotation', 5, 0),
            'opacity' => $this->slider('opacity', 'opacity', 5, 100),
            'brightness' => $this->slider('brightness', 'brightness', 5, 100),
            'contrast' => $this->slider('contrast', 'contrast', 5, 100),
            'saturate' => $this->slider('saturate', 'saturation', 5, 100),
            'grayscale' => $this->slider('grayscale', 'grayscale', 5, 0),
            'hue' => $this->slider('hue', 'hue', 5, 0),
            'blur' => $this->slider('blur', 'blur', 1, 0),
        ];
    }

    /**
     * Settings and text the script needs, which travel to it in a data attribute of the template.
     *
     * @return array Configuration for the AMD module.
     */
    public function script_config(): array {
        $names = [
            'statussaved', 'statussaving', 'statusdirty', 'statuserror', 'savefailed', 'iconcount', 'originhere',
            'origindefault', 'sharedglyph', 'uploadfailed', 'contrastgood', 'contrastlow', 'artworkready', 'noartwork',
            'themeinherits', 'wherechoose', 'addplacestitle', 'addplacesconfirm', 'placesplaceholder', 'placesnone',
            'propdefault', 'iconcolour', 'boxcolour', 'foreground', 'artworkfailed', 'exchangefailed',
            'currentmode', 'currentmodeauto', 'copytoothermode', 'copytoothermodes', 'copied', 'exportskipped', 'importtitle',
            'importconfirm', 'importtoobig', 'savetimeout',
            'selectmodestitle', 'filtclear', 'filtmore', 'filttraituntouched', 'filttraitcolour',
            'filttraitshape', 'filttraitspacing', 'filttraittransform', 'filttraiteffects', 'filttraitartwork', 'filttraitlimited',
            'filtplacesite', 'filtplacecategory', 'filtplacecourse', 'filtplaceactivity',
            'copylookdone', 'copygroupcolours', 'copygroupshape', 'copygroupspacing', 'copygrouptransform', 'copygroupeffects',
            'copygroupicon', 'exportdone', 'exportdoneall', 'importmergehelp', 'importreplacehelp', 'importreplacechosenhelp',
            'importempty', 'importmore', 'importnothing', 'selectcount', 'selectcopy', 'selectcopytitle', 'selectexport',
            'selectexporttitle',
        ];
        $strings = [];
        foreach ($names as $name) {
            $strings[$name] = get_string($name, 'local_iconrestyle', '{n}');
        }
        $strings['importdone'] = get_string('importdone', 'local_iconrestyle', (object)[
            'created' => '{created}', 'updated' => '{updated}', 'deleted' => '{deleted}', 'skipped' => '{skipped}',
        ]);
        $strings['copymodesdone'] = get_string('copymodesdone', 'local_iconrestyle', (object)[
            'copied' => '{copied}', 'skipped' => '{skipped}', 'from' => '{from}', 'to' => '{to}',
        ]);
        $strings['importsummary'] = get_string('importsummary', 'local_iconrestyle', (object)[
            'icons' => '{icons}', 'rules' => '{rules}', 'assets' => '{assets}',
        ]);
        $strings['importchosen'] = get_string('importchosen', 'local_iconrestyle', (object)[
            'chosen' => '{chosen}', 'total' => '{total}',
        ]);
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
        $site = \context_system::instance();
        return [
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
            'strings' => $strings,
        ];
    }

    /**
     * One colour control.
     *
     * @param string $name Property name.
     * @param string $label Language string of the label.
     * @return array Template context.
     */
    private function colour(string $name, string $label): array {
        return ['name' => $name, 'label' => get_string($label, 'local_iconrestyle')];
    }

    /**
     * One property with a value for each side.
     *
     * @param string $group Name of the group, padding or margin.
     * @param string $label Language string of the label.
     * @param string $reset Language string of the button that clears the four sides.
     * @param string $first First letter of the properties of the four sides.
     * @param int $min Smallest value, in hundredths of a unit.
     * @return array Template context.
     */
    private function sides(string $group, string $label, string $reset, string $first, int $min): array {
        $sides = [];
        foreach (['t' => 'padtop', 'r' => 'padright', 'b' => 'padbottom', 'l' => 'padleft'] as $letter => $string) {
            $sides[] = ['prop' => $first . $letter, 'label' => get_string($string, 'local_iconrestyle'), 'min' => $min, 'max' => 3];
        }
        return [
            'group' => $group,
            'label' => get_string($label, 'local_iconrestyle'),
            'reset' => get_string($reset, 'local_iconrestyle'),
            'link' => get_string('padlink', 'local_iconrestyle'),
            'sides' => $sides,
        ];
    }

    /**
     * One slider, with the range the design accepts for its property.
     *
     * @param string $prop Design property.
     * @param string $label Language string of the label.
     * @param int $step Step.
     * @param int $default Value the slider rests at while the property is not set.
     * @return array Template context.
     */
    private function slider(string $prop, string $label, int $step, int $default): array {
        [$min, $max] = design::RANGES[$prop];
        return [
            'prop' => $prop,
            'label' => get_string($label, 'local_iconrestyle'),
            'min' => $min,
            'max' => $max,
            'step' => $step,
            'default' => $default,
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
