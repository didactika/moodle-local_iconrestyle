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

// NOTE: no MOODLE_INTERNAL test here. This file is required by Behat before the Moodle environment is set up.

require_once(__DIR__ . '/../../../../lib/behat/behat_base.php');

/**
 * Steps that inspect how icons are really painted in the browser.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class behat_local_iconrestyle extends behat_base {
    /**
     * Check that the page carries the icon stylesheet, loaded after the theme stylesheet.
     *
     * @Then /^the page should include the icon stylesheet$/
     */
    public function the_page_should_include_the_icon_stylesheet(): void {
        $script = "(function () {
            var links = Array.prototype.slice.call(document.querySelectorAll('link[rel=stylesheet]'));
            var own = links.filter(function (l) { return l.href.indexOf('/local/iconrestyle/styles.php/') !== -1; });
            var theme = links.filter(function (l) { return l.href.indexOf('/theme/styles.php/') !== -1; });
            if (own.length !== 1 || theme.length === 0) { return 'own=' + own.length + ' theme=' + theme.length; }
            var order = links.indexOf(own[0]) > links.indexOf(theme[theme.length - 1]);
            return order ? 'ok' : 'before-theme';
        })()";
        $result = $this->getSession()->evaluateScript($script);
        if ($result !== 'ok') {
            throw new \Behat\Mink\Exception\ExpectationException(
                'Icon stylesheet check failed: ' . $result,
                $this->getSession()
            );
        }
    }

    /**
     * Check one computed style of the pseudo-element of an icon rendered by Moodle.
     *
     * @Then /^the icon "([^"]+)" pseudo-element "([^"]+)" should have "([^"]+)" containing "([^"]+)"$/
     * @param string $slot Slot key such as core:a/setting.
     * @param string $pseudo Pseudo-element such as ::before.
     * @param string $property CSS property.
     * @param string $text Text the computed value must contain.
     */
    public function the_icon_pseudo_should_have(string $slot, string $pseudo, string $property, string $text): void {
        $actual = $this->computed($this->icon_html($slot), $pseudo, $property);
        if (strpos((string)$actual, $text) === false) {
            throw new \Behat\Mink\Exception\ExpectationException(
                "The icon {$slot} {$pseudo} has {$property} '{$actual}', which does not contain '{$text}'.",
                $this->getSession()
            );
        }
    }

    /**
     * Check one computed style of an image icon, built from Moodle's own image address for the slot.
     *
     * @Then /^the image icon "([^"]+)" should have "([^"]+)" "([^"]+)"$/
     * @param string $slot Slot key such as core:i/groupn.
     * @param string $property CSS property.
     * @param string $value Expected computed value.
     */
    public function the_image_icon_should_have(string $slot, string $property, string $value): void {
        global $OUTPUT, $PAGE;
        [$component, $name] = explode(':', $slot, 2);
        $PAGE->set_url('/');
        $url = $OUTPUT->image_url($name, $component === 'core' ? 'moodle' : $component)->out(false);
        $html = '<img class="icon" alt="" src="' . s($url) . '">';
        $actual = $this->computed($html, null, $property);
        if ($actual !== $value) {
            throw new \Behat\Mink\Exception\ExpectationException(
                "The image icon {$slot} has {$property} '{$actual}', expected '{$value}'.",
                $this->getSession()
            );
        }
    }

    /**
     * Show icons on the page and save a screenshot, so a person can look at how they are painted.
     *
     * @Then /^I capture the icons "([^"]+)" as "([^"]+)"$/
     * @param string $slots Comma-separated slot keys.
     * @param string $name Screenshot name.
     */
    public function i_capture_the_icons(string $slots, string $name): void {
        global $CFG;
        $cells = '';
        foreach (array_map('trim', explode(',', $slots)) as $slot) {
            $cells .= '<span style="display:inline-block;margin:12px;font-size:64px;line-height:64px">' .
                '<span class="icon-size-5">' . $this->icon_html($slot) . '</span></span>';
        }
        $script = "(function () {
            var host = document.createElement('div');
            host.id = 'iconrestyle-capture';
            host.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:99999;background:#fff;padding:24px';
            host.innerHTML = " . json_encode($cells) . ";
            document.body.appendChild(host);
        })()";
        $this->getSession()->executeScript($script);
        $directory = $CFG->behat_faildump_path ?? sys_get_temp_dir();
        $file = $directory . '/' . clean_param($name, PARAM_ALPHANUMEXT) . '.png';
        file_put_contents($file, $this->getSession()->getScreenshot());
    }

    /**
     * Check one computed style of the first icon in one column of the designer's preview.
     *
     * @Then /^the (default|current|new) preview icon should have "([^"]+)" "([^"]+)"$/
     * @param string $area Preview column.
     * @param string $property CSS property.
     * @param string $value Expected computed value.
     */
    public function the_preview_icon_should_have(string $area, string $property, string $value): void {
        $host = json_encode('[data-region="cells-' . $area . '"]');
        $read = "(function () {
            var host = document.querySelector(" . $host . ");
            var element = host && host.shadowRoot ? host.shadowRoot.querySelector('.irs-cell > *') : null;
            return element ? window.getComputedStyle(element)[" . json_encode($property) . "] : '';
        })()";
        $this->getSession()->wait(5000, '(' . $read . ') === ' . json_encode($value));
        $actual = $this->getSession()->evaluateScript($read);
        if ($actual !== $value) {
            throw new \Behat\Mink\Exception\ExpectationException(
                "The {$area} preview icon has {$property} '{$actual}', expected '{$value}'.",
                $this->getSession()
            );
        }
    }

    /**
     * Choose a fixture file in the designer's upload field.
     *
     * The file is created in the page, because the browser container cannot see the plugin's files.
     *
     * @When /^I choose the artwork fixture "([^"]+)"$/
     * @param string $name Name of a file in tests/fixtures, without extension.
     */
    public function i_choose_the_artwork_fixture(string $name): void {
        $content = file_get_contents(__DIR__ . '/../fixtures/' . clean_param($name, PARAM_ALPHANUMEXT) . '.svg');
        $script = "(function () {
            var input = document.getElementById('irs-upload');
            var transfer = new DataTransfer();
            transfer.items.add(new File([" . json_encode($content) . "], 'fixture.svg', {type: 'image/svg+xml'}));
            input.files = transfer.files;
            input.dispatchEvent(new Event('change', {bubbles: true}));
        })()";
        $this->getSession()->executeScript($script);
    }

    /**
     * Save a screenshot of the whole page, for looking at it.
     *
     * @Then /^I capture the page as "([^"]+)"$/
     * @param string $name Screenshot name.
     */
    public function i_capture_the_page(string $name): void {
        global $CFG;
        $file = ($CFG->behat_faildump_path ?? sys_get_temp_dir()) . '/' . clean_param($name, PARAM_ALPHANUMEXT) . '.png';
        file_put_contents($file, $this->getSession()->getScreenshot());
    }

    /**
     * Open the designer by its address, as someone who does not use the administration menu would.
     *
     * @When /^I open the icon designer address$/
     */
    public function i_open_the_icon_designer_address(): void {
        $this->getSession()->visit($this->locate_path('/local/iconrestyle/designer.php'));
    }

    /**
     * Open a page of the site by its path.
     *
     * @When /^I visit the path "([^"]+)"$/
     * @param string $path Path starting with a slash.
     */
    public function i_visit_the_path(string $path): void {
        $this->getSession()->visit($this->locate_path($path));
    }

    /**
     * Check the colour really painted on screen at a point inside the artwork of an icon.
     *
     * Computed styles can be right while nothing is drawn, so this reads a pixel of a screenshot. The icon is shown as
     * Moodle renders it, at its normal size and without any wrapper that would give it a size. The point is the centre
     * of the icon's width and 70% of its height, which lies inside the triangle used by the fixtures.
     *
     * @Then /^the icon "([^"]+)" should be painted "(#[0-9a-f]{6})" inside its artwork$/
     * @param string $slot Slot key such as core:a/setting.
     * @param string $expected Expected colour as six hexadecimal digits.
     */
    public function the_icon_should_be_painted(string $slot, string $expected): void {
        $script = "(function () {
            var host = document.createElement('div');
            host.id = 'iconrestyle-pixels';
            host.style.cssText = 'position:fixed;left:20px;top:20px;z-index:99999;background:#fff;padding:20px';
            host.innerHTML = " . json_encode($this->icon_html($slot)) . ";
            document.body.appendChild(host);
            var rect = host.querySelector('.icon').getBoundingClientRect();
            return JSON.stringify([rect.left, rect.top, rect.width, rect.height]);
        })()";
        [$left, $top, $width, $height] = json_decode($this->getSession()->evaluateScript($script));
        $image = imagecreatefromstring($this->getSession()->getScreenshot());
        $this->getSession()->executeScript("document.getElementById('iconrestyle-pixels').remove();");
        $rgb = imagecolorat($image, (int)round($left + $width * 0.5), (int)round($top + $height * 0.7));
        $actual = [($rgb >> 16) & 0xFF, ($rgb >> 8) & 0xFF, $rgb & 0xFF];
        $wanted = [hexdec(substr($expected, 1, 2)), hexdec(substr($expected, 3, 2)), hexdec(substr($expected, 5, 2))];
        foreach ($wanted as $index => $channel) {
            if (abs($channel - $actual[$index]) > 12) {
                throw new \Behat\Mink\Exception\ExpectationException(
                    sprintf(
                        'The icon %s is painted rgb(%s) inside its artwork, expected %s.',
                        $slot,
                        implode(', ', $actual),
                        $expected
                    ),
                    $this->getSession()
                );
            }
        }
    }

    /**
     * Markup of an icon as Moodle renders it.
     *
     * @param string $slot Slot key.
     * @return string HTML.
     */
    private function icon_html(string $slot): string {
        global $OUTPUT, $PAGE;
        [$component, $name] = explode(':', $slot, 2);
        $PAGE->set_url('/');
        return $OUTPUT->pix_icon($name, 'Example', $component === 'core' ? 'moodle' : $component);
    }

    /**
     * Insert markup into the page and read one computed style of its first element.
     *
     * @param string $html Markup.
     * @param string|null $pseudo Pseudo-element, or null for the element itself.
     * @param string $property CSS property.
     * @return string|null Computed value.
     */
    private function computed(string $html, ?string $pseudo, string $property): ?string {
        $script = "(function () {
            var host = document.createElement('div');
            host.id = 'iconrestyle-probe';
            host.innerHTML = " . json_encode($html) . ";
            document.body.appendChild(host);
            var element = host.firstElementChild;
            var computed = window.getComputedStyle(element, " . json_encode($pseudo) . ")[" . json_encode($property) . "];
            host.remove();
            return computed;
        })()";
        return $this->getSession()->evaluateScript($script);
    }

    /**
     * Render an icon with Moodle's own renderer inside the page and check one computed style of it.
     *
     * @Then /^the icon "([^"]+)" should have "([^"]+)" "([^"]+)"$/
     * @param string $slot Slot key such as core:a/setting.
     * @param string $property CSS property.
     * @param string $value Expected computed value.
     */
    public function the_icon_should_have(string $slot, string $property, string $value): void {
        global $OUTPUT, $PAGE;
        [$component, $name] = explode(':', $slot, 2);
        $PAGE->set_url('/');
        $html = $OUTPUT->pix_icon($name, 'Example', $component === 'core' ? 'moodle' : $component);
        $script = "(function () {
            var host = document.createElement('div');
            host.id = 'iconrestyle-probe';
            host.innerHTML = " . json_encode($html) . ";
            document.body.appendChild(host);
            var element = host.firstElementChild;
            var computed = window.getComputedStyle(element)[" . json_encode($property) . "];
            host.remove();
            return computed;
        })()";
        $actual = $this->getSession()->evaluateScript($script);
        if ($actual !== $value) {
            throw new \Behat\Mink\Exception\ExpectationException(
                "The icon {$slot} has {$property} '{$actual}', expected '{$value}'.",
                $this->getSession()
            );
        }
    }
}
