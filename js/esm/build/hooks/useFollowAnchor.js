import{useEffect as m,useRef as u}from"react";/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Keep a floating list under the element that opened it while the page, or anything inside the page, scrolls or changes size.
 *
 * The lists are placed in the coordinates of the window, so they would stay where they were put while the element that opened
 * them moves away. While the list is open, the place is worked out again as often as the screen is drawn, and not more.
 *
 * @module     local_iconrestyle/hooks/useFollowAnchor
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const v=(o,i,s)=>{const d=u(i),w=u(s);d.current=i,w.current=s,m(()=>{if(!o)return;let t=0,r=0,e=!1;const a=()=>{e&&(e=!1,window.cancelAnimationFrame(t),window.clearTimeout(r),d.current())},n=c=>{const l=w.current?.();e||l&&c.target instanceof Node&&l.contains(c.target)||(e=!0,t=window.requestAnimationFrame(a),r=window.setTimeout(a,50))};return window.addEventListener("scroll",n,!0),window.addEventListener("resize",n),()=>{e=!1,window.cancelAnimationFrame(t),window.clearTimeout(r),window.removeEventListener("scroll",n,!0),window.removeEventListener("resize",n)}},[o])};export{v as useFollowAnchor};
