import{useEffect as I,useRef as n,useState as k}from"react";import*as P from"../services/api";import{toInput as M}from"../lib/draft";/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Compiles the look of a draft that is not saved yet, so the preview and the card of the open icon can show it.
 *
 * The server compiles it, so what the preview shows is what the site will show. A request goes out a moment after the last
 * change, only one request is in flight at a time with the newest look winning, and a look that was compiled before is not
 * asked for again.
 *
 * @module     local_iconrestyle/hooks/usePreviewCss
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const E=250,S=200,R=(s,f)=>{const[p,g]=k({key:"",css:""}),[v,o]=k(!1),t=n(new Map),w=n(new Map),e=n(0),m=n(Promise.resolve()),y=n(0),i=s&&f?M(f,s.kind):null,a=i?JSON.stringify(i):"",r=s?s.key:"";return I(()=>{window.clearTimeout(y.current);const l=c=>{w.current.set(r,c),g({key:r,css:c}),o(!1)};if(r===""){e.current++,g({key:"",css:""}),o(!1);return}if(i===null){e.current++,l("");return}const d=t.current.get(a);if(d!==void 0){e.current++,l(d);return}o(!0);const h=++e.current,C=async c=>{if(h!==e.current)return;let u;try{u=await P.previewCss([c],"new"),t.current.set(a,u),t.current.size>S&&t.current.delete(t.current.keys().next().value)}catch{u=""}h===e.current&&l(u)};y.current=window.setTimeout(()=>{m.current=m.current.then(()=>C(i))},E)},[r,a]),{css:p.key===r?p.css:"",waiting:v,held:w.current}};export{R as usePreviewCss};
