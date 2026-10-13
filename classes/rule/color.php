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
 * Typed colour value.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * A colour is a hex value, a custom property of the theme, a legacy theme token or the current text colour.
 *
 * Only validated values can reach generated CSS.
 */
final class color {
    /** @var string[] Theme tokens that compile to custom properties. */
    public const TOKENS = [
        'primary', 'secondary', 'success', 'info', 'warning', 'danger', 'light', 'dark',
        'activityadministration', 'activityassessment', 'activitycollaboration',
        'activitycommunication', 'activitycontent', 'activityinteractivecontent',
    ];

    /** @var string Pattern of the name of a custom property of the theme, as chosen from the list the theme declares. */
    private const VARIABLE = '/^--[A-Za-z0-9_-]{1,64}$/';

    /** @var string Stored form of the current text colour. */
    private const CURRENT = 'currentcolor';

    /** @var string Stored form of no colour at all, which removes a background. */
    public const TRANSPARENT = 'transparent';

    /** @var string Pattern of rgb() and rgba() with comma or space separators and an optional alpha. */
    private const RGB = '/^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*'
        . '(?:[,\/]\s*(\d*\.?\d+%?)\s*)?\)$/';

    /** @var string Pattern of hsl() and hsla() with comma or space separators and an optional alpha. */
    private const HSL = '/^hsla?\(\s*(\d{1,3}(?:\.\d+)?)(?:deg)?\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)%\s*[,\s]\s*'
        . '(\d{1,3}(?:\.\d+)?)%\s*(?:[,\/]\s*(\d*\.?\d+%?)\s*)?\)$/';

    /** @var string Canonical stored value. */
    private $stored;

    /**
     * Create from a canonical value.
     *
     * @param string $stored Canonical stored value.
     */
    private function __construct(string $stored) {
        $this->stored = $stored;
    }

    /**
     * Parse any accepted notation.
     *
     * Accepts #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba(), hsl(), hsla(), var:--name, token:name, currentcolor and
     * transparent.
     *
     * @param string $value Candidate value.
     * @return self Canonical colour.
     * @throws \InvalidArgumentException When the value is not accepted.
     */
    public static function parse(string $value): self {
        $value = trim($value);
        if (strncasecmp($value, 'var:', 4) === 0) {
            $name = substr($value, 4);
            if (!preg_match(self::VARIABLE, $name)) {
                throw new \InvalidArgumentException('Invalid custom property name.');
            }
            return new self('var:' . $name);
        }
        $value = strtolower($value);
        if ($value === self::CURRENT || $value === self::TRANSPARENT) {
            return new self($value);
        }
        if (strpos($value, 'token:') === 0) {
            $token = substr($value, 6);
            if (!in_array($token, self::TOKENS, true)) {
                throw new \InvalidArgumentException('Unknown colour token.');
            }
            return new self('token:' . $token);
        }
        if (preg_match('/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/', $value, $matches)) {
            return new self(self::expand_hex($matches[1]));
        }
        if (preg_match(self::RGB, $value, $matches)) {
            $channels = [(int)$matches[1], (int)$matches[2], (int)$matches[3]];
            foreach ($channels as $channel) {
                if ($channel > 255) {
                    throw new \InvalidArgumentException('Colour channel out of range.');
                }
            }
            $alpha = isset($matches[4]) ? self::parse_alpha($matches[4]) : 255;
            return new self(self::to_hex($channels, $alpha));
        }
        if (preg_match(self::HSL, $value, $matches)) {
            $hue = (float)$matches[1];
            $saturation = (float)$matches[2];
            $lightness = (float)$matches[3];
            if ($hue > 360 || $saturation > 100 || $lightness > 100) {
                throw new \InvalidArgumentException('Colour component out of range.');
            }
            $alpha = isset($matches[4]) ? self::parse_alpha($matches[4]) : 255;
            return new self(self::to_hex(self::hsl_to_rgb($hue, $saturation / 100, $lightness / 100), $alpha));
        }
        throw new \InvalidArgumentException('Unsupported colour notation.');
    }

    /**
     * Whether a candidate value is accepted.
     *
     * @param string $value Candidate value.
     * @return bool True when accepted.
     */
    public static function is_valid(string $value): bool {
        try {
            self::parse($value);
            return true;
        } catch (\InvalidArgumentException $exception) {
            return false;
        }
    }

