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
 * Tests for the SVG sanitiser.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\asset;

#[\PHPUnit\Framework\Attributes\CoversClass(svg_sanitizer::class)]
/**
 * Verify that hostile vector files are refused or neutralised and that good files survive unchanged in meaning.
 *
 * @covers \local_iconrestyle\asset\svg_sanitizer
 * @covers \local_iconrestyle\asset\sanitized_content
 */
final class svg_sanitizer_test extends \basic_testcase {
    /** @var string Namespace declaration used by the fixtures. */
    private const NS = 'xmlns="http://www.w3.org/2000/svg"';

    /**
     * Wrap shapes in a valid root.
     *
     * @param string $body Inner markup.
     * @param string $attributes Extra root attributes.
     * @return string Document.
     */
    private function svg(string $body, string $attributes = 'viewBox="0 0 24 24"'): string {
        return '<svg ' . self::NS . ' ' . $attributes . '>' . $body . '</svg>';
    }

    /**
     * Sanitise and return the safe markup.
     *
     * @param string $svg Input.
     * @return sanitized_content Result.
     */
    private function clean(string $svg): sanitized_content {
        return (new svg_sanitizer())->sanitise($svg);
    }

    /**
     * A plain icon survives and reports its size, kind and hash.
     */
    public function test_valid_icon_survives(): void {
        $result = $this->clean($this->svg('<path d="M12 2L2 22h20z" fill="#123456"/>'));
        $this->assertSame(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">' .
                '<path d="M12 2L2 22h20z" fill="#123456"/></svg>',
            $result->bytes()
        );
        $this->assertSame(sanitized_content::KIND_SVG, $result->kind());
        $this->assertSame('image/svg+xml', $result->mime());
        $this->assertSame([24, 24], [$result->width(), $result->height()]);
        $this->assertTrue($result->monochrome());
        $this->assertSame(hash('sha256', $result->bytes()), $result->hash());
    }

    /**
     * Sanitising twice gives the same bytes, so the hash is stable.
     */
    public function test_idempotent(): void {
        $shapes = '<circle cx="12" cy="12" r="5"/><rect x="1" y="1" width="4" height="4"/>';
        $once = $this->clean($this->svg('<g fill="#000">' . $shapes . '</g>'));
        $twice = $this->clean($once->bytes());
        $this->assertSame($once->bytes(), $twice->bytes());
    }

    /**
     * Files that must be refused, with the reason the interface will show.
     *
     * @dataProvider refused_provider
     * @param string $svg Input.
     * @param string $reason Expected reason code.
     */
    public function test_refused(string $svg, string $reason): void {
        try {
            $this->clean($svg);
            $this->fail('The file was accepted.');
        } catch (asset_rejected_exception $exception) {
            $this->assertSame($reason, $exception->reason());
        }
    }

