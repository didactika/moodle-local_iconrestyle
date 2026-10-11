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
 * The icon designer.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/adminlib.php');

use local_iconrestyle\output\designer_page;
use local_iconrestyle\service_factory;

admin_externalpage_setup('local_iconrestyle_designer');
$context = context_system::instance();
service_factory::instance()->permissions()->require_manage($context);

$page = new designer_page($context);
$PAGE->requires->js_call_amd('local_iconrestyle/designer', 'init', [$page->script_config()]);

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('designer', 'local_iconrestyle'));
echo $OUTPUT->render_from_template('local_iconrestyle/designer', $page->export_for_template($OUTPUT));
echo $OUTPUT->footer();
