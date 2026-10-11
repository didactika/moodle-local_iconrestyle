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
 * Builds the plugin's services.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle;

use local_iconrestyle\asset\asset_service;
use local_iconrestyle\asset\asset_store;
use local_iconrestyle\asset\asset_urls;
use local_iconrestyle\asset\raster_reencoder;
use local_iconrestyle\asset\svg_sanitizer;
use local_iconrestyle\delivery\bundle_service;
use local_iconrestyle\delivery\chain_resolver;
use local_iconrestyle\delivery\compile_lock;
use local_iconrestyle\delivery\compiled_cache;
use local_iconrestyle\rule\delta_context;
use local_iconrestyle\rule\revision_registry;
use local_iconrestyle\rule\rule;
use local_iconrestyle\rule\rule_service;
use local_iconrestyle\rule\rule_store;
use local_iconrestyle\slot\glyph_signature_factory;
use local_iconrestyle\slot\icon_map;
use local_iconrestyle\style\color_painter;
use local_iconrestyle\style\container_painter;
use local_iconrestyle\style\image_painter;
use local_iconrestyle\style\mask_painter;
use local_iconrestyle\style\stylesheet_compiler;

/**
 * Creates each service once per request, with its collaborators.
 */
class service_factory {
    /** @var int Default most rules one delta stylesheet may hold. */
    public const DEFAULT_MAX_RULES = 500;

    /** @var self|null Shared instance. */
    private static $instance = null;

    /** @var object[] Built services keyed by name. */
    private $services = [];

    /**
     * Shared instance for the current request.
     *
     * @return self Factory.
     */
    public static function instance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Drop the shared instance, for tests.
     */
    public static function reset(): void {
        self::$instance = null;
    }

    /**
     * Hash that keys compiled output to the installed code and plugin set.
     *
     * @return string Eight hex characters.
     */
    public function version_hash(): string {
        return substr(\core_component::get_all_versions_hash(), 0, 8);
    }

    /**
     * Revision registry.
     *
     * @return revision_registry Registry.
     */
    public function revisions(): revision_registry {
        global $DB;
        return $this->services['revisions'] ?? $this->services['revisions'] =
            new revision_registry($DB, \cache::make('local_iconrestyle', 'ctxrev'));
    }

    /**
     * Rule storage.
     *
     * @return rule_store Store.
     */
    public function rules(): rule_store {
        global $DB;
        return $this->services['rules'] ?? $this->services['rules'] = new rule_store($DB);
    }

    /**
     * Chain resolver.
     *
     * @return chain_resolver Resolver.
     */
    public function chain_resolver(): chain_resolver {
        return $this->services['chain'] ?? $this->services['chain'] = new chain_resolver($this->revisions());
    }

    /**
     * Signature factory over the live icon map.
     *
     * @return glyph_signature_factory Factory.
     */
    public function signatures(): glyph_signature_factory {
        return $this->services['signatures'] ?? $this->services['signatures'] =
            new glyph_signature_factory(new icon_map());
    }

    /**
     * Stylesheet compiler.
     *
     * @return stylesheet_compiler Compiler.
     */
    public function compiler(): stylesheet_compiler {
        return $this->services['compiler'] ?? $this->services['compiler'] = new stylesheet_compiler(
            $this->signatures(),
            [
                rule::PAINTER_COLOR => new color_painter(),
                rule::PAINTER_MASK => new mask_painter($this->asset_urls()),
                rule::PAINTER_IMAGE => new image_painter($this->asset_urls()),
            ],
            new container_painter()
        );
    }

    /**
     * Artwork storage.
     *
     * @return asset_store Store.
     */
    public function asset_store(): asset_store {
        global $DB;
        return $this->services['asset_store'] ?? $this->services['asset_store'] = new asset_store($DB);
    }

    /**
     * Artwork addresses for CSS.
     *
     * @return asset_urls Helper.
     */
    public function asset_urls(): asset_urls {
        return $this->services['asset_urls'] ?? $this->services['asset_urls'] = new asset_urls($this->asset_store());
    }

    /**
     * Artwork intake.
     *
     * @return asset_service Service.
     */
    public function assets(): asset_service {
        return $this->services['assets'] ?? $this->services['assets'] =
            new asset_service(new svg_sanitizer(), new raster_reencoder(), $this->asset_store());
    }

    /**
     * Bundle service.
     *
     * @return bundle_service Service.
     */
    public function bundles(): bundle_service {
        return $this->services['bundles'] ?? $this->services['bundles'] = new bundle_service(
            $this->revisions(),
            $this->rules(),
            $this->compiler(),
            new compiled_cache(\cache::make('local_iconrestyle', 'compiled')),
            new compile_lock()
        );
    }

    /**
     * Rule service.
     *
     * @return rule_service Service.
     */
    public function rule_service(): rule_service {
        global $DB;
        $max = (int)get_config('local_iconrestyle', 'maxrulespercontext');
        return $this->services['rule_service'] ?? $this->services['rule_service'] = new rule_service(
            $DB,
            $this->rules(),
            new delta_context(),
            $this->revisions(),
            $max > 0 ? $max : self::DEFAULT_MAX_RULES
        );
    }
}
