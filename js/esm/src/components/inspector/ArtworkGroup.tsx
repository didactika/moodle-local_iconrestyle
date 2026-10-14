/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The artwork of an icon: a file of the person's own that replaces the icon of Moodle.
 *
 * @module     local_iconrestyle/components/inspector/ArtworkGroup
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useState} from 'react';
import {IconClose, IconPlus} from '../common/Icons';
import * as api from '../../services/api';
import {NO_ARTWORK} from '../../lib/presets';
import type {Draft, Patch, Text} from '../../types';

const MAX_UPLOAD_BASE64 = 360000;

interface ArtworkGroupProps {
    draft: Draft;
    text: Text;
    onStage: (patch: Patch) => void;
}

/**
 * The artwork group of the style tab.
 *
 * @param props The draft, the texts and what to do with the artwork that was chosen or removed.
 * @returns The group.
 */
export default function ArtworkGroup({draft, text, onStage}: ArtworkGroupProps) {
    const [hint, setHint] = useState('');
    const has = draft.assetid > 0;

    const upload = (file: File): void => {
        const reader = new FileReader();
        reader.onload = () => {
            const content = String(reader.result).split(',')[1] || '';
            if (content.length > MAX_UPLOAD_BASE64) {
                setHint(text('uploadfailed', file.name));
                return;
            }
            api.addAsset(content).then((asset) => {
                setHint('');
                onStage({
                    assetid: asset.id, asseturl: asset.url, assetkind: asset.kind, assetmono: asset.monochrome, autoartwork: false,
                });
                return null;
            }).catch((error: Error) => setHint(text('uploadfailed', error.message || file.name)));
        };
        reader.readAsDataURL(file);
    };

    return <details className="irs-group" data-region="group-artwork" open>
        <summary>{text('artwork')}</summary>
        <div className="irs-field" data-region="artwork">
            <div className="irs-artwork-row">
                <label className="btn btn-outline-secondary btn-sm irs-upload" htmlFor="irs-upload">
                    <IconPlus /> {text('uploadartwork')}
                </label>
                <input type="file" id="irs-upload" className="irs-upload-input" data-region="upload"
                    accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (file) {
                            upload(file);
                        }
                    }} />
                <span className={`irs-file-chip${has ? ' irs-has-file' : ''}`} data-region="artwork-chip">
                    <span className="irs-artwork-name" data-region="artwork-name" role="status">
                        {has ? text('artworkready', draft.assetkind.toUpperCase()) : text('noartwork')}
                    </span>
                    <button type="button" className="irs-x" data-action="remove-artwork" hidden={!has}
                        aria-label={text('removeartwork')} title={text('removeartwork')}
                        onClick={() => {
                            setHint('');
                            onStage(NO_ARTWORK);
                        }}>
                        <IconClose />
                    </button>
                </span>
            </div>
            <p className={`irs-hint${hint === '' ? '' : ' irs-error'}`} data-region="artwork-hint" hidden={hint === ''}>{hint}</p>
        </div>
    </details>;
}
