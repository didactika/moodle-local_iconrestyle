import{useEffect as u,useState as i}from"react";/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Whether the designer has little room, which is not the same as the window being small: a drawer of Moodle that is open takes room
 * from the page and leaves the window as it was.
 *
 * @module     local_iconrestyle/hooks/useNarrow
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const d=62,a=t=>{const[o,s]=i(!1);return u(()=>{const e=t.current;if(!e||typeof ResizeObserver>"u")return;const n=()=>{const c=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;s(e.getBoundingClientRect().width<d*c)},r=new ResizeObserver(n);return r.observe(e),n(),()=>r.disconnect()},[t]),o};export{a as useNarrow};
