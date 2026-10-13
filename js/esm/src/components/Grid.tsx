/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The icon grid. Only the rows that can be seen exist in the page, so thousands of icons cost the same as dozens.
 *
 * @module     local_iconrestyle/components/Grid
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent} from 'react';
import IconCard from './IconCard';
import {fitCards} from '../lib/fit';
import {visibleRows} from '../lib/filter';
import type {Icon, Text} from '../types';

const BUFFER_ROWS = 6;
const CARD_REM = 6.5;
const GAP_REM = 0.5;
const DIRECTIONS: Record<string, string> = {ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down'};

interface GridProps {
    items: Icon[];
    selected: string | null;
    modified: Set<string>;
    picking: boolean;
    isPicked: (key: string) => boolean;
    isPickable: (key: string) => boolean;
    cardCss: (key: string) => string | null;
    theme: string | null;
    text: Text;
    stylesheetVersion: number;
    onSelect: (key: string, range: boolean) => void;
    onMove: (key: string) => void;
    onFirstRender: () => void;
}

/**
 * The size of the cards in pixels and how many fit in a row.
 *
 * @param viewport The scrolling area.
 * @returns Columns, the height of a row and the size of a rem.
 */
const metrics = (viewport: HTMLElement | null): {columns: number; rowHeight: number} => {
    const rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
    const card = CARD_REM * rem;
    const gap = GAP_REM * rem;
    const width = Math.max(card, (viewport?.clientWidth ?? 0) - 2 * gap);
    return {columns: Math.max(1, Math.floor((width + gap) / (card + gap))), rowHeight: card + gap};
};

/**
 * The grid of icons.
 *
 * @param props The icons, which is open, which have a look, whether icons are being chosen, how to draw a card whose change is
 *     not saved, the texts and what to do with a click or an arrow key.
 * @returns The grid.
 */
export default function Grid({
    items, selected, modified, picking, isPicked, isPickable, cardCss, theme, text, stylesheetVersion, onSelect, onMove,
    onFirstRender,
}: GridProps) {
    const viewport = useRef<HTMLDivElement>(null);
    const windowEl = useRef<HTMLDivElement>(null);
    const [scroll, setScroll] = useState({top: 0, height: 0, width: 0});
    const frame = useRef(0);
    const drawn = useRef(false);

    const measure = useCallback(() => {
        window.cancelAnimationFrame(frame.current);
        frame.current = window.requestAnimationFrame(() => {
            const element = viewport.current;
            if (element) {
                setScroll({top: element.scrollTop, height: element.clientHeight, width: element.clientWidth});
            }
        });
    }, []);

    useLayoutEffect(() => {
        measure();
        window.addEventListener('resize', measure);
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
        if (viewport.current) {
            observer?.observe(viewport.current);
        }
        return () => {
            window.removeEventListener('resize', measure);
            observer?.disconnect();
            window.cancelAnimationFrame(frame.current);
        };
    }, [measure]);

    const {columns, rowHeight} = metrics(viewport.current);
    const rows = Math.ceil(items.length / columns);
    const {first, last} = visibleRows(scroll.top, scroll.height, rowHeight, rows, BUFFER_ROWS);
    const slice = items.slice(first * columns, last * columns);

    useLayoutEffect(() => {
        if (windowEl.current) {
            fitCards(windowEl.current);
        }
    });

    useEffect(() => {
        if (!drawn.current && slice.length > 0) {
            drawn.current = true;
            onFirstRender();
        }
    }, [slice.length, onFirstRender]);

    // The selection panel opens and closes beside the grid, which changes its width.
    useEffect(() => {
        measure();
    }, [selected === null, measure]);

    const scrollTo = (key: string): void => {
        const element = viewport.current;
        const position = items.findIndex((icon) => icon.key === key);
        if (!element || position < 0) {
            return;
        }
        const top = Math.floor(position / columns) * rowHeight;
        if (top < element.scrollTop || top + rowHeight > element.scrollTop + element.clientHeight) {
            element.scrollTop = Math.max(0, top - element.clientHeight / 2 + rowHeight / 2);
        }
    };

    const keydown = (event: KeyboardEvent<HTMLDivElement>): void => {
        const direction = DIRECTIONS[event.key];
        if (!direction || picking) {
            return;
        }
        event.preventDefault();
        const position = selected === null ? -1 : items.findIndex((icon) => icon.key === selected);
        if (position < 0) {
            if (items.length > 0) {
                onMove(items[0].key);
                scrollTo(items[0].key);
            }
            return;
        }
        const step = ({left: -1, right: 1, up: -columns, down: columns} as Record<string, number>)[direction];
        const next = items[Math.min(items.length - 1, Math.max(0, position + step))].key;
        onMove(next);
        scrollTo(next);
    };

    return <div className="irs-grid" data-region="grid" tabIndex={0} ref={viewport} onScroll={measure} onKeyDown={keydown}
        data-version={stylesheetVersion}>
        <div className="irs-grid-spacer" data-region="grid-spacer" style={{height: rows * rowHeight}}>
            <div className="irs-grid-window" data-region="grid-window" ref={windowEl}
                style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, transform: `translateY(${first * rowHeight}px)`,
                }}>
                {slice.map((icon) => <IconCard key={icon.key} icon={icon} modified={modified.has(icon.key)}
                    selected={icon.key === selected} picking={picking} picked={picking && isPicked(icon.key)}
                    pickable={picking && isPickable(icon.key)} css={cardCss(icon.key)} theme={theme} text={text}
                    onSelect={onSelect} />)}
            </div>
        </div>
    </div>;
}
