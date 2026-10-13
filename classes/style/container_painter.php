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
 * Paints the background, shape, spacing, border, shadow, transform and opacity of an icon element.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\rule\design;
use local_iconrestyle\rule\rule;
use local_iconrestyle\slot\glyph_signature;

/**
 * Applies the design of a rule to the icon element, or to the box around an activity icon.
 *
 * Scale is a zoom: unlike a transform it changes the room the icon takes, so a large icon pushes its neighbours aside instead of
 * covering them.
 *
 * The glyph inside an activity box is an image that Moodle turns white with a filter. Its colour is set by moving the
 * image out of the box and bringing back its shadow, which takes any colour exactly, and the box clips the original.
 * Both declarations are important: Moodle 5 recolours the glyph with a selector that is more specific than any prefix this
 * plugin can add, and a glyph that is moved without its shadow disappears.
 */
final class container_painter implements painter {
    /** @var int Distance in pixels the glyph is moved out of its box while its shadow stays in place. */
    private const GLYPH_OFFSET = 1000;

    /** @var string[] Border radius of each shape. */
    private const RADIUS = ['none' => '0', 'square' => '0', 'rounded' => '0.375em', 'circle' => '50%', 'pill' => '999px'];

    /** @var string[][] Shadow of each preset, with the colour it has when the rule gives none. */
    private const SHADOWS = [
        'soft' => ['0 1px 3px', 'rgba(0, 0, 0, 0.25)'],
        'medium' => ['0 4px 10px', 'rgba(0, 0, 0, 0.28)'],
        'strong' => ['0 8px 22px', 'rgba(0, 0, 0, 0.35)'],
        'glow' => ['0 0 10px 2px', 'currentColor'],
        'inner' => ['inset 0 2px 6px', 'rgba(0, 0, 0, 0.35)'],
        'lifted' => ['0 12px 24px -8px', 'rgba(0, 0, 0, 0.4)'],
        'hard' => ['3px 3px 0', 'rgba(0, 0, 0, 0.45)'],
    ];

    /** @var string[][] Shadow that follows the shape of the icon, with the colour it has when the rule gives none. */
    private const DROP_SHADOWS = [
        'soft' => ['0 1px 2px', 'rgba(0, 0, 0, 0.35)'],
        'medium' => ['0 3px 5px', 'rgba(0, 0, 0, 0.4)'],
        'strong' => ['0 6px 10px', 'rgba(0, 0, 0, 0.45)'],
        'glow' => ['0 0 6px', 'currentColor'],
    ];

    /** @var string[] What the icon adds to its own transform when the pointer is over it. */
    private const HOVER = [
        'grow' => 'scale(1.15)',
        'shrink' => 'scale(0.9)',
        'lift' => 'translateY(-3px)',
        'tilt' => 'rotate(12deg)',
    ];

    /**
     * Declarations for a rule on a signature.
     *
     * @param rule $rule Rule to paint.
     * @param glyph_signature $signature Markup signature of the slot.
     * @return array Declarations keyed by selector suffix.
     */
    public function paint(rule $rule, glyph_signature $signature): array {
        $declarations = [];
        $design = $rule->design();
        if ($rule->bg() !== null) {
            $declarations['background-color'] = $rule->bg()->css();
        }
        $radius = $this->radius($design);
        if ($radius !== null) {
            $declarations['border-radius'] = $radius;
        }
        $gradient = $this->gradient($rule);
        if ($gradient !== null) {
            $declarations['background-image'] = $gradient;
        }
        $declarations += $this->padding($design);
        $declarations += $this->margin($design);
        $declarations += $this->border($design);
        $declarations += $this->outline($design);
        $shadow = $this->shadow($design);
        if ($shadow !== null) {
            $declarations['box-shadow'] = $shadow;
        }
        if ($design->get('scale') !== null) {
            $declarations['zoom'] = number_format($design->get('scale') / 100, 2, '.', '');
        }
        $transform = $this->transform($design);
        if ($transform !== null) {
            $declarations['transform'] = $transform;
        }
        $filter = $this->filter($design);
        if ($filter !== null) {
            $declarations['filter'] = $filter;
        }
        if ($design->get('opacity') !== null) {
            $declarations['opacity'] = number_format($design->get('opacity') / 100, 2, '.', '');
        }
        if ($design->get('blend') !== null && $design->get('blend') !== 'normal') {
            $declarations['mix-blend-mode'] = $design->get('blend');
        }
        $blocks = [];
        $hover = $this->hover($design);
        if ($hover !== []) {
            $declarations['transition'] = 'transform 0.2s ease, opacity 0.2s ease';
            $blocks[':hover'] = $hover;
        }
        $ownicon = $rule->assetid() !== null;
        $glyph = $signature->kind() === glyph_signature::KIND_CONTAINER && !$ownicon ? glyph_colour::of($rule) : null;
        if ($glyph !== null) {
            $declarations['overflow'] = 'hidden';
            $offset = self::GLYPH_OFFSET . 'px';
            $blocks[' .activityicon:not(.nofilter)'] = [
                'transform' => 'translateX(-' . $offset . ') !important',
                'filter' => 'drop-shadow(' . $offset . ' 0 0 ' . $glyph->css() . ') !important',
            ];
        }
        return ($declarations === [] ? [] : ['' => $declarations]) + $blocks;
    }

