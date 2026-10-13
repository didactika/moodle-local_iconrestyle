var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
/**
 * A modal dialog with the markup of Bootstrap's, so it follows the theme, with focus kept inside and Escape to close.
 *
 * @module     local_iconrestyle/components/common/Modal
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function Modal(props) {
  const { title, saveLabel, cancelLabel, closeLabel, saveDisabled = false, children, onSave, onClose } = props;
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    document.body.classList.add("modal-open");
    const first = dialog.current?.querySelector(".modal-body " + FOCUSABLE) ?? dialog.current;
    first?.focus();
    return () => {
      document.body.classList.remove("modal-open");
      previous?.focus?.();
    };
  }, []);
  const keydown = /* @__PURE__ */ __name((event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialog.current) {
      return;
    }
    const items = Array.from(dialog.current.querySelectorAll(FOCUSABLE));
    if (items.length === 0) {
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, "keydown");
  return createPortal(/* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "modal-backdrop show" }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/common/Modal.tsx",
      lineNumber: 75,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: "modal show d-block irs-modal",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": title,
        tabIndex: -1,
        onKeyDown: keydown,
        ref: dialog,
        children: /* @__PURE__ */ jsxDEV("div", { className: "modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered", role: "document", children: /* @__PURE__ */ jsxDEV("div", { className: "modal-content", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
            /* @__PURE__ */ jsxDEV("h5", { className: "modal-title", children: title }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/common/Modal.tsx",
              lineNumber: 81,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("button", { type: "button", className: "btn-close", "aria-label": closeLabel, "data-action": "hide", onClick: onClose }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/common/Modal.tsx",
              lineNumber: 82,
              columnNumber: 25
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/common/Modal.tsx",
            lineNumber: 80,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "modal-body", children }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/common/Modal.tsx",
            lineNumber: 84,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "modal-footer", children: [
            /* @__PURE__ */ jsxDEV("button", { type: "button", className: "btn btn-secondary", "data-action": "cancel", onClick: onClose, children: cancelLabel }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/common/Modal.tsx",
              lineNumber: 86,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                className: "btn btn-primary",
                "data-action": "save",
                disabled: saveDisabled,
                onClick: onSave,
                children: saveLabel
              },
              void 0,
              false,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/common/Modal.tsx",
                lineNumber: 89,
                columnNumber: 25
              },
              this
            )
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/common/Modal.tsx",
            lineNumber: 85,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/common/Modal.tsx",
          lineNumber: 79,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/common/Modal.tsx",
          lineNumber: 78,
          columnNumber: 13
        }, this)
      },
      void 0,
      false,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/common/Modal.tsx",
        lineNumber: 76,
        columnNumber: 9
      },
      this
    )
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/common/Modal.tsx",
    lineNumber: 74,
    columnNumber: 25
  }, this), document.body);
}
__name(Modal, "Modal");
export {
  Modal as default
};
//# sourceMappingURL=Modal.dev.js.map
