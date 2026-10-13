// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * The markup of the export and import controls that the script depends on.
 *
 * @module     local_iconrestyle/exchange/selectors
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import {action, region} from 'local_iconrestyle/common/selectors';

export default {
    exportButton: action('exchange-export'),
    importButton: action('exchange-import'),
    file: region('exchange-file'),
    form: region('import-form'),
    report: region('import-report'),
    summary: region('import-summary'),
    modeHelp: region('import-mode-help'),
    search: region('import-search'),
    count: region('import-count'),
    rows: region('import-rows'),
    error: region('import-error'),
    row: 'input[data-region="import-row"]',
    chooseAll: action('review-all'),
    chooseNew: action('review-new'),
    chooseNone: action('review-none'),
    modes: 'input[name="irs-import-mode"]',
    modeChosen: 'input[name="irs-import-mode"]:checked',
};
