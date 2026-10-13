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
 * How an icon appears in the page markup.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_iconrestyle\slot;

/**
 * Describes the markup of one icon and builds the selectors that match it.
 */
final class glyph_signature {
    /** @var string Font icon element. */
    public const KIND_FONT = 'font';

    /** @var string Image icon element. */
    public const KIND_IMAGE = 'image';

    /** @var string Coloured box Moodle draws around an activity icon. */
    public const KIND_CONTAINER = 'container';

    /** @var string[] Font Awesome families that name their glyphs explicitly. */
    private const NAMED_FAMILIES = ['fa-regular', 'fa-brands', 'fa-light', 'fa-thin', 'fa-duotone', 'fa-sharp'];

    /** @var string[] Font Awesome tokens that modify a glyph instead of identifying it. */
    private const MODIFIERS = [
        'fa-fw', 'fa-spin', 'fa-pulse', 'fa-beat', 'fa-fade', 'fa-beat-fade', 'fa-bounce', 'fa-shake',
        'fa-flip', 'fa-flip-horizontal', 'fa-flip-vertical', 'fa-flip-both', 'fa-inverse', 'fa-border',
        'fa-xs', 'fa-sm', 'fa-lg', 'fa-xl', 'fa-2xl', 'fa-2x', 'fa-3x', 'fa-4x', 'fa-5x', 'fa-6x',
        'fa-7x', 'fa-8x', 'fa-9x', 'fa-10x', 'fa-li', 'fa-ul', 'fa-stack', 'fa-stack-1x', 'fa-stack-2x',
        'fa-pull-left', 'fa-pull-right', 'fa-rotate-90', 'fa-rotate-180', 'fa-rotate-270', 'fa-rotate-by',
        'fa-solid', 'fa-sr-only',
    ];

    /** @var string Kind of element. */
    private $kind;

    /** @var string[] Classes an element must carry. */
    private $required;

    /** @var string[] Classes an element must not carry. */
    private $excluded;

    /** @var string Component of an image icon. */
    private $component;

    /** @var string Image name of an image icon. */
    private $image;

    /**
     * Create a signature.
     *
     * @param string $kind Kind of element.
     * @param string[] $required Required classes.
     * @param string[] $excluded Excluded classes.
     * @param string $component Component of an image icon.
     * @param string $image Image name of an image icon.
     */
    private function __construct(string $kind, array $required, array $excluded, string $component, string $image) {
        $this->kind = $kind;
        $this->required = $required;
        $this->excluded = $excluded;
        $this->component = $component;
        $this->image = $image;
    }

    /**
     * Build the signature of a font icon from its mapped class string.
     *
     * @param string $classes Mapped classes, for example "fa-regular fa-bookmark".
     * @return self|null Signature, or null when the string names no glyph.
     */
    public static function from_font_classes(string $classes): ?self {
        $identity = [];
        $family = '';
        foreach (preg_split('/\s+/', trim($classes)) as $token) {
            if (!preg_match('/^fa-[a-z0-9-]+$/', $token)) {
                continue;
            }
            if (in_array($token, self::NAMED_FAMILIES, true)) {
                $family = $token;
            } else if (!in_array($token, self::MODIFIERS, true)) {
                $identity[] = $token;
            }
        }
        if ($identity === []) {
            return null;
        }
        sort($identity);
        if ($family !== '') {
            return new self(self::KIND_FONT, array_merge([$family], $identity), [], '', '');
        }
        return new self(self::KIND_FONT, $identity, self::NAMED_FAMILIES, '', '');
    }

    /**
     * Build the signature of an image icon.
     *
     * @param string $component Component, with core in place of moodle.
     * @param string $image Image name inside the component's pix directory.
     * @return self Signature.
     */
    public static function from_image(string $component, string $image): self {
        $component = ($component === '' || $component === 'moodle') ? 'core' : $component;
        return new self(self::KIND_IMAGE, [], [], $component, $image);
    }

