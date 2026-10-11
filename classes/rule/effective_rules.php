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
 * The rules that apply in a context and where each one comes from.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * Applies the same cascade as the browser does: the rule from the nearest context wins.
 */
class effective_rules {
    /** @var rule_store Rule storage. */
    private $store;

    /**
     * Create the reader.
     *
     * @param rule_store $store Rule storage.
     */
    public function __construct(rule_store $store) {
        $this->store = $store;
    }

    /**
     * Rules that apply in a context, one per slot and target.
     *
     * @param \context $context Context being edited.
     * @return array[] Entries with the winning rule under rule and whether it belongs to this context under own.
     */
    public function for_context(\context $context): array {
        $ids = array_values(array_filter(array_map('intval', explode('/', $context->path))));
        $depth = array_flip($ids);
        $winners = [];
        foreach ($this->store->find_in_contexts($ids) as $rule) {
            $key = $rule->slot() . "\0" . $rule->target();
            if (!isset($winners[$key]) || $depth[$rule->contextid()] > $depth[$winners[$key]->contextid()]) {
                $winners[$key] = $rule;
            }
        }
        ksort($winners);
        $result = [];
        foreach ($winners as $rule) {
            $result[] = ['rule' => $rule, 'own' => $rule->contextid() === (int)$context->id];
        }
        return $result;
    }
}
