# Troubleshooting

| What you see | Why and what to do |
|---|---|
| The designer opens empty and says *Loading…* for a long time | The catalogue is read once from the server. Reload the page; if it persists, check that the web service is enabled for your role and purge the caches. |
| I changed an icon and the page still shows the old one | Reload with Ctrl+F5. Each save gives the page a new stylesheet address; a page that was open before keeps the old one. Also check that **Enabled** is on in the settings. |
| The status says *Could not save* | The server refused the change or did not answer in thirty seconds. Read the red message: a limit of the site (rules, stylesheet size, effect cost) is the usual cause. Your last changes are shown again as they are stored. |
| Changing one icon changed another | They share a glyph, and the panel says so. Moodle draws both with the same Font Awesome glyph, so they cannot be styled apart. |
| An image icon will not take a colour | Image icons are coloured through their own file, which the designer fetches when you choose a colour. If it fails, a message says so; upload an SVG of your own instead. |
| My look is not in the dark mode | Each look belongs to one mode when your site has colour modes. Open the icon in the dark mode, or use **Copy this look to Dark mode** on the **Places** tab. |
| An activity in a course does not change | A look for an activity is looked up by name inside its course and only applies to that activity. Use the course, or the category, to cover many. |
| The import leaves rules out | The report says why: a place that this site does not have, an icon this Moodle does not have, or artwork that was refused. Fix the cause or ignore those rules; the others were imported. |
| *This file is too big to import here* | The browser takes up to 20 MB. Use `php local/iconrestyle/cli/import.php`. |
| I cannot see **Icon Restyle** in the menu | You need the capability `local/iconrestyle:manage`. |

## Still stuck

Open an [issue](https://github.com/didactika/moodle-local_iconrestyle/issues) with your Moodle and PHP versions, the theme, the
icon (its name is the title of the panel) and what you expected to see.
