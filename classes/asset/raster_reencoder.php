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
 * Re-encodes uploaded raster artwork.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\asset;

/**
 * A raster file is decoded and written again, which drops every metadata chunk and anything appended after the image.
 */
class raster_reencoder {
    /** @var int Largest accepted input in bytes. */
    public const MAX_BYTES = 262144;

    /** @var int Largest accepted width or height in pixels. */
    public const MAX_SIDE = 512;

    /**
     * Re-encode raster artwork.
     *
     * The size is read from the header and checked before anything is decoded, so a small file cannot expand into a
     * large bitmap.
     *
     * @param string $bytes Uploaded bytes.
     * @return sanitized_content Safe artwork.
     * @throws asset_rejected_exception When the file is refused.
     */
    public function reencode(string $bytes): sanitized_content {
        if (strlen($bytes) > self::MAX_BYTES) {
            throw new asset_rejected_exception(asset_rejected_exception::TOO_LARGE);
        }
        if (!function_exists('imagecreatefromstring')) {
            throw new asset_rejected_exception(asset_rejected_exception::UNAVAILABLE, 'gd');
        }
        $info = @getimagesizefromstring($bytes);
        if (!$info || !in_array($info[2], [IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
            throw new asset_rejected_exception(asset_rejected_exception::UNSUPPORTED);
        }
        [$width, $height] = $info;
        if ($width < 1 || $height < 1 || $width > self::MAX_SIDE || $height > self::MAX_SIDE) {
            throw new asset_rejected_exception(asset_rejected_exception::DIMENSIONS);
        }
        $kind = $info[2] === IMAGETYPE_PNG ? sanitized_content::KIND_PNG : sanitized_content::KIND_WEBP;
        if ($kind === sanitized_content::KIND_WEBP && !function_exists('imagewebp')) {
            throw new asset_rejected_exception(asset_rejected_exception::UNAVAILABLE, 'webp');
        }
        $image = @imagecreatefromstring($bytes);
        if ($image === false) {
            throw new asset_rejected_exception(asset_rejected_exception::MALFORMED, 'decode');
        }
        imagealphablending($image, false);
        imagesavealpha($image, true);
        ob_start();
        $written = $kind === sanitized_content::KIND_PNG ? imagepng($image, null, 9) : imagewebp($image, null, 90);
        $encoded = (string)ob_get_clean();
        imagedestroy($image);
        if (!$written || $encoded === '') {
            throw new asset_rejected_exception(asset_rejected_exception::MALFORMED, 'encode');
        }
        return new sanitized_content($encoded, $kind, $width, $height, false);
    }
}