    /**
     * The gradient from the background colour, or from nothing, to a second colour.
     *
     * @param rule $rule Rule.
     * @return string|null CSS value, or null when there is no second colour.
     */
    private function gradient(rule $rule): ?string {
        $design = $rule->design();
        $end = $design->get('bg2');
        if ($end === null) {
            return null;
        }
        $start = $rule->bg() === null ? 'transparent' : $rule->bg()->css();
        return 'linear-gradient(' . ($design->get('gd') ?? 135) . 'deg, ' . $start . ', ' . $end->css() . ')';
    }

    /**
     * Outline, which is drawn outside the border and does not take room.
     *
     * @param design $design Design.
     * @return array Declarations.
     */
    private function outline(design $design): array {
        if (!$design->has_any(['ow', 'oc', 'oo'])) {
            return [];
        }
        $width = $design->get('ow') ?? 2;
        if ($width === 0) {
            return ['outline' => '0'];
        }
        $colour = $design->get('oc');
        $declarations = ['outline' => $width . 'px solid ' . ($colour === null ? 'currentColor' : $colour->css())];
        if ($design->get('oo') !== null) {
            $declarations['outline-offset'] = $design->get('oo') . 'px';
        }
        return $declarations;
    }

    /**
     * What the icon does when the pointer is over it.
     *
     * @param design $design Design.
     * @return array Declarations of the hovered icon, none when there is no effect.
     */
    private function hover(design $design): array {
        $name = $design->get('hover');
        if ($name === null || $name === 'none') {
            return [];
        }
        if ($name === 'fade') {
            return ['opacity' => '0.6'];
        }
        $parts = $this->transform_parts($design);
        $parts[] = self::HOVER[$name];
        return ['transform' => implode(' ', $parts)];
    }

    /**
     * Corner radius.
     *
     * @param design $design Design.
     * @return string|null CSS value, or null when neither a shape nor a radius is set.
     */
    private function radius(design $design): ?string {
        if ($design->get('radius') !== null) {
            return $design->get('radius') . 'px';
        }
        return $design->get('shape') === null ? null : self::RADIUS[$design->get('shape')];
    }

    /**
     * Padding on each side.
     *
     * @param design $design Design.
     * @return array Declarations.
     */
    private function padding(design $design): array {
        if (!$design->has_padding()) {
            return [];
        }
        return ['box-sizing' => 'content-box'] + $this->sides($design, 'padding', ['pt', 'pr', 'pb', 'pl']);
    }

    /**
     * Margin on each side.
     *
     * @param design $design Design.
     * @return array Declarations.
     */
    private function margin(design $design): array {
        return $design->has_margin() ? $this->sides($design, 'margin', ['mt', 'mr', 'mb', 'ml']) : [];
    }

