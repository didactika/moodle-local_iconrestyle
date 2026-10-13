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
 * The limits that keep a site fast however many rules it has.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * What one stylesheet and the whole site may hold, so that no change can make a page slow.
 *
 * Each limit protects one cost: the rules of a context bound the work of compiling it, the size of its stylesheet bounds
 * what every visitor downloads, the cost of its effects bounds what the browser paints, and the number of contexts that
 * have rules of their own bounds how many different stylesheets the site serves.
 */
final class rule_limits {
    /** @var int Most stylesheets one page may load: the site and the nearest contexts below it that have rules. */
    public const MAX_CHAIN = 12;

    /** @var int Default most rules one delta stylesheet may hold. */
    public const DEFAULT_RULES = 500;

    /** @var int Default most kilobytes one compiled delta stylesheet may have. */
    public const DEFAULT_SHEET_KB = 256;

    /** @var int Default most categories and courses, besides the site, that may have rules of their own. */
    public const DEFAULT_CONTEXTS = 500;

    /** @var int Default most effect cost the rules of one delta stylesheet may add up to. */
    public const DEFAULT_COST = 2000;

    /** @var int Most rules of one delta stylesheet. */
    private $rules;

    /** @var int Most bytes of one compiled delta stylesheet. */
    private $sheetbytes;

    /** @var int Most contexts with rules of their own. */
    private $contexts;

    /** @var int Most effect cost of one delta stylesheet. */
    private $cost;

    /**
     * Create the limits.
     *
     * @param int $rules Most rules one delta stylesheet may hold.
     * @param int $sheetkb Most kilobytes one compiled delta stylesheet may have.
     * @param int $contexts Most contexts that may have rules of their own.
     * @param int $cost Most effect cost the rules of one delta stylesheet may add up to.
     */
    public function __construct(
        int $rules = self::DEFAULT_RULES,
        int $sheetkb = self::DEFAULT_SHEET_KB,
        int $contexts = self::DEFAULT_CONTEXTS,
        int $cost = self::DEFAULT_COST
    ) {
        $this->rules = max(1, $rules);
        $this->sheetbytes = max(1, $sheetkb) * 1024;
        $this->contexts = max(1, $contexts);
        $this->cost = max(1, $cost);
    }

    /**
     * Read the limits from the settings of the plugin.
     *
     * @return self Limits, with the default of every setting that is not set.
     */
    public static function from_config(): self {
        $config = get_config('local_iconrestyle');
        return new self(
            (int)($config->maxrulespercontext ?? 0) ?: self::DEFAULT_RULES,
            (int)($config->maxsheetkb ?? 0) ?: self::DEFAULT_SHEET_KB,
            (int)($config->maxcontextswithrules ?? 0) ?: self::DEFAULT_CONTEXTS,
            (int)($config->maxeffectcost ?? 0) ?: self::DEFAULT_COST
        );
    }

    /**
     * Most rules one delta stylesheet may hold.
     *
     * @return int Rules.
     */
    public function rules(): int {
        return $this->rules;
    }

    /**
     * Most bytes one compiled delta stylesheet may have.
     *
     * @return int Bytes.
     */
    public function sheet_bytes(): int {
        return $this->sheetbytes;
    }

    /**
     * Most contexts that may have rules of their own, besides the site.
     *
     * @return int Contexts.
     */
    public function contexts(): int {
        return $this->contexts;
    }

    /**
     * Most effect cost the rules of one delta stylesheet may add up to.
     *
     * @return int Cost.
     */
    public function cost(): int {
        return $this->cost;
    }
}
