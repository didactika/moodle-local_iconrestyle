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
 * Artwork that passed sanitising.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\asset;

/**
 * Safe bytes plus what was learned about them. Identity is the SHA-256 of the safe bytes.
 */
final class sanitized_content {
    /** @var string Vector image. */
    public const KIND_SVG = 'svg';

    /** @var string PNG image. */
    public const KIND_PNG = 'png';

    /** @var string WebP image. */
    public const KIND_WEBP = 'webp';

    /** @var string Safe bytes. */
    private $bytes;

    /** @var string Kind of image. */
    private $kind;

    /** @var int Width. */
    private $width;

    /** @var int Height. */
    private $height;

    /** @var bool Whether the artwork uses a single colour. */
    private $monochrome;

    /**
     * Create the value.
     *
     * @param string $bytes Safe bytes.
     * @param string $kind Kind of image.
     * @param int $width Width in pixels or viewBox units.
     * @param int $height Height in pixels or viewBox units.
     * @param bool $monochrome Whether the artwork uses a single colour.
     */
    public function __construct(string $bytes, string $kind, int $width, int $height, bool $monochrome) {
        $this->bytes = $bytes;
        $this->kind = $kind;
        $this->width = $width;
        $this->height = $height;
        $this->monochrome = $monochrome;
    }

    /**
     * Safe bytes.
     *
     * @return string Bytes.
     */
    public function bytes(): string {
        return $this->bytes;
    }

    /**
     * Kind of image.
     *
     * @return string One of the KIND constants.
     */
    public function kind(): string {
        return $this->kind;
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
     * Content hash that identifies the artwork.
     *
     * @return string SHA-256 in hexadecimal.
     */
    public function hash(): string {
        return hash('sha256', $this->bytes);
    }

    /**
     * Media type of the bytes.
     *
     * @return string MIME type.
     */
    public function mime(): string {
        return self::mime_for($this->kind);
    }

    /**
     * Media type of a kind.
     *
     * @param string $kind One of the KIND constants.
     * @return string MIME type.
     */
    public static function mime_for(string $kind): string {
        return ['svg' => 'image/svg+xml', 'png' => 'image/png', 'webp' => 'image/webp'][$kind];
    }
}
