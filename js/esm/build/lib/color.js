/**
 * Colour maths with no dependencies, so it can be tested without a browser.
 *
 * @module     local_iconrestyle/lib/color
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const u=(r,t,n)=>Math.min(n,Math.max(t,r)),i=r=>{const t=/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(String(r??"").trim());if(!t)return null;let n=t[1];n.length<=4&&(n=n.split("").map(a=>a+a).join(""));const e=n.length===8?parseInt(n.slice(6,8),16):255;return{r:parseInt(n.slice(0,2),16),g:parseInt(n.slice(2,4),16),b:parseInt(n.slice(4,6),16),a:e}},c=({r,g:t,b:n,a:e=255})=>{const a=s=>Math.round(u(s,0,255)).toString(16).padStart(2,"0");return"#"+a(r)+a(t)+a(n)+(Math.round(e)===255?"":a(e))},b=r=>{const t=i(r);return t?c(t):null},o=({r,g:t,b:n})=>{const e=a=>{const s=a/255;return s<=.03928?s/12.92:Math.pow((s+.055)/1.055,2.4)};return .2126*e(r)+.7152*e(t)+.0722*e(n)},l=(r,t)=>{const n=o(r),e=o(t);return(Math.max(n,e)+.05)/(Math.min(n,e)+.05)};export{l as contrastRatio,o as luminance,b as normalise,i as parseHex,c as toHex};
