<?php
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
 * Web service: import customisations from a package.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use local_iconrestyle\exchange\importer;
use local_iconrestyle\service_factory;

// The classes below use those of core_external, which Moodle 4.0 and 4.1 only have under their old names.
// phpcs:ignore moodle.Files.MoodleInternal.MoodleInternalGlobalState
\local_iconrestyle\compat\external_aliases::register();

/**
 * The designer asks first what the import would do, shows it, and only then asks to do it.
 */
class import_rules extends external_api {
    /** @var int Most bytes of a package that is sent through the web. */
    public const MAX_BYTES = 20971520;

    /**
     * Parameters.
     *
     * @return external_function_parameters Description.
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'content' => new external_value(PARAM_RAW, 'The package, one JSON object on each line'),
            'mode' => new external_value(PARAM_ALPHA, 'merge or replace', VALUE_DEFAULT, importer::MERGE),
            'dryrun' => new external_value(PARAM_BOOL, 'Whether to only say what would be done', VALUE_DEFAULT, true),
            'slots' => new external_multiple_structure(
                new external_value(PARAM_RAW, 'Slot key of an icon'),
                'Icons to take, none for all',
                VALUE_DEFAULT,
                []
            ),
        ]);
    }

    /**
     * Import a package.
     *
     * @param string $content The package.
     * @param string $mode merge or replace.
     * @param bool $dryrun Whether to only say what would be done.
     * @param string[] $slots Slot keys of the icons to take from the package, none for all.
     * @return array What was done, or what would be.
     */
    public static function execute(
        string $content,
        string $mode = importer::MERGE,
        bool $dryrun = true,
        array $slots = []
    ): array {
        global $USER;
        $params = self::validate_parameters(
            self::execute_parameters(),
            ['content' => $content, 'mode' => $mode, 'dryrun' => $dryrun, 'slots' => $slots]
        );
        $context = \context_system::instance();
        self::validate_context($context);
        $factory = service_factory::instance();
        require_capability('local/iconrestyle:exchange', $context);
        if (strlen($params['content']) > self::MAX_BYTES) {
            throw new \invalid_parameter_exception('The package is too big to send through the web.');
        }
        if (!in_array($params['mode'], [importer::MERGE, importer::REPLACE], true)) {
            throw new \invalid_parameter_exception('Unknown import mode.');
        }
        $report = $factory->importer()->run(
            preg_split('/\R/', $params['content']),
            $params['mode'],
            $params['dryrun'],
            (int)$USER->id,
            export_rules::valid_slots($params['slots'])
        );
        $url = \local_iconrestyle\hook\head_callbacks::stylesheet_url(\context_system::instance());
        return $report->to_array() + ['stylesheeturl' => $url === null ? '' : $url->out(false)];
    }

    /**
     * Returned structure.
     *
     * @return external_single_structure Description.
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'created' => new external_value(PARAM_INT, 'Rules that were added'),
            'updated' => new external_value(PARAM_INT, 'Rules that were changed'),
            'deleted' => new external_value(PARAM_INT, 'Rules that were removed'),
            'skipped' => new external_value(PARAM_INT, 'Rules that were left out'),
            'assets' => new external_value(PARAM_INT, 'Artwork files in the package'),
            'issues' => new external_multiple_structure(
                new external_value(PARAM_RAW, 'Reason'),
                'Why rules were left out, the first ones'
            ),
            'entries' => new external_multiple_structure(new external_single_structure([
                'slot' => new external_value(PARAM_RAW, 'Slot key of the icon'),
                'created' => new external_value(PARAM_INT, 'Rules of the icon that would be added'),
                'updated' => new external_value(PARAM_INT, 'Rules of the icon that would be changed'),
                'skipped' => new external_value(PARAM_INT, 'Rules of the icon that would be left out'),
            ]), 'What happens to each icon of the package'),
            'stylesheeturl' => new external_value(PARAM_RAW, 'Address of the stylesheet of the site, empty when no rule applies'),
        ]);
    }
}
