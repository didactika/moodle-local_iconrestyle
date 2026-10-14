import{useEffect as u,useState as a}from"react";/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The colour mode this page is shown in, when Moodle has colour modes.
 *
 * Boost writes the mode that is applied in the data-bs-theme attribute of the html element, and the mode the person chose,
 * which can also be to follow the device, in data-colourmode. A site where colour modes are not enabled writes neither, and
 * then nothing is shown and nothing is preselected.
 *
 * @module     local_iconrestyle/hooks/usePageColourMode
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const n=()=>{const t=document.documentElement,e=t.getAttribute("data-bs-theme");return e!=="light"&&e!=="dark"?null:{applied:e,followsDevice:t.getAttribute("data-colourmode")==="auto"}},s=()=>{const[t,e]=a(n);return u(()=>{const r=new MutationObserver(()=>{const o=n();e(l=>l&&o&&l.applied===o.applied&&l.followsDevice===o.followsDevice?l:o)});return r.observe(document.documentElement,{attributes:!0,attributeFilter:["data-bs-theme","data-colourmode"]}),()=>r.disconnect()},[]),t};export{s as usePageColourMode};