    /**
     * Hostile and unusable files.
     *
     * @return array Cases.
     */
    public static function refused_provider(): array {
        $ns = self::NS;
        $shape = '<path d="M0 0h1v1z"/>';
        $deep = str_repeat('<g>', 40) . $shape . str_repeat('</g>', 40);
        return [
            'script element' => [
                "<svg {$ns} viewBox=\"0 0 24 24\"><script>alert(1)</script>{$shape}</svg>", asset_rejected_exception::FORBIDDEN,
            ],
            'foreignObject' => [
                "<svg {$ns} viewBox=\"0 0 24 24\"><foreignObject><div>x</div></foreignObject>{$shape}</svg>",
                asset_rejected_exception::FORBIDDEN,
            ],
            'iframe' => [
                "<svg {$ns} viewBox=\"0 0 24 24\"><iframe src=\"x\"/>{$shape}</svg>", asset_rejected_exception::FORBIDDEN,
            ],
            'billion laughs' => [
                '<!DOCTYPE svg [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;">]>' .
                "<svg {$ns} viewBox=\"0 0 24 24\"><title>&b;</title>{$shape}</svg>",
                asset_rejected_exception::FORBIDDEN,
            ],
            'external entity' => [
                '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]>' .
                "<svg {$ns} viewBox=\"0 0 24 24\"><title>&x;</title>{$shape}</svg>",
                asset_rejected_exception::FORBIDDEN,
            ],
            'stylesheet instruction' => [
                '<?xml-stylesheet href="http://evil.example/x.css"?>' . "<svg {$ns} viewBox=\"0 0 24 24\">{$shape}</svg>",
                asset_rejected_exception::FORBIDDEN,
            ],
            'xinclude' => [
                "<svg {$ns} viewBox=\"0 0 24 24\"><xi:include href=\"/etc/passwd\"/>{$shape}</svg>",
                asset_rejected_exception::FORBIDDEN,
            ],
            'not an svg root' => ['<html xmlns="http://www.w3.org/1999/xhtml"><body/></html>', asset_rejected_exception::MALFORMED],
            'no namespace' => ['<svg viewBox="0 0 24 24"><path d="M0 0h1v1z"/></svg>', asset_rejected_exception::MALFORMED],
            'plain text' => ['hello', asset_rejected_exception::MALFORMED],
            'broken xml' => ["<svg {$ns} viewBox=\"0 0 24 24\"><path d=\"M0 0\"></svg>", asset_rejected_exception::MALFORMED],
            'too large' => [str_repeat(' ', svg_sanitizer::MAX_BYTES + 1), asset_rejected_exception::TOO_LARGE],
            'too deep' => ["<svg {$ns} viewBox=\"0 0 24 24\">{$deep}</svg>", asset_rejected_exception::TOO_LARGE],
            'too many elements' => [
                "<svg {$ns} viewBox=\"0 0 24 24\">" . str_repeat('<path d="M0 0z"/>', svg_sanitizer::MAX_NODES + 1) . '</svg>',
                asset_rejected_exception::TOO_LARGE,
            ],
            'draws nothing' => ["<svg {$ns} viewBox=\"0 0 24 24\"><g/></svg>", asset_rejected_exception::EMPTY],
            'only forbidden content inside a link' => [
                "<svg {$ns} viewBox=\"0 0 24 24\"><a href=\"javascript:alert(1)\">{$shape}</a></svg>",
                asset_rejected_exception::EMPTY,
            ],
            'no size' => ["<svg {$ns}>{$shape}</svg>", asset_rejected_exception::MALFORMED],
            'zero size' => ["<svg {$ns} viewBox=\"0 0 0 0\">{$shape}</svg>", asset_rejected_exception::DIMENSIONS],
            'huge size' => ["<svg {$ns} viewBox=\"0 0 99999 99999\">{$shape}</svg>", asset_rejected_exception::DIMENSIONS],
            'bad viewBox' => ["<svg {$ns} viewBox=\"0 0 a b\">{$shape}</svg>", asset_rejected_exception::MALFORMED],
            'relative size' => ["<svg {$ns} width=\"50%\" height=\"50%\">{$shape}</svg>", asset_rejected_exception::MALFORMED],
        ];
    }

    /**
     * Dangerous parts are left out while the rest of the file is kept.
     */
    public function test_dangerous_parts_are_removed(): void {
        $body = '<path d="M12 2L2 22h20z" onclick="alert(1)" style="fill:url(http://evil.example/x)" class="a" ' .
            'fill="url(http://evil.example/a.svg#x)" stroke="javascript:alert(1)" id="a b" data-x="y"/>' .
            '<style>.a{fill:red}@import url(http://evil.example/x.css);</style>' .
            '<image href="http://evil.example/x.png" width="10" height="10"/>' .
            '<use xlink:href="http://evil.example/x.svg#y" xmlns:xlink="http://www.w3.org/1999/xlink"/>' .
            '<animate attributeName="href" values="javascript:alert(1)"/>' .
            '<set attributeName="fill" to="red"/>' .
            '<a href="javascript:alert(1)"><circle cx="5" cy="5" r="2"/></a>' .
            '<rect x="1" y="1" width="4" height="4" fill="#000" xlink:href="http://evil.example" ' .
            'xmlns:xlink="http://www.w3.org/1999/xlink"/>';
        $result = $this->clean($this->svg($body, 'viewBox="0 0 24 24" onload="alert(1)" width="100%"'));
        $safe = $result->bytes();
        $forbidden = ['onclick', 'onload', 'alert', 'evil', 'javascript', 'style', 'class', 'data-x', 'xlink', 'href', 'image',
            '<use', '<animate', '<set', '<a ', 'circle', 'import'];
        foreach ($forbidden as $forbidden) {
            $this->assertStringNotContainsString($forbidden, $safe, "'{$forbidden}' survived");
        }
        $this->assertStringContainsString('<path d="M12 2L2 22h20z"/>', $safe);
        $this->assertStringContainsString('<rect x="1" y="1" width="4" height="4" fill="#000"/>', $safe);
    }

