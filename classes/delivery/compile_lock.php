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
 * Single-flight compilation.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\delivery;

/**
 * Lets one process compile a stylesheet while the others wait, across web nodes.
 */
class compile_lock {
    /** @var int Seconds to wait for a lock. */
    private const TIMEOUT = 10;

    /**
     * Run a callback under a lock.
     *
     * When the lock cannot be obtained in time the callback still runs, because compilation is idempotent.
     *
     * @param string $key Lock name.
     * @param callable $callback Work to run.
     * @return mixed Callback result.
     */
    public function run(string $key, callable $callback) {
        $factory = \core\lock\lock_config::get_lock_factory('local_iconrestyle');
        $deadline = microtime(true) + self::TIMEOUT;
        do {
            $lock = $factory->get_lock($key, 1);
            if (!$lock) {
                // The first processes to ask for a lock that does not exist yet can fail at once, without waiting.
                usleep(10000);
            }
        } while (!$lock && microtime(true) < $deadline);
        try {
            return $callback();
        } finally {
            if ($lock) {
                $lock->release();
            }
        }
    }
}
