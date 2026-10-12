import{DESIGN_PROPS as r}from"./draft";/**
 * The quick looks, the groups of properties that can be linked and what it takes to clear a design.
 *
 * @module     local_iconrestyle/lib/presets
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const n={padding:["pt","pr","pb","pl"],margin:["mt","mr","mb","ml"]},l={assetid:0,asseturl:"",assetkind:"",assetmono:!1,autoartwork:!1},p=Object.fromEntries(r.map(e=>[e,null])),t=e=>({pt:e,pr:e,pb:e,pl:e}),a={flat:{kinds:["container"],keepDesign:!0,force:{bg:"transparent"}},box:{kinds:["container"],design:{shape:"rounded",...t(20)}},pill:{kinds:["container"],design:{shape:"pill",pt:15,pr:35,pb:15,pl:35,shadow:"soft"}},tile:{kinds:["font","image"],design:{shape:"rounded",...t(25)},colours:{bg:"token:light"}},badge:{kinds:["font","image"],design:{shape:"circle",...t(30)},colours:{bg:"token:primary",fg:"#ffffff"}},outline:{kinds:["font","image"],design:{shape:"circle",...t(25),bw:2,bs:"solid"}}},d={flat:["presetflat","presetflathelp"],box:["presetbox","presetboxhelp"],pill:["lookpill","lookpillhelp"],tile:["looktile","looktilehelp"],badge:["lookbadge","lookbadgehelp"],outline:["lookoutline","lookoutlinehelp"]},c=e=>Object.keys(n).find(o=>n[o].includes(e)),g=(e,o)=>Object.fromEntries(n[e].map(s=>[s,o]));export{p as CLEAR_DESIGN,a as LOOKS,d as LOOK_STRINGS,l as NO_ARTWORK,n as SIDE_GROUPS,c as groupOf,g as sidesOf};
