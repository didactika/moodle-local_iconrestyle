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
 * Turns untrusted artwork into stored assets.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\asset;

/**
 * The only way artwork enters the plugin: it is sniffed from its content, sanitised and then stored.
 */
class asset_service {
    /** @var svg_sanitizer Vector sanitiser. */
    private $svg;

    /** @var raster_reencoder Raster re-encoder. */
    private $raster;

    /** @var asset_store Storage. */
    private $store;

    /**
     * Create the service.
     *
     * @param svg_sanitizer $svg Vector sanitiser.
     * @param raster_reencoder $raster Raster re-encoder.
     * @param asset_store $store Storage.
     */
    public function __construct(svg_sanitizer $svg, raster_reencoder $raster, asset_store $store) {
        $this->svg = $svg;
        $this->raster = $raster;
        $this->store = $store;
    }

    /**
     * Add uploaded artwork.
     *
     * The kind is decided from the content; file names and declared media types are ignored.
     *
     * @param string $bytes Uploaded bytes.
     * @param int $userid User adding the artwork.
     * @param string $source Where it came from: upload, library or import.
     * @param string|null $sourceref Provenance, as text only.
     * @param string|null $license Licence identifier of library artwork.
     * @return asset Stored asset.
     * @throws asset_rejected_exception When the artwork is refused.
     */
    public function add(
        string $bytes,
        int $userid,
        string $source = 'upload',
        ?string $sourceref = null,
        ?string $license = null
    ): asset {
        $content = $this->looks_like_svg($bytes) ? $this->svg->sanitise($bytes) : $this->raster->reencode($bytes);
        return $this->store->save($content, $source, $sourceref, $license, $userid);
    }

    /**
     * Whether bytes are text that should be treated as vector artwork.
     *
     * @param string $bytes Uploaded bytes.
     * @return bool True for XML-looking content.
     */
    private function looks_like_svg(string $bytes): bool {
        return (bool)preg_match('/^(\xEF\xBB\xBF)?\s*<(\?xml|svg|!--|!DOCTYPE)/i', $bytes);
    }
}