    /**
     * Build the signature of the box around every activity icon of one purpose.
     *
     * @param string $purpose Purpose such as assessment.
     * @return self|null Signature, or null when the name cannot be a class.
     */
    public static function from_purpose(string $purpose): ?self {
        return preg_match('/^[a-z0-9_]+$/', $purpose) ? new self(self::KIND_CONTAINER, [], [], 'purpose', $purpose) : null;
    }

    /**
     * Build the signature of the box around the icon of one kind of activity.
     *
     * @param string $modname Name of the activity module such as assign.
     * @return self|null Signature, or null when the name cannot be a class.
     */
    public static function from_activity_type(string $modname): ?self {
        return preg_match('/^[a-z0-9_]+$/', $modname) ? new self(self::KIND_CONTAINER, [], [], 'activity', $modname) : null;
    }

    /**
     * Kind of element.
     *
     * @return string One of the KIND constants.
     */
    public function kind(): string {
        return $this->kind;
    }

    /**
     * Stable identity used to group slots that share one glyph.
     *
     * @return string Identity.
     */
    public function identity(): string {
        if ($this->kind === self::KIND_IMAGE || $this->kind === self::KIND_CONTAINER) {
            return $this->kind . ':' . $this->component . '/' . $this->image;
        }
        return 'font:' . implode(' ', $this->required) . '|' . implode(' ', $this->excluded);
    }

    /**
     * Whether an element with the given classes carries this signature.
     *
     * Image icons are matched by URL, so this applies to font icons only.
     *
     * @param string[] $classes Classes of the element.
     * @return bool True when the element matches.
     */
    public function matches(array $classes): bool {
        if ($this->kind !== self::KIND_FONT) {
            return false;
        }
        foreach ($this->required as $class) {
            if (!in_array($class, $classes, true)) {
                return false;
            }
        }
        foreach ($this->excluded as $class) {
            if (in_array($class, $classes, true)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Selectors matching this signature.
     *
     * @param string $prefix Selector prefix that raises specificity above theme rules.
     * @return string[] Selectors.
     */
    public function selectors(string $prefix): array {
        if ($this->kind === self::KIND_CONTAINER) {
            if ($this->component === 'purpose') {
                return [$prefix . '.activityiconcontainer.' . $this->image];
            }
            // Moodle marks the type of an activity on the list item of the course page, and on the box itself everywhere else:
            // in the activity chooser, in the header of the activity, in the help of the chooser and in the question banks.
            return [
                $prefix . '.modtype_' . $this->image . ' .activityiconcontainer',
                $prefix . '.activityiconcontainer.modicon_' . $this->image,
            ];
        }
        if ($this->kind === self::KIND_FONT) {
            // An element is an icon because of its glyph class, whatever else the markup that draws it carries: the class icon
            // is the one that Moodle writes, not one that an icon needs to be drawn, so it is not asked for. The attribute
            // keeps the weight of the class that used to be here, so the rule is not weaker than the ones of a theme.
            $selector = $prefix . '[class]';
            foreach ($this->required as $class) {
                $selector .= '.' . $class;
            }
            foreach ($this->excluded as $class) {
                $selector .= ':not(.' . $class . ')';
            }
            return [$selector];
        }
        $component = self::escape_value($this->component);
        $path = self::escape_value($this->image);
        $encoded = self::escape_value(rawurlencode($this->image));
        $base = $prefix . 'img';
        return [
            $base . '[src*="/image.php/"][src*="/' . $component . '/"][src$="/' . $path . '"]',
            $base . '[src*="component=' . $component . '"][src$="image=' . $encoded . '"]',
            $base . '[src*="component=' . $component . '"][src*="image=' . $encoded . '&"]',
        ];
    }

    /**
     * Escape a value placed inside a quoted attribute selector.
     *
     * @param string $value Raw value.
     * @return string Escaped value.
     */
    private static function escape_value(string $value): string {
        return addcslashes($value, "\\\"\n\r\f");
    }
}
