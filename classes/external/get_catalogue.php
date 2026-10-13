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
 * Web service: the icons that can be customised.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\external;

use local_iconrestyle\service_factory;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/compat.php');

/**
 * The list is the same for every context, so the client keeps it by version and searches it locally.
 */
class get_catalogue extends api {
    /**
     * Parameters.
     *
     * @return parameters Description.
     */
    public static function execute_parameters(): parameters {
        return new parameters([]);
    }

    /**
     * List every customisable icon.
     *
     * @return array Version key and icons.
     */
    public static function execute(): array {
        global $PAGE;
        self::validate_parameters(self::execute_parameters(), []);
        self::validate_context(\context_system::instance());
        $factory = service_factory::instance();
        $factory->permissions()->require_manage();

        $icons = [];
        foreach ($factory->catalogue()->all() as $entry) {
            $entry['imageurl'] = '';
            if ($entry['kind'] === 'image') {
                $entry['imageurl'] = $PAGE->theme->image_url($entry['name'], $entry['component'])->out(false);
            } else if ($entry['kind'] === 'container' && $entry['sample'] !== '') {
                $url = $PAGE->theme->image_url('monologo', $entry['sample']);
                $entry['imageurl'] = $url ? $url->out(false, ['filtericon' => 1]) : '';
            }
            $icons[] = $entry;
        }
        return ['version' => $factory->version_hash(), 'icons' => $icons];
    }

    /**
     * Returned structure.
     *
     * @return structure Description.
     */
    public static function execute_returns(): structure {
        return new structure([
            'version' => new value(PARAM_ALPHANUM, 'Key that changes when the installed code or plugins change'),
            'icons' => new listof(new structure([
                'key' => new value(PARAM_RAW, 'Slot key'),
                'kind' => new value(PARAM_ALPHA, 'font, image or container'),
                'classes' => new value(PARAM_RAW, 'Class attribute of a font icon'),
                'imageurl' => new value(PARAM_RAW, 'Address of an image icon'),
                'component' => new value(PARAM_RAW, 'Component'),
                'name' => new value(PARAM_RAW, 'Name inside the component'),
                'group' => new value(PARAM_INT, 'Number of icons that share its glyph, zero when it is alone'),
                'purpose' => new value(PARAM_ALPHANUMEXT, 'Purpose of an activity slot, empty for icons'),
                'sample' => new value(PARAM_ALPHANUMEXT, 'Activity module whose icon previews an activity slot, empty for icons'),
            ])),
        ]);
    }
}
