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
 * A compiler that counts how many times it is asked to compile, to prove that a stylesheet is compiled once.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\performance;

use local_iconrestyle\delivery\compile_lock;
use local_iconrestyle\delivery\compiled_cache;
use local_iconrestyle\delivery\delta_sheets;
use local_iconrestyle\rule\module_scope;
use local_iconrestyle\rule\rule;
use local_iconrestyle\service_factory;
use local_iconrestyle\style\color_painter;
use local_iconrestyle\style\container_painter;
use local_iconrestyle\style\image_painter;
use local_iconrestyle\style\mask_painter;
use local_iconrestyle\style\stylesheet_compiler;

/**
 * Builds delta sheets over a compiler that keeps count.
 */
class counting_compiler_factory {
    /** @var int Compilations so far. */
    private $count = 0;

    /** @var int[] Context of the first rule of each stylesheet that was compiled. */
    private $contexts = [];

    /**
     * Sheets that use the shared cache and the real rules, with a compiler that counts.
     *
     * @param service_factory $factory Factory that provides everything else.
     * @param compile_lock|null $lock Lock to use, or null for the real one.
     * @return delta_sheets Sheets.
     */
    public function sheets(service_factory $factory, ?compile_lock $lock = null): delta_sheets {
        $counter = function (array $rules): void {
            $this->count++;
            $this->contexts[] = $rules === [] ? 0 : $rules[0]->contextid();
        };
        $compiler = new class (
            $factory->signatures(),
            [
                rule::PAINTER_COLOR => new color_painter(),
                rule::PAINTER_MASK => new mask_painter($factory->asset_urls()),
                rule::PAINTER_IMAGE => new image_painter($factory->asset_urls()),
            ],
            new container_painter(),
            new module_scope(),
            $counter
        ) extends stylesheet_compiler {
            /** @var callable Called on every compilation. */
            private $counter;

            /**
             * Create the compiler.
             *
             * @param \local_iconrestyle\slot\glyph_signature_factory $signatures Signature source.
             * @param array $artwork Artwork painters.
             * @param container_painter $container Container painter.
             * @param module_scope $modules Scope resolver.
             * @param callable $counter Called on every compilation with its rules.
             */
            public function __construct($signatures, array $artwork, $container, $modules, callable $counter) {
                parent::__construct($signatures, $artwork, $container, $modules);
                $this->counter = $counter;
            }

            /**
             * Compile and count.
             *
             * @param array $rules Rules.
             * @param string $prefix Selector prefix.
             * @param bool $scoped Whether rules are limited to their place.
             * @return string CSS.
             */
            public function compile(array $rules, string $prefix = self::PREFIX, bool $scoped = true): string {
                ($this->counter)($rules);
                return parent::compile($rules, $prefix, $scoped);
            }
        };
        return new delta_sheets(
            $factory->rules(),
            $compiler,
            new compiled_cache(\cache::make('local_iconrestyle', 'compiled')),
            $lock ?? new compile_lock(),
            $factory->revisions(),
            $factory->version_hash()
        );
    }

    /**
     * How many times a stylesheet was compiled.
     *
     * @return int Compilations.
     */
    public function compiles(): int {
        return $this->count;
    }

    /**
     * Which stylesheets were compiled, by the context of their first rule.
     *
     * @return int[] Context ids, one for each compilation.
     */
    public function compiled_contexts(): array {
        return $this->contexts;
    }
}
