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
 * Validated address of an editable icon.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\slot;

/**
 * A slot key has the form component:name, for example core:a/setting.
 */
final class slot_key {
    /** @var string Slot that is an icon rendered by the icon system. */
    public const KIND_ICON = 'icon';

    /** @var string Synthetic slot for an activity type. */
    public const KIND_ACTIVITY = 'activity';

    /** @var string Synthetic slot for an activity purpose. */
    public const KIND_PURPOSE = 'purpose';

    /** @var string Accepted grammar. */
    private const PATTERN = '/^(core|theme|activity|purpose|[a-z][a-z0-9]*_[a-z0-9_]+):([A-Za-z0-9_.\/-]{1,200})$/';

    /** @var string Component part. */
    private $component;

    /** @var string Name part. */
    private $name;

    /**
     * Create a validated key.
     *
     * @param string $component Component part.
     * @param string $name Name part.
     */
    private function __construct(string $component, string $name) {
        $this->component = $component;
        $this->name = $name;
    }

    /**
     * Parse a key, rejecting anything outside the grammar.
     *
     * @param string $key Candidate key.
     * @return self Parsed key.
     * @throws \InvalidArgumentException When the key is not valid.
     */
    public static function parse(string $key): self {
        if (strlen($key) > 255 || !preg_match(self::PATTERN, $key, $matches)) {
            throw new \InvalidArgumentException('Invalid slot key.');
        }
        $name = $matches[2];
        if (strpos($name, '..') !== false || $name[0] === '/' || substr($name, -1) === '/') {
            throw new \InvalidArgumentException('Invalid slot key.');
        }
        return new self($matches[1], $name);
    }

    /**
     * Whether a candidate string is a valid key.
     *
     * @param string $key Candidate key.
     * @return bool True when valid.
     */
    public static function is_valid(string $key): bool {
        try {
            self::parse($key);
            return true;
        } catch (\InvalidArgumentException $exception) {
            return false;
        }
    }

    /**
     * Component part.
     *
     * @return string Component.
     */
    public function component(): string {
        return $this->component;
    }

    /**
     * Name part.
     *
     * @return string Name.
     */
    public function name(): string {
        return $this->name;
    }

    /**
     * Kind of slot.
     *
     * @return string One of the KIND constants.
     */
    public function kind(): string {
        if ($this->component === 'activity') {
            return self::KIND_ACTIVITY;
        }
        if ($this->component === 'purpose') {
            return self::KIND_PURPOSE;
        }
        return self::KIND_ICON;
    }

    /**
     * Canonical string form.
     *
     * @return string The key.
     */
    public function __toString(): string {
        return $this->component . ':' . $this->name;
    }
}