    /**
     * Canonical stored value.
     *
     * @return string Stored value.
     */
    public function stored(): string {
        return $this->stored;
    }

    /**
     * Whether the colour follows the theme instead of being fixed.
     *
     * @return bool True for theme variables, tokens, the current text colour and transparent.
     */
    public function follows_theme(): bool {
        return $this->stored === self::CURRENT || $this->stored === self::TRANSPARENT ||
            strpos($this->stored, 'token:') === 0 || strpos($this->stored, 'var:') === 0;
    }

    /**
     * Value safe to place in a CSS declaration.
     *
     * A theme variable becomes the custom property itself. Tokens use the Bootstrap 5 custom property and fall back to the
     * Bootstrap 4 one.
     *
     * @return string CSS value.
     */
    public function css(): string {
        if ($this->stored === self::CURRENT) {
            return 'currentColor';
        }
        if (strpos($this->stored, 'var:') === 0) {
            return 'var(' . substr($this->stored, 4) . ')';
        }
        if (strpos($this->stored, 'token:') === 0) {
            $token = substr($this->stored, 6);
            if (strpos($token, 'activity') === 0) {
                return 'var(--' . $token . ')';
            }
            return 'var(--bs-' . $token . ', var(--' . $token . '))';
        }
        return $this->stored;
    }

    /**
     * WCAG relative luminance of a fixed colour.
     *
     * @return float|null Luminance from 0 to 1, or null when the colour follows the theme.
     */
    public function luminance(): ?float {
        if ($this->follows_theme()) {
            return null;
        }
        $hex = substr($this->stored, 1, 6);
        $total = 0.0;
        foreach ([0.2126, 0.7152, 0.0722] as $index => $weight) {
            $channel = hexdec(substr($hex, $index * 2, 2)) / 255;
            $linear = $channel <= 0.03928 ? $channel / 12.92 : pow(($channel + 0.055) / 1.055, 2.4);
            $total += $weight * $linear;
        }
        return $total;
    }

    /**
     * Expand a short or long hex body to canonical form.
     *
     * @param string $body Hex digits without the hash.
     * @return string Canonical value, six digits plus alpha only when not opaque.
     */
    private static function expand_hex(string $body): string {
        if (strlen($body) <= 4) {
            $expanded = '';
            foreach (str_split($body) as $digit) {
                $expanded .= $digit . $digit;
            }
            $body = $expanded;
        }
        if (strlen($body) === 8 && substr($body, 6) === 'ff') {
            $body = substr($body, 0, 6);
        }
        return '#' . $body;
    }

    /**
     * Convert an alpha notation to a 0-255 value.
     *
     * @param string $alpha Fraction or percentage.
     * @return int Alpha channel.
     */
    private static function parse_alpha(string $alpha): int {
        $fraction = substr($alpha, -1) === '%' ? (float)$alpha / 100 : (float)$alpha;
        if ($fraction < 0 || $fraction > 1) {
            throw new \InvalidArgumentException('Alpha out of range.');
        }
        return (int)round($fraction * 255);
    }

    /**
     * Build the canonical hex string.
     *
     * @param int[] $channels Red, green and blue.
     * @param int $alpha Alpha channel.
     * @return string Canonical value.
     */
    private static function to_hex(array $channels, int $alpha): string {
        $hex = sprintf('#%02x%02x%02x', $channels[0], $channels[1], $channels[2]);
        return $alpha === 255 ? $hex : $hex . sprintf('%02x', $alpha);
    }

    /**
     * Convert HSL to RGB.
     *
     * @param float $hue Degrees.
     * @param float $saturation Fraction.
     * @param float $lightness Fraction.
     * @return int[] Red, green and blue.
     */
    private static function hsl_to_rgb(float $hue, float $saturation, float $lightness): array {
        $chroma = (1 - abs(2 * $lightness - 1)) * $saturation;
        $sector = fmod($hue, 360) / 60;
        $second = $chroma * (1 - abs(fmod($sector, 2) - 1));
        $match = $lightness - $chroma / 2;
        $table = [[$chroma, $second, 0], [$second, $chroma, 0], [0, $chroma, $second],
            [0, $second, $chroma], [$second, 0, $chroma], [$chroma, 0, $second]];
        $rgb = $table[(int)floor($sector) % 6];
        return [
            (int)round(($rgb[0] + $match) * 255),
            (int)round(($rgb[1] + $match) * 255),
            (int)round(($rgb[2] + $match) * 255),
        ];
    }
}
