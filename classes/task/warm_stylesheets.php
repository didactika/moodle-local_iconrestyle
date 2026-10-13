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
 * Scheduled task that prepares the icon stylesheets.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\task;

use local_iconrestyle\service_factory;

/**
 * Purging the caches or upgrading Moodle empties the compiled stylesheets. This compiles the missing ones in the background,
 * so the first visitors of a busy site do not have to.
 */
class warm_stylesheets extends \core\task\scheduled_task {
    /**
     * Name of the task.
     *
     * @return string Name.
     */
    public function get_name(): string {
        return get_string('taskwarm', 'local_iconrestyle');
    }

    /**
     * Compile every stylesheet that is not in the cache.
     */
    public function execute(): void {
        $result = service_factory::instance()->delta_sheets()->warm_all();
        mtrace('local_iconrestyle: ' . $result['compiled'] . ' compiled, ' . $result['cached'] . ' already cached.');
    }
}