    /**
     * Local references are kept and external ones are not.
     */
    public function test_local_references_only(): void {
        $body = '<defs><linearGradient id="g"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/>' .
            '</linearGradient><clipPath id="c"><rect width="8" height="8"/></clipPath></defs>' .
            '<path d="M0 0h8v8z" fill="url(#g)" clip-path="url(#c)"/>' .
            '<path d="M0 0h8v8z" fill="url(#g) url(http://evil.example)"/>';
        $safe = $this->clean($this->svg($body))->bytes();
        $this->assertStringContainsString('fill="url(#g)"', $safe);
        $this->assertStringContainsString('clip-path="url(#c)"', $safe);
        $this->assertStringContainsString('<linearGradient id="g">', $safe);
        $this->assertStringNotContainsString('evil', $safe);
    }

    /**
     * Size comes from width and height when there is no viewBox, and the output always states both.
     *
     * Some browsers do not paint a vector image without an intrinsic size when it is a CSS background.
     */
    public function test_size_from_width_and_height(): void {
        $result = $this->clean('<svg ' . self::NS . ' width="16px" height="16"><path d="M0 0h16v16z"/></svg>');
        $this->assertStringContainsString('viewBox="0 0 16 16" width="16" height="16"', $result->bytes());
        $this->assertSame([16, 16], [$result->width(), $result->height()]);

        $declared = $this->clean($this->svg('<path d="M0 0h1v1z"/>', 'viewBox="0 0 24.5 12" width="100%"'));
        $this->assertStringContainsString('viewBox="0 0 24.5 12" width="24.5" height="12"', $declared->bytes());
    }

    /**
     * Text is escaped, byte order marks and XML declarations are accepted and prefixes are normalised.
     */
    public function test_encoding_and_prefixes(): void {
        $titled = $this->clean($this->svg('<title>A &amp; B &lt;x&gt;</title><path d="M0 0h1v1z"/>'))->bytes();
        $this->assertStringContainsString('<title>A &amp; B &lt;x&gt;</title>', $titled);

        $declared = "\xEF\xBB\xBF<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" . $this->svg('<path d="M0 0h1v1z"/>');
        $this->assertStringContainsString('<path d="M0 0h1v1z"/>', $this->clean($declared)->bytes());

        $prefixed = '<svg:svg xmlns:svg="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><svg:path d="M0 0h8v8z"/></svg:svg>';
        $this->assertSame(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8"><path d="M0 0h8v8z"/></svg>',
            $this->clean($prefixed)->bytes()
        );
    }

    /**
     * Monochrome detection.
     *
     * @dataProvider monochrome_provider
     * @param string $body Inner markup.
     * @param bool $expected Whether the artwork is monochrome.
     */
    public function test_monochrome_detection(string $body, bool $expected): void {
        $this->assertSame($expected, $this->clean($this->svg($body))->monochrome());
    }

    /**
     * Monochrome cases.
     *
     * @return array Cases.
     */
    public static function monochrome_provider(): array {
        return [
            'no paint at all' => ['<path d="M0 0h1v1z"/>', true],
            'one colour twice' => ['<path d="M0 0h1v1z" fill="#111"/><rect width="2" height="2" fill="#111"/>', true],
            'current colour' => ['<path d="M0 0h1v1z" fill="currentColor"/>', true],
            'stroke only' => ['<path d="M0 0h1v1z" fill="none" stroke="#222"/>', true],
            'two colours' => ['<path d="M0 0h1v1z" fill="#111"/><rect width="2" height="2" fill="#f00"/>', false],
            'gradient' => ['<defs><linearGradient id="g"/></defs><path d="M0 0h1v1z" fill="url(#g)"/>', false],
        ];
    }
}
