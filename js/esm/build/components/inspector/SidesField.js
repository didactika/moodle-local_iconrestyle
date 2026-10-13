import{useState as f}from"react";import{IconLinked as F,IconUnlinked as x}from"../common/Icons";import{jsx as a,jsxs as s}from"react/jsx-runtime";/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * A property with a value for each side, which can be linked so that the four sides move together.
 *
 * @module     local_iconrestyle/components/inspector/SidesField
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */function P({group:n,label:g,resetLabel:b,min:v,max:k,sides:o,draft:N,text:m,onStage:p}){const[d,y]=f(!0),[u,c]=f(null),h=(t,e)=>{c({prop:t,raw:e});const l=e===""?null:Math.round(parseFloat(e)*100),i=l===null||Number.isNaN(l)?null:l;p(d?Object.fromEntries(o.map(r=>[r.prop,i])):{[t]:i},!0)};return s("div",{className:"irs-field","data-sides":n,children:[s("div",{className:"irs-slider-head",children:[a("span",{className:"irs-label",id:`irs-${n}-label`,children:g}),a("button",{type:"button",className:"btn btn-link btn-sm irs-reset","data-action":"reset-sides","data-group":n,"aria-label":b,title:b,onClick:()=>p(Object.fromEntries(o.map(t=>[t.prop,null]))),children:"\u2715"})]}),s("div",{className:"irs-sides",role:"group","aria-labelledby":`irs-${n}-label`,children:[o.map(t=>{const e=N[t.prop],l=e==null?"":(e/100).toFixed(2),i=u&&u.prop===t.prop?u.raw:l;return s("label",{className:"irs-side",children:[a("span",{children:t.label}),a("input",{type:"number",className:"form-control","data-prop":t.prop,min:v,max:k,step:"0.05",value:i,onFocus:r=>c({prop:t.prop,raw:r.target.value}),onBlur:()=>c(null),onChange:r=>h(t.prop,r.target.value)})]},t.prop)}),s("button",{type:"button",className:"irs-link","data-action":"toggle-link","data-group":n,"aria-pressed":d,"aria-label":m("padlink"),title:m("padlink"),onClick:()=>y(!d),children:[a(F,{}),a(x,{})]})]})]})}export{P as default};
