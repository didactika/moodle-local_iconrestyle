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
 * Creates modals with a save and a cancel button, on every Moodle line the plugin supports.
 *
 * @module     local_iconrestyle/common/modal
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import ModalSaveCancel from 'core/modal_save_cancel';

/**
 * Create a modal with a save and a cancel button.
 *
 * Moodle 4.3 and later create modals from their own class. Earlier lines use the modal factory, which Moodle 5 no longer has,
 * so it is only loaded when it is needed.
 *
 * @param {{title: string, body: string, save: string}} config Title, body and text of the save button.
 * @returns {Promise<object>} The modal.
 */
export const createModal = async(config) => {
    if (typeof ModalSaveCancel.create === 'function') {
        return ModalSaveCancel.create({
            title: config.title,
            body: config.body,
            buttons: {save: config.save},
            removeOnClose: true,
            large: true,
        });
    }
    const factory = await new Promise((resolve, reject) => window.require(['core/modal_factory'], resolve, reject));
    const modal = await factory.create({
        type: factory.types.SAVE_CANCEL,
        title: config.title,
        body: config.body,
        removeOnClose: true,
        large: true,
    });
    modal.setSaveButtonText(config.save);
    return modal;
};
