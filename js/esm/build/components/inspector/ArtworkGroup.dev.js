var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * The artwork of an icon: a file of the person's own that replaces the icon of Moodle.
 *
 * @module     local_iconrestyle/components/inspector/ArtworkGroup
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useState } from "react";
import { IconClose, IconPlus } from "../common/Icons";
import * as api from "../../services/api";
import { NO_ARTWORK } from "../../lib/presets";
const MAX_UPLOAD_BASE64 = 36e4;
function ArtworkGroup({ draft, text, onStage }) {
  const [hint, setHint] = useState("");
  const has = draft.assetid > 0;
  const upload = /* @__PURE__ */ __name((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result).split(",")[1] || "";
      if (content.length > MAX_UPLOAD_BASE64) {
        setHint(text("uploadfailed", file.name));
        return;
      }
      api.addAsset(content).then((asset) => {
        setHint("");
        onStage({
          assetid: asset.id,
          asseturl: asset.url,
          assetkind: asset.kind,
          assetmono: asset.monochrome,
          autoartwork: false
        });
        return null;
      }).catch((error) => setHint(text("uploadfailed", error.message || file.name)));
    };
    reader.readAsDataURL(file);
  }, "upload");
  return /* @__PURE__ */ jsxDEV("details", { className: "irs-group", "data-region": "group-artwork", open: true, children: [
    /* @__PURE__ */ jsxDEV("summary", { children: text("artwork") }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ArtworkGroup.tsx",
      lineNumber: 56,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "irs-field", "data-region": "artwork", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "irs-artwork-row", children: [
        /* @__PURE__ */ jsxDEV("label", { className: "btn btn-outline-secondary btn-sm irs-upload", htmlFor: "irs-upload", children: [
          /* @__PURE__ */ jsxDEV(IconPlus, {}, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ArtworkGroup.tsx",
            lineNumber: 60,
            columnNumber: 21
          }, this),
          " ",
          text("uploadartwork")
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ArtworkGroup.tsx",
          lineNumber: 59,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "file",
            id: "irs-upload",
            className: "irs-upload-input",
            "data-region": "upload",
            accept: ".svg,.png,.webp,image/svg+xml,image/png,image/webp",
            onChange: (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                upload(file);
              }
            }
          },
          void 0,
          false,
          {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ArtworkGroup.tsx",
            lineNumber: 62,
            columnNumber: 17
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("span", { className: `irs-file-chip${has ? " irs-has-file" : ""}`, "data-region": "artwork-chip", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "irs-artwork-name", "data-region": "artwork-name", role: "status", children: has ? text("artworkready", draft.assetkind.toUpperCase()) : text("noartwork") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ArtworkGroup.tsx",
            lineNumber: 72,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              className: "irs-x",
              "data-action": "remove-artwork",
              hidden: !has,
              "aria-label": text("removeartwork"),
              title: text("removeartwork"),
              onClick: () => {
                setHint("");
                onStage(NO_ARTWORK);
              },
              children: /* @__PURE__ */ jsxDEV(IconClose, {}, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ArtworkGroup.tsx",
                lineNumber: 81,
                columnNumber: 25
              }, this)
            },
            void 0,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ArtworkGroup.tsx",
              lineNumber: 75,
              columnNumber: 21
            },
            this
          )
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ArtworkGroup.tsx",
          lineNumber: 71,
          columnNumber: 17
        }, this)
      ] }, void 0, true, {
        fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ArtworkGroup.tsx",
        lineNumber: 58,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: `irs-hint${hint === "" ? "" : " irs-error"}`, "data-region": "artwork-hint", hidden: hint === "", children: hint }, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ArtworkGroup.tsx",
        lineNumber: 85,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ArtworkGroup.tsx",
      lineNumber: 57,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ArtworkGroup.tsx",
    lineNumber: 55,
    columnNumber: 12
  }, this);
}
__name(ArtworkGroup, "ArtworkGroup");
export {
  ArtworkGroup as default
};
//# sourceMappingURL=ArtworkGroup.dev.js.map
