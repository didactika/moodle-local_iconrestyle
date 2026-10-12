import{fetchOne as l}from"@moodle/lms/core/ajax";/**
 * Every web service call of the designer, in one place.
 *
 * @module     local_iconrestyle/services/api
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const c=3e4;class u extends Error{timedout=!0;constructor(){super("The server did not answer in time.")}}const r=(e,t)=>l({methodname:e,args:t}),a=(e,t)=>new Promise((s,o)=>{const i=window.setTimeout(()=>o(new u),t);e.then(n=>(window.clearTimeout(i),s(n),null),n=>{window.clearTimeout(i),o(n)})}),p=()=>r("local_iconrestyle_get_catalogue",{}),_=()=>r("local_iconrestyle_get_rules",{}),g=(e,t)=>a(r("local_iconrestyle_save_rules",{rules:e,deleteids:t}),c),d=(e,t)=>r("local_iconrestyle_preview_css",{rules:e,scope:t}),w=(e,t)=>r("local_iconrestyle_search_locations",{kind:e,query:t}),x=e=>r("local_iconrestyle_add_asset",{content:e}),P=e=>r("local_iconrestyle_use_icon_artwork",{slotkey:e}),T=(e=[])=>r("local_iconrestyle_export_rules",{slots:e}),y=(e,t,s,o=[])=>r("local_iconrestyle_import_rules",{content:e,mode:t,dryrun:s,slots:o});export{u as TimeoutError,x as addAsset,T as exportRules,p as getCatalogue,_ as getRules,y as importRules,d as previewCss,g as saveRules,w as searchLocations,P as useIconArtwork};
