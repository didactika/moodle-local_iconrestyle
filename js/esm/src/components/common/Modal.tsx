/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * A modal dialog with the markup of Bootstrap's, so it follows the theme, with focus kept inside and Escape to close.
 *
 * @module     local_iconrestyle/components/common/Modal
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {useEffect, useRef, type ReactNode} from 'react';
import {createPortal} from 'react-dom';

interface ModalProps {
    title: string;
    saveLabel: string;
    cancelLabel: string;
    closeLabel: string;
    saveDisabled?: boolean;
    children: ReactNode;
    onSave: () => void;
    onClose: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal with a save and a cancel button.
 *
 * @param props Title, texts of the buttons, what to do when saving and closing and what is inside.
 * @returns The modal, drawn at the end of the page.
 */
export default function Modal(props: ModalProps) {
    const {title, saveLabel, cancelLabel, closeLabel, saveDisabled = false, children, onSave, onClose} = props;
    const dialog = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        document.body.classList.add('modal-open');
        const first = dialog.current?.querySelector<HTMLElement>('.modal-body ' + FOCUSABLE) ?? dialog.current;
        first?.focus();
        return () => {
            document.body.classList.remove('modal-open');
            previous?.focus?.();
        };
    }, []);

    const keydown = (event: React.KeyboardEvent): void => {
        if (event.key === 'Escape') {
            event.stopPropagation();
            onClose();
            return;
        }
        if (event.key !== 'Tab' || !dialog.current) {
            return;
        }
        const items = Array.from(dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) {
            return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    return createPortal(<>
        <div className="modal-backdrop show" />
        <div className="modal show d-block irs-modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
            onKeyDown={keydown} ref={dialog}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button type="button" className="btn-close" aria-label={closeLabel} data-action="hide" onClick={onClose} />
                    </div>
                    <div className="modal-body">{children}</div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-action="cancel" onClick={onClose}>
                            {cancelLabel}
                        </button>
                        <button type="button" className="btn btn-primary" data-action="save" disabled={saveDisabled}
                            onClick={onSave}>{saveLabel}</button>
                    </div>
                </div>
            </div>
        </div>
    </>, document.body);
}
