import{jsx as s}from"react/jsx-runtime";/**
 * One icon as Moodle draws it, at one size, in the preview and on the cards of the grid.
 *
 * @module     local_iconrestyle/components/IconCell
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */function t({icon:e,size:a}){let l;return e.kind==="container"?l=s("span",{className:e.component==="activity"?`modtype_${e.name}`:"",children:s("div",{className:`${e.classes} irs-box`,style:{width:a*1.6,height:a*1.6},children:s("img",{className:"activityicon",alt:"",src:e.imageurl})})}):e.kind==="font"?l=s("i",{className:e.classes,"aria-hidden":"true",style:{fontSize:a,width:a,height:a,lineHeight:`${a}px`}}):l=s("img",{className:"icon",alt:"",src:e.imageurl,style:{width:a,height:a}}),s("span",{className:"irs-cell",children:s("span",{className:"irs-fit",children:l})})}export{t as default};
