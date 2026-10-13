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
 * Turns the file of an icon that Moodle ships into artwork.
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
use local_iconrestyle\service_factory;
use local_iconrestyle\slot\slot_key;

// The classes below use those of core_external, which Moodle 4.0 and 4.1 only have under their old names.
// phpcs:ignore moodle.Files.MoodleInternal.MoodleInternalGlobalState
\local_iconrestyle\compat\external_aliases::register();

/**
 * An image icon cannot be recoloured as it is, so its own file becomes the artwork and the colour is painted through it.
 */
class use_icon_artwork extends external_api {
    /**
     * Parameters.
     *
     * @return external_function_parameters Description.
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters(['slotkey' => new external_value(PARAM_RAW, 'Slot key of an image icon')]);
    }

    /**
     * Store the file of an icon as artwork.
     *
     * @param string $slotkey Slot key of an image icon.
     * @return array The asset.
     * @throws \moodle_exception When the icon has no file of its own or the file is refused.
     */
    public static function execute(string $slotkey): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['slotkey' => $slotkey]);
        self::validate_context(\context_system::instance());
        $factory = service_factory::instance();
        $factory->permissions()->require_manage();
        try {
            $slot = slot_key::parse($params['slotkey']);
        } catch (\InvalidArgumentException $exception) {
            throw new \invalid_parameter_exception($exception->getMessage());
        }
        $bytes = $factory->icon_files()->contents($slot);
        if ($bytes === null) {
            throw new \moodle_exception('noiconfile', 'local_iconrestyle');
        }
        try {
            $asset = $factory->assets()->add($bytes, (int)$USER->id);
        } catch (asset_rejected_exception $exception) {
            throw new \moodle_exception('asset_rejected_' . $exception->reason(), 'local_iconrestyle');
        }
        return add_asset::export($asset);
    }

    /**
     * Returned structure.
     *
     * @return external_single_structure Description.
     */
    public static function execute_returns(): external_single_structure {
        return add_asset::execute_returns();
    }
}
