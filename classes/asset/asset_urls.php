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
 * How artwork is referenced from CSS.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\asset;

/**
 * Small artwork is inlined as a data URI, so it costs no request; larger artwork has an immutable content-hash URL.
 */
class asset_urls {
    /** @var int Largest artwork inlined into CSS, in bytes. */
    public const INLINE_LIMIT = 2048;

    /** @var asset_store Storage. */
    private $store;

    /**
     * Create the helper.
     *
     * @param asset_store $store Storage.
     */
    public function __construct(asset_store $store) {
        $this->store = $store;
    }

    /**
     * A CSS url() value for an asset.
     *
     * @param int $assetid Asset id.
     * @return string|null The url() value, or null when the asset no longer exists.
     */
    public function css_url(int $assetid): ?string {
        $asset = $this->store->find($assetid);
        if (!$asset) {
            return null;
        }
        if ($asset->bytes() <= self::INLINE_LIMIT) {
            return 'url("data:' . $asset->mime() . ';base64,' . base64_encode($this->store->content($asset)) . '")';
        }
        return 'url("' . self::public_url($asset) . '")';
    }

    /**
     * Public address of an asset.
     *
     * @param asset $asset Asset.
     * @return string Address of asset.php for the content hash.
     */
    public static function public_url(asset $asset): string {
        return (new \moodle_url('/local/iconrestyle/asset.php/' . $asset->filename()))->out(false);
    }
}
