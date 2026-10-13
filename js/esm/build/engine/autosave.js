/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Saves the changes of the designer on its own, without ever sending two requests at once.
 *
 * A click, a choice or an undo is saved at once. What the person is still typing or dragging waits a third of a second
 * after the last step, so a slider makes one request and not one per step, and a save is forced after two seconds if the
 * person never stops. Everything that changed goes in a single request. While a request is in flight, new changes only wait:
 * they go in the next request, which starts the moment the first one ends.
 *
 * @module     local_iconrestyle/engine/autosave
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const S=m=>{const{flush:f,pendingCount:t,onStatus:i,onSaved:w,onFailure:h}=m;let n=0,s=0,e=null;const p=async()=>{let o=!1;i("saving");try{w(await f())}catch(a){o=!0,i("error"),await h(a)}finally{e=null}t()>0?u(!0):o||i("saved")},r=()=>(window.clearTimeout(n),e||(t()===0?(i("saved"),Promise.resolve()):(s=0,e=p(),e)));function u(o=!1){!e&&t()>0&&i("dirty");const a=Date.now();s=s||a,window.clearTimeout(n);const y=o?0:Math.max(0,Math.min(350,s+2e3-a));n=window.setTimeout(()=>{r()},y)}const l=async()=>{await r(),t()>0&&await r()},d=()=>e!==null||t()>0,v=o=>{d()&&(o.preventDefault(),o.returnValue="")},c=()=>{document.visibilityState==="hidden"&&d()&&l()};return window.addEventListener("beforeunload",v),document.addEventListener("visibilitychange",c),{schedule:u,saveNow:r,flushAll:l,isBusy:d,dispose:()=>{window.clearTimeout(n),window.removeEventListener("beforeunload",v),document.removeEventListener("visibilitychange",c)}}};export{S as createAutosave};
