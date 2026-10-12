import{jsx as t,jsxs as i}from"react/jsx-runtime";/**
 * A property that takes one of a fixed list of values, or Moodle's own.
 *
 * @module     local_iconrestyle/components/inspector/SelectField
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */function p({prop:l,label:s,options:r,value:o,text:a,onChange:n}){return i("div",{className:"irs-field irs-row",children:[t("label",{className:"irs-label",htmlFor:`irs-${l}`,children:s}),i("select",{className:"custom-select form-select",id:`irs-${l}`,"data-prop":l,value:o??"",onChange:e=>n(l,e.target.value===""?null:e.target.value),children:[t("option",{value:"",children:a("propdefault")}),r.map(([e,u])=>t("option",{value:e,children:a(u)},e))]})]})}export{p as default};
