/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * One icon as Moodle draws it, at one size, in the preview and on the cards of the grid.
 *
 * @module     local_iconrestyle/components/IconCell
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import type {Icon} from '../types';

interface IconCellProps {
    icon: Icon;
    size: number;
}

/**
 * The markup of an icon, which carries the classes Moodle's own styles and the rules of the site match.
 *
 * @param props The icon and the size in pixels.
 * @returns The icon inside the wrappers the preview needs to keep a large look from covering its neighbours.
 */
export default function IconCell({icon, size}: IconCellProps) {
    let glyph;
    if (icon.kind === 'container') {
        glyph = <span className={icon.component === 'activity' ? `modtype_${icon.name}` : ''}>
            <div className={`${icon.classes} irs-box`} style={{width: size * 1.6, height: size * 1.6}}>
                <img className="activityicon" alt="" src={icon.imageurl} />
            </div>
        </span>;
    } else if (icon.kind === 'font') {
        glyph = <i className={icon.classes} aria-hidden="true"
            style={{fontSize: size, width: size, height: size, lineHeight: `${size}px`}} />;
    } else {
        glyph = <img className="icon" alt="" src={icon.imageurl} style={{width: size, height: size}} />;
    }
    return <span className="irs-cell"><span className="irs-fit">{glyph}</span></span>;
}
