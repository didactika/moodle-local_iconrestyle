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

### Added

- Rule storage with optimistic locking and a per-context rule limit. A rule applies in the whole site, a category, a course or an activity, and can be limited to kinds of page and page regions chosen from fixed lists.
- Rendering engine that derives each icon's markup from the running Moodle's icon map and compiles rules to CSS: recolour for font icons, background, shape, padding and opacity for any icon.
- Per-context stylesheets delivered as one immutable bundle after the theme stylesheet, with cache revisions that only grow and single-flight compilation.
- Site setting to disable the plugin, rule limit setting and capabilities for each scope.
- Artwork intake: uploaded SVG is rebuilt from an allow-list (scripts, event handlers, external references, entities and document type declarations are refused or removed) and raster images are decoded and written again, then stored once by content hash.
- Mask and image painters that replace an icon's artwork with an uploaded file, recolourable through a mask, on font icons and on image icons.
- `asset.php` serves artwork by content hash with immutable caching, a restrictive content security policy and cross-origin access for CDN deployments.
- One icon designer under Site administration > Appearance: a searchable, filterable and virtualised catalogue of every customisable icon, several variants per icon each limited to a place (the whole site, a category, a course or an activity found by name, kinds of page and page regions), an inspector for artwork, foreground and background colour, shape, padding and opacity, a live preview of Moodle's default, the current and the new look on light and dark surfaces, and staged changes with undo, redo, discard and save.
- Web services behind the designer to read the catalogue and every rule, save and delete rules, add artwork, compile unsaved rules for the preview and search categories, courses and activities by name, each checked against the capability.
- Customisations apply on every page, the designer included. The preview columns draw inside isolated shadow trees, so the "Moodle default" column still shows the untouched icon.
- Works on sites with caching disabled, using the cache object Moodle returns in that case.
- A single capability, `local/iconrestyle:manage`, governs every rule: there are no designers, navigation entries or capabilities in categories, courses or activities.
- Rules are removed when their category, course or activity is deleted, and the stylesheet of the course is refreshed when an activity goes.
- The complete schema ships in `db/install.xml`; the first release has no upgrade steps.