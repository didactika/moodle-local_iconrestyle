// This file is part of Moodle - https://moodle.org/
// Moodle is free software under the GNU General Public License, version 3 or later.

/**
 * Keeps the stylesheet of the site, which this page also loads, in step with what was just saved.
 *
 * @module     local_iconrestyle/engine/stylesheet
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const SITE_STYLESHEET = 'link[href*="/local/iconrestyle/styles.php"]';

/**
 * Load the stylesheet the site now has, so the icons of this page show what was just saved.
 *
 * The address changes with every save, so the old stylesheet is replaced rather than reloaded, and only once the new one
 * has loaded, so the icons never flash.
 *
 * @param url Address of the stylesheet, empty when no rule applies any more.
 * @param onApplied Called when the page shows the new stylesheet.
 */
export const applyStylesheet = (url: string, onApplied: () => void): void => {
    const current = document.querySelector<HTMLLinkElement>(SITE_STYLESHEET);
    if (url === '') {
        current?.remove();
        onApplied();
        return;
    }
    if (current && current.href === url) {
        onApplied();
        return;
    }
    const next = document.createElement('link');
    next.rel = 'stylesheet';
    next.href = url;
    next.addEventListener('load', () => {
        current?.remove();
        onApplied();
    });
    if (current) {
        current.after(next);
    } else {
        document.head.appendChild(next);
    }
};
