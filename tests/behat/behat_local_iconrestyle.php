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
     * @Then /^the (default|new) preview icon should have "([^"]+)" "([^"]+)"$/
     * @param string $area Preview column.
     * @param string $property CSS property.
     * @param string $value Expected computed value.
     */
    public function the_preview_icon_should_have(string $area, string $property, string $value): void {
        $host = json_encode('[data-region="cells-' . $area . '"]');
        $read = "(function () {
            var host = document.querySelector(" . $host . ");
            var element = host && host.shadowRoot ? host.shadowRoot.querySelector('.irs-cell .irs-fit > *') : null;
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
     * Choose a package in the file field of the import, as if the person picked it from their computer.
     *
     * @When /^I choose the package fixture "([^"]+)"$/
     * @param string $name Name of a file in tests/fixtures, without extension.
     */
    public function i_choose_the_package_fixture(string $name): void {
        $content = file_get_contents(__DIR__ . '/../fixtures/' . clean_param($name, PARAM_ALPHANUMEXT) . '.iconrestyle');
        $script = "(function () {
            var input = document.querySelector('[data-region=\"exchange-file\"]');
            var transfer = new DataTransfer();
            transfer.items.add(new File([" . json_encode($content) . "], 'fixture.iconrestyle', {type: 'text/plain'}));
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

    /**
     * Render an icon with Moodle's own renderer and check a length that the design gives in em, against the font size
     * the icon really has, which differs between Moodle versions and so cannot be written as pixels.
     *
     * @Then /^the icon "([^"]+)" should have "([^"]+)" of "(-?[0-9.]+)" em$/
     * @param string $slot Slot key such as core:a/setting.
     * @param string $property CSS property.
     * @param string $em Expected length in em.
     */
    public function the_icon_should_have_em(string $slot, string $property, string $em): void {
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
            var computed = window.getComputedStyle(element);
            var result = JSON.stringify({value: computed[" . json_encode($property) . "], size: computed['fontSize']});
            host.remove();
            return result;
        })()";
        $found = json_decode((string)$this->getSession()->evaluateScript($script), true);
        $expected = (float)$em * (float)$found['size'];
        if (abs((float)$found['value'] - $expected) > 0.1) {
            throw new \Behat\Mink\Exception\ExpectationException(
                "The icon {$slot} has {$property} '{$found['value']}', expected {$em} em of a font of {$found['size']}.",
                $this->getSession()
            );
        }
    }

    /**
     * Check one computed style of the box Moodle draws around the icons of a purpose, or of the glyph inside it.
     *
     * @Then /^the (box|glyph) of the "([a-z]+)" activities (should|should not) have "([^"]+)" "([^"]+)"$/
     * @param string $part box or glyph.
     * @param string $purpose Purpose such as assessment.
     * @param string $expectation should or should not.
     * @param string $property CSS property.
     * @param string $value Computed value.
     */
    public function the_activity_part_should_have(
        string $part,
        string $purpose,
        string $expectation,
        string $property,
        string $value
    ): void {
        $selector = '.activityiconcontainer.' . $purpose . ($part === 'glyph' ? ' .activityicon' : '');
        $read = "(function () {
            var element = document.querySelector(" . json_encode($selector) . ");
            return element ? window.getComputedStyle(element)[" . json_encode($property) . "] : '';
        })()";
        $wanted = $expectation === 'should';
        $this->getSession()->wait(5000, '((' . $read . ') === ' . json_encode($value) . ') === ' . json_encode($wanted));
        $actual = $this->getSession()->evaluateScript($read);
        if (($actual === $value) !== $wanted) {
            throw new \Behat\Mink\Exception\ExpectationException(
                "The {$part} of the {$purpose} activities has {$property} '{$actual}', which {$expectation} be '{$value}'.",
                $this->getSession()
            );
        }
    }

    /**
     * Check that the glyph inside the box of a purpose is really painted in a colour, by looking at the screen.
     *
     * The glyph is an image whose colour comes from a filter and which is moved out of its box, so computed styles cannot tell
     * whether it shows. The box is scanned, because the image itself is not where it is drawn.
     *
     * @Then /^the glyph of the "([a-z]+)" activities should show "(#[0-9a-f]{6})"$/
     * @param string $purpose Purpose such as assessment.
     * @param string $expected Expected colour as six hexadecimal digits.
     */
    public function the_glyph_should_show(string $purpose, string $expected): void {
        $selector = '.activityiconcontainer.' . $purpose;
        $script = "(function () {
            var element = document.querySelector(" . json_encode($selector) . ");
            element.scrollIntoView({block: 'center'});
            var rect = element.getBoundingClientRect();
            return JSON.stringify([rect.left, rect.top, rect.width, rect.height]);
        })()";
        [$left, $top, $width, $height] = json_decode($this->getSession()->evaluateScript($script));
        $image = imagecreatefromstring($this->getSession()->getScreenshot());
        $wanted = [hexdec(substr($expected, 1, 2)), hexdec(substr($expected, 3, 2)), hexdec(substr($expected, 5, 2))];
        $found = 0;
        for ($x = (int)$left; $x < (int)($left + $width); $x++) {
            for ($y = (int)$top; $y < (int)($top + $height); $y++) {
                $rgb = imagecolorat($image, $x, $y);
                $actual = [($rgb >> 16) & 0xFF, ($rgb >> 8) & 0xFF, $rgb & 0xFF];
                $near = abs($wanted[0] - $actual[0]) <= 12 && abs($wanted[1] - $actual[1]) <= 12;
                if ($near && abs($wanted[2] - $actual[2]) <= 12) {
                    $found++;
                }
            }
        }
        if ($found < 8) {
            throw new \Behat\Mink\Exception\ExpectationException(
                "The glyph of the {$purpose} activities shows only {$found} pixels of {$expected}.",
                $this->getSession()
            );
        }
    }

    /**
     * Put the page in the colour mode that Boost writes on the html element, as Moodle 5.3 does for dark mode.
     *
     * @When /^I switch the page to (light|dark) mode$/
     * @param string $mode light or dark.
     */
    public function i_switch_the_page_to_mode(string $mode): void {
        $this->getSession()->executeScript("document.documentElement.setAttribute('data-bs-theme', " . json_encode($mode) . ");");
    }

    /**
     * Wait until the designer has written everything it was asked to change.
     *
     * The designer saves on its own a moment after the last change and shows its state, so this follows that state.
     *
     * @Then /^the changes are saved$/
     */
    public function the_changes_are_saved(): void {
        $read = "(function () {
            var status = document.querySelector('[data-region=\"status\"]');
            return status ? status.dataset.state : '';
        })()";
        $this->getSession()->wait(20000, '(' . $read . ') === "saved"');
        $actual = $this->getSession()->evaluateScript($read);
        if ($actual !== 'saved') {
            throw new \Behat\Mink\Exception\ExpectationException(
                "The designer did not finish saving, its state is '{$actual}'.",
                $this->getSession()
            );
        }
    }

    /**
     * Wait until the modal that adds places has finished appearing, which Behat cannot tell from its content alone.
     *
     * @Then /^the places modal is open$/
     */
    public function the_places_modal_is_open(): void {
        $read = "document.querySelector('.modal.show .irs-places-form') !== null";
        $this->getSession()->wait(10000, $read);
        if (!$this->getSession()->evaluateScript($read)) {
            throw new \Behat\Mink\Exception\ExpectationException('The modal that adds places did not open.', $this->getSession());
        }
    }

    /**
     * Wait until the modal has finished closing, so nothing is left in front of the page.
     *
     * @Then /^the places modal is closed$/
     */
    public function the_places_modal_is_closed(): void {
        $read = "document.querySelector('.modal.show .irs-places-form') === null";
        $this->getSession()->wait(10000, $read);
        if (!$this->getSession()->evaluateScript($read)) {
            throw new \Behat\Mink\Exception\ExpectationException('The modal that adds places did not close.', $this->getSession());
        }
    }

    /**
     * Pick a place in the autocomplete of the modal that adds places: type its name, which selects the only place that matches.
     *
     * @When /^I choose the place "(?P<name_string>(?:[^"]|\\")*)" in the "(?P<kind_string>category|course|activity)" field$/
     * @param string $name Text to type and to find among the chosen places.
     * @param string $kind Kind of place the field belongs to.
     */
    public function i_choose_the_place_in_the_field(string $name, string $kind): void {
        $field = "//div[@data-kind-field='" . $kind . "']";
        $this->execute('behat_forms::i_set_the_field_with_xpath_to', [$field . "//input[@type='text']", $name]);
        $literal = $this->getSession()->getSelectorsHandler()->xpathLiteral($name);
        $chosen = $field . "//*[@data-value][contains(@class, 'badge') or @role='option' or @role='listitem']"
            . "[contains(., " . $literal . ")]";
        $this->execute('behat_general::wait_until_exists', [$chosen, 'xpath_element']);
    }

    /**
     * Check how many icons the designer lists.
     *
     * @Then /^the designer lists at least "(\d+)" icons$/
     * @param string $minimum Fewest icons.
     */
    public function the_designer_lists_at_least_icons(string $minimum): void {
        $text = $this->getSession()->evaluateScript("document.querySelector('[data-region=\"count\"]').textContent");
        $count = (int)preg_replace('/\D+/', '', (string)$text);
        if ($count < (int)$minimum) {
            throw new \Behat\Mink\Exception\ExpectationException(
                'The designer lists ' . $count . ' icons, fewer than ' . $minimum . '.',
                $this->getSession()
            );
        }
    }

    /**
     * Check that the grid only holds the cards that can be seen, however many icons there are.
     *
     * @Then /^the grid holds at most "(\d+)" cards$/
     * @param string $maximum Most cards.
     */
    public function the_grid_holds_at_most_cards(string $maximum): void {
        $cards = (int)$this->getSession()->evaluateScript("document.querySelectorAll('.irs-card').length");
        if ($cards > (int)$maximum) {
            throw new \Behat\Mink\Exception\ExpectationException(
                'The grid holds ' . $cards . ' cards, more than ' . $maximum . '.',
                $this->getSession()
            );
        }
    }

    /**
     * Check how long the designer took from its start to the first grid on screen.
     *
     * @Then /^the designer drew its first grid within "(\d+)" milliseconds$/
     * @param string $budget Most milliseconds.
     */
    public function the_designer_drew_its_first_grid_within(string $budget): void {
        $script = "(function () {
            var start = performance.getEntriesByName('irs:init')[0];
            var done = performance.getEntriesByName('irs:rendered')[0];
            return start && done ? Math.round(done.startTime - start.startTime) : -1;
        })()";
        $took = (int)$this->getSession()->evaluateScript($script);
        if ($took < 0 || $took > (int)$budget) {
            throw new \Behat\Mink\Exception\ExpectationException(
                'The first grid took ' . $took . ' ms, the budget is ' . $budget . ' ms.',
                $this->getSession()
            );
        }
    }

    /**
     * Scroll the icon grid from the top to the bottom in steps, as fast as the browser lets it, and note how long it took.
     *
     * @When /^I scroll the icon grid through the whole catalogue$/
     */
    public function i_scroll_the_icon_grid_through_the_whole_catalogue(): void {
        $script = "(function () {
            var view = document.querySelector('[data-region=\"grid\"]');
            var steps = 40;
            var step = 0;
            var worst = 0;
            var started = performance.now();
            var last = started;
            window.irsScroll = null;
            var next = function () {
                step++;
                view.scrollTop = Math.round((view.scrollHeight - view.clientHeight) * step / steps);
                window.requestAnimationFrame(function () {
                    var now = performance.now();
                    worst = Math.max(worst, now - last);
                    last = now;
                    if (step < steps) {
                        window.setTimeout(next, 0);
                    } else {
                        window.irsScroll = {total: Math.round(now - started), worst: Math.round(worst)};
                    }
                });
            };
            next();
        })()";
        $this->getSession()->executeScript($script);
        $this->getSession()->wait(60000, 'window.irsScroll !== null');
    }

    /**
     * Check how smooth the scroll was.
     *
     * @Then /^scrolling took at most "(\d+)" milliseconds and no frame took more than "(\d+)"$/
     * @param string $total Most milliseconds for the whole scroll.
     * @param string $frame Most milliseconds for one frame.
     */
    public function scrolling_took_at_most(string $total, string $frame): void {
        $result = $this->getSession()->evaluateScript('window.irsScroll');
        if (!is_array($result)) {
            throw new \Behat\Mink\Exception\ExpectationException('The scroll did not finish.', $this->getSession());
        }
        if ((int)$result['total'] > (int)$total || (int)$result['worst'] > (int)$frame) {
            throw new \Behat\Mink\Exception\ExpectationException(
                'Scrolling took ' . $result['total'] . ' ms with a slowest frame of ' . $result['worst'] . ' ms, the budget is ' .
                    $total . ' ms and ' . $frame . ' ms.',
                $this->getSession()
            );
        }
    }

    /**
     * Turn colour modes on, which only Moodle versions that have them can do; on the others the scenario is left pending.
     *
     * @Given /^colour modes are turned on$/
     */
    public function colour_modes_are_turned_on(): void {
        if (!class_exists(\theme_boost\colour_mode::class)) {
            throw new \Behat\Behat\Tester\Exception\PendingException('This Moodle has no colour modes.');
        }
        set_config('enablecolourmodes', 1, 'theme_boost');
        // Chrome may still be fetching theme files of the previous scenario, which makes the removal of that cache warn.
        set_error_handler(static function (): bool {
            return true;
        }, E_WARNING);
        try {
            theme_reset_all_caches();
        } finally {
            restore_error_handler();
        }
    }

    /**
     * Open the activity chooser of the first section of the course.
     *
     * The step of core clicks the link of the section, which Chrome does not consider interactable until the section is
     * hovered; here the link is clicked by script.
     *
     * @When /^I open the activity chooser of the course$/
     */
    public function i_open_the_activity_chooser_of_the_course(): void {
        $this->getSession()->wait(
            10000,
            "document.querySelector('[data-action=\"open-chooser\"], .section-modchooser-link') !== null"
        );
        $this->getSession()->executeScript(
            "document.querySelector('[data-action=\"open-chooser\"], .section-modchooser-link').click();"
        );
        $this->getSession()->wait(10000, "document.querySelector('.modal.show .optionicon') !== null");
    }

    /**
     * Check the theme colour a colour field shows.
     *
     * @Then /^the theme colour of "(fg|bg|bc|sc)" should contain "([^"]+)"$/
     * @param string $name Name of the colour field.
     * @param string $text Text the colour must contain.
     */
    public function the_theme_colour_should_contain(string $name, string $text): void {
        $value = (string)$this->getSession()->evaluateScript(
            "document.querySelector('[data-region=\"" . $name . "-themeinput\"]').value"
        );
        if (strpos($value, $text) === false) {
            throw new \Behat\Mink\Exception\ExpectationException(
                'The theme colour of ' . $name . ' is "' . $value . '", which does not contain "' . $text . '".',
                $this->getSession()
            );
        }
    }

    /**
     * Check that a colour field shows the code of the colour it has, also when the colour comes from the theme.
     *
     * @Then /^the colour of "(fg|bg|bc|sc)" should be written as a hex code$/
     * @param string $name Name of the colour field.
     */
    public function the_colour_should_be_a_hex_code(string $name): void {
        $value = (string)$this->getSession()->evaluateScript(
            "document.querySelector('[data-region=\"" . $name . "-hex\"]').value"
        );
        if (!preg_match('/^#[0-9a-f]{6,8}$/', $value)) {
            throw new \Behat\Mink\Exception\ExpectationException(
                'The colour of ' . $name . ' is written as "' . $value . '", not as a hex code.',
                $this->getSession()
            );
        }
    }

    /**
     * Check one computed style of the box of an activity in the activity chooser.
     *
     * @Then /^the box of "([a-z0-9_]+)" in the activity chooser should have "([^"]+)" "([^"]+)"$/
     * @param string $module Name of the module, such as assign.
     * @param string $property CSS property.
     * @param string $value Computed value.
     */
    public function the_chooser_box_should_have(string $module, string $property, string $value): void {
        $selector = '.modal.show .optionicon.modicon_' . $module;
        $actual = (string)$this->getSession()->evaluateScript(
            "(function () { var e = document.querySelector(" . json_encode($selector) . "); " .
            "return e ? window.getComputedStyle(e)[" . json_encode($property) . "] : ''; })()"
        );
        if ($actual !== $value) {
            throw new \Behat\Mink\Exception\ExpectationException(
                'The box of ' . $module . ' in the chooser has ' . $property . " '" . $actual . "', expected '" . $value . "'.",
                $this->getSession()
            );
        }
    }
}
