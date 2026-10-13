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
 * A stored artwork.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\asset;

/**
 * Metadata of sanitised artwork. The bytes live in the file storage under the content hash.
 */
final class asset {
    /** @var int Asset id. */
    private $id;

    /** @var string SHA-256 of the safe bytes. */
    private $hash;

    /** @var string Kind of image. */
    private $kind;

    /** @var int Size in bytes. */
    private $bytes;

    /** @var int Width. */
    private $width;

    /** @var int Height. */
    private $height;

    /** @var bool Whether the artwork uses a single colour. */
    private $monochrome;

    /**
     * Create the value.
     *
     * @param int $id Asset id.
     * @param string $hash SHA-256 of the safe bytes.
     * @param string $kind Kind of image.
     * @param int $bytes Size in bytes.
     * @param int $width Width.
     * @param int $height Height.
     * @param bool $monochrome Whether the artwork uses a single colour.
     */
    public function __construct(int $id, string $hash, string $kind, int $bytes, int $width, int $height, bool $monochrome) {
        $this->id = $id;
        $this->hash = $hash;
        $this->kind = $kind;
        $this->bytes = $bytes;
        $this->width = $width;
        $this->height = $height;
        $this->monochrome = $monochrome;
    }

    /**
     * Asset id.
     *
     * @return int Id.
     */
    public function id(): int {
        return $this->id;
    }

    /**
     * Content hash.
     *
     * @return string SHA-256.
     */
    public function hash(): string {
        return $this->hash;
    }

    /**
     * Kind of image.
     *
     * @return string One of the sanitized_content kinds.
     */
    public function kind(): string {
        return $this->kind;
    }

    /**
     * Size in bytes.
     *
     * @return int Bytes.
     */
    public function bytes(): int {
        return $this->bytes;
    }

    /**
     * Width.
     *
     * @return int Width.
     */
    public function width(): int {
        return $this->width;
    }

    /**
     * Height.
     *
     * @return int Height.
     */
    public function height(): int {
        return $this->height;
    }

    /**
     * Whether the artwork uses a single colour.
     *
     * @return bool True when monochrome.
     */
    public function monochrome(): bool {
        return $this->monochrome;
    }

    /**
     * Media type.
     *
     * @return string MIME type.
     */
    public function mime(): string {
        return sanitized_content::mime_for($this->kind);
    }

    /**
     * File name that carries the hash and the extension.
     *
     * @return string File name.
     */
    public function filename(): string {
        return $this->hash . '.' . $this->kind;
    }
}