    /**
     * The four sides of a box property: the shorthand when all are set to one value, one longhand per side set otherwise.
     *
     * @param design $design Design.
     * @param string $property padding or margin.
     * @param string[] $names Design properties for top, right, bottom and left.
     * @return array Declarations.
     */
    private function sides(design $design, string $property, array $names): array {
        $values = array_combine(['top', 'right', 'bottom', 'left'], array_map([$design, 'get'], $names));
        if (!in_array(null, $values, true) && count(array_unique($values)) === 1) {
            return [$property => $this->em($values['top'])];
        }
        $declarations = [];
        foreach ($values as $side => $value) {
            if ($value !== null) {
                $declarations[$property . '-' . $side] = $this->em($value);
            }
        }
        return $declarations;
    }

    /**
     * Border.
     *
     * @param design $design Design.
     * @return array Declarations.
     */
    private function border(design $design): array {
        if ($design->get('bw') === null && $design->get('bs') === null && $design->get('bc') === null) {
            return [];
        }
        $width = $design->get('bw') ?? 1;
        if ($width === 0) {
            return ['border' => '0'];
        }
        $colour = $design->get('bc');
        $style = $design->get('bs') ?? 'solid';
        return ['border' => $width . 'px ' . $style . ' ' . ($colour === null ? 'currentColor' : $colour->css())];
    }

    /**
     * Shadow.
     *
     * @param design $design Design.
     * @return string|null CSS value, or null when no shadow is set.
     */
    private function shadow(design $design): ?string {
        $name = $design->get('shadow');
        if ($name === null) {
            return null;
        }
        if ($name === 'none') {
            return 'none';
        }
        [$geometry, $fallback] = self::SHADOWS[$name];
        $colour = $design->get('sc');
        return $geometry . ' ' . ($colour === null ? $fallback : $colour->css());
    }

    /**
     * Rotation and flips, which do not change the room the icon takes. Scale does, so it is a zoom and not a transform.
     *
     * @param design $design Design.
     * @return string|null CSS value, or null when none is set.
     */
    private function transform(design $design): ?string {
        $parts = $this->transform_parts($design);
        return $parts === [] ? null : implode(' ', $parts);
    }

    /**
     * The functions of the transform of a design.
     *
     * @param design $design Design.
     * @return string[] Transform functions, none when the design does not move the icon.
     */
    private function transform_parts(design $design): array {
        $parts = [];
        if ($design->get('rotate') !== null) {
            $parts[] = 'rotate(' . $design->get('rotate') . 'deg)';
        }
        if ($design->get('skx') !== null) {
            $parts[] = 'skewX(' . $design->get('skx') . 'deg)';
        }
        if ($design->get('sky') !== null) {
            $parts[] = 'skewY(' . $design->get('sky') . 'deg)';
        }
        if ($design->get('flipx') === 1) {
            $parts[] = 'scaleX(-1)';
        }
        if ($design->get('flipy') === 1) {
            $parts[] = 'scaleY(-1)';
        }
        return $parts;
    }

    /**
     * Colour filters and blur.
     *
     * @param design $design Design.
     * @return string|null CSS value, or null when none is set.
     */
    private function filter(design $design): ?string {
        $parts = [];
        foreach (['brightness', 'contrast', 'saturate', 'grayscale', 'sepia', 'invert'] as $name) {
            if ($design->get($name) !== null) {
                $parts[] = $name . '(' . number_format($design->get($name) / 100, 2, '.', '') . ')';
            }
        }
        if ($design->get('hue') !== null) {
            $parts[] = 'hue-rotate(' . $design->get('hue') . 'deg)';
        }
        if ($design->get('blur') !== null) {
            $parts[] = 'blur(' . $design->get('blur') . 'px)';
        }
        $drop = $design->get('ds');
        if ($drop !== null && $drop !== 'none') {
            [$geometry, $fallback] = self::DROP_SHADOWS[$drop];
            $colour = $design->get('sc');
            $parts[] = 'drop-shadow(' . $geometry . ' ' . ($colour === null ? $fallback : $colour->css()) . ')';
        }
        return $parts === [] ? null : implode(' ', $parts);
    }

    /**
     * Hundredths of an em as a length.
     *
     * @param int $hundredths Value in hundredths of an em.
     * @return string Length.
     */
    private function em(int $hundredths): string {
        return number_format($hundredths / 100, 2, '.', '') . 'em';
    }
}
