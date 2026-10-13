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

use Behat\Gherkin\Node\TableNode;

/**
 * Steps that take the annotated screenshots of the user manual: numbered rings over the controls the text explains, and a
 * capture cropped to one area of the page.
 *
 * @package local_iconrestyle
 * @copyright 2026 Didactika.org
 * @author Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class behat_local_iconrestyle_manual extends behat_base {
    /** @var int Pixels of the page that are kept around a cropped area, so the numbers that sit outside it are seen. */
    private const MARGIN = 18;

    /**
     * Draw a numbered ring over each element of a list, so a screenshot can point at it.
     *
     * The table has the columns selector, number and, optionally, text (the element whose text contains it is chosen when the
     * selector matches several) and where (top-left, top-right, left, right or bottom-left: where the number sits).
     *
     * @When /^I mark the page with:$/
     * @param TableNode $table Rows of what to mark.
     */
    public function i_mark_the_page_with(TableNode $table): void {
        $rows = [];
        foreach ($table->getHash() as $row) {
            $rows[] = [
                'selector' => $row['selector'],
                'number' => $row['number'],
                'text' => $row['text'] ?? '',
                'where' => ($row['where'] ?? '') !== '' ? $row['where'] : 'top-left',
            ];
        }
        $script = "(function (rows) {
            Array.prototype.slice.call(document.querySelectorAll('.irs-doc-mark')).forEach(function (n) { n.remove(); });
            var missing = [];
            rows.forEach(function (row) {
                var list = Array.prototype.slice.call(document.querySelectorAll(row.selector));
                if (row.text !== '') {
                    list = list.filter(function (n) { return n.textContent.replace(/\\s+/g, ' ').indexOf(row.text) !== -1; });
                }
                list = list.filter(function (n) { var b = n.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
                if (!list.length) {
                    missing.push(row.selector + (row.text !== '' ? ' [' + row.text + ']' : ''));
                    return;
                }
                var r = list[0].getBoundingClientRect();
                var ring = document.createElement('div');
                ring.className = 'irs-doc-mark';
                ring.style.cssText = 'position:fixed;z-index:2147483000;pointer-events:none;box-sizing:border-box;' +
                    'border:2px solid #e83e8c;border-radius:8px;box-shadow:0 0 0 3px rgba(232,62,140,.25);' +
                    'left:' + (r.left - 3) + 'px;top:' + (r.top - 3) + 'px;width:' + (r.width + 6) + 'px;height:' + (r.height + 6) + 'px';
                document.body.appendChild(ring);
                var at = {
                    'top-left': [r.left - 14, r.top - 14],
                    'top-right': [r.right - 8, r.top - 14],
                    'left': [r.left - 34, r.top + r.height / 2 - 11],
                    'right': [r.right + 10, r.top + r.height / 2 - 11],
                    'bottom-left': [r.left - 14, r.bottom - 8]
                }[row.where] || [r.left - 14, r.top - 14];
                var badge = document.createElement('div');
                badge.className = 'irs-doc-mark';
                badge.textContent = row.number;
                badge.style.cssText = 'position:fixed;z-index:2147483001;pointer-events:none;width:22px;height:22px;' +
                    'border-radius:50%;background:#e83e8c;color:#fff;font:700 12px/22px sans-serif;text-align:center;' +
                    'box-shadow:0 1px 3px rgba(0,0,0,.45);left:' + at[0] + 'px;top:' + at[1] + 'px';
                document.body.appendChild(badge);
            });
            return missing.join(', ');
        })(" . json_encode($rows) . ")";
        $missing = (string)$this->getSession()->evaluateScript($script);
        if ($missing !== '') {
            throw new \Behat\Mink\Exception\ExpectationException(
                'Nothing to mark for: ' . $missing,
                $this->getSession()
            );
        }
    }

    /**
     * Take the rings away again.
     *
     * @When /^I clear the marks$/
     */
    public function i_clear_the_marks(): void {
        $this->getSession()->executeScript(
            "Array.prototype.slice.call(document.querySelectorAll('.irs-doc-mark')).forEach(function (n) { n.remove(); });"
        );
    }

    /**
     * Open one group of the editing panel and close the others, so its controls are all in view.
     *
     * @When /^I show only the group "([^"]+)" of the editing panel$/
     * @param string $name Title of the group.
     */
    public function i_show_only_the_group(string $name): void {
        $script = "(function (name) {
            var found = false;
            Array.prototype.slice.call(document.querySelectorAll('.irs-panel details.irs-group')).forEach(function (g) {
                var summary = g.querySelector('summary');
                var wanted = summary && summary.textContent.trim() === name;
                g.open = wanted;
                found = found || wanted;
            });
            var body = document.querySelector('.irs-panel-body');
            if (body) { body.scrollTop = 0; }
            return found;
        })(" . json_encode($name) . ")";
        if (!$this->getSession()->evaluateScript($script)) {
            throw new \Behat\Mink\Exception\ExpectationException('There is no group called ' . $name, $this->getSession());
        }
    }

    /**
     * Scroll the editing panel until an element is in view.
     *
     * @When /^I scroll the editing panel to "([^"]+)"$/
     * @param string $selector CSS selector.
     */
    public function i_scroll_the_editing_panel_to(string $selector): void {
        $this->getSession()->executeScript(
            "var e = document.querySelector(" . json_encode($selector) . "); if (e) { e.scrollIntoView({block: 'center'}); }"
        );
    }

    /**
     * Save a screenshot cropped to one area of the page, with a margin that keeps the numbers drawn around it.
     *
     * @Then /^I capture the area "([^"]+)" as "([^"]+)"$/
     * @param string $selector CSS selector of the area.
     * @param string $name Screenshot name.
     */
    public function i_capture_the_area(string $selector, string $name): void {
        global $CFG;
        $json = (string)$this->getSession()->evaluateScript(
            "(function (s) { var e = document.querySelector(s); if (!e) { return ''; } var r = e.getBoundingClientRect();
            return JSON.stringify({l: r.left, t: r.top, w: r.width, h: r.height, iw: window.innerWidth}); })(" .
            json_encode($selector) . ")"
        );
        $box = json_decode($json, true);
        if (!is_array($box)) {
            throw new \Behat\Mink\Exception\ExpectationException('There is nothing to capture at ' . $selector, $this->getSession());
        }
        $image = imagecreatefromstring($this->getSession()->getScreenshot());
        $scale = imagesx($image) / max(1, $box['iw']);
        $x = max(0, (int)floor(($box['l'] - self::MARGIN) * $scale));
        $y = max(0, (int)floor(($box['t'] - self::MARGIN) * $scale));
        $width = min(imagesx($image) - $x, (int)ceil(($box['w'] + 2 * self::MARGIN) * $scale));
        $height = min(imagesy($image) - $y, (int)ceil(($box['h'] + 2 * self::MARGIN) * $scale));
        $cropped = imagecrop($image, ['x' => $x, 'y' => $y, 'width' => $width, 'height' => $height]);
        $file = ($CFG->behat_faildump_path ?? sys_get_temp_dir()) . '/' . clean_param($name, PARAM_ALPHANUMEXT) . '.png';
        imagepng($cropped, $file);
    }
}
