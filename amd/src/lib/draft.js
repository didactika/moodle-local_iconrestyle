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
 * A rule is an icon, a place where it applies (the site, a category, a course or an activity, optionally limited to some
 * kinds of page and some page regions) and an appearance. The place is what tells apart the variants of one icon.
 *
 * @module     local_iconrestyle/lib/draft
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const FIELDS = ['assetid', 'fg', 'bg', 'shape', 'padding', 'opacity', 'enabled'];

/**
 * Identity of a place, the same for the same site, category, course or activity with the same pages and regions.
 *
 * @param {{contextid: number, pages: string[], regions: string[]}} where Place.
 * @returns {string} Identity.
 */
export const whereKey = (where) => `${where.contextid}|${where.pages.join(',')}|${where.regions.join(',')}`;

/**
 * Identity of one variant of one icon.
 *
 * @param {string} slotkey Slot key.
 * @param {{contextid: number, pages: string[], regions: string[]}} where Place.
 * @returns {string} Identity.
 */
export const ruleKey = (slotkey, where) => `${slotkey}#${whereKey(where)}`;

/**
 * Words that describe a place.
 *
 * @param {{contextname: string, contextkind: string, pages: string[], regions: string[]}} where Place.
 * @param {{everywhere: string, pages: Object<string, string>, regions: Object<string, string>}} labels Names to use.
 * @returns {string} For example "Faculty of Arts · Administration pages · Navigation bar", or "Everywhere".
 */
export const whereLabel = (where, labels) => {
    const parts = [];
    if (where.contextkind !== 'site') {
        parts.push(where.contextname);
    }
    parts.push(...where.pages.map((page) => labels.pages[page] || page));
    parts.push(...where.regions.map((region) => labels.regions[region] || region));
    return parts.length ? parts.join(' · ') : labels.everywhere;
};

/**
 * A draft that changes nothing.
 *
 * @param {string} slotkey Slot key.
 * @param {{contextid: number, contextname: string, contextkind: string, pages: string[], regions: string[]}} where Place.
 * @returns {object} Draft.
 */
export const emptyDraft = (slotkey, where) => ({
    slotkey,
    id: 0,
    contextid: where.contextid,
    contextname: where.contextname,
    contextkind: where.contextkind,
    pages: [...where.pages],
    regions: [...where.regions],
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
    id: rule.id,
    contextid: rule.contextid,
    contextname: rule.contextname,
    contextkind: rule.contextkind,
    pages: [...rule.pages],
    regions: [...rule.regions],
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
 * The place of a draft.
 *
 * @param {object} draft Draft.
 * @returns {{contextid: number, contextname: string, contextkind: string, pages: string[], regions: string[]}} Place.
 */
export const whereOf = (draft) => ({
    contextid: draft.contextid,
    contextname: draft.contextname,
    contextkind: draft.contextkind,
    pages: draft.pages,
    regions: draft.regions,
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
 * Whether two drafts would produce the same appearance.
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
    contextid: draft.contextid,
    pages: draft.pages,
    regions: draft.regions,
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
