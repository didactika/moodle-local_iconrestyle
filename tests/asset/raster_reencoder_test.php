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
 * Tests for the raster re-encoder.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\asset;

#[\PHPUnit\Framework\Attributes\CoversClass(raster_reencoder::class)]
/**
 * Verify that raster files are decoded and rewritten, and that disguised or oversized files are refused.
 *
 * @covers \local_iconrestyle\asset\raster_reencoder
 */
final class raster_reencoder_test extends \basic_testcase {
    /**
     * Skip when the image library is missing.
     */
    protected function setUp(): void {
        parent::setUp();
        if (!function_exists('imagecreatetruecolor')) {
            $this->markTestSkipped('The GD extension is not available.');
        }
    }

    /**
     * Build an image.
     *
     * @param int $width Width.
     * @param int $height Height.
     * @param string $format png, gif or jpeg.
     * @return string Encoded bytes.
     */
    private function image(int $width, int $height, string $format = 'png'): string {
        $image = imagecreatetruecolor($width, $height);
        imagealphablending($image, false);
        imagesavealpha($image, true);
        imagefill($image, 0, 0, imagecolorallocatealpha($image, 200, 30, 30, 64));
        ob_start();
        $format === 'gif' ? imagegif($image) : ($format === 'jpeg' ? imagejpeg($image) : imagepng($image));
        return (string)ob_get_clean();
    }

    /**
     * A PNG is rewritten and keeps its size and transparency.
     */
    public function test_png_is_rewritten(): void {
        $result = (new raster_reencoder())->reencode($this->image(16, 24));
        $this->assertSame(sanitized_content::KIND_PNG, $result->kind());
        $this->assertSame([16, 24], [$result->width(), $result->height()]);
        $this->assertFalse($result->monochrome());
        $decoded = imagecreatefromstring($result->bytes());
        $this->assertNotFalse($decoded);
        $this->assertGreaterThan(0, (imagecolorat($decoded, 1, 1) >> 24) & 0x7F, 'Transparency was lost');
    }

    /**
     * Anything appended after the image is dropped.
     */
    public function test_trailing_code_is_dropped(): void {
        $hostile = $this->image(8, 8) . "<?php system('id'); ?>";
        $result = (new raster_reencoder())->reencode($hostile);
        $this->assertStringNotContainsString('<?php', $result->bytes());
        $this->assertStringNotContainsString('system', $result->bytes());
    }

    /**
     * Unsupported, malformed, oversized and disguised files are refused.
     *
     * @dataProvider refused_provider
     * @param callable $make Creates the bytes.
     * @param string $reason Expected reason code.
     */
    public function test_refused(callable $make, string $reason): void {
        try {
            (new raster_reencoder())->reencode($make($this));
            $this->fail('The file was accepted.');
        } catch (asset_rejected_exception $exception) {
            $this->assertSame($reason, $exception->reason());
        }
    }

    /**
     * Files that must be refused.
     *
     * @return array Cases.
     */
    public static function refused_provider(): array {
        return [
            'gif' => [function (self $test): string {
                return $test->image(8, 8, 'gif');
            }, asset_rejected_exception::UNSUPPORTED],
            'jpeg' => [function (self $test): string {
                return $test->image(8, 8, 'jpeg');
            }, asset_rejected_exception::UNSUPPORTED],
            'php source' => [function (): string {
                return '<?php echo 1;';
            }, asset_rejected_exception::UNSUPPORTED],
            'random bytes' => [function (): string {
                return str_repeat("\x01\x02\x03", 50);
            }, asset_rejected_exception::UNSUPPORTED],
            'too wide' => [function (self $test): string {
                return $test->image(raster_reencoder::MAX_SIDE + 1, 8);
            }, asset_rejected_exception::DIMENSIONS],
            'too tall' => [function (self $test): string {
                return $test->image(8, raster_reencoder::MAX_SIDE + 1);
            }, asset_rejected_exception::DIMENSIONS],
            'too many bytes' => [function (): string {
                return str_repeat('a', raster_reencoder::MAX_BYTES + 1);
            }, asset_rejected_exception::TOO_LARGE],
            'truncated png' => [function (self $test): string {
                return substr($test->image(8, 8), 0, 40);
            }, asset_rejected_exception::MALFORMED],
        ];
    }
}
