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

use local_iconrestyle\asset\asset_rejected_exception;
use local_iconrestyle\asset\asset_urls;
use local_iconrestyle\service_factory;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/compat.php');

/**
 * The file travels as base64 in the request, which keeps the upload inside the normal web service checks.
 */
class add_asset extends api {
    /** @var int Longest accepted base64 text, enough for the largest accepted raster file. */
    private const MAX_BASE64 = 360000;

    /**
     * Parameters.
     *
     * @return parameters Description.
     */
    public static function execute_parameters(): parameters {
        return new parameters([
            'contextid' => new value(PARAM_INT, 'Context the artwork will be used in'),
            'content' => new value(PARAM_RAW, 'The file, base64 encoded'),
        ]);
    }

    /**
     * Sanitise and store artwork.
     *
     * @param int $contextid Context the artwork will be used in.
     * @param string $content The file, base64 encoded.
     * @return array The asset.
     * @throws \moodle_exception With a reason code when the artwork is refused.
     */
    public static function execute(int $contextid, string $content): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['contextid' => $contextid, 'content' => $content]);
        $context = \context::instance_by_id($params['contextid']);
        self::validate_context($context);
        service_factory::instance()->permissions()->require_manage($context);

        $bytes = strlen($params['content']) <= self::MAX_BASE64 ? base64_decode($params['content'], true) : false;
        if ($bytes === false || $bytes === '') {
            throw new \invalid_parameter_exception('The file is not valid base64 or is too large.');
        }
        try {
            $asset = service_factory::instance()->assets()->add($bytes, (int)$USER->id);
        } catch (asset_rejected_exception $exception) {
            throw new \moodle_exception('asset_rejected_' . $exception->reason(), 'local_iconrestyle');
        }
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
     * @return structure Description.
     */
    public static function execute_returns(): structure {
        return new structure([
            'id' => new value(PARAM_INT, 'Asset id'),
            'url' => new value(PARAM_RAW, 'Address of the artwork'),
            'kind' => new value(PARAM_ALPHA, 'svg, png or webp'),
            'width' => new value(PARAM_INT, 'Width'),
            'height' => new value(PARAM_INT, 'Height'),
            'monochrome' => new value(PARAM_BOOL, 'Whether the artwork uses a single colour'),
        ]);
    }
}
