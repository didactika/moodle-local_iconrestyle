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
 * Compiles rules into CSS.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\style;

use local_iconrestyle\rule\module_scope;
use local_iconrestyle\rule\rule;
use local_iconrestyle\slot\glyph_signature;
use local_iconrestyle\slot\glyph_signature_factory;

/**
 * The only producer of CSS. Output is deterministic and built from typed values only.
 */
class stylesheet_compiler {
    /** @var string Prefix that raises specificity above theme rules without !important. */
    public const PREFIX = 'body ';

    /** @var glyph_signature_factory Signature source. */
    private $signatures;

    /** @var painter[] Artwork painters keyed by painter name. */
    private $artwork;

    /** @var painter Container painter. */
    private $container;

    /** @var scope_prefixes Selector prefixes of each rule. */
    private $scopes;

    /**
     * Create the compiler.
     *
     * @param glyph_signature_factory $signatures Signature source.
     * @param painter[] $artwork Artwork painters keyed by painter name.
     * @param painter $container Container painter.
     * @param module_scope|null $modules Scope resolver for activity rules.
     */
    public function __construct(
        glyph_signature_factory $signatures,
        array $artwork,
        painter $container,
        ?module_scope $modules = null
    ) {
        $this->signatures = $signatures;
        $this->artwork = $artwork;
        $this->container = $container;
        $this->scopes = new scope_prefixes($modules);
    }

    /**
     * Compile a list of rules.
     *
     * @param rule[] $rules Rules.
     * @param string $prefix Selector prefix.
     * @param bool $scoped Whether each rule is limited to its pages, regions and activity, which only makes sense on pages.
     * @return string CSS.
     */
    public function compile(array $rules, string $prefix = self::PREFIX, bool $scoped = true): string {
        usort($rules, function (rule $first, rule $second): int {
            $order = strcmp((string)$first->slot() . "\0" . $first->target(), (string)$second->slot() . "\0" . $second->target());
            return $order !== 0 ? $order : $first->id() <=> $second->id();
        });
        $css = '';
        foreach ($rules as $rule) {
            if (!$rule->enabled()) {
                continue;
            }
            $signature = $this->signatures->for_slot($rule->slot());
            if ($signature === null) {
                continue;
            }
            $isbox = $signature->kind() === glyph_signature::KIND_CONTAINER;
            $blocks = $rule->styles_container() || $isbox ? $this->container->paint($rule, $signature) : [];
            if (isset($this->artwork[$rule->painter()])) {
                $blocks = $this->merge($blocks, $this->artwork[$rule->painter()]->paint($rule, $signature));
            }
            $selectors = [];
            foreach ($this->scopes->for_rule($rule, $prefix, $scoped) as $each) {
                $selectors = array_merge($selectors, $signature->selectors($each));
            }
            foreach ($blocks as $suffix => $declarations) {
                $css .= $this->block($selectors, (string)$suffix, $declarations);
            }
        }
        return $css;
    }

    /**
     * Merge two sets of declarations grouped by suffix.
     *
     * The artwork painter comes second so that, where both write the same property, the artwork wins.
     *
     * @param array $first First set.
     * @param array $second Second set, which wins on conflict.
     * @return array Merged set.
     */
    private function merge(array $first, array $second): array {
        foreach ($second as $suffix => $declarations) {
            $first[$suffix] = array_merge($first[$suffix] ?? [], $declarations);
        }
        return $first;
    }

    /**
     * Format one CSS block.
     *
     * @param string[] $selectors Selectors.
     * @param string $suffix Suffix appended to every selector.
     * @param string[] $declarations Declarations keyed by property.
     * @return string CSS block.
     */
    private function block(array $selectors, string $suffix, array $declarations): string {
        $list = implode(",\n", array_map(function (string $selector) use ($suffix): string {
            return $selector . $suffix;
        }, $selectors));
        $body = '';
        foreach ($declarations as $property => $value) {
            $body .= '  ' . $property . ': ' . $value . ";\n";
        }
        return $list . " {\n" . $body . "}\n";
    }
}
