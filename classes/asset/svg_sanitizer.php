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
 * Rebuilds uploaded SVG from an allow-list.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\asset;

/**
 * The single choke point for vector artwork.
 *
 * The input is parsed without network access or entity expansion and is never modified in place: a new
 * document is built containing only allow-listed elements and attributes with validated values. Anything
 * that could run code or load another resource is either refused or left out.
 */
class svg_sanitizer {
    /** @var int Largest accepted input in bytes. */
    public const MAX_BYTES = 65536;

    /** @var int Most elements an image may contain. */
    public const MAX_NODES = 2000;

    /** @var int Deepest element nesting. */
    public const MAX_DEPTH = 32;

    /** @var int Longest accepted attribute value. */
    private const MAX_VALUE = 32768;

    /** @var string SVG namespace. */
    private const NS = 'http://www.w3.org/2000/svg';

    /** @var string[] Accepted elements, keyed by lowercase name, with their canonical name. */
    private const ELEMENTS = [
        'svg' => 'svg', 'g' => 'g', 'path' => 'path', 'rect' => 'rect', 'circle' => 'circle',
        'ellipse' => 'ellipse', 'line' => 'line', 'polyline' => 'polyline', 'polygon' => 'polygon',
        'defs' => 'defs', 'lineargradient' => 'linearGradient', 'radialgradient' => 'radialGradient',
        'stop' => 'stop', 'clippath' => 'clipPath', 'mask' => 'mask', 'title' => 'title', 'desc' => 'desc',
    ];

    /** @var string[] Elements that draw something. */
    private const SHAPES = ['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'];

    /** @var string[] Elements whose presence means the file is refused instead of cleaned. */
    private const FORBIDDEN = ['script', 'foreignobject', 'iframe', 'embed', 'object', 'handler', 'listener'];

    /** @var string[] Accepted attributes, keyed by lowercase name, with their canonical name. */
    private const ATTRIBUTES = [
        'd' => 'd', 'x' => 'x', 'y' => 'y', 'x1' => 'x1', 'x2' => 'x2', 'y1' => 'y1', 'y2' => 'y2',
        'cx' => 'cx', 'cy' => 'cy', 'r' => 'r', 'rx' => 'rx', 'ry' => 'ry', 'fx' => 'fx', 'fy' => 'fy',
        'width' => 'width', 'height' => 'height', 'points' => 'points', 'transform' => 'transform',
        'fill' => 'fill', 'fill-rule' => 'fill-rule', 'fill-opacity' => 'fill-opacity',
        'clip-rule' => 'clip-rule', 'stroke' => 'stroke', 'stroke-width' => 'stroke-width',
        'stroke-linecap' => 'stroke-linecap', 'stroke-linejoin' => 'stroke-linejoin',
        'stroke-miterlimit' => 'stroke-miterlimit', 'stroke-dasharray' => 'stroke-dasharray',
        'stroke-dashoffset' => 'stroke-dashoffset', 'stroke-opacity' => 'stroke-opacity',
        'opacity' => 'opacity', 'id' => 'id', 'offset' => 'offset', 'stop-color' => 'stop-color',
        'stop-opacity' => 'stop-opacity', 'gradientunits' => 'gradientUnits',
        'gradienttransform' => 'gradientTransform', 'spreadmethod' => 'spreadMethod',
        'clip-path' => 'clip-path', 'mask' => 'mask', 'clippathunits' => 'clipPathUnits',
        'maskunits' => 'maskUnits', 'maskcontentunits' => 'maskContentUnits', 'display' => 'display',
    ];

    /** @var string Attribute values may only contain these characters. */
    private const SAFE_VALUE = '/^[A-Za-z0-9\s,.+\-#%():_\/]*$/';

    /** @var int Elements seen in the current run. */
    private $nodes = 0;

    /** @var string[] Distinct paint values seen in the current run. */
    private $paints = [];

    /** @var bool Whether paint refers to another element, such as a gradient. */
    private $referenced = false;

    /** @var bool Whether the current run kept a drawing element. */
    private $drew = false;

