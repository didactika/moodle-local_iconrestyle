import{useCallback as I,useRef as v,useState as s}from"react";/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Choosing icons in the grid itself, to export them, to copy the look of the open icon to them or to copy one colour mode to
 * another in them.
 *
 * While a choice is going on, a click on a card chooses it instead of opening it, a click with Shift chooses everything between
 * it and the last card chosen, and a bar floats over the grid with what can be done with the choice. Nothing is changed until
 * the person applies, and leaving the choice, with Esc or the cross, changes nothing.
 *
 * @module     local_iconrestyle/hooks/useSelection
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const q=t=>{const[i,m]=s(null),[b,w]=s(null),[r,c]=s(new Set),[k,P]=s(t.defaults.copygroups),[x,h]=s(t.defaults.copyoverwrite),[O,C]=s(""),[T,E]=s(""),[F,D]=s(!1),u=v(null),g=v(null),f=v(t);f.current=t;const p=(e,o=i,n=b)=>o!==null&&f.current.isPickable(o,e,n),G=I(()=>{g.current=null,m(null),w(null),c(new Set),u.current=null},[]),N=I(e=>{const o=f.current;if(!(e==="copy"&&o.source()===null)){if(g.current===null){P(o.defaults.copygroups),h(o.defaults.copyoverwrite);const n=o.modeNames,d=n.includes(o.currentMode())?o.currentMode():n[0]??"";C(d),E(n.find(a=>a!==d)??n[0]??""),o.onStart(e)}g.current=e,m(e),w(e==="copy"?o.source():null),c(new Set),u.current=null}},[]);return{mode:i,from:b,picked:r,groups:k,overwrite:x,fromMode:O,toMode:T,busy:F,start:N,stop:G,toggle:(e,o=!1)=>{if(i===null||!p(e))return;const n=!r.has(e);let d=[e];if(o&&u.current!==null){const l=t.items().filter(S=>p(S.key)).map(S=>S.key),y=l.indexOf(u.current),M=l.indexOf(e);y>=0&&M>=0&&(d=l.slice(Math.min(y,M),Math.max(y,M)+1))}const a=new Set(r);d.forEach(l=>{n?a.add(l):a.delete(l)}),c(a),u.current=e},apply:async()=>{if(F||r.size===0||i===null)return;D(!0);const e=[...r],o=await{copy:()=>t.onCopy(e,k),modes:()=>t.onCopyModes(e,O,T,x),export:()=>t.onExport(e)}[i]();D(!1),o&&G()},all:()=>c(new Set(t.items().filter(e=>p(e.key)).map(e=>e.key))),none:()=>c(new Set),setGroups:P,setOverwrite:h,setFromMode:C,setToMode:E,switchTo:e=>{g.current=e,m(e)},isPicked:e=>r.has(e),isPickable:e=>p(e)}};export{q as useSelection};
