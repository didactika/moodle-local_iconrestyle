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
 * Tests for the framework-free modules of the designer. Run with: node --test tests/js
 *
 * @copyright  2026 Didactika.org
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHex, toHex, normalise, rgbToHsv, hsvToRgb, contrastRatio} from '../../amd/src/lib/color.js';
import {createHistory} from '../../amd/src/lib/history.js';
import {filterIcons, visibleRows} from '../../amd/src/lib/filter.js';
import {emptyDraft, ruleKey, toInput, whereKey, whereLabel} from '../../amd/src/lib/draft.js';

test('colours parse and normalise to the form the server stores', () => {
    assert.deepEqual(parseHex('#fff'), {r: 255, g: 255, b: 255, a: 255});
    assert.deepEqual(parseHex('#f008'), {r: 255, g: 0, b: 0, a: 136});
    assert.equal(normalise('#1B6EC2'), '#1b6ec2');
    assert.equal(normalise('#fff'), '#ffffff');
    assert.equal(normalise('  #1b6ec2ff '), '#1b6ec2');
    assert.equal(toHex({r: 255, g: 0, b: 0, a: 128}), '#ff000080');
    for (const bad of ['', 'red', '#12', '#ggg', 'rgb(1,2,3)', '#fff;x', 'url(x)']) {
        assert.equal(normalise(bad), null, bad);
    }
});

test('hsv and rgb convert both ways', () => {
    assert.deepEqual(hsvToRgb({h: 0, s: 1, v: 1}), {r: 255, g: 0, b: 0});
    assert.deepEqual(hsvToRgb({h: 240, s: 1, v: 1}), {r: 0, g: 0, b: 255});
    assert.deepEqual(hsvToRgb({h: 120, s: 0, v: 0.5}), {r: 128, g: 128, b: 128});
    for (const colour of [{r: 27, g: 110, b: 194}, {r: 232, g: 62, b: 140}, {r: 10, g: 107, b: 61}, {r: 0, g: 0, b: 0}]) {
        const back = hsvToRgb(rgbToHsv(colour));
        for (const channel of ['r', 'g', 'b']) {
            assert.ok(Math.abs(back[channel] - colour[channel]) <= 1, JSON.stringify(colour));
        }
    }
});

test('contrast follows WCAG', () => {
    const white = {r: 255, g: 255, b: 255};
    const black = {r: 0, g: 0, b: 0};
    assert.ok(Math.abs(contrastRatio(white, black) - 21) < 0.01);
    assert.ok(Math.abs(contrastRatio(white, white) - 1) < 0.01);
});

test('history supports undo, redo and branching', () => {
    const history = createHistory('a');
    assert.equal(history.canUndo(), false);
    history.push('b');
    history.push('c');
    assert.equal(history.undo(), 'b');
    assert.equal(history.canRedo(), true);
    assert.equal(history.redo(), 'c');
    history.undo();
    history.push('d');
    assert.equal(history.canRedo(), false);
    assert.equal(history.current(), 'd');
    assert.equal(history.undo(), 'b');
    history.reset('z');
    assert.deepEqual([history.current(), history.canUndo(), history.canRedo()], ['z', false, false]);
});

test('history keeps a bounded number of snapshots', () => {
    const history = createHistory(0, 5);
    for (let value = 1; value <= 20; value++) {
        history.push(value);
    }
    let steps = 0;
    while (history.canUndo()) {
        history.undo();
        steps++;
    }
    assert.equal(steps, 4);
});

test('filtering needs every word and respects kind and state', () => {
    const icons = [
        {key: 'core:a/setting', kind: 'font', group: 0},
        {key: 'core:t/edit', kind: 'font', group: 2},
        {key: 'mod_forum:monologo', kind: 'image', group: 0},
        {key: 'mod_forum:icon', kind: 'image', group: 0},
    ];
    const keys = (list) => list.map((icon) => icon.key);
    assert.deepEqual(keys(filterIcons(icons, {query: 'forum mono'})), ['mod_forum:monologo']);
    assert.deepEqual(keys(filterIcons(icons, {query: 'FORUM'})), ['mod_forum:monologo', 'mod_forum:icon']);
    assert.deepEqual(keys(filterIcons(icons, {kind: 'font'})), ['core:a/setting', 'core:t/edit']);
    assert.deepEqual(keys(filterIcons(icons, {state: 'shared'})), ['core:t/edit']);
    assert.deepEqual(keys(filterIcons(icons, {state: 'modified', modified: new Set(['core:a/setting'])})), ['core:a/setting']);
    assert.equal(filterIcons(icons, {query: 'nothing here'}).length, 0);
    assert.equal(filterIcons(icons).length, 4);
});

test('the grid renders only the rows that can be seen', () => {
    assert.deepEqual(visibleRows(0, 300, 100, 1000, 0), {first: 0, last: 3});
    assert.deepEqual(visibleRows(500, 300, 100, 1000, 2), {first: 3, last: 10});
    assert.deepEqual(visibleRows(99700, 300, 100, 1000, 2), {first: 995, last: 1000});
    assert.deepEqual(visibleRows(0, 300, 100, 0), {first: 0, last: 0});
});

const site = {contextid: 1, contextname: 'Site', contextkind: 'site', pages: [], regions: []};
const labels = {everywhere: 'Everywhere', pages: {admin: 'Administration pages'}, regions: {navbar: 'Navigation bar'}};

test('a variant is identified by its icon and its place', () => {
    assert.equal(whereKey(site), '1||');
    assert.equal(ruleKey('core:a/setting', {...site, pages: ['admin'], regions: ['navbar']}), 'core:a/setting#1|admin|navbar');
    assert.notEqual(ruleKey('core:a/setting', site), ruleKey('core:a/setting', {...site, contextid: 7}));
});

test('a place is described in words', () => {
    assert.equal(whereLabel(site, labels), 'Everywhere');
    assert.equal(whereLabel({...site, pages: ['admin']}, labels), 'Administration pages');
    const course = {contextid: 9, contextname: 'Course A', contextkind: 'course', pages: ['admin'], regions: ['navbar']};
    assert.equal(whereLabel(course, labels), 'Course A · Administration pages · Navigation bar');
});

test('a draft carries its place into the rule input', () => {
    const where = {...site, contextid: 5, contextkind: 'category', contextname: 'Faculty', pages: ['admin']};
    const input = toInput({...emptyDraft('core:a/setting', where), fg: '#111111'}, 'font');
    assert.deepEqual([input.contextid, input.pages, input.regions, input.painter], [5, ['admin'], [], 'color']);
});
