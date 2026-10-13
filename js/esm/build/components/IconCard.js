import{memo as u}from"react";import f from"./IconCell";import b,{CARD_LAYOUT as y}from"./ShadowStage";import{IconCheck as N}from"./common/Icons";import{jsx as s,jsxs as C}from"react/jsx-runtime";/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * One icon of the grid: how the site draws it, or how it will look once what is waiting is saved.
 *
 * @module     local_iconrestyle/components/IconCard
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const g=24,h=a=>a.kind==="font"?s("i",{className:a.classes,"aria-hidden":"true"}):a.kind==="image"?s("img",{className:"icon",src:a.imageurl,alt:""}):s("span",{className:a.component==="activity"?`modtype_${a.name}`:"",children:s("span",{className:`${a.classes} irs-box`,children:s("img",{className:"activityicon",src:a.imageurl,alt:""})})});function k({icon:a,modified:o,selected:r,picking:e,picked:t,pickable:i,css:n,theme:l,text:c,onSelect:m}){const p=e&&!i&&!r;return C("button",{type:"button",className:`irs-card${r?" irs-selected":""}${e?" irs-picking":""}${t?" irs-picked":""}`,"data-action":"select","data-key":a.key,"aria-pressed":e?t:r,title:a.key,disabled:p,onClick:d=>m(a.key,d.shiftKey),children:[n===null?s("span",{className:"irs-card-icon",children:s("span",{className:"irs-card-fit",children:h(a)})}):s(b,{className:"irs-card-icon",area:"new",layout:y,css:n,theme:l,limit:"host",children:s(f,{icon:a,size:g})}),s("span",{className:"irs-card-name",children:a.name}),s("span",{className:"irs-card-component",children:a.component}),e&&s("span",{className:"irs-pick","aria-hidden":"true",children:s(N,{size:11})}),o&&s("span",{className:"irs-dot",role:"img","aria-label":c("modified")}),a.group>1&&s("span",{className:"irs-shared","aria-hidden":"true",children:"\u2261"})]})}var w=u(k);export{w as default};
