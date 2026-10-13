// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * Every web service call of the designer, in one place.
 *
 * @module     local_iconrestyle/services/api
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {fetchOne} from '@moodle/lms/core/ajax';
import type {Icon, ImportReport, Rule} from '../types';
import type {RuleInput} from '../lib/draft';

const SAVE_TIMEOUT_MS = 30000;

/** An error that says the server did not answer in time. */
export class TimeoutError extends Error {
    public readonly timedout = true;

    public constructor() {
        super('The server did not answer in time.');
    }
}

/**
 * Call one web service of the plugin.
 *
 * @param methodname Name of the web service function.
 * @param args Arguments.
 * @returns What the function returns.
 */
const call = <T>(methodname: string, args: Record<string, unknown>): Promise<T> => fetchOne<T>({methodname, args});

/**
 * Give a promise a time to finish, so that nothing waits for ever for a server that does not answer.
 *
 * @param promise What is waited for.
 * @param milliseconds Longest time to wait.
 * @returns The promise, or one that is rejected with a TimeoutError when time ran out.
 */
const withTimeout = <T>(promise: Promise<T>, milliseconds: number): Promise<T> => new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new TimeoutError()), milliseconds);
    promise.then((value) => {
        window.clearTimeout(timer);
        resolve(value);
        return null;
    }, (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
    });
});

/** An artwork file the server stored. */
export interface Asset {
    id: number;
    url: string;
    kind: string;
    monochrome: boolean;
}

/** A place a rule can be limited to. */
export interface Place {
    contextid: number;
    name: string;
    detail: string;
}

export const getCatalogue = (): Promise<{version: string; icons: Icon[]}> => call('local_iconrestyle_get_catalogue', {});

export const getRules = (): Promise<{rules: Rule[]}> => call('local_iconrestyle_get_rules', {});

export const saveRules = (rules: RuleInput[], deleteids: number[]): Promise<{
    rules: Rule[];
    deleted: number[];
    stylesheeturl: string;
}> => withTimeout(call('local_iconrestyle_save_rules', {rules, deleteids}), SAVE_TIMEOUT_MS);

export const previewCss = (rules: RuleInput[], scope: string): Promise<string> => call(
    'local_iconrestyle_preview_css',
    {rules, scope},
);

export const searchLocations = (kind: string, query: string): Promise<{places: Place[]}> => call(
    'local_iconrestyle_search_locations',
    {kind, query},
);

export const addAsset = (content: string): Promise<Asset> => call('local_iconrestyle_add_asset', {content});

export const useIconArtwork = (slotkey: string): Promise<Asset> => call('local_iconrestyle_use_icon_artwork', {slotkey});

export const exportRules = (slots: string[] = []): Promise<{filename: string; content: string; skipped: string[]}> => call(
    'local_iconrestyle_export_rules',
    {slots},
);

export const importRules = (content: string, mode: string, dryrun: boolean, slots: string[] = []): Promise<ImportReport> => call(
    'local_iconrestyle_import_rules',
    {content, mode, dryrun, slots},
);
