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
 * One customisation of one icon in one context.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

use local_iconrestyle\slot\slot_key;

/**
 * Immutable validated rule.
 */
final class rule {
    /** @var string Recolour a font glyph with the text colour. */
    public const PAINTER_COLOR = 'color';

    /** @var string Paint artwork through a mask so it can be recoloured. */
    public const PAINTER_MASK = 'mask';

    /** @var string Paint multicolour artwork as an image. */
    public const PAINTER_IMAGE = 'image';

    /** @var string No artwork change, only the container is styled. */
    public const PAINTER_NONE = 'none';

    /** @var string Rule for a single icon. */
    public const TARGET_ICON = 'icon';

    /** @var string[] Painters that are accepted. */
    private const PAINTERS = [self::PAINTER_COLOR, self::PAINTER_MASK, self::PAINTER_IMAGE, self::PAINTER_NONE];

    /** @var string[] Shapes that are accepted. */
    private const SHAPES = ['none', 'square', 'rounded', 'circle'];

    /** @var int Rule id, zero when not stored. */
    private $id;

    /** @var int Context the rule belongs to. */
    private $contextid;

    /** @var slot_key Slot the rule styles. */
    private $slot;

    /** @var string Artwork painter. */
    private $painter;

    /** @var int|null Artwork asset. */
    private $assetid;

    /** @var color|null Foreground. */
    private $fg;

    /** @var color|null Background. */
    private $bg;

    /** @var string|null Shape. */
    private $shape;

    /** @var int|null Padding in hundredths of an em. */
    private $padding;

    /** @var int|null Opacity percentage. */
    private $opacity;

    /** @var string Rule target. */
    private $target;

    /** @var bool Whether the rule is compiled. */
    private $enabled;

    /** @var int Optimistic lock counter. */
    private $rev;

    /**
     * Create a rule from validated parts.
     *
     * @param int $id Rule id.
     * @param int $contextid Context id.
     * @param slot_key $slot Slot.
     * @param array $options Optional painter, assetid, fg, bg, shape, padding, opacity, target, enabled and rev.
     * @throws \InvalidArgumentException When a value is outside its accepted range.
     */
    public function __construct(int $id, int $contextid, slot_key $slot, array $options = []) {
        $painter = (string)($options['painter'] ?? self::PAINTER_COLOR);
        if (!in_array($painter, self::PAINTERS, true)) {
            throw new \InvalidArgumentException('Unknown painter.');
        }
        $shape = $options['shape'] ?? null;
        if ($shape !== null && !in_array($shape, self::SHAPES, true)) {
            throw new \InvalidArgumentException('Unknown shape.');
        }
        $padding = isset($options['padding']) ? (int)$options['padding'] : null;
        if ($padding !== null && ($padding < 0 || $padding > 300)) {
            throw new \InvalidArgumentException('Padding out of range.');
        }
        $opacity = isset($options['opacity']) ? (int)$options['opacity'] : null;
        if ($opacity !== null && ($opacity < 0 || $opacity > 100)) {
            throw new \InvalidArgumentException('Opacity out of range.');
        }
        $this->id = $id;
        $this->contextid = $contextid;
        $this->slot = $slot;
        $this->painter = $painter;
        $this->assetid = isset($options['assetid']) ? (int)$options['assetid'] : null;
        $this->fg = $this->color_option($options['fg'] ?? null);
        $this->bg = $this->color_option($options['bg'] ?? null);
        $this->shape = $shape;
        $this->padding = $padding;
        $this->opacity = $opacity;
        $this->target = (string)($options['target'] ?? self::TARGET_ICON);
        $this->enabled = (bool)($options['enabled'] ?? true);
        $this->rev = (int)($options['rev'] ?? 1);
    }

    /**
     * Rule id.
     *
     * @return int Id.
     */
    public function id(): int {
        return $this->id;
    }

    /**
     * Context id.
     *
     * @return int Context id.
     */
    public function contextid(): int {
        return $this->contextid;
    }

    /**
     * Slot.
     *
     * @return slot_key Slot.
     */
    public function slot(): slot_key {
        return $this->slot;
    }

    /**
     * Artwork painter.
     *
     * @return string Painter.
     */
    public function painter(): string {
        return $this->painter;
    }

    /**
     * Artwork asset.
     *
     * @return int|null Asset id.
     */
    public function assetid(): ?int {
        return $this->assetid;
    }

    /**
     * Foreground.
     *
     * @return color|null Foreground colour.
     */
    public function fg(): ?color {
        return $this->fg;
    }

    /**
     * Background.
     *
     * @return color|null Background colour.
     */
    public function bg(): ?color {
        return $this->bg;
    }

    /**
     * Shape.
     *
     * @return string|null Shape.
     */
    public function shape(): ?string {
        return $this->shape;
    }

    /**
     * Padding.
     *
     * @return int|null Hundredths of an em.
     */
    public function padding(): ?int {
        return $this->padding;
    }

    /**
     * Opacity.
     *
     * @return int|null Percentage.
     */
    public function opacity(): ?int {
        return $this->opacity;
    }

    /**
     * Target.
     *
     * @return string Target.
     */
    public function target(): string {
        return $this->target;
    }

    /**
     * Whether the rule is compiled.
     *
     * @return bool True when enabled.
     */
    public function enabled(): bool {
        return $this->enabled;
    }

    /**
     * Optimistic lock counter.
     *
     * @return int Revision.
     */
    public function rev(): int {
        return $this->rev;
    }

    /**
     * Whether any container property is set.
     *
     * @return bool True when background, shape, padding or opacity is styled.
     */
    public function styles_container(): bool {
        return $this->bg !== null || $this->shape !== null || $this->padding !== null || $this->opacity !== null;
    }

    /**
     * Convert an optional colour option.
     *
     * @param string|color|null $value Raw or typed colour.
     * @return color|null Colour.
     */
    private function color_option($value): ?color {
        if ($value === null || $value === '') {
            return null;
        }
        return $value instanceof color ? $value : color::parse((string)$value);
    }
}
