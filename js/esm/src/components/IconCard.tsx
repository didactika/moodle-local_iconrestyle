// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * One icon of the grid: how the site draws it, or how it will look once what is waiting is saved.
 *
 * @module     local_iconrestyle/components/IconCard
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {memo} from 'react';
import IconCell from './IconCell';
import ShadowStage, {CARD_LAYOUT} from './ShadowStage';
import {IconCheck} from './common/Icons';
import type {Icon, Text} from '../types';

const CARD_SIZE = 24;

interface IconCardProps {
    icon: Icon;
    modified: boolean;
    selected: boolean;
    picking: boolean;
    picked: boolean;
    pickable: boolean;
    css: string | null;
    theme: string | null;
    text: Text;
    onSelect: (key: string, range: boolean) => void;
}

/**
 * The glyph of an icon, with the markup that Moodle's own styles and the rules of the site match.
 *
 * @param icon Catalogue entry.
 * @returns The glyph.
 */
const glyphOf = (icon: Icon) => {
    if (icon.kind === 'font') {
        return <i className={icon.classes} aria-hidden="true" />;
    }
    if (icon.kind === 'image') {
        return <img className="icon" src={icon.imageurl} alt="" />;
    }
    return <span className={icon.component === 'activity' ? `modtype_${icon.name}` : ''}>
        <span className={`${icon.classes} irs-box`}><img className="activityicon" src={icon.imageurl} alt="" /></span>
    </span>;
};

/**
 * A card of the grid.
 *
 * @param props The icon, whether it has a look, is open or is chosen, the look to draw it with while that is not saved, and
 *     what to do with a click.
 * @returns The card.
 */
function Card({icon, modified, selected, picking, picked, pickable, css, theme, text, onSelect}: IconCardProps) {
    const unpickable = picking && !pickable && !selected;
    const classes = `irs-card${selected ? ' irs-selected' : ''}${picking ? ' irs-picking' : ''}${picked ? ' irs-picked' : ''}`;
    return <button type="button" className={classes} data-action="select" data-key={icon.key}
        aria-pressed={picking ? picked : selected} title={icon.key} disabled={unpickable}
        onClick={(event) => onSelect(icon.key, event.shiftKey)}>
        {css === null ?
            <span className="irs-card-icon"><span className="irs-card-fit">{glyphOf(icon)}</span></span> :
            <ShadowStage className="irs-card-icon" area="new" layout={CARD_LAYOUT} css={css} theme={theme} limit="host">
                <IconCell icon={icon} size={CARD_SIZE} />
            </ShadowStage>}
        <span className="irs-card-name">{icon.name}</span>
        <span className="irs-card-component">{icon.component}</span>
        {picking && <span className="irs-pick" aria-hidden="true"><IconCheck size={11} /></span>}
        {modified && <span className="irs-dot" role="img" aria-label={text('modified')} />}
        {icon.group > 1 && <span className="irs-shared" aria-hidden="true">&#8801;</span>}
    </button>;
}

export default memo(Card);
