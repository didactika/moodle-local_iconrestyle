import{jsx as e}from"react/jsx-runtime";/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * The small icons of the designer: the icons of Moodle, which Font Awesome draws, so they take the colour of the text around them and a site can restyle them. None is drawn by hand.
 *
 * @module     local_iconrestyle/components/common/Icons
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const o=({name:t,size:n=16,className:s})=>e("i",{className:`irs-glyph fa-solid fa-${t}${n===18?" irs-glyph-lg":""}${s?` ${s}`:""}`,style:n===16||n===18?void 0:{fontSize:n},"aria-hidden":"true"}),c=()=>e(o,{name:"triangle-exclamation",size:18}),r=()=>e(o,{name:"arrow-left",size:18}),a=({size:t=18})=>e(o,{name:"check",size:t}),i=()=>e(o,{name:"chevron-down"}),l=()=>e(o,{name:"xmark"}),p=()=>e(o,{name:"adjust"}),m=()=>e(o,{name:"clone"}),x=()=>e(o,{name:"download",size:18}),I=()=>e(o,{name:"link",className:"irs-icon-linked"}),d=()=>e(o,{name:"ellipsis",size:18}),h=()=>e(o,{name:"plus"}),g=()=>e(o,{name:"arrow-rotate-right",size:18}),k=()=>e(o,{name:"arrows-rotate",size:18}),f=()=>e(o,{name:"magnifying-glass",size:18}),u=()=>e(o,{name:"square-check"}),z=()=>e(o,{name:"trash-can"}),y=()=>e(o,{name:"rotate-left",size:18}),w=()=>e(o,{name:"link-slash",className:"irs-icon-unlinked"}),C=()=>e(o,{name:"upload",size:18}),$=()=>e(o,{name:"filter"}),G=()=>e(o,{name:"rotate-right"});export{c as IconAlert,r as IconBack,a as IconCheck,i as IconChevron,l as IconClose,p as IconColourMode,m as IconCopy,x as IconDownload,$ as IconFilter,G as IconFilterClear,I as IconLinked,d as IconMore,h as IconPlus,g as IconRedo,k as IconRefresh,f as IconSearch,u as IconSelect,z as IconTrash,y as IconUndo,w as IconUnlinked,C as IconUpload};