    /**
     * Sanitise vector artwork.
     *
     * @param string $svg Uploaded bytes.
     * @return sanitized_content Safe artwork.
     * @throws asset_rejected_exception When the file is refused.
     */
    public function sanitise(string $svg): sanitized_content {
        if (strlen($svg) > self::MAX_BYTES) {
            throw new asset_rejected_exception(asset_rejected_exception::TOO_LARGE);
        }
        $svg = preg_replace('/^\xEF\xBB\xBF/', '', $svg);
        if (preg_match('/<!\s*(DOCTYPE|ENTITY|ELEMENT|ATTLIST)|<\?xml-stylesheet|<xi:include/i', $svg)) {
            throw new asset_rejected_exception(asset_rejected_exception::FORBIDDEN, 'declaration');
        }
        $source = $this->parse($svg);
        $root = $source->documentElement;
        if (!$root || strtolower($root->localName) !== 'svg' || $root->namespaceURI !== self::NS) {
            throw new asset_rejected_exception(asset_rejected_exception::MALFORMED, 'root');
        }
        $viewbox = $this->viewbox($root);
        $this->nodes = 0;
        $this->paints = [];
        $this->referenced = false;
        $this->drew = false;

        $target = new \DOMDocument('1.0', 'UTF-8');
        $newroot = $target->createElementNS(self::NS, 'svg');
        $target->appendChild($newroot);
        $newroot->setAttribute('viewBox', implode(' ', array_map([$this, 'number'], $viewbox)));
        $newroot->setAttribute('width', $this->number($viewbox[2]));
        $newroot->setAttribute('height', $this->number($viewbox[3]));
        $this->copy_children($root, $newroot, $target, 1);
        if (!$this->drew) {
            throw new asset_rejected_exception(asset_rejected_exception::EMPTY);
        }
        $clean = $target->saveXML($newroot);
        if ($clean === false || strlen($clean) > self::MAX_BYTES) {
            throw new asset_rejected_exception(asset_rejected_exception::TOO_LARGE, 'output');
        }
        return new sanitized_content(
            $clean,
            sanitized_content::KIND_SVG,
            (int)ceil($viewbox[2]),
            (int)ceil($viewbox[3]),
            !$this->referenced && count($this->paints) <= 1
        );
    }

    /**
     * Parse without network access or entity expansion.
     *
     * Entities cannot be used at all: every document type declaration is refused before parsing, and the parser is never
     * asked to substitute entities or load a DTD, so there is nothing to resolve on any PHP version.
     *
     * @param string $svg Document.
     * @return \DOMDocument Parsed document.
     * @throws asset_rejected_exception When the document is not well-formed.
     */
    private function parse(string $svg): \DOMDocument {
        $previous = libxml_use_internal_errors(true);
        $document = new \DOMDocument();
        $loaded = $document->loadXML($svg, LIBXML_NONET | LIBXML_NOBLANKS | LIBXML_NOCDATA);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        if (!$loaded) {
            throw new asset_rejected_exception(asset_rejected_exception::MALFORMED, 'xml');
        }
        return $document;
    }

    /**
     * Work out the viewBox of the artwork.
     *
     * @param \DOMElement $root Root element.
     * @return float[] Minimum x, minimum y, width and height.
     * @throws asset_rejected_exception When no usable size is declared.
     */
    private function viewbox(\DOMElement $root): array {
        $declared = trim($root->getAttribute('viewBox'));
        if ($declared !== '') {
            $numbers = preg_split('/[\s,]+/', $declared);
            if (count($numbers) !== 4 || count(array_filter($numbers, 'is_numeric')) !== 4) {
                throw new asset_rejected_exception(asset_rejected_exception::MALFORMED, 'viewBox');
            }
            $box = array_map('floatval', $numbers);
        } else {
            $width = $this->length($root->getAttribute('width'));
            $height = $this->length($root->getAttribute('height'));
            if ($width === null || $height === null) {
                throw new asset_rejected_exception(asset_rejected_exception::MALFORMED, 'size');
            }
            $box = [0.0, 0.0, $width, $height];
        }
        if ($box[2] <= 0 || $box[3] <= 0 || $box[2] > 10000 || $box[3] > 10000) {
            throw new asset_rejected_exception(asset_rejected_exception::DIMENSIONS);
        }
        return $box;
    }

    /**
     * Format a number the same way on every locale and PHP version.
     *
     * The root keeps an explicit width and height next to its viewBox because some browsers do not paint a vector image
     * without an intrinsic size when it is used as a CSS background.
     *
     * @param float $value Number.
     * @return string Plain decimal notation without trailing zeros.
     */
    private function number(float $value): string {
        return rtrim(rtrim(number_format($value, 4, '.', ''), '0'), '.');
    }

