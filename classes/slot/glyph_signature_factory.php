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
 * Derives glyph signatures from the live icon map.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\slot;

/**
 * Never hard-codes class names: every signature comes from the running core.
 */
class glyph_signature_factory {
    /** @var icon_map Source of the live map. */
    private $iconmap;

    /**
     * Create the factory.
     *
     * @param icon_map $iconmap Source of the live map.
     */
    public function __construct(icon_map $iconmap) {
        $this->iconmap = $iconmap;
    }

    /**
     * Signature of a slot.
     *
     * @param slot_key $slot Slot.
     * @return glyph_signature|null Signature, or null for slots without icon markup.
     */
    public function for_slot(slot_key $slot): ?glyph_signature {
        if ($slot->kind() === slot_key::KIND_PURPOSE) {
            return glyph_signature::from_purpose($slot->name());
        }
        if ($slot->kind() === slot_key::KIND_ACTIVITY) {
            return glyph_signature::from_activity_type($slot->name());
        }
        $mapped = $this->iconmap->all()[(string)$slot] ?? null;
        if ($mapped !== null) {
            $font = glyph_signature::from_font_classes($mapped);
            if ($font !== null) {
                return $font;
            }
        }
        return glyph_signature::from_image($slot->component(), $slot->name());
    }
}
