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

use local_iconrestyle\rule\color;

/**
 * Prepares what the designer template and script need; the markup itself lives in templates.
 */
class designer_page implements \renderable, \templatable {
    /** @var \context Context being edited. */
    private $context;

    /**
     * Create the page data.
     *
     * @param \context $context Context being edited.
     */
    public function __construct(\context $context) {
        $this->context = $context;
    }

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
            'contextid' => $this->context->id,
            'contextname' => $this->context->get_context_name(false),
            'fgfield' => ['name' => 'fg', 'label' => get_string('foreground', 'local_iconrestyle'), 'tokens' => $tokens],
            'bgfield' => ['name' => 'bg', 'label' => get_string('background', 'local_iconrestyle'), 'tokens' => $tokens],
        ];
    }

    /**
     * Settings and text the script needs that cannot live in the template.
     *
     * @return array Configuration for the AMD module.
     */
    public function script_config(): array {
        $names = [
            'stagedchanges', 'saved', 'saveerror', 'iconcount', 'originhere', 'origininherited', 'origindefault',
            'originreset', 'sharedglyph', 'needsartwork', 'uploadfailed', 'contrastgood', 'contrastlow', 'nochanges',
            'artworkready', 'noartwork', 'themeinherits',
        ];
        $strings = [];
        foreach ($names as $name) {
            $strings[$name] = get_string($name, 'local_iconrestyle', '{n}');
        }
        return ['contextid' => $this->context->id, 'strings' => $strings];
    }
}