    /**
     * Read a plain length in pixels.
     *
     * @param string $value Attribute value.
     * @return float|null Length, or null when it is not a plain number of pixels.
     */
    private function length(string $value): ?float {
        return preg_match('/^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/', $value, $matches) ? (float)$matches[1] : null;
    }

    /**
     * Copy accepted children into the new document.
     *
     * @param \DOMElement $from Source element.
     * @param \DOMElement $to Target element.
     * @param \DOMDocument $target Target document.
     * @param int $depth Depth of the target element.
     * @throws asset_rejected_exception When a refused construct or a limit is met.
     */
    private function copy_children(\DOMElement $from, \DOMElement $to, \DOMDocument $target, int $depth): void {
        if ($depth > self::MAX_DEPTH) {
            throw new asset_rejected_exception(asset_rejected_exception::TOO_LARGE, 'depth');
        }
        foreach ($from->childNodes as $child) {
            if ($child instanceof \DOMText && in_array(strtolower($from->localName), ['title', 'desc'], true)) {
                $text = trim(preg_replace('/[\x00-\x1F\x7F]/', '', $child->nodeValue));
                if ($text !== '') {
                    $to->appendChild($target->createTextNode(substr($text, 0, 200)));
                }
                continue;
            }
            if (!$child instanceof \DOMElement) {
                continue;
            }
            $name = strtolower($child->localName);
            if (in_array($name, self::FORBIDDEN, true)) {
                throw new asset_rejected_exception(asset_rejected_exception::FORBIDDEN, $name);
            }
            if (++$this->nodes > self::MAX_NODES) {
                throw new asset_rejected_exception(asset_rejected_exception::TOO_LARGE, 'nodes');
            }
            if (!isset(self::ELEMENTS[$name]) || $child->namespaceURI !== self::NS) {
                continue;
            }
            $copy = $target->createElementNS(self::NS, self::ELEMENTS[$name]);
            $to->appendChild($copy);
            $this->copy_attributes($child, $copy, $name);
            if (in_array($name, self::SHAPES, true)) {
                $this->drew = true;
            }
            $this->copy_children($child, $copy, $target, $depth + 1);
        }
    }

    /**
     * Copy accepted attributes with validated values.
     *
     * @param \DOMElement $from Source element.
     * @param \DOMElement $to Target element.
     * @param string $name Lowercase element name.
     */
    private function copy_attributes(\DOMElement $from, \DOMElement $to, string $name): void {
        foreach ($from->attributes as $attribute) {
            $key = strtolower($attribute->localName);
            if ($attribute->namespaceURI !== null || !isset(self::ATTRIBUTES[$key])) {
                continue;
            }
            $value = trim($attribute->value);
            if (!$this->safe_value($key, $value)) {
                continue;
            }
            if (in_array($key, ['fill', 'stroke', 'stop-color'], true)) {
                $this->note_paint($value);
            }
            $to->setAttribute(self::ATTRIBUTES[$key], $value);
        }
    }

    /**
     * Whether an attribute value may be kept.
     *
     * @param string $key Lowercase attribute name.
     * @param string $value Value.
     * @return bool True when the value is safe.
     */
    private function safe_value(string $key, string $value): bool {
        if (strlen($value) > self::MAX_VALUE || !preg_match(self::SAFE_VALUE, $value)) {
            return false;
        }
        if (preg_match('/javascript|expression|data:|@import/i', $value)) {
            return false;
        }
        if ($key === 'id') {
            return (bool)preg_match('/^[A-Za-z][A-Za-z0-9_.:\-]*$/', $value);
        }
        if (stripos($value, 'url(') !== false) {
            return (bool)preg_match('/^url\(\s*#[A-Za-z][A-Za-z0-9_.:\-]*\s*\)$/', $value);
        }
        return true;
    }

    /**
     * Record a paint value for the monochrome decision.
     *
     * @param string $value Paint value.
     */
    private function note_paint(string $value): void {
        $paint = strtolower($value);
        if (strpos($paint, 'url(') !== false) {
            $this->referenced = true;
        } else if (!in_array($paint, ['', 'none', 'currentcolor', 'transparent'], true)) {
            $this->paints[$paint] = true;
        }
    }
}
