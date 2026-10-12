// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * The small line icons of the designer, drawn as inline SVG so they take the colour of the text around them.
 *
 * @module     local_iconrestyle/components/common/Icons
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import type {ReactNode} from 'react';

interface SvgProps {
    size?: number;
    className?: string;
    children: ReactNode;
}

const Svg = ({size = 16, className, children}: SvgProps) => <svg
    className={className}
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
>{children}</svg>;

export const IconAlert = () => <Svg size={18}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
</Svg>;
export const IconBack = () => <Svg size={18}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></Svg>;
export const IconCheck = ({size = 18}: {size?: number}) => <Svg size={size}><polyline points="20 6 9 17 4 12" /></Svg>;
export const IconChevron = () => <Svg><polyline points="6 9 12 15 18 9" /></Svg>;
export const IconClose = () => <Svg><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>;
export const IconCopy = () => <Svg>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
</Svg>;
export const IconDownload = () => <Svg size={18}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
</Svg>;
export const IconFilter = () => <Svg><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></Svg>;
export const IconFilterClear = () => <Svg>
    <path d="M13 14.5V20l-3 1.5v-7L3 4h14" />
    <line x1="16" y1="8" x2="22" y2="14" />
    <line x1="22" y1="8" x2="16" y2="14" />
</Svg>;
export const IconLinked = () => <Svg className="irs-icon-linked">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
</Svg>;
export const IconUnlinked = () => <Svg className="irs-icon-unlinked">
    <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M5.17 11.75l-1.71 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    <line x1="8" y1="2" x2="8" y2="5" />
    <line x1="2" y1="8" x2="5" y2="8" />
    <line x1="16" y1="19" x2="16" y2="22" />
    <line x1="19" y1="16" x2="22" y2="16" />
</Svg>;
export const IconMore = () => <Svg size={18}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
</Svg>;
export const IconPlus = () => <Svg><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Svg>;
export const IconRedo = () => <Svg size={18}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
</Svg>;
export const IconRefresh = () => <Svg size={18}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
</Svg>;
export const IconSearch = () => <Svg size={18}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Svg>;
export const IconSelect = () => <Svg>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <polyline points="8 12.5 11 15.5 16.5 9" />
</Svg>;
export const IconTrash = () => <Svg>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
</Svg>;
export const IconUndo = () => <Svg size={18}>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
</Svg>;
export const IconUpload = () => <Svg size={18}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
</Svg>;
