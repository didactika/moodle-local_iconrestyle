/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Keeps the stylesheet of the site, which this page also loads, in step with what was just saved.
 *
 * @module     local_iconrestyle/engine/stylesheet
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const o='link[href*="/local/iconrestyle/styles.php"]',s=(n,r)=>{const e=document.querySelector(o);if(n===""){e?.remove(),r();return}if(e&&e.href===n){r();return}const t=document.createElement("link");t.rel="stylesheet",t.href=n,t.addEventListener("load",()=>{e?.remove(),r()}),e?e.after(t):document.head.appendChild(t)};export{s as applyStylesheet};
