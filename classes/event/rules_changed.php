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
 * Event: the icon customisations of the site changed.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\event;

/**
 * One event for each change that was saved, not one for each rule, because the designer saves many rules at once and an import
 * saves thousands. It says how many rules were added, changed and removed.
 */
class rules_changed extends \core\event\base {
    /**
     * Initialise the event.
     */
    protected function init(): void {
        $this->data['crud'] = 'u';
        $this->data['edulevel'] = self::LEVEL_OTHER;
    }

    /**
     * Create the event for a change.
     *
     * @param int $created Rules that were added.
     * @param int $updated Rules that were changed.
     * @param int $deleted Rules that were removed.
     * @return self The event, not yet triggered.
     */
    public static function for_change(int $created, int $updated, int $deleted): self {
        return self::create([
            'context' => \context_system::instance(),
            'other' => ['created' => $created, 'updated' => $updated, 'deleted' => $deleted],
        ]);
    }

    /**
     * Name of the event.
     *
     * @return string Name.
     */
    public static function get_name(): string {
        return get_string('eventruleschanged', 'local_iconrestyle');
    }

    /**
     * Description of the event.
     *
     * @return string Description.
     */
    public function get_description(): string {
        return "The user with id '{$this->userid}' changed the icon customisations of the site: {$this->other['created']} added, " .
            "{$this->other['updated']} changed and {$this->other['deleted']} removed.";
    }

    /**
     * The page where the customisations are made.
     *
     * @return \moodle_url Address.
     */
    public function get_url(): \moodle_url {
        return new \moodle_url('/local/iconrestyle/designer.php');
    }

    /**
     * Check what the event carries.
     *
     * @throws \coding_exception When the counts are missing.
     */
    protected function validate_data(): void {
        parent::validate_data();
        foreach (['created', 'updated', 'deleted'] as $name) {
            if (!isset($this->other[$name])) {
                throw new \coding_exception('The ' . $name . ' count is required.');
            }
        }
    }

    /**
     * Mapping of the event data for restoring backups, which this event does not need.
     *
     * @return false No mapping.
     */
    public static function get_other_mapping() {
        return false;
    }
}
