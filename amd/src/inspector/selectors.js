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
 * The markup of the editing panel that the script depends on.
 *
 * @module     local_iconrestyle/inspector/selectors
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {action, region} from 'local_iconrestyle/common/selectors';

export default {
    layout: region('layout'),
    panel: region('panel'),
    title: region('title'),
    origin: region('origin'),
    sharedNotice: region('shared-notice'),
    sharedNoticeText: region('shared-notice-text'),
    upload: region('upload'),
    artworkName: region('artwork-name'),
    artworkHint: region('artwork-hint'),
    props: '[data-prop]',
    rangeInputs: 'input[data-prop]',
    selects: 'select[data-prop]',
    numberInputs: 'input[data-prop-num]',
    number: (prop) => `[data-prop-num="${prop}"]`,
    looks: '[data-looks]',
    lookButtons: '[data-looks] button',
    shape: '.irs-shape',
    flipButtons: 'button[data-flip]',
    buttons: 'button[data-action]',
    tabs: action('tab'),
    tab: (name) => region(`tab-${name}`),
    removeVariant: action('remove-variant'),
    removeArtwork: action('remove-artwork'),
    artworkChip: region('artwork-chip'),
};
