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
 * The design properties of a rule beyond its colours and artwork.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\rule;

/**
 * Shape, radius, padding and margin on each side, scale, rotation, skew, flips, border, outline, gradient, shadows, filters,
 * blending, hover effect and opacity.
 *
 * Every property is optional, and an absent property leaves Moodle's own value alone. Each one has a fixed type and range,
 * so the only values that can reach the generated CSS are the ones this class accepts.
 */
final class design {
    /** @var string[] Shapes: the corners of the element. */
    public const SHAPES = ['none', 'square', 'rounded', 'circle', 'pill'];

    /** @var string[] Border styles. */
    public const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];

    /** @var string[] Shadows of the box: from none to strong, a glow that follows the shadow colour, and three more. */
    public const SHADOWS = ['none', 'soft', 'medium', 'strong', 'glow', 'inner', 'lifted', 'hard'];

    /** @var string[] Shadows that follow the shape of the icon itself and not its box. */
    public const DROP_SHADOWS = ['none', 'soft', 'medium', 'strong', 'glow'];

    /** @var string[] How the icon blends with what is behind it. */
    public const BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'difference'];

    /** @var string[] What the icon does when the pointer is over it. */
    public const HOVERS = ['none', 'grow', 'shrink', 'lift', 'tilt', 'fade'];

    /** @var int[][] Range of each numeric property: minimum and maximum. */
    public const RANGES = [
        'radius' => [0, 100],
        'pt' => [0, 300],
        'pr' => [0, 300],
        'pb' => [0, 300],
        'pl' => [0, 300],
        'mt' => [-100, 300],
        'mr' => [-100, 300],
        'mb' => [-100, 300],
        'ml' => [-100, 300],
        'scale' => [25, 400],
        'rotate' => [-180, 180],
        'flipx' => [0, 1],
        'flipy' => [0, 1],
        'skx' => [-45, 45],
        'sky' => [-45, 45],
        'bw' => [0, 12],
        'ow' => [0, 12],
        'oo' => [0, 20],
        'gd' => [0, 360],
        'sepia' => [0, 100],
        'invert' => [0, 100],
        'blur' => [0, 20],
        'brightness' => [0, 200],
        'contrast' => [0, 200],
        'saturate' => [0, 300],
        'grayscale' => [0, 100],
        'hue' => [-180, 180],
        'opacity' => [0, 100],
    ];

    /** @var int Most effect cost one design may have, which keeps a single rule from stacking every expensive effect. */
    public const MAX_COST = 20;

    /** @var string[] Properties that hold a colour. */
    private const COLOURS = ['bc', 'sc', 'bg2', 'oc'];

    /** @var array Validated properties, keyed by name. */
    private $values;

    /**
     * Create a design from validated properties.
     *
     * @param array $values Validated properties.
     */
    private function __construct(array $values) {
        $this->values = $values;
    }

    /**
     * A design that changes nothing.
     *
     * @return self Empty design.
     */
    public static function none(): self {
        return new self([]);
    }

    /**
     * Validate properties.
     *
     * Empty strings and null mean "not set", so a form can send every field. A property outside its fixed list or range is
     * refused, and a property this class does not know is refused too.
     *
     * @param array $input Properties keyed by name.
     * @return self Design.
     * @throws \InvalidArgumentException When a property is unknown or outside what it accepts.
     */
    public static function from_array(array $input): self {
        $values = [];
        foreach ($input as $name => $value) {
            if ($value === null || $value === '') {
                continue;
            }
            $values[$name] = self::check($name, $value);
        }
        ksort($values);
        return new self($values);
    }

    /**
     * Read JSON, as stored or as sent by the designer.
     *
     * @param string|null $json JSON object, or empty for no design.
     * @return self Design.
     * @throws \InvalidArgumentException When the text is not a JSON object or holds a property that is not accepted.
     */
    public static function from_json(?string $json): self {
        if ($json === null || trim($json) === '') {
            return self::none();
        }
        $decoded = json_decode($json, true);
        if (!is_array($decoded) || (array_values($decoded) === $decoded && $decoded !== [])) {
            throw new \InvalidArgumentException('The design must be a JSON object.');
        }
        return self::from_array($decoded);
    }

    /**
     * The properties in a form safe to store.
     *
     * @return array Properties keyed by name, in a stable order.
     */
    public function to_array(): array {
        return $this->values;
    }

    /**
     * The properties as JSON, or null when there are none.
     *
     * @return string|null JSON.
     */
    public function json(): ?string {
        return $this->values === [] ? null : json_encode($this->values);
    }

    /**
     * Whether nothing is set.
     *
     * @return bool True when the design changes nothing.
     */
    public function is_empty(): bool {
        return $this->values === [];
    }

    /**
     * One property.
     *
     * @param string $name Property name.
     * @return int|string|color|null Value, or null when it is not set. Colours are returned as colours.
     */
    public function get(string $name) {
        if (!array_key_exists($name, $this->values)) {
            return null;
        }
        return in_array($name, self::COLOURS, true) ? color::parse($this->values[$name]) : $this->values[$name];
    }

    /**
     * How hard the design is for a browser to paint, in units.
     *
     * Blur, glow and the colour filters make the browser draw an icon in an extra step, and it does so for every icon the rule
     * reaches, so each one adds to the cost. Size, shape, spacing and border cost nothing. The cost of every rule of a
     * stylesheet is limited, so a site cannot be made slow by giving many icons expensive effects.
     *
     * @return int Cost, zero for a design that is as cheap as Moodle's own.
     */
    public function cost(): int {
        $cost = 0;
        if (($this->values['blur'] ?? 0) > 0) {
            $cost += 4 + (int)ceil($this->values['blur'] / 5);
        }
        $boxshadows = ['soft' => 1, 'medium' => 2, 'strong' => 3, 'glow' => 4, 'inner' => 1, 'lifted' => 2, 'hard' => 1];
        $cost += $boxshadows[$this->values['shadow'] ?? ''] ?? 0;
        $cost += ['soft' => 1, 'medium' => 2, 'strong' => 3, 'glow' => 4][$this->values['ds'] ?? ''] ?? 0;
        $cost += isset($this->values['blend']) && $this->values['blend'] !== 'normal' ? 2 : 0;
        $cost += isset($this->values['hover']) && $this->values['hover'] !== 'none' ? 1 : 0;
        $neutrals = ['brightness' => 100, 'contrast' => 100, 'saturate' => 100, 'hue' => 0, 'grayscale' => 0, 'sepia' => 0,
            'invert' => 0];
        foreach ($neutrals as $name => $neutral) {
            if (isset($this->values[$name]) && $this->values[$name] !== $neutral) {
                $cost += 2;
            }
        }
        $moved = (isset($this->values['scale']) && $this->values['scale'] !== 100) ||
            (isset($this->values['rotate']) && $this->values['rotate'] !== 0) ||
            !empty($this->values['flipx']) || !empty($this->values['flipy']) ||
            !empty($this->values['skx']) || !empty($this->values['sky']);
        $cost += $moved ? 1 : 0;
        $cost += isset($this->values['opacity']) && $this->values['opacity'] !== 100 ? 1 : 0;
        return $cost;
    }

    /**
     * Whether any of the four padding sides is set.
     *
     * @return bool True when there is padding.
     */
    public function has_padding(): bool {
        return $this->has_any(['pt', 'pr', 'pb', 'pl']);
    }

    /**
     * Whether any of the four margin sides is set.
     *
     * @return bool True when there is margin.
     */
    public function has_margin(): bool {
        return $this->has_any(['mt', 'mr', 'mb', 'ml']);
    }

    /**
     * Whether any of some properties is set.
     *
     * @param string[] $names Property names.
     * @return bool True when at least one is set.
     */
    public function has_any(array $names): bool {
        foreach ($names as $name) {
            if (isset($this->values[$name])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check one property.
     *
     * @param string $name Property name.
     * @param mixed $value Candidate value.
     * @return int|string Canonical value.
     * @throws \InvalidArgumentException When the value is not accepted.
     */
    private static function check(string $name, $value) {
        if (isset(self::RANGES[$name])) {
            if (!is_numeric($value) || (int)$value != $value) {
                throw new \InvalidArgumentException('Design property ' . $name . ' must be a whole number.');
            }
            [$min, $max] = self::RANGES[$name];
            if ((int)$value < $min || (int)$value > $max) {
                throw new \InvalidArgumentException('Design property ' . $name . ' is out of range.');
            }
            return (int)$value;
        }
        $lists = [
            'shape' => self::SHAPES, 'bs' => self::BORDER_STYLES, 'shadow' => self::SHADOWS, 'ds' => self::DROP_SHADOWS,
            'blend' => self::BLENDS, 'hover' => self::HOVERS,
        ];
        if (isset($lists[$name])) {
            if (!in_array($value, $lists[$name], true)) {
                throw new \InvalidArgumentException('Design property ' . $name . ' is not one of the accepted values.');
            }
            return (string)$value;
        }
        if (in_array($name, self::COLOURS, true)) {
            return color::parse((string)$value)->stored();
        }
        throw new \InvalidArgumentException('Unknown design property.');
    }
}
