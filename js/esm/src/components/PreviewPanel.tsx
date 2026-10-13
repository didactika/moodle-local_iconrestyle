// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * The live preview of the open icon: how Moodle draws it, how it looks with the draft, or both, on a light or a dark surface.
 *
 * @module     local_iconrestyle/components/PreviewPanel
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import ShadowStage from './ShadowStage';
import IconCell from './IconCell';
import {contrastRatio, parseHex} from '../lib/color';
import type {Icon, Text} from '../types';

const SIZES = [16, 24, 32, 48];
const PANEL_LIMIT = 84;
const SURFACES: Record<string, {r: number; g: number; b: number}> = {light: {r: 255, g: 255, b: 255}, dark: {r: 33, g: 37, b: 41}};

export type PreviewView = 'edited' | 'original' | 'compare';

interface PreviewPanelProps {
    icon: Icon;
    css: string;
    waiting: boolean;
    view: PreviewView;
    surface: string;
    modes: string[];
    note: string;
    foreground: string;
    text: Text;
    onView: (view: PreviewView) => void;
    onSurface: (surface: string) => void;
}

/**
 * The preview of the open icon.
 *
 * @param props The icon, its compiled look, what to show, the surface and the texts.
 * @returns The preview.
 */
export default function PreviewPanel(props: PreviewPanelProps) {
    const {icon, css, waiting, view, surface, modes, note, foreground, text, onView, onSurface} = props;
    const theme = modes.length > 0 ? surface : null;
    const colour = parseHex(foreground);
    const contrast = colour && colour.a === 255 ? contrastRatio(colour, SURFACES[surface] ?? SURFACES.light) : null;
    const views: Array<[PreviewView, string]> = [
        ['edited', 'previewedited'], ['original', 'previeworiginal'], ['compare', 'previewcompare'],
    ];
    const stages = (area: string, compiled: string) => <ShadowStage
        className="irs-preview-cells" region={`cells-${area}`} area={area} css={compiled} theme={theme}
        waiting={area === 'new' && waiting}
        limit={PANEL_LIMIT}>
        {SIZES.map((size) => <IconCell key={size} icon={icon} size={size} />)}
    </ShadowStage>;
    return <div className="irs-preview" data-region="preview">
        <div className="irs-preview-head">
            <div className="irs-seg-group" role="group" aria-label={text('previewview')}>
                {views.map(([name, label]) => <button key={name} type="button" data-action="preview-view" data-view={name}
                    className={`irs-seg-btn${view === name ? ' irs-active' : ''}`} aria-pressed={view === name}
                    onClick={() => onView(name)}>{text(label)}</button>)}
            </div>
            <div className="irs-seg-group irs-surface" data-region="surface-group" role="group" aria-label={text('surface')}
                hidden={modes.length === 0}>
                {['light', 'dark'].map((name) => <button key={name} type="button" data-action="surface" data-surface={name}
                    className={`irs-seg-btn${surface === name ? ' irs-active' : ''}`} aria-pressed={surface === name}
                    onClick={() => onSurface(name)}>{text(name === 'light' ? 'surfacelight' : 'surfacedark')}</button>)}
            </div>
        </div>
        <p className="irs-mode-note" data-region="mode-note" role="status" hidden={note === ''}>{note}</p>
        <div className={`irs-preview-cols${surface === 'dark' ? ' irs-dark' : ''}`} data-region="preview-surface" data-view={view}>
            <div className="irs-preview-col" data-area="default">
                <span className="irs-preview-label">{text('previeworiginal')}</span>
                {stages('default', '')}
            </div>
            <div className="irs-preview-col" data-area="new">
                <span className="irs-preview-label">{text('previewedited')}</span>
                {stages('new', css)}
            </div>
        </div>
        <p className="irs-contrast" data-region="contrast" role="status" hidden={contrast === null}>
            {contrast === null ? '' : text(contrast >= 3 ? 'contrastgood' : 'contrastlow', contrast.toFixed(1))}
        </p>
    </div>;
}
