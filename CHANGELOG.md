# Changelog

All notable changes to this plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
.github/workflows/release.yml reads this file: when $plugin->release changes
in version.php on `main` OR on any MOODLE_XXX_STABLE branch, it looks for a
"## [<that release>]" heading below and uses everything under it, verbatim,
as the GitHub Release body. If no such heading exists yet, the release still
happens but with a generic one-line release note instead.

Keep an "## [Unreleased]" section above the latest release for changes that
have not shipped yet; rename it to "## [x.y.z]" (matching $plugin->release)
when you cut that release, and start a fresh "## [Unreleased]" above it. Each
branch keeps its own CHANGELOG.md history from the point it was cut, same as
its own $plugin->release line -- no need to reconcile entries across branches.
-->

## [Unreleased]

## [1.0.0-m400] - 2026-10-11

First release of the Moodle 4.0 to 5.2 line, on `MOODLE_400_STABLE`. The Moodle 5.3 line is on `main` (1.0.0-m503).

### Added

- A designer in the site administration that lists every icon of Moodle (Font Awesome icons, every image icon of core, its subsystems, the plugins and the themes, and the boxes of activities) in a searchable and filterable grid that stays fast with thousands of icons. The interface is written in AMD modules and Mustache templates, with the same features as the 5.3 line.
- Colour, gradient, shape and corner radius, border and outline, padding and margin on each side, scale, rotation, skew and flips, shadows, blending, a hover effect, opacity and colour filters for each icon, saved on their own with no save button.
- Replacement of any icon by an SVG, PNG or WebP file of your own, sanitised, with recolouring of single-colour files.
- Theme colours: any colour that the active theme declares can be picked (Bootstrap 4 and 5 names), and the icon follows the theme and its colour modes.
- Places: a look can apply to the whole site, a category, a course or an activity, to some kinds of page, to some parts of a page and to one colour mode; the most specific look wins.
- Work in bulk: filters by type, status, component, purpose, place and colour mode, selection of many icons, copy of a look to many icons and copy of one colour mode to another.
- Export and import between sites, of everything or of the icons you choose, with a review step; command line tools to warm the cache, export and import.
- Customisations are delivered to each page as one cached stylesheet compiled once, with limits on rules, stylesheet size and effect cost, so replaced icons need no JavaScript and no database query on a page view.
- Placeholders while the designer loads, a layout that follows the room it has when a drawer of Moodle is open, and the colour mode and moon icons of the designer registered in the icon map of Moodle.
