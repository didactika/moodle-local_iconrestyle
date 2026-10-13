/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The small icons of the designer: the icons of Moodle, which Font Awesome draws, so they take the colour of the text around them and a site can restyle them. None is drawn by hand.
 *
 * @module     local_iconrestyle/components/common/Icons
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
interface GlyphProps {
    /** Name of the icon in Font Awesome, without the fa- prefix. */
    name: string;
    /** Size in pixels: 16 unless the icon is one of the larger ones. */
    size?: number;
    className?: string;
}

const Glyph = ({name, size = 16, className}: GlyphProps) => <i
    className={`irs-glyph fa-solid fa-${name}${size === 18 ? ' irs-glyph-lg' : ''}${className ? ` ${className}` : ''}`}
    style={size === 16 || size === 18 ? undefined : {fontSize: size}}
    aria-hidden="true"
/>;

export const IconAlert = () => <Glyph name="triangle-exclamation" size={18} />;
export const IconBack = () => <Glyph name="arrow-left" size={18} />;
export const IconCheck = ({size = 18}: {size?: number}) => <Glyph name="check" size={size} />;
export const IconChevron = () => <Glyph name="chevron-down" />;
export const IconClose = () => <Glyph name="xmark" />;
export const IconColourMode = () => <Glyph name="circle-half-stroke" />;
export const IconCopy = () => <Glyph name="clone" />;
export const IconDownload = () => <Glyph name="download" size={18} />;
export const IconLinked = () => <Glyph name="link" className="irs-icon-linked" />;
export const IconMore = () => <Glyph name="ellipsis" size={18} />;
export const IconPlus = () => <Glyph name="plus" />;
export const IconRedo = () => <Glyph name="arrow-rotate-right" size={18} />;
export const IconRefresh = () => <Glyph name="arrows-rotate" size={18} />;
export const IconSearch = () => <Glyph name="magnifying-glass" size={18} />;
export const IconSelect = () => <Glyph name="square-check" />;
export const IconTrash = () => <Glyph name="trash-can" />;
export const IconUndo = () => <Glyph name="rotate-left" size={18} />;
export const IconUnlinked = () => <Glyph name="link-slash" className="irs-icon-unlinked" />;
export const IconUpload = () => <Glyph name="upload" size={18} />;
export const IconFilter = () => <Glyph name="filter" />;
export const IconFilterClear = () => <Glyph name="rotate-right" />;
