var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * This file is part of Moodle - https://moodle.org/
 * Moodle is free software under the GNU General Public License, version 3 or later.
 *
 * Chooses categories, courses or activities by name: what is typed is searched on the server and the places found are offered.
 *
 * @module     local_iconrestyle/components/places/LocationPicker
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import { useEffect, useRef, useState } from "react";
import * as api from "../../services/api";
import { IconClose } from "../common/Icons";
const SEARCH_DELAY_MS = 200;
function LocationPicker({ kind, label, hint, chosen, text, onChange }) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState(null);
  const token = useRef(0);
  useEffect(() => {
    if (query.trim() === "") {
      setFound(null);
      return void 0;
    }
    const mine = ++token.current;
    const timer = window.setTimeout(() => {
      api.searchLocations(kind, query.trim()).then((result) => {
        if (mine === token.current) {
          setFound(result.places);
        }
        return null;
      }).catch(() => {
        if (mine === token.current) {
          setFound([]);
        }
      });
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [kind, query]);
  const choose = /* @__PURE__ */ __name((place) => {
    if (!chosen.some((each) => each.contextid === place.contextid)) {
      onChange([...chosen, { contextid: place.contextid, name: place.name }]);
    }
    setQuery("");
    setFound(null);
  }, "choose");
  const options = (found ?? []).filter((place) => !chosen.some((each) => each.contextid === place.contextid));
  return /* @__PURE__ */ jsxDEV("div", { className: "irs-field", "data-kind-field": kind, children: [
    /* @__PURE__ */ jsxDEV("label", { className: "irs-label", htmlFor: `irs-places-${kind}`, children: label }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
      lineNumber: 77,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "irs-picked", role: "list", children: chosen.map((place) => /* @__PURE__ */ jsxDEV(
      "span",
      {
        className: "badge badge-primary bg-primary irs-picked-item",
        role: "listitem",
        "data-value": place.contextid,
        children: [
          place.name,
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              className: "irs-x",
              "aria-label": text("removeplace", place.name),
              onClick: () => onChange(chosen.filter((each) => each.contextid !== place.contextid)),
              children: /* @__PURE__ */ jsxDEV(IconClose, {}, void 0, false, {
                fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
                lineNumber: 85,
                columnNumber: 21
              }, this)
            },
            void 0,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
              lineNumber: 83,
              columnNumber: 17
            },
            this
          )
        ]
      },
      place.contextid,
      true,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
        lineNumber: 79,
        columnNumber: 36
      },
      this
    )) }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
      lineNumber: 78,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV(
      "input",
      {
        type: "text",
        className: "form-control",
        id: `irs-places-${kind}`,
        autoComplete: "off",
        value: query,
        placeholder: text("placesplaceholder"),
        role: "combobox",
        "aria-expanded": found !== null,
        "aria-autocomplete": "list",
        onChange: (event) => setQuery(event.target.value),
        onKeyDown: (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (options[0]) {
              choose(options[0]);
            }
          }
        }
      },
      void 0,
      false,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
        lineNumber: 89,
        columnNumber: 9
      },
      this
    ),
    found !== null && /* @__PURE__ */ jsxDEV("div", { className: "irs-location-list", role: "listbox", children: [
      options.map((place) => /* @__PURE__ */ jsxDEV(
        "button",
        {
          type: "button",
          className: "irs-location-item",
          role: "option",
          "aria-selected": "false",
          "data-value": place.contextid,
          onClick: () => choose(place),
          children: [
            /* @__PURE__ */ jsxDEV("span", { children: place.name }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
              lineNumber: 103,
              columnNumber: 17
            }, this),
            place.detail ? /* @__PURE__ */ jsxDEV("small", { children: place.detail }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
              lineNumber: 103,
              columnNumber: 58
            }, this) : null
          ]
        },
        place.contextid,
        true,
        {
          fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
          lineNumber: 101,
          columnNumber: 37
        },
        this
      )),
      options.length === 0 && /* @__PURE__ */ jsxDEV("p", { className: "irs-theme-note", children: text("placesnone") }, void 0, false, {
        fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
        lineNumber: 105,
        columnNumber: 38
      }, this)
    ] }, void 0, true, {
      fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
      lineNumber: 100,
      columnNumber: 28
    }, this),
    hint ? /* @__PURE__ */ jsxDEV("p", { className: "irs-hint", children: hint }, void 0, false, {
      fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
      lineNumber: 107,
      columnNumber: 17
    }, this) : null
  ] }, void 0, true, {
    fileName: "public/local/iconrestyle/js/esm/src/components/places/LocationPicker.tsx",
    lineNumber: 76,
    columnNumber: 12
  }, this);
}
__name(LocationPicker, "LocationPicker");
export {
  LocationPicker as default
};
//# sourceMappingURL=LocationPicker.dev.js.map
