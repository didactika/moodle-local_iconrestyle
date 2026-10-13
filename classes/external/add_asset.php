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
 * Web service: add uploaded artwork.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use local_iconrestyle\asset\asset_rejected_exception;
use local_iconrestyle\asset\asset_urls;
use local_iconrestyle\service_factory;

/**
 * The file travels as base64 in the request, which keeps the upload inside the normal web service checks.
 */
class add_asset extends external_api {
    /** @var int Longest accepted base64 text, enough for the largest accepted raster file. */
    private const MAX_BASE64 = 360000;

    /**
     * Parameters.
     *
     * @return external_function_parameters Description.
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'content' => new external_value(PARAM_RAW, 'The file, base64 encoded'),
        ]);
    }

    /**
     * Sanitise and store artwork.
     *
     * @param string $content The file, base64 encoded.
     * @return array The asset.
     * @throws \moodle_exception With a reason code when the artwork is refused.
     */
    public static function execute(string $content): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['content' => $content]);
        self::validate_context(\context_system::instance());
        service_factory::instance()->permissions()->require_manage();

        $bytes = strlen($params['content']) <= self::MAX_BASE64 ? base64_decode($params['content'], true) : false;
        if ($bytes === false || $bytes === '') {
            throw new \invalid_parameter_exception('The file is not valid base64 or is too large.');
        }
        try {
            $asset = service_factory::instance()->assets()->add($bytes, (int)$USER->id);
        } catch (asset_rejected_exception $exception) {
            throw new \moodle_exception('asset_rejected_' . $exception->reason(), 'local_iconrestyle');
        }
        return self::export($asset);
    }

    /**
     * Describe a stored asset for a client.
     *
     * @param \local_iconrestyle\asset\asset $asset Asset.
     * @return array Fields following execute_returns().
     */
    public static function export(\local_iconrestyle\asset\asset $asset): array {
        return [
            'id' => $asset->id(),
            'url' => asset_urls::public_url($asset),
            'kind' => $asset->kind(),
            'width' => $asset->width(),
            'height' => $asset->height(),
            'monochrome' => $asset->monochrome(),
        ];
    }

    /**
     * Returned structure.
     *
     * @return external_single_structure Description.
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Asset id'),
            'url' => new external_value(PARAM_RAW, 'Address of the artwork'),
            'kind' => new external_value(PARAM_ALPHA, 'svg, png or webp'),
            'width' => new external_value(PARAM_INT, 'Width'),
            'height' => new external_value(PARAM_INT, 'Height'),
            'monochrome' => new external_value(PARAM_BOOL, 'Whether the artwork uses a single colour'),
        ]);
    }
}
