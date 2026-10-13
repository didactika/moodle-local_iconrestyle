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
 * Serves the icon stylesheet bundle of a page.
 *
 * The path is /styles.php/{versionhash}/{contextid-revision.contextid-revision}/all.css and is immutable
 * while every revision is current.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('NO_MOODLE_COOKIES', true);
define('NO_DEBUG_DISPLAY', true);

require_once(__DIR__ . '/../../config.php');

use local_iconrestyle\delivery\bundle_service;
use local_iconrestyle\service_factory;

$PAGE->set_context(context_system::instance());

$parts = explode('/', ltrim((string)get_file_argument(), '/'));
$chain = null;
if (count($parts) === 3 && $parts[2] === 'all.css' && bundle_service::is_valid_hash($parts[0])) {
    $chain = bundle_service::decode_chain($parts[1]);
}
if ($chain === null) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    exit;
}

$factory = service_factory::instance();
$bundles = $factory->bundles();
$state = $bundles->effective($chain);
$current = $state['current'] && $parts[0] === $factory->version_hash();
$etag = '"' . bundle_service::etag($factory->version_hash(), $state['chain']) . '"';

header('Content-Type: text/css; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('ETag: ' . $etag);
header('Cache-Control: ' . ($current ? 'public, max-age=31536000, immutable' : 'no-cache'));

if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
    http_response_code(304);
    exit;
}

$css = $bundles->css($state['chain']);
$length = strlen($css);
header('Content-Length: ' . $length);
echo $css;
