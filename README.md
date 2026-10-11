<div align="center">

# Icon Restyle for Moodle

*Replace, recolor and re-background Moodle icons, per site, category, course and activity*

[![Moodle](https://img.shields.io/badge/Moodle-4.0%E2%80%935.2-f98012?style=flat-square&logo=moodle&logoColor=white)](https://moodle.org)
[![PHP](https://img.shields.io/badge/PHP-7.4+-777bb4?style=flat-square&logo=php&logoColor=white)](https://www.php.net)
[![License](https://img.shields.io/badge/License-GPL_v3-blue?style=flat-square)](LICENSE)

[Status](#status) • [How it works](#how-it-works) • [Installation](#installation) • [Configuration](#configuration) • [Permissions](#permissions)

</div>

Icon Restyle (**local_iconrestyle**) changes how Moodle draws its icons without touching the theme or core. Customisations are stored per context and delivered to each page as one cached stylesheet, so replaced icons need no JavaScript and add no database query to a page view when the cache is warm.

## Status

**Pre-release, under active development.** The rendering engine, storage, delivery and the intake of replacement artwork are implemented; the icon designer for the whole site is available; per-category and per-course editing, icon libraries and export/import are not yet. It is not ready for production sites.

## How it works

Moodle's icon markup does not carry the icon's name, only its Font Awesome classes or its image URL. Icon Restyle derives, from the icon map of the running Moodle, the markup each icon produces, and generates CSS that targets exactly that markup. Rules inherit down the context tree (site, category, course, activity): the page loads the stylesheets of the contexts on its path in order, so the nearest context wins.

Icons that several Moodle icon names draw with the same Font Awesome glyph cannot be styled independently; they are treated as one glyph.

## Installation

**Requirements:** Moodle 4.0 to 5.2 on this branch, PHP 7.4 or newer and the database requirements of the selected Moodle release. A separate branch targets Moodle 5.3.

```bash
cd /path/to/moodle
git clone --branch MOODLE_400_STABLE https://github.com/didactika/moodle-local_iconrestyle.git local/iconrestyle
php admin/cli/upgrade.php --non-interactive
```

From Moodle 5.1 the plugin directory is `public/local/iconrestyle`.

## Configuration

The designer is under **Site administration → Appearance → Icon appearance**. Settings are under **Site administration → Appearance → Icon Restyle**.

| Setting | Default | Meaning |
|---|---|---|
| `local_iconrestyle/enabled` | Enabled | When disabled, no customised icon stylesheet is added to any page. Saved customisations are kept. |
| `local_iconrestyle/maxrulespercontext` | 500 | Most customisations that one site, category or course may hold. New rules beyond the limit are refused. |

To disable the plugin without the administration interface, set `$CFG->local_iconrestyle_disabled = true;` in `config.php`.

## Permissions

| Capability | Context | Default |
|---|---|---|
| `local/iconrestyle:managesite` | System | Manager |
| `local/iconrestyle:managecategory` | Category | Manager |
| `local/iconrestyle:managecourse` | Course | None |
| `local/iconrestyle:managemodule` | Activity | None |
| `local/iconrestyle:viewhistory` | Course | Manager |
| `local/iconrestyle:exchange` | System | Manager |
| `local/iconrestyle:managelibraries` | System | Manager |

Capabilities that change what every page renders carry the XSS risk flag.

## Getting help

Open an [issue](https://github.com/didactika/moodle-local_iconrestyle/issues) with your Moodle and PHP versions, the theme in use and what you expected.
