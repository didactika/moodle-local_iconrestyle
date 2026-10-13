/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Keeps an icon whose customised look has grown from covering its neighbours.
 *
 * @module     local_iconrestyle/lib/fit
 * @copyright  2026 Didactica.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const r=(c,n)=>{c.querySelectorAll(".irs-cell").forEach(t=>{const e=t.firstElementChild;if(!e)return;e.style.zoom="";const i=e.querySelector(".activityiconcontainer, .icon, img");if(!i)return;const o=i.getBoundingClientRect(),l=Math.max(o.width,o.height);l>n&&(e.style.zoom=(n/l).toFixed(3))})},s=c=>{c.querySelectorAll(".irs-card-icon").forEach(n=>{const t=n.firstElementChild;if(!t||t.classList.contains("irs-card-fit")===!1)return;t.style.zoom="";const e=t.querySelector(".activityiconcontainer, .icon, img");if(!e)return;const i=e.getBoundingClientRect(),o=Math.min(n.clientWidth,n.clientHeight)*.92,l=Math.max(i.width,i.height);l>o&&(t.style.zoom=(o/l).toFixed(3))})};export{s as fitCards,r as fitCells};
