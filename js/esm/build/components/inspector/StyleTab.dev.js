var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { jsxDEV } from "react/jsx-dev-runtime";
/**
 * The style tab of the editing panel: quick looks, colour, artwork, shape, spacing, transform, effects and filters.
 *
 * @module     local_iconrestyle/components/inspector/StyleTab
 * @copyright  2026 Didactika.org
 * @author     Hector Arrechea <hectorlazaroarrechea@gmail.com>
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import ArtworkGroup from "./ArtworkGroup";
import ColourField from "./ColourField";
import SelectField from "./SelectField";
import SidesField from "./SidesField";
import SliderField from "./SliderField";
import { SELECTS, SELECT_LABELS, SHAPES, SIDES, SIDE_STRINGS, SLIDERS } from "./config";
import { CLEAR_DESIGN, LOOKS, LOOK_STRINGS } from "../../lib/presets";
function StyleTab({ icon, draft, ranges, specials, boxColours, text, hidden, onProp, onStage }) {
  const slider = /* @__PURE__ */ __name((prop) => /* @__PURE__ */ jsxDEV(
    SliderField,
    {
      prop,
      label: text(SLIDERS[prop].label),
      min: ranges[prop][0],
      max: ranges[prop][1],
      step: SLIDERS[prop].step,
      defaultValue: SLIDERS[prop].rest,
      value: draft[prop],
      text,
      onChange: onProp
    },
    prop,
    false,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
      lineNumber: 41,
      columnNumber: 38
    },
    this
  ), "slider");
  const select = /* @__PURE__ */ __name((prop) => /* @__PURE__ */ jsxDEV(
    SelectField,
    {
      prop,
      label: text(SELECT_LABELS[prop]),
      options: SELECTS[prop],
      value: draft[prop],
      text,
      onChange: onProp
    },
    prop,
    false,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
      lineNumber: 44,
      columnNumber: 38
    },
    this
  ), "select");
  const colour = /* @__PURE__ */ __name((name, label) => /* @__PURE__ */ jsxDEV(
    ColourField,
    {
      name,
      label: text(label),
      value: draft[name] ?? "",
      specials: specials[name] ?? [],
      text,
      onChange: (field, value, continuous) => onProp(field, value, continuous)
    },
    name,
    false,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
      lineNumber: 46,
      columnNumber: 53
    },
    this
  ), "colour");
  const sides = /* @__PURE__ */ __name((group) => {
    const config = SIDES[group];
    return /* @__PURE__ */ jsxDEV(
      SidesField,
      {
        group,
        label: text(config.label),
        resetLabel: text(config.reset),
        min: config.min,
        max: config.max,
        draft,
        text,
        onStage,
        sides: ["t", "r", "b", "l"].map((letter) => ({ prop: config.first + letter, label: text(SIDE_STRINGS[letter]) }))
      },
      group,
      false,
      {
        fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
        lineNumber: 51,
        columnNumber: 16
      },
      this
    );
  }, "sides");
  const chooseLook = /* @__PURE__ */ __name((name) => {
    const look = LOOKS[name];
    const patch = look.keepDesign ? {} : { ...CLEAR_DESIGN, ...look.design };
    Object.keys(look.colours ?? {}).forEach((field) => {
      if (!draft[field]) {
        patch[field] = look.colours[field];
      }
    });
    onStage({ ...patch, ...look.force ?? {} });
  }, "chooseLook");
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: "irs-tabpanel",
      role: "tabpanel",
      id: "irs-panel-style",
      "aria-labelledby": "irs-tab-style",
      "data-region": "tab-style",
      hidden,
      children: [
        /* @__PURE__ */ jsxDEV("details", { className: "irs-group", open: true, children: [
          /* @__PURE__ */ jsxDEV("summary", { children: text("grouplooks") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
            lineNumber: 70,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "irs-looks", "data-looks": true, children: Object.keys(LOOKS).map((name) => /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              className: `irs-look irs-look-${name}`,
              "data-action": "look",
              "data-look": name,
              "data-kinds": LOOKS[name].kinds.join(" "),
              title: text(LOOK_STRINGS[name][1]),
              hidden: !LOOKS[name].kinds.includes(icon.kind),
              onClick: () => chooseLook(name),
              children: [
                /* @__PURE__ */ jsxDEV("span", { className: "irs-look-sample", "aria-hidden": "true" }, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
                  lineNumber: 76,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "irs-look-name", children: text(LOOK_STRINGS[name][0]) }, void 0, false, {
                  fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
                  lineNumber: 77,
                  columnNumber: 21
                }, this)
              ]
            },
            name,
            true,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
              lineNumber: 72,
              columnNumber: 51
            },
            this
          )) }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
            lineNumber: 71,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "irs-hint", children: text("lookshint") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
            lineNumber: 80,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
          lineNumber: 69,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("details", { className: "irs-group", open: true, children: [
          /* @__PURE__ */ jsxDEV("summary", { children: text("groupcolour") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
            lineNumber: 84,
            columnNumber: 13
          }, this),
          colour("fg", icon.kind === "container" ? "iconcolour" : "foreground"),
          colour("bg", icon.kind === "container" ? "boxcolour" : "background"),
          colour("bg2", "gradientcolour"),
          slider("gd")
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
          lineNumber: 83,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV(ArtworkGroup, { draft, text, onStage }, void 0, false, {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
          lineNumber: 91,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("details", { className: "irs-group", children: [
          /* @__PURE__ */ jsxDEV("summary", { children: text("groupshape") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
            lineNumber: 94,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "irs-field", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "irs-label", id: "irs-shape-label", children: text("shape") }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
              lineNumber: 96,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "irs-shapes", role: "group", "aria-labelledby": "irs-shape-label", "data-prop": "shape", children: SHAPES.map(([value, label, sample]) => /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                className: "irs-shape",
                "data-value": value,
                "aria-pressed": (draft.shape ?? "") === value,
                onClick: () => onProp("shape", value === "" ? null : value),
                children: [
                  /* @__PURE__ */ jsxDEV("span", { className: `irs-shape-sample${sample === "" ? "" : ` ${sample}`}` }, void 0, false, {
                    fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
                    lineNumber: 101,
                    columnNumber: 25
                  }, this),
                  text(label)
                ]
              },
              value,
              true,
              {
                fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
                lineNumber: 98,
                columnNumber: 61
              },
              this
            )) }, void 0, false, {
              fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
              lineNumber: 97,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
            lineNumber: 95,
            columnNumber: 13
          }, this),
          slider("radius"),
          slider("bw"),
          select("bs"),
          colour("bc", "bordercolour"),
          slider("ow"),
          slider("oo"),
          colour("oc", "outlinecolour")
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
          lineNumber: 93,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("details", { className: "irs-group", children: [
          /* @__PURE__ */ jsxDEV("summary", { children: text("groupspacing") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
            lineNumber: 115,
            columnNumber: 13
          }, this),
          sides("padding"),
          sides("margin"),
          slider("scale")
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
          lineNumber: 114,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("details", { className: "irs-group", children: [
          /* @__PURE__ */ jsxDEV("summary", { children: text("grouptransform") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
            lineNumber: 122,
            columnNumber: 13
          }, this),
          slider("rotate"),
          slider("skx"),
          slider("sky"),
          /* @__PURE__ */ jsxDEV("div", { className: "irs-field irs-flips", children: ["flipx", "flipy"].map((flip) => /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              className: "irs-toggle",
              "data-flip": flip,
              "aria-pressed": draft[flip] === 1,
              onClick: () => onStage({ [flip]: draft[flip] === 1 ? null : 1 }),
              children: text(flip)
            },
            flip,
            false,
            {
              fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
              lineNumber: 127,
              columnNumber: 51
            },
            this
          )) }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
            lineNumber: 126,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
          lineNumber: 121,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("details", { className: "irs-group", children: [
          /* @__PURE__ */ jsxDEV("summary", { children: text("groupeffects") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
            lineNumber: 135,
            columnNumber: 13
          }, this),
          slider("opacity"),
          select("shadow"),
          select("ds"),
          colour("sc", "shadowcolour"),
          select("blend"),
          select("hover")
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
          lineNumber: 134,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("details", { className: "irs-group", children: [
          /* @__PURE__ */ jsxDEV("summary", { children: text("groupfilters") }, void 0, false, {
            fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
            lineNumber: 145,
            columnNumber: 13
          }, this),
          ["brightness", "contrast", "saturate", "grayscale", "hue", "sepia", "invert", "blur"].map(slider)
        ] }, void 0, true, {
          fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
          lineNumber: 144,
          columnNumber: 9
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "public/local/iconrestyle/js/esm/src/components/inspector/StyleTab.tsx",
      lineNumber: 67,
      columnNumber: 12
    },
    this
  );
}
__name(StyleTab, "StyleTab");
export {
  StyleTab as default
};
//# sourceMappingURL=StyleTab.dev.js.map
