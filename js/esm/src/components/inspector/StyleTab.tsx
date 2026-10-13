/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The style tab of the editing panel: quick looks, colour, artwork, shape, spacing, transform, effects and filters.
 *
 * @module     local_iconrestyle/components/inspector/StyleTab
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import ArtworkGroup from './ArtworkGroup';
import ColourField from './ColourField';
import SelectField from './SelectField';
import SidesField from './SidesField';
import SliderField from './SliderField';
import {SELECTS, SELECT_LABELS, SHAPES, SIDES, SIDE_STRINGS, SLIDERS} from './config';
import {CLEAR_DESIGN, LOOKS, LOOK_STRINGS} from '../../lib/presets';
import type {Draft, Icon, Patch, Text} from '../../types';

interface StyleTabProps {
    icon: Icon;
    draft: Draft;
    ranges: Record<string, [number, number]>;
    specials: Record<string, Array<{value: string; label: string}>>;
    boxColours: boolean;
    text: Text;
    hidden: boolean;
    onProp: (prop: string, value: number | string | null, continuous?: boolean) => void;
    onStage: (patch: Patch, continuous?: boolean) => void;
}

/**
 * The style tab.
 *
 * @param props The open icon, its draft, the ranges the server accepts, the choices that are not theme colours, the texts and
 *     what to do with a change.
 * @returns The tab.
 */
export default function StyleTab({icon, draft, ranges, specials, boxColours, text, hidden, onProp, onStage}: StyleTabProps) {
    const slider = (prop: string) => <SliderField key={prop} prop={prop} label={text(SLIDERS[prop].label)} min={ranges[prop][0]}
        max={ranges[prop][1]} step={SLIDERS[prop].step} defaultValue={SLIDERS[prop].rest} value={draft[prop] as number | null}
        text={text} onChange={onProp} />;
    const select = (prop: string) => <SelectField key={prop} prop={prop} label={text(SELECT_LABELS[prop])} options={SELECTS[prop]}
        value={draft[prop] as string | null} text={text} onChange={onProp} />;
    const colour = (name: string, label: string) => <ColourField key={name} name={name} label={text(label)}
        value={(draft[name] as string | null) ?? ''} specials={specials[name] ?? []} text={text}
        onChange={(field, value, continuous) => onProp(field, value, continuous)} />;
    const sides = (group: 'padding' | 'margin') => {
        const config = SIDES[group];
        return <SidesField key={group} group={group} label={text(config.label)} resetLabel={text(config.reset)} min={config.min}
            max={config.max} draft={draft} text={text} onStage={onStage}
            sides={['t', 'r', 'b', 'l'].map((letter) => ({prop: config.first + letter, label: text(SIDE_STRINGS[letter])}))} />;
    };

    const chooseLook = (name: string): void => {
        const look = LOOKS[name];
        const patch: Patch = look.keepDesign ? {} : {...CLEAR_DESIGN, ...look.design};
        Object.keys(look.colours ?? {}).forEach((field) => {
            if (!draft[field]) {
                patch[field] = (look.colours as Record<string, string>)[field];
            }
        });
        onStage({...patch, ...(look.force ?? {})});
    };

    return <div className="irs-tabpanel" role="tabpanel" id="irs-panel-style" aria-labelledby="irs-tab-style"
        data-region="tab-style" hidden={hidden}>
        <details className="irs-group" open>
            <summary>{text('grouplooks')}</summary>
            <div className="irs-looks" data-looks>
                {Object.keys(LOOKS).map((name) => <button key={name} type="button" className={`irs-look irs-look-${name}`}
                    data-action="look" data-look={name} data-kinds={LOOKS[name].kinds.join(' ')}
                    title={text(LOOK_STRINGS[name][1])} hidden={!LOOKS[name].kinds.includes(icon.kind)}
                    onClick={() => chooseLook(name)}>
                    <span className="irs-look-sample" aria-hidden="true" />
                    <span className="irs-look-name">{text(LOOK_STRINGS[name][0])}</span>
                </button>)}
            </div>
            <p className="irs-hint">{text('lookshint')}</p>
        </details>

        <details className="irs-group" open>
            <summary>{text('groupcolour')}</summary>
            {colour('fg', icon.kind === 'container' ? 'iconcolour' : 'foreground')}
            {colour('bg', icon.kind === 'container' ? 'boxcolour' : 'background')}
            {colour('bg2', 'gradientcolour')}
            {slider('gd')}
        </details>

        <ArtworkGroup draft={draft} text={text} onStage={onStage} />

        <details className="irs-group">
            <summary>{text('groupshape')}</summary>
            <div className="irs-field">
                <span className="irs-label" id="irs-shape-label">{text('shape')}</span>
                <div className="irs-shapes" role="group" aria-labelledby="irs-shape-label" data-prop="shape">
                    {SHAPES.map(([value, label, sample]) => <button key={value} type="button" className="irs-shape"
                        data-value={value} aria-pressed={(draft.shape ?? '') === value}
                        onClick={() => onProp('shape', value === '' ? null : value)}>
                        <span className={`irs-shape-sample${sample === '' ? '' : ` ${sample}`}`} />{text(label)}
                    </button>)}
                </div>
            </div>
            {slider('radius')}
            {slider('bw')}
            {select('bs')}
            {colour('bc', 'bordercolour')}
            {slider('ow')}
            {slider('oo')}
            {colour('oc', 'outlinecolour')}
        </details>

        <details className="irs-group">
            <summary>{text('groupspacing')}</summary>
            {sides('padding')}
            {sides('margin')}
            {slider('scale')}
        </details>

        <details className="irs-group">
            <summary>{text('grouptransform')}</summary>
            {slider('rotate')}
            {slider('skx')}
            {slider('sky')}
            <div className="irs-field irs-flips">
                {['flipx', 'flipy'].map((flip) => <button key={flip} type="button" className="irs-toggle" data-flip={flip}
                    aria-pressed={draft[flip] === 1} onClick={() => onStage({[flip]: draft[flip] === 1 ? null : 1})}>
                    {text(flip)}
                </button>)}
            </div>
        </details>

        <details className="irs-group">
            <summary>{text('groupeffects')}</summary>
            {slider('opacity')}
            {select('shadow')}
            {select('ds')}
            {colour('sc', 'shadowcolour')}
            {select('blend')}
            {select('hover')}
        </details>

        <details className="irs-group">
            <summary>{text('groupfilters')}</summary>
            {['brightness', 'contrast', 'saturate', 'grayscale', 'hue', 'sepia', 'invert', 'blur'].map(slider)}
        </details>
    </div>;
}
