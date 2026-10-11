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
     * Render an icon with Moodle's own renderer inside the page and check one computed style of it.
     *
     * @Then /^the icon "(?P<slot_string>[^"]+)" should have "(?P<property_string>[^"]+)" "(?P<value_string>[^"]+)"$/
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
