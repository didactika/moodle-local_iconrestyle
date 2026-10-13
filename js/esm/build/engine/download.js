/**
 * Gives the browser a file to save.
 *
 * @module     local_iconrestyle/engine/download
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */const d=(t,n)=>{const o=window.URL.createObjectURL(new window.Blob([n],{type:"text/plain;charset=utf-8"})),e=document.createElement("a");e.href=o,e.download=t,document.body.appendChild(e),e.click(),e.remove(),window.setTimeout(()=>window.URL.revokeObjectURL(o),1e3)};export{d as download};
