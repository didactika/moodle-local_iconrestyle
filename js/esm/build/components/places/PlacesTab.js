import{IconClose as d,IconCopy as b,IconPlus as m}from"../common/Icons";import{jsx as a,jsxs as l}from"react/jsx-runtime";/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The places where the open icon has a look, as chips, with the buttons that add more and copy the look to other colour modes.
 *
 * @module     local_iconrestyle/components/places/PlacesTab
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */function y({variants:s,otherModes:i,text:o,hidden:t,onPick:p,onRemove:n,onAdd:c,onCopyMode:r}){return l("div",{className:"irs-tabpanel",role:"tabpanel",id:"irs-panel-places","aria-labelledby":"irs-tab-places","data-region":"tab-places",hidden:t,children:[a("p",{className:"irs-help",children:o("placeshelp")}),a("div",{className:"irs-variants","data-region":"variants",role:"group","aria-label":o("appliesto"),children:s.map(e=>l("span",{className:`irs-chip${e.active?" irs-active":""}${e.removable?" irs-has-x":""}`,children:[a("button",{type:"button",className:"irs-chip-label","data-action":"pick-variant","data-key":e.key,"aria-pressed":e.active,onClick:()=>p(e.key),children:e.label}),e.removable&&a("button",{type:"button",className:"irs-x","data-action":"remove-chip","data-key":e.key,"aria-label":o("removeplace",e.label),title:o("removeplace",e.label),onClick:()=>n(e.key),children:a(d,{})})]},e.key))}),l("div",{className:"irs-places-actions",children:[l("button",{type:"button",className:"irs-pillbtn irs-pillbtn-primary","data-action":"add-places",onClick:c,children:[a(m,{})," ",o("addplaces")]}),l("button",{type:"button",className:"irs-pillbtn","data-action":"copy-mode",hidden:i===0,onClick:r,children:[a(b,{}),a("span",{"data-region":"copy-mode-label",children:o(i>1?"copytoothermodes":"copytoothermode")})]})]})]})}export{y as default};
