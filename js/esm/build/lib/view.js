import{whereLabel as h}from"./draft";/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * What the designer shows about the open icon and the colour mode, worked out from its state.
 *
 * @module     local_iconrestyle/lib/view
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const f=(t,e)=>t===null||t.mode==="all"?[]:e.filter(r=>r!==t.mode),b=t=>{const{pageMode:e,modes:r,labels:o,text:n}=t;return r.length===0||e===null?"":n(e.followsDevice?"currentmodeauto":"currentmode",o.modes[e.applied]||e.applied)},y=t=>{const{state:e,selected:r,active:o,customised:n,modes:l,labels:i,surface:c,modeNow:d,selecting:u}=t,a=o===null?null:e.whereOfKey(o),g=l.length>0,m=r===null?[]:e.variants(r),p=r===null?null:e.everywhereKey(r,d);return{rootClass:u?"irs irs-picking":"irs",theme:g?c:null,note:b(t),filterModes:g?i.modes:{},selectionModes:l.length>1?i.modes:{},activeWhere:a,others:f(a,l),removable:n||o!==null&&o!==p,variants:m.map(s=>({key:s.key,label:h(s.where,i),active:s.key===o,removable:!s.base}))}};export{y as deriveView};
