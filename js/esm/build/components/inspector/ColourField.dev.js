var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * One colour control: a picker, a hex box with a cross that clears it, and a searchable list of the colours of the theme.
 *
 * @module     local_iconrestyle/components/inspector/ColourField
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useMemo, useState } from "react";
import ThemeColourSelect from "./ThemeColourSelect";
import { IconClose } from "../common/Icons";
import { normalise, parseHex, toHex } from "../../lib/color";
import * as themevars from "../../lib/themevars";
const FOLLOWS_THEME = /^(var:|token:)|^(currentcolor|transparent)$/;
const hexOf = /* @__PURE__ */ __name((css) => {
  const probe = document.createElement("span");
  probe.style.color = css;
  document.body.appendChild(probe);
  const [red, green, blue, alpha] = (window.getComputedStyle(probe).color.match(/[0-9.]+/g) || []).map(Number);
  probe.remove();
  return red === void 0 ? "" : toHex({ r: red, g: green, b: blue, a: alpha === void 0 ? 255 : Math.round(alpha * 255) });
}, "hexOf");
function ColourField({ name, label, value, specials, text, onChange }) {
  const [typed, setTyped] = useState(null);
  const [invalid, setInvalid] = useState(false);
  const themed = FOLLOWS_THEME.test(value);
  const fromTheme = themevars.cssOf(value);
  const shown = useMemo(() => {
    if (!themed) {
      return value;
    }
    return fromTheme === "" ? "" : hexOf(fromTheme);
  }, [themed, fromTheme, value]);
  const special = specials.find((item) => item.value === value);
  const hasTheme = themevars.nameOf(value) !== "" || Boolean(special);
  const parsed = parseHex(shown);
  const pair = /* @__PURE__ */ __name((channel) => channel.toString(16).padStart(2, "0"), "pair");
  const picker = parsed ? `#${pair(parsed.r)}${pair(parsed.g)}${pair(parsed.b)}` : "#000000";
  const input = /* @__PURE__ */ __name((raw) => {
    const current = raw.trim();
    setTyped(raw);
    if (current === "") {
      setInvalid(false);
      onChange(name, "", true);
    } else if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(current)) {
      setInvalid(false);
      onChange(name, normalise(current) ?? "", true);
    } else if (/[^#0-9a-f]/i.test(current) || current.length > 9) {
      setInvalid(true);
    }
  }, "input");
  const commit = /* @__PURE__ */ __name((raw) => {
    const current = raw.trim();
    const valid = current === "" ? "" : normalise(current);
    setTyped(null);
    if (valid === null) {
      setInvalid(true);
    } else {
      setInvalid(false);
      onChange(name, valid, false);
    }
  }, "commit");
  return /* @__PURE__ */ jsxDEV("div", { className: `irs-field irs-colour${hasTheme ? " irs-themed" : ""}`, "data-colour": name, children: [
    /* @__PURE__ */ jsxDEV("label", { className: "irs-label", htmlFor: `irs-${name}-hex`, "data-region": `${name}-label`, children: label }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ColourField.tsx",
      lineNumber: 96,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "irs-colour-row", children: [
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "color",
          className: "irs-colour-picker",
          "data-region": `${name}-picker`,
          value: picker,
          "aria-label": label,
          title: label,
          onChange: (event) => onChange(name, normalise(event.target.value) ?? "", true)
        },
        void 0,
        false,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ColourField.tsx",
          lineNumber: 98,
          columnNumber: 13
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "irs-with-x", children: [
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            className: `form-control irs-colour-hex${fromTheme !== "" ? " irs-from-theme" : ""}`,
            id: `irs-${name}-hex`,
            "data-region": `${name}-hex`,
            maxLength: 9,
            spellCheck: false,
            autoComplete: "off",
            placeholder: "#rrggbb",
            "aria-invalid": invalid ? true : void 0,
            value: typed ?? shown,
            onFocus: (event) => setTyped(event.target.value),
            onChange: (event) => input(event.target.value),
            onBlur: (event) => commit(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter") {
                commit(event.target.value);
              }
            }
          },
          void 0,
          false,
          {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ColourField.tsx",
            lineNumber: 101,
            columnNumber: 17
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "button",
            className: "irs-x",
            "data-action": `clear-${name}`,
            "aria-label": text("clearcolour"),
            title: text("clearcolour"),
            onClick: () => {
              setTyped(null);
              setInvalid(false);
              onChange(name, "", false);
            },
            children: /* @__PURE__ */ jsxDEV(IconClose, {}, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ColourField.tsx",
              lineNumber: 119,
              columnNumber: 21
            }, this)
          },
          void 0,
          false,
          {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ColourField.tsx",
            lineNumber: 113,
            columnNumber: 17
          },
          this
        )
      ] }, void 0, true, {
        fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ColourField.tsx",
        lineNumber: 100,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV(
        ThemeColourSelect,
        {
          name,
          stored: value,
          specials,
          text,
          onPick: (picked) => onChange(name, picked, false)
        },
        void 0,
        false,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ColourField.tsx",
          lineNumber: 122,
          columnNumber: 13
        },
        this
      )
    ] }, void 0, true, {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ColourField.tsx",
      lineNumber: 97,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("p", { className: "irs-hint", "data-region": `${name}-hint`, hidden: true }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ColourField.tsx",
      lineNumber: 125,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/inspector/ColourField.tsx",
    lineNumber: 95,
    columnNumber: 12
  }, this);
}
__name(ColourField, "ColourField");
export {
  ColourField as default
};
//# sourceMappingURL=ColourField.dev.js.map
