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
 * Where the compiled stylesheet of a context is kept.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * What the rules need from the delivery of stylesheets: to know how big the stylesheet of some rules would be, and to keep it
 * in step with them. Delivery implements it, so the rules never depend on delivery.
 */
interface sheet_store {
    /**
     * Compile the rules of one delta stylesheet.
     *
     * @param rule[] $rules Rules.
     * @return string CSS.
     */
    public function compile(array $rules): string;

    /**
     * Keep a stylesheet that was just compiled, and drop the one it replaces.
     *
     * @param int $contextid Delta owner context.
     * @param int $rev New effective revision, zero when the context has no rules left.
     * @param string $css Compiled CSS of that revision.
     * @param int $previous Effective revision it replaces, zero when there was none.
     */
    public function replace(int $contextid, int $rev, string $css, int $previous): void;

    /**
     * Drop the stylesheet of a context at a revision.
     *
     * @param int $contextid Delta owner context.
     * @param int $rev Effective revision.
     */
    public function forget(int $contextid, int $rev): void;
}
