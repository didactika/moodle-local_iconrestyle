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
 * Serves sanitised artwork by content hash.
 *
 * The path is /asset.php/{sha256}.{svg|png|webp}. The bytes behind a hash never change, so the response is immutable.
 * Artwork is styling, not user content, and the login page needs it, so no session is required. Cross-origin access is
 * allowed because browsers fetch CSS mask images in CORS mode when the files come from another origin, such as a CDN.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('NO_MOODLE_COOKIES', true);
define('NO_DEBUG_DISPLAY', true);

require_once(__DIR__ . '/../../config.php');

use local_iconrestyle\asset\sanitized_content;
use local_iconrestyle\service_factory;

$asset = null;
if (preg_match('~^/([0-9a-f]{64})\.(svg|png|webp)$~', (string)get_file_argument(), $matches)) {
    $asset = service_factory::instance()->asset_store()->find_by_hash($matches[1]);
    if ($asset && $asset->kind() !== $matches[2]) {
        $asset = null;
    }
}
if ($asset === null) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    exit;
}

$etag = '"' . $asset->hash() . '"';
header('Content-Type: ' . sanitized_content::mime_for($asset->kind()));
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox");
header('Access-Control-Allow-Origin: *');
header('Cross-Origin-Resource-Policy: cross-origin');
header('ETag: ' . $etag);
header('Cache-Control: public, max-age=31536000, immutable');

if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
    http_response_code(304);
    exit;
}

$bytes = service_factory::instance()->asset_store()->content($asset);
$length = strlen($bytes);
$lengthheader = 'Content-Length';
header("$lengthheader: $length");
echo $bytes;
