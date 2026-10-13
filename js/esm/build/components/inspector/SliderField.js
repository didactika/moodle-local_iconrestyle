import{useState as v}from"react";import{jsx as i,jsxs as b}from"react/jsx-runtime";/**
 * A property with a slider, a number box and a cross that puts it back to Moodle's own value.
 *
 * @module     local_iconrestyle/components/inspector/SliderField
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */function y({prop:e,label:l,min:s,max:u,step:d,defaultValue:m,value:r,text:o,onChange:n}){const[c,a]=v(null),f=t=>{if(a(t),t===""){n(e,null,!0);return}const p=Math.min(u,Math.max(s,parseInt(t,10)));n(e,Number.isNaN(p)?null:p,!0)};return b("div",{className:"irs-field irs-slider",children:[b("div",{className:"irs-slider-head",children:[i("label",{className:"irs-label",htmlFor:`irs-${e}`,children:l}),i("input",{type:"number",className:"form-control irs-num","data-prop-num":e,min:s,max:u,step:d,"aria-label":l,placeholder:o("propdefault"),value:c??(r===null?"":r),onFocus:t=>a(t.target.value),onBlur:()=>a(null),onChange:t=>f(t.target.value)}),i("button",{type:"button",className:"btn btn-link btn-sm irs-reset","data-action":"reset-prop","data-prop":e,"aria-label":o("resetproperty",l),title:o("resetproperty",l),onClick:()=>{a(null),n(e,null,!1)},children:"\u2715"})]}),i("input",{type:"range",id:`irs-${e}`,"data-prop":e,min:s,max:u,step:d,"data-default":m,value:r===null?m:r,onChange:t=>n(e,parseInt(t.target.value,10),!0)})]})}export{y as default};
