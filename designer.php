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
$PAGE->set_pagelayout('report');
$PAGE->add_body_class('local-iconrestyle-designer');
service_factory::instance()->permissions()->require_manage();

echo $OUTPUT->header();
// The element that the component fills in is empty, so the placeholder goes right before its closing tag.
echo preg_replace('~</div>\s*$~', designer_page::placeholder() . '</div>', $OUTPUT->render(new designer_page()), 1);
echo $OUTPUT->footer();
