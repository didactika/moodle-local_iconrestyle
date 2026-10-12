<div align="center">

<img src="pix/icon.svg" width="96" alt="Icon Restyle icon">

# Icon Restyle for Moodle

*Give every icon of your Moodle its own look, from one designer, without touching the theme*

[![Release](https://img.shields.io/github/v/release/didactika/moodle-local_iconrestyle?filter=v4.*&style=flat-square)](https://github.com/didactika/moodle-local_iconrestyle/releases)
[![Moodle](https://img.shields.io/badge/Moodle-4.0%E2%80%935.2-f98012?style=flat-square&logo=moodle&logoColor=white)](https://moodle.org)
[![PHP](https://img.shields.io/badge/PHP-7.4+-777bb4?style=flat-square&logo=php&logoColor=white)](https://www.php.net)
[![License](https://img.shields.io/badge/License-GPL_v3-blue?style=flat-square)](LICENSE)

[Overview](#overview) • [Installation](#installation) • [Usage](#usage) • [User manual](#user-manual) • [Configuration](#configuration) • [Command line](#command-line) • [Performance](#performance) • [Troubleshooting](#troubleshooting)

</div>

Icon Restyle (**local_iconrestyle**) changes how Moodle draws its icons without touching the theme or the core. A designer in the site administration lists every icon that can be customised. Choose one, change its colour, shape, spacing, effects or replace it with a file of your own, and the whole site shows it. Customisations are stored per place and delivered to each page as one cached stylesheet, so replaced icons need no JavaScript on the pages of your users and add no database query to a page view once the cache is warm.

![The icon designer](docs/user-manual/images/designer-overview.png)

## Overview

- **One designer** for every icon: Font Awesome icons, image icons and the boxes of activities, in a searchable and filterable grid that stays fast with thousands of icons.
- **Everything you would expect**: icon and background colour, gradient, shape and corner radius, border and outline, padding and margin on each side, scale, rotation, skew and flips, box and icon shadows, blending, a hover effect, opacity, and the usual colour filters.
- **Your own artwork** (SVG, PNG or WebP) replaces any icon; single-colour files can be recoloured. Every file is sanitised.
- **Theme colours**: pick any colour the active theme declares, such as `--bs-primary`, and the icon follows the theme.
- **Places**: a look can apply to the whole site, a category, a course or an activity, to some kinds of page, to some parts of a page and, when your site has colour modes, to one of them. The most specific look wins.
- **Light and dark**: the designer follows the colour modes of Moodle and the colours of the theme.
- **Work in bulk**: filter by type, status, component, purpose, what an icon customises, place and colour mode; choose many icons at once; copy a look to many icons; copy one colour mode to another.
- **Export and import** between sites, of everything or only the icons you choose, with a review step before anything changes.
- **Safe and fast**: every value is typed and range-checked, a stylesheet is compiled once however many visitors ask for it, and limits stop a site from growing the stylesheets past what a browser handles well.

## Installation

**Requirements:** Moodle 4.0 to 5.2 on this branch, PHP 7.4 or newer and the database requirements of the selected Moodle release. A separate line of the plugin targets Moodle 5.3 and later with a React interface.

**From a release:** download the matching release ZIP, open **Site administration → Plugins → Install plugins**, upload the package and follow the prompts.

**From Git:**

```bash
cd /path/to/moodle
git clone --branch MOODLE_400_STABLE https://github.com/didactika/moodle-local_iconrestyle.git local/iconrestyle
php admin/cli/upgrade.php --non-interactive
```

From Moodle 5.1 the plugin directory is `public/local/iconrestyle`.

## Usage

1. Open **Site administration → Plugins → Local plugins → Icon Restyle → Icon designer**. It is also under **Site administration → Appearance → Icon Restyle**.
2. Search the icon, for example `a/setting`, and click its card.
3. Change what you want in the panel. The preview shows it at once and it is saved on its own; there is no save button.
4. To limit the look to a category, a course, an activity, some pages or a colour mode, use the **Places** tab.

Every control is explained, with screenshots, in the user manual.

## User manual

- **[User manual](docs/user-manual/Home.md)**: getting started, the designer, finding icons, editing, places and colour modes, copying looks, export and import, administration and troubleshooting.
- The pages are written in the format of a GitHub wiki, with its `_Sidebar.md`, so they can be published as the wiki of the repository by copying `docs/user-manual` into it.
- The screenshots are taken from the real designer by `tests/behat/manual.feature`; run it with `--tags=@iconrestyle_manual` to refresh them.

## Configuration

The plugin has a section of its own, **Site administration → Plugins → Local plugins → Icon Restyle**, with the **Icon designer** and the **Settings**.

| Setting | Default | Meaning |
|---|---|---|
| `local_iconrestyle/enabled` | Enabled | When disabled, no customised icon stylesheet is added to any page. Saved customisations are kept. |
| `local_iconrestyle/maxrulespercontext` | 500 | Most customisations that one site, category or course may hold. New rules beyond the limit are refused. |
| `local_iconrestyle/maxsheetkb` | 256 | Largest compiled stylesheet, in KB, of the site, one category or one course. A change that would make it bigger is refused whole. |
| `local_iconrestyle/maxcontextswithrules` | 500 | Most categories and courses, besides the whole site, that may have customisations of their own. Each is a different stylesheet that browsers download once. |
| `local_iconrestyle/maxeffectcost` | 2000 | What the effects of the rules of one context may add up to. Blur, shadows and colour filters make the browser paint an icon in an extra step, so each rule adds a cost for them and one rule may cost at most 20. |
| `local_iconrestyle/copygroups` | colours, shape, spacing, rotation and flips, effects | The parts of a look that are chosen when someone starts copying the look of an icon to others. The replacement icon is off unless it is turned on here. |
| `local_iconrestyle/copyoverwrite` | off | Whether copying looks from one colour mode to another replaces the looks that already exist. |
| `local_iconrestyle/importmode` | merge | Whether an import adds to what the site has (`merge`) or replaces it (`replace`) when it opens. |
| `local_iconrestyle/importchoose` | all | Which icons of a package are chosen when an import opens: `all`, `new` or `none`. |

The last four only decide what the designer starts from. Each person can change them every time they use a choice, and what they change is not kept.

To disable the plugin without the administration interface, set `$CFG->local_iconrestyle_disabled = true;` in `config.php`.

### Permissions

| Capability | Context | Default |
|---|---|---|
| `local/iconrestyle:manage` | System | Manager |
| `local/iconrestyle:exchange` | System | Manager |

Capabilities that change what every page renders carry the XSS risk flag. Icons are customised in one place, so one capability governs every rule, wherever it applies.

## Command line

| Command | Does |
|---|---|
| `php local/iconrestyle/cli/warm.php` | Compiles the stylesheets that are not in the cache. Purging the caches or upgrading Moodle empties them; a scheduled task does the same every ten minutes, so run this to have them at once. |
| `php local/iconrestyle/cli/export.php --file=FILE [--slots=LIST]` | Writes every customisation to a file, however many there are, or only those of the icons in the comma separated list. |
| `php local/iconrestyle/cli/import.php --file=FILE [--mode=merge\|replace] [--dry-run]` | Imports a file, reading it one line at a time. `--dry-run` says what would be done and changes nothing. |

## Performance

A page whose stylesheets are cached adds no database query and about twenty microseconds of work, however many courses, categories and rules the site has: the work depends on the contexts on the path of the page, not on the size of the site. What keeps a very large site fast is that every stylesheet is compiled once however many visitors ask for it at the same moment, each context keeps only its newest stylesheet in the cache, a rule limited to many pages and regions writes its selectors as lists, and the settings above stop the stylesheets, their number and the cost of the effects from growing past what a browser handles well.

The benchmarks are part of the test suite, with budgets that fail the build when they are exceeded (`tests/performance`). The measurements on a large site are in the [performance report](docs/performance-report.md).

## Troubleshooting

| Problem | Check |
|---|---|
| A change does not show on a page | Reload with Ctrl+F5 and check that **Enabled** is on in the settings. |
| *Could not save* | A limit of the site (rules, stylesheet size, effect cost) is the usual cause; the message says which. |
| Two icons change together | They share one glyph in Moodle and cannot be styled apart; the panel says so. |
| An import leaves rules out | The report lists why: a place or an icon that this site does not have, or refused artwork. |

More in the [troubleshooting chapter](docs/user-manual/Troubleshooting.md).

## Getting help

Open an [issue](https://github.com/didactika/moodle-local_iconrestyle/issues) with your Moodle and PHP versions, the theme in use and what you expected.
