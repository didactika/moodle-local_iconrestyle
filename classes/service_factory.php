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
use local_iconrestyle\delivery\chain_addresses;
use local_iconrestyle\delivery\chain_resolver;
use local_iconrestyle\delivery\compile_lock;
use local_iconrestyle\delivery\compiled_cache;
use local_iconrestyle\delivery\delta_sheets;
use local_iconrestyle\exchange\exporter;
use local_iconrestyle\exchange\importer;
use local_iconrestyle\exchange\place_keys;
use local_iconrestyle\rule\delta_context;
use local_iconrestyle\rule\permissions;
use local_iconrestyle\rule\revision_registry;
use local_iconrestyle\rule\rule;
use local_iconrestyle\rule\module_scope;
use local_iconrestyle\rule\rule_cleaner;
use local_iconrestyle\rule\rule_limits;
use local_iconrestyle\rule\rule_service;
use local_iconrestyle\rule\rule_store;
use local_iconrestyle\slot\activity_map;
use local_iconrestyle\slot\glyph_signature_factory;
use local_iconrestyle\slot\icon_files;
use local_iconrestyle\slot\icon_map;
use local_iconrestyle\slot\slot_catalogue;
use local_iconrestyle\style\color_painter;
use local_iconrestyle\style\container_painter;
use local_iconrestyle\style\image_painter;
use local_iconrestyle\style\mask_painter;
use local_iconrestyle\style\stylesheet_compiler;

/**
 * Creates each service once per request, with its collaborators.
 */
class service_factory {
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
     * It is read from the hash that Moodle stores when an upgrade finishes. Working it out from the plugins takes several
     * milliseconds, which every page of a site with rules would pay.
     *
     * @return string Eight hex characters.
     */
    public function version_hash(): string {
        global $CFG;
        if (!isset($this->services['hash'])) {
            $all = !empty($CFG->allversionshash) ? $CFG->allversionshash : \core_component::get_all_versions_hash();
            $this->services['hash'] = substr($all, 0, 8);
        }
        return $this->services['hash'];
    }

    /**
     * Revision registry.
     *
     * @return revision_registry Registry.
     */
    public function revisions(): revision_registry {
        global $DB;
        return $this->services['revisions'] ?? $this->services['revisions'] =
            new revision_registry($DB, \cache::make('local_iconrestyle', 'ctxrev'), \cache::make('local_iconrestyle', 'chains'));
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
     * Stylesheets that apply to a context path, kept for the pages that come after.
     *
     * @return chain_addresses Addresses.
     */
    public function chain_addresses(): chain_addresses {
        return $this->services['addresses'] ?? $this->services['addresses'] = new chain_addresses(
            \cache::make('local_iconrestyle', 'chains'),
            function (): chain_resolver {
                return $this->chain_resolver();
            }
        );
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
            new container_painter(),
            new module_scope()
        );
    }

    /**
     * Who may customise icons where.
     *
     * @return permissions Permissions.
     */
    public function permissions(): permissions {
        return $this->services['permissions'] ?? $this->services['permissions'] = new permissions();
    }

    /**
     * The icons that can be customised.
     *
     * @return slot_catalogue Catalogue.
     */
    public function catalogue(): slot_catalogue {
        return $this->services['catalogue'] ?? $this->services['catalogue'] = new slot_catalogue(
            new icon_map(),
            $this->signatures(),
            \cache::make('local_iconrestyle', 'catalogue'),
            $this->version_hash(),
            new activity_map()
        );
    }

    /**
     * Files of the icons Moodle ships.
     *
     * @return icon_files Files.
     */
    public function icon_files(): icon_files {
        return $this->services['icon_files'] ?? $this->services['icon_files'] = new icon_files();
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
     * The compiled stylesheet of each context that has rules.
     *
     * @return delta_sheets Sheets.
     */
    public function delta_sheets(): delta_sheets {
        return $this->services['delta_sheets'] ?? $this->services['delta_sheets'] = new delta_sheets(
            $this->rules(),
            $this->compiler(),
            new compiled_cache(\cache::make('local_iconrestyle', 'compiled')),
            new compile_lock(),
            $this->revisions(),
            $this->version_hash()
        );
    }

    /**
     * Bundle service.
     *
     * @return bundle_service Service.
     */
    public function bundles(): bundle_service {
        return $this->services['bundles'] ?? $this->services['bundles'] =
            new bundle_service($this->revisions(), $this->delta_sheets());
    }

    /**
     * Cleaner that removes the rules of deleted contexts.
     *
     * @return rule_cleaner Cleaner.
     */
    public function rule_cleaner(): rule_cleaner {
        global $DB;
        return $this->services['rule_cleaner'] ?? $this->services['rule_cleaner'] = new rule_cleaner(
            $DB,
            $this->rules(),
            $this->revisions(),
            $this->delta_sheets()
        );
    }

    /**
     * Names of places that mean the same on every site.
     *
     * @return place_keys Place keys.
     */
    public function place_keys(): place_keys {
        global $DB;
        return $this->services['place_keys'] ?? $this->services['place_keys'] = new place_keys($DB);
    }

    /**
     * Writer of packages.
     *
     * @return exporter Exporter.
     */
    public function exporter(): exporter {
        return $this->services['exporter'] ?? $this->services['exporter'] =
            new exporter($this->rules(), $this->asset_store(), $this->place_keys());
    }

    /**
     * Reader of packages.
     *
     * @return importer Importer.
     */
    public function importer(): importer {
        return $this->services['importer'] ?? $this->services['importer'] = new importer(
            $this->rule_service(),
            $this->rules(),
            $this->assets(),
            $this->place_keys(),
            $this->catalogue()
        );
    }

    /**
     * Rule service.
     *
     * @return rule_service Service.
     */
    public function rule_service(): rule_service {
        global $DB;
        return $this->services['rule_service'] ?? $this->services['rule_service'] = new rule_service(
            $DB,
            $this->rules(),
            new delta_context(),
            $this->revisions(),
            rule_limits::from_config(),
            $this->delta_sheets()
        );
    }
}
