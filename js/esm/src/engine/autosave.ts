// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * Saves the changes of the designer on its own, without ever sending two requests at once.
 *
 * A click, a choice or an undo is saved at once. What the person is still typing or dragging waits a third of a second
 * after the last step, so a slider makes one request and not one per step, and a save is forced after two seconds if the
 * person never stops. Everything that changed goes in a single request. While a request is in flight, new changes only wait:
 * they go in the next request, which starts the moment the first one ends.
 *
 * @module     local_iconrestyle/engine/autosave
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import type {FlushResult} from './state';

const QUIET_MS = 350;
const MAX_WAIT_MS = 2000;

/** The state of the saving the person sees. */
export type SaveStatus = 'dirty' | 'saving' | 'saved' | 'error';

/** What the autosave needs from the rest of the designer. */
export interface AutosaveOptions {
    flush: () => Promise<FlushResult>;
    pendingCount: () => number;
    onStatus: (status: SaveStatus) => void;
    onSaved: (result: FlushResult) => void;
    onFailure: (error: Error) => Promise<void> | void;
}

/** The autosave. */
export interface Autosave {
    schedule: (immediate?: boolean) => void;
    saveNow: () => Promise<void>;
    flushAll: () => Promise<void>;
    isBusy: () => boolean;
    dispose: () => void;
}

/**
 * Create the autosave.
 *
 * @param options What to save and what to do about it.
 * @returns Autosave API.
 */
export const createAutosave = (options: AutosaveOptions): Autosave => {
    const {flush, pendingCount, onStatus, onSaved, onFailure} = options;
    let timer = 0;
    let dirtySince = 0;
    let saving: Promise<void> | null = null;

    const run = async(): Promise<void> => {
        let failed = false;
        onStatus('saving');
        try {
            onSaved(await flush());
        } catch (error) {
            failed = true;
            onStatus('error');
            await onFailure(error as Error);
        } finally {
            saving = null;
        }
        if (pendingCount() > 0) {
            schedule(true);
        } else if (!failed) {
            onStatus('saved');
        }
    };

    /**
     * Save now what is pending, or wait for the request that is already in flight.
     *
     * @returns Resolves when that request has finished.
     */
    const saveNow = (): Promise<void> => {
        window.clearTimeout(timer);
        if (saving) {
            return saving;
        }
        if (pendingCount() === 0) {
            // A change that changed nothing, such as asking for what is already there, leaves nothing to save and must not
            // leave the status waiting for a save that will never come.
            onStatus('saved');
            return Promise.resolve();
        }
        dirtySince = 0;
        saving = run();
        return saving;
    };

    /**
     * Note that something changed, so it is saved.
     *
     * @param immediate True for a change that is complete, such as a click, which is saved at once. False for one that
     *     is still going, such as a slider being dragged, which is saved after the quiet moment, or sooner if it never stops.
     */
    function schedule(immediate = false): void {
        if (!saving && pendingCount() > 0) {
            onStatus('dirty');
        }
        const now = Date.now();
        dirtySince = dirtySince || now;
        window.clearTimeout(timer);
        const wait = immediate ? 0 : Math.max(0, Math.min(QUIET_MS, dirtySince + MAX_WAIT_MS - now));
        timer = window.setTimeout(() => {
            void saveNow();
        }, wait);
    }

    /**
     * Save everything at once, including what changed while a request was in flight.
     *
     * @returns Resolves when nothing is left to save.
     */
    const flushAll = async(): Promise<void> => {
        await saveNow();
        if (pendingCount() > 0) {
            await saveNow();
        }
    };

    const isBusy = (): boolean => saving !== null || pendingCount() > 0;

    const beforeUnload = (event: BeforeUnloadEvent): void => {
        if (isBusy()) {
            event.preventDefault();
            event.returnValue = '';
        }
    };
    const hidden = (): void => {
        if (document.visibilityState === 'hidden' && isBusy()) {
            void flushAll();
        }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('visibilitychange', hidden);

    return {
        schedule,
        saveNow,
        flushAll,
        isBusy,
        dispose: () => {
            window.clearTimeout(timer);
            window.removeEventListener('beforeunload', beforeUnload);
            document.removeEventListener('visibilitychange', hidden);
        },
    };
};
