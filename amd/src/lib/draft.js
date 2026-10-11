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
 * The editable form of a rule, kept apart from the server's own response so it can be compared and staged.
 *
 * @module     local_iconrestyle/lib/draft
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const FIELDS = ['assetid', 'fg', 'bg', 'shape', 'padding', 'opacity', 'enabled'];

/**
 * A draft that changes nothing.
 *
 * @param {string} slotkey Slot key.
 * @returns {object} Draft.
 */
export const emptyDraft = (slotkey) => ({
    slotkey,
    painter: 'none',
    assetid: 0,
    asseturl: '',
    assetkind: '',
    assetmono: false,
    fg: '',
    bg: '',
    shape: '',
    padding: -1,
    opacity: -1,
    enabled: true,
    rev: 0,
});

/**
 * Turn a rule returned by the server into a draft.
 *
 * @param {object} rule Rule as returned by local_iconrestyle_get_rules.
 * @returns {object} Draft.
 */
export const fromRule = (rule) => ({
    slotkey: rule.slotkey,
    painter: rule.painter,
    assetid: rule.assetid,
    asseturl: rule.asseturl,
    assetkind: rule.assetkind,
    assetmono: rule.painter === 'mask',
    fg: rule.fg,
    bg: rule.bg,
    shape: rule.shape,
    padding: rule.padding,
    opacity: rule.opacity,
    enabled: rule.enabled,
    rev: rule.rev,
});

/**
 * Whether a draft changes nothing at all.
 *
 * @param {object} draft Draft.
 * @returns {boolean} True when there is no artwork, colour, shape, padding or opacity.
 */
export const isEmpty = (draft) => draft.assetid === 0 && draft.fg === '' && draft.bg === '' && draft.shape === '' &&
    draft.padding < 0 && draft.opacity < 0;

/**
 * Whether two drafts would produce the same rule.
 *
 * @param {object} first First draft.
 * @param {object} second Second draft.
 * @returns {boolean} True when every editable field matches.
 */
export const sameDraft = (first, second) => FIELDS.every((field) => first[field] === second[field]);

/**
 * The painter a draft needs.
 *
 * Artwork is drawn through a mask when it has a single colour, so it can be recoloured, and as an image otherwise.
 * A font icon with only a colour keeps Moodle's glyph and just changes its colour.
 *
 * @param {object} draft Draft.
 * @param {string} kind font or image.
 * @returns {string} color, mask, image or none.
 */
export const painterFor = (draft, kind) => {
    if (draft.assetid > 0) {
        return draft.assetmono ? 'mask' : 'image';
    }
    return draft.fg !== '' && kind === 'font' ? 'color' : 'none';
};

/**
 * Fields for local_iconrestyle_save_rule and local_iconrestyle_preview_css.
 *
 * @param {object} draft Draft.
 * @param {string} kind font or image.
 * @returns {object} Input following the web service description.
 */
export const toInput = (draft, kind) => ({
    slotkey: draft.slotkey,
    painter: painterFor(draft, kind),
    assetid: draft.assetid,
    fg: draft.fg,
    bg: draft.bg,
    shape: draft.shape,
    padding: draft.padding,
    opacity: draft.opacity,
    enabled: draft.enabled,
    rev: draft.rev,
});

/**
 * Whether a foreground colour has nothing to apply to.
 *
 * An image icon cannot be recoloured without replacement artwork.
 *
 * @param {object} draft Draft.
 * @param {string} kind font or image.
 * @returns {boolean} True when the colour would have no effect.
 */
export const colourNeedsArtwork = (draft, kind) => kind === 'image' && draft.fg !== '' && draft.assetid === 0;
