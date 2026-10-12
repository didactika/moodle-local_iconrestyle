/**
 * Client-side search, filtering and sorting of the icon catalogue.
 *
 * @module     local_iconrestyle/lib/filter
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const h=new Set,C=["untouched","modified","shared"],O=n=>String(n).toLowerCase().split(/[\s/:_-]+/).filter(s=>s!==""),w=(n,s,o)=>s==="name"?[...n].sort((t,e)=>t.name.localeCompare(e.name)||t.component.localeCompare(e.component)):s==="component"?[...n].sort((t,e)=>t.component.localeCompare(e.component)||t.name.localeCompare(e.name)):s==="modified"?[...n].sort((t,e)=>Number(o.has(e.key))-Number(o.has(t.key))):n,x=(n,s={})=>{const{query:o="",kinds:t=[],modified:e=h,components:i=[],purposes:a=[],traits:l=[],places:u=[],modes:p=[],traitsOf:y=()=>h}=s,k=O(o),d=l.filter(r=>!C.includes(r)),b=d.length>0||u.length>0||p.length>0;return n.filter(r=>{if(t.length>0&&!t.includes(r.kind)||i.length>0&&!i.includes(r.component)||a.length>0&&!a.includes(r.purpose)||l.includes("untouched")&&e.has(r.key)||l.includes("modified")&&!e.has(r.key)||l.includes("shared")&&r.group<2)return!1;if(b){const c=y(r.key),f=(m,g)=>g.length===0||g.some(S=>c.has(`${m}:${S}`));if(!d.every(m=>c.has(m))||!f("place",u)||!f("mode",p))return!1}const I=r.key.toLowerCase();return k.every(c=>I.includes(c))})},v=(n,s,o,t,e=2)=>{const i=Math.max(0,Math.floor(n/o)-e),a=Math.min(t,Math.ceil((n+s)/o)+e);return{first:i,last:a}};export{x as filterIcons,w as sortIcons,v as visibleRows};
