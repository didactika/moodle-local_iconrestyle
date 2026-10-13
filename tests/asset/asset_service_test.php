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
 * Tests for artwork intake and storage.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\asset;

use local_iconrestyle\service_factory;

#[\PHPUnit\Framework\Attributes\CoversClass(asset_service::class)]
/**
 * Verify sniffing, sanitising, deduplication, storage and CSS addresses.
 *
 * @covers \local_iconrestyle\asset\asset_service
 * @covers \local_iconrestyle\asset\asset_store
 * @covers \local_iconrestyle\asset\asset_urls
 * @covers \local_iconrestyle\asset\asset
 */
final class asset_service_test extends \advanced_testcase {
    /** @var string Small valid icon in the canonical form the sanitiser writes. */
    private const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">' .
        '<path d="M12 2L2 22h20z"/></svg>';

    /**
     * Start from a fresh factory.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        service_factory::reset();
    }

    /**
     * Uploaded vector artwork is sanitised, stored once and readable back.
     */
    public function test_vector_upload_is_stored(): void {
        global $DB;
        $asset = service_factory::instance()->assets()->add(self::ICON, 2);
        $this->assertGreaterThan(0, $asset->id());
        $this->assertSame('svg', $asset->kind());
        $this->assertSame('image/svg+xml', $asset->mime());
        $this->assertSame(hash('sha256', self::ICON), $asset->hash());
        $this->assertSame($asset->hash() . '.svg', $asset->filename());
        $this->assertSame(self::ICON, service_factory::instance()->asset_store()->content($asset));
        $this->assertSame(1, $DB->count_records('local_iconrestyle_asset'));
        $record = $DB->get_record('local_iconrestyle_asset', ['id' => $asset->id()]);
        $this->assertSame('upload', $record->source);
        $this->assertSame(2, (int)$record->usermodified);
    }

    /**
     * The same artwork is never stored twice, even when it arrives in a different spelling.
     */
    public function test_duplicates_are_reused(): void {
        global $DB;
        $service = service_factory::instance()->assets();
        $first = $service->add(self::ICON, 2);
        $second = $service->add("<?xml version=\"1.0\"?>\n" . self::ICON, 3);
        $this->assertSame($first->id(), $second->id());
        $this->assertSame(1, $DB->count_records('local_iconrestyle_asset'));
    }

    /**
     * Raster artwork is recognised from its content.
     */
    public function test_raster_upload(): void {
        if (!function_exists('imagecreatetruecolor')) {
            $this->markTestSkipped('The GD extension is not available.');
        }
        $image = imagecreatetruecolor(12, 12);
        ob_start();
        imagepng($image);
        $asset = service_factory::instance()->assets()->add((string)ob_get_clean(), 2);
        $this->assertSame('png', $asset->kind());
        $this->assertSame([12, 12], [$asset->width(), $asset->height()]);
    }

    /**
     * Refused artwork leaves nothing behind.
     */
    public function test_refused_artwork_is_not_stored(): void {
        global $DB;
        $refused = [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><script/><path d="M0 0z"/></svg>',
            '<?php echo 1;',
            'plain text',
            '',
        ];
        foreach ($refused as $bytes) {
            try {
                service_factory::instance()->assets()->add($bytes, 2);
                $this->fail('Accepted: ' . $bytes);
            } catch (asset_rejected_exception $exception) {
                $this->assertNotSame('', $exception->reason());
            }
        }
        $this->assertSame(0, $DB->count_records('local_iconrestyle_asset'));
    }

    /**
     * Small artwork is inlined into CSS and large artwork has an immutable address.
     */
    public function test_css_addresses(): void {
        $service = service_factory::instance()->assets();
        $urls = service_factory::instance()->asset_urls();

        $small = $service->add(self::ICON, 2);
        $inline = $urls->css_url($small->id());
        $this->assertStringStartsWith('url("data:image/svg+xml;base64,', $inline);
        $encoded = substr($inline, strlen('url("data:image/svg+xml;base64,'), -2);
        $this->assertSame(self::ICON, base64_decode($encoded, true));

        $path = 'M' . implode(' ', array_map(function (int $number): string {
            return $number . ' ' . ($number * 2);
        }, range(1, 400)));
        $large = $service->add('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="' . $path . '"/></svg>', 2);
        $this->assertGreaterThan(asset_urls::INLINE_LIMIT, $large->bytes());
        $address = $urls->css_url($large->id());
        $this->assertSame('url("' . asset_urls::public_url($large) . '")', $address);
        $this->assertStringContainsString('/local/iconrestyle/asset.php/' . $large->hash() . '.svg', $address);

        $this->assertNull($urls->css_url(999999));
    }

    /**
     * A missing stored file is reported instead of serving nothing.
     */
    public function test_missing_file_is_reported(): void {
        $asset = service_factory::instance()->assets()->add(self::ICON, 2);
        get_file_storage()->delete_area_files(\context_system::instance()->id, 'local_iconrestyle', 'asset');
        $this->expectException(\moodle_exception::class);
        service_factory::instance()->asset_store()->content($asset);
    }
}
