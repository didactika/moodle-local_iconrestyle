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

    /** @var design Design properties. */
    private $design;

    /** @var string Rule target. */
    private $target;

    /** @var bool Whether the rule is compiled. */
    private $enabled;

    /** @var int Optimistic lock counter. */
    private $rev;

    /** @var string[] Kinds of page the rule is limited to, empty for every page. */
    private $pages;

    /** @var string[] Regions of a page the rule is limited to, empty for every region. */
    private $regions;

    /** @var string Colour mode the rule is limited to: all, light or dark. */
    private $mode;

    /**
     * Create a rule from validated parts.
     *
     * @param int $id Rule id.
     * @param int $contextid Context id, which is where the rule applies: the site, a category, a course or an activity.
     * @param slot_key $slot Slot.
     * @param array $options Optional painter, assetid, fg, bg, design (or the flat shape, padding and opacity), target,
     *     enabled, rev, pages, regions and mode.
     * @throws \InvalidArgumentException When a value is outside its accepted range.
     */
    public function __construct(int $id, int $contextid, slot_key $slot, array $options = []) {
        $painter = (string)($options['painter'] ?? self::PAINTER_COLOR);
        if (!in_array($painter, self::PAINTERS, true)) {
            throw new \InvalidArgumentException('Unknown painter.');
        }
        $assetid = isset($options['assetid']) ? (int)$options['assetid'] : null;
        $needsasset = in_array($painter, [self::PAINTER_MASK, self::PAINTER_IMAGE], true);
        if ($needsasset !== ($assetid !== null)) {
            throw new \InvalidArgumentException('Artwork painters need an asset and other painters must not have one.');
        }
        $this->id = $id;
        $this->contextid = $contextid;
        $this->slot = $slot;
        $this->painter = $painter;
        $this->assetid = $assetid;
        $this->fg = $this->color_option($options['fg'] ?? null);
        $this->bg = $this->color_option($options['bg'] ?? null);
        $this->design = $this->design_option($options);
        $this->target = (string)($options['target'] ?? self::TARGET_ICON);
        $this->enabled = (bool)($options['enabled'] ?? true);
        $this->rev = (int)($options['rev'] ?? 1);
        $this->pages = audience::normalise((array)($options['pages'] ?? []), audience::PAGES);
        $this->regions = audience::normalise((array)($options['regions'] ?? []), audience::REGIONS);
        $this->mode = audience::check_mode((string)($options['mode'] ?? 'all'));
    }

    /**
     * Colour mode the rule is limited to.
     *
     * @return string all, light or dark.
     */
    public function mode(): string {
        return $this->mode;
    }

    /**
     * Kinds of page the rule is limited to.
     *
     * @return string[] Page tokens, empty for every page.
     */
    public function pages(): array {
        return $this->pages;
    }

    /**
     * Regions of a page the rule is limited to.
     *
     * @return string[] Region tokens, empty for every region.
     */
    public function regions(): array {
        return $this->regions;
    }

    /**
     * Identity of the rule's pages and regions, which tells apart the variants of one icon in one context.
     *
     * @return string audience::UNLIMITED for a rule that applies on every page and region.
     */
    public function variant(): string {
        return audience::variant($this->pages, $this->regions, $this->mode);
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
     * Design properties: shape, radius, padding, scale, rotation, border, shadow and opacity.
     *
     * @return design Design.
     */
    public function design(): design {
        return $this->design;
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
     * @return bool True when the background or any design property is set.
     */
    public function styles_container(): bool {
        return $this->bg !== null || !$this->design->is_empty();
    }

    /**
     * Build the design from the options.
     *
     * Accepts a design, its array or its JSON under design, and the flat shape, padding and opacity that rules were first
     * written with, where padding sets all four sides.
     *
     * @param array $options Rule options.
     * @return design Design.
     * @throws \InvalidArgumentException When a property is not accepted.
     */
    private function design_option(array $options): design {
        $given = $options['design'] ?? [];
        if ($given instanceof design) {
            return $given;
        }
        $values = is_string($given) ? design::from_json($given)->to_array() : (array)$given;
        foreach (['shape', 'opacity'] as $name) {
            if (isset($options[$name]) && $options[$name] !== '') {
                $values[$name] = $options[$name];
            }
        }
        if (isset($options['padding']) && $options['padding'] !== '') {
            $padding = $options['padding'];
            $values += ['pt' => $padding, 'pr' => $padding, 'pb' => $padding, 'pl' => $padding];
        }
        return design::from_array($values);
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
