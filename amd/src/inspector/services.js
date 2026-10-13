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
 * Web services that give an icon its artwork.
 *
 * @module     local_iconrestyle/inspector/services
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {call} from 'local_iconrestyle/common/ajax';

/**
 * Upload artwork.
 *
 * @param {string} content The file, base64 encoded.
 * @returns {Promise<object>} The stored asset.
 */
export const addAsset = (content) => call('local_iconrestyle_add_asset', {content});

/**
 * Use the file of an icon that Moodle ships as artwork, so the icon can be recoloured.
 *
 * @param {string} slotkey Slot key of an image icon.
 * @returns {Promise<object>} The stored asset.
 */
export const useIconArtwork = (slotkey) => call('local_iconrestyle_use_icon_artwork', {slotkey});
