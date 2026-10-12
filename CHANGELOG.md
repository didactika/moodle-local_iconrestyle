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

- A user manual with screenshots (`docs/user-manual`), written in the format of a GitHub wiki, a performance report of the mass benchmarks (`docs/performance-report.md`) and an icon for the plugin in the colours of Didactika.
- A benchmark for importing a package of any size one line at a time (B-06).
- Settings for what the designer starts from: the parts of a look that are copied, whether copying between modes replaces, and how an import starts. They are only starting points; each person can change them every time.
- More ways to customise an icon: a gradient behind it, an outline with its own colour and offset, skew, a shadow that follows the glyph, three more shadows for the box (inner, lifted, hard), sepia, invert, blending with the background and a hover effect (grow, shrink, lift, tilt, fade). All typed, range checked, counted in the cost of the design and part of the looks that can be copied.
- A *Filters* panel next to the search: component, purpose, what an icon customises, where it applies, colour mode and sorting, with a badge that counts the filters that are on and an icon that clears them.
- Copying every look of the icons that are chosen from one colour mode to another in one step, from the selection bar.
- Choosing icons in the grid: a *Select* button exports only the icons chosen (Shift+click chooses a run), and the copy button in the header of the editing panel copies the look of the open icon, part by part, to the icons chosen in the grid, as one undo step. Export and import take a list of icons, and so does `cli/export.php --slots`.
- The import reviews the package before it changes anything: a summary, a switch between adding and replacing, a searchable list of its icons with what would happen to each, and a live report for the choice made.
- Export and import of customisations: a text package with one JSON object on each line, rules that name their places (site, category by id number or path, course by short name, activity by id number) instead of carrying database ids, artwork carried once and sanitised again on import. The designer previews what an import would do before it does it, in a mode that adds or replaces; the command line does the same for any size. One `rules_changed` event is triggered for each change that is saved.
- Privacy provider: the plugin says that it only remembers who last changed a rule and who added artwork, exports that and, when a user is erased, keeps the configuration and forgets who made it.
- Scale: every change is checked against limits before anything is written (rules, stylesheet size, effect cost, contexts with rules, how many parents with rules a page can load) and refused whole; a stylesheet is compiled once however many visitors ask for it at once, kept once for each context and prepared by a scheduled task and by `cli/warm.php` after a purge or an upgrade; a rule limited to many pages and regions writes its selectors as lists, so it needs four prefixes instead of up to sixty-three.
- A single request saves everything that changed, in one transaction, and answers with the address of the new stylesheet. The designer never has two saves in flight and waits for a quiet moment before saving.
- The colours of the theme: any colour of the active theme can be chosen from a searchable list of the custom properties the stylesheets of the page declare, and any custom property can be typed.
- Benchmarks with budgets (`tests/performance/`) and a compile-storm tool that starts many operating system processes at once.

- Rule storage with optimistic locking and a per-context rule limit. A rule applies in the whole site, a category, a course or an activity, and can be limited to kinds of page and page regions chosen from fixed lists.
- Rendering engine that derives each icon's markup from the running Moodle's icon map and compiles rules to CSS: recolour for font icons, background, shape, padding and opacity for any icon.
- Per-context stylesheets delivered as one immutable bundle after the theme stylesheet, with cache revisions that only grow and single-flight compilation.
- Site setting to disable the plugin, rule limit setting and capabilities for each scope.
- Artwork intake: uploaded SVG is rebuilt from an allow-list (scripts, event handlers, external references, entities and document type declarations are refused or removed) and raster images are decoded and written again, then stored once by content hash.
- Mask and image painters that replace an icon's artwork with an uploaded file, recolourable through a mask, on font icons and on image icons.
- `asset.php` serves artwork by content hash with immutable caching, a restrictive content security policy and cross-origin access for CDN deployments.
- One icon designer under Site administration > Appearance: a searchable, filterable and virtualised catalogue of every customisable icon, several variants per icon each limited to a place (the whole site, a category, a course or an activity found by name, kinds of page and page regions), an inspector for artwork, foreground and background colour, shape, padding and opacity, a live preview of the edited icon, the original or both on light and dark surfaces, and automatic saving with undo and redo.
- Web services behind the designer to read the catalogue and every rule, save and delete rules, add artwork, compile unsaved rules for the preview and search categories, courses and activities by name, each checked against the capability.
- Customisations apply on every page, the designer included. The preview columns draw inside isolated shadow trees, so the "Moodle default" column still shows the untouched icon.
- Works on sites with caching disabled, using the cache object Moodle returns in that case.
- Design properties beyond colour, all typed and validated: shape and exact corner radius, padding on each side, scale, rotation, border (width, style, colour), shadow (presets and colour) and opacity, with quick looks and a link button that moves the four padding sides together.
- Colour mode: a rule can apply only in dark or light mode, from the places modal or with one click on "Add a dark mode look".
- Image icons are recoloured with their own file as artwork, fetched automatically when a colour is set, and the glyph inside an activity box takes any colour.
- Every change is saved on its own, with a visible state, undo and redo on Ctrl+Z, Ctrl+Y and buttons, and an actions menu with icons that also leads back to the settings and the site administration.
- A preview that shows the edited icon with a switch to the original or to both side by side, and a live card in the grid for the icon that is open.
- After each save the designer swaps in the new site stylesheet, so every icon on its own page shows the saved look at once, and the grid scrolls without cards jumping.
- Margin on each side, flips and six colour filters (brightness, contrast, saturation, grayscale, hue rotation, blur), and scale as a zoom so that a large icon takes its room.
- A designer that fits the window with a compact live preview that is always visible, a panel that only exists while an icon is open, tabs, collapsible groups and a modal with a multi-select autocomplete to add places.
- Activity boxes: the colour Moodle gives each activity purpose, or one kind of activity, can be kept, removed, replaced or put in a box (shape, padding, opacity), with a light or dark glyph, from the same designer and with the same places, pages and regions as any icon.
- A single capability, `local/iconrestyle:manage`, governs every rule: there are no designers, navigation entries or capabilities in categories, courses or activities.
- Rules are removed when their category, course or activity is deleted, and the stylesheet of the course is refreshed when an activity goes.
- The complete schema ships in `db/install.xml`; the first release has no upgrade steps.