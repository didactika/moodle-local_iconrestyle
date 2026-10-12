# Editing an icon

Open an icon and the **Style** tab shows its controls in groups. Every control starts empty, which means *Moodle's own
value*. A control that has a value shows a cross that takes it away again. Everything you change shows at once in the preview
and is saved on its own.

![The editing panel](images/designer-open.png)

## Preview

- **Edited** shows the icon with your look, **Original** shows how Moodle draws it, **Compare** shows both side by side.
- Each shows the icon at 16, 24, 32 and 48 pixels.
- **Light** and **Dark** change the background of the preview. When your site has colour modes the preview follows the mode
  of the page and each look belongs to one mode (see [Places and colour modes](Places-and-colour-modes.md)).
- Under the preview, a line tells you whether the colour of the icon can be read on that background.

## Quick looks

One click gives the icon a complete look. A quick look gives shape, spacing and border and **keeps the colours you already
chose**, so choosing one never undoes a colour.

| Look | For | What it does |
|---|---|---|
| **Remove Moodle's colour** | Activity icons | Takes away the coloured box Moodle gives them, and nothing else. |
| **Put in a box** | Activity icons | A rounded box around the icon. |
| **Pill** | Activity icons | A long rounded box with a soft shadow. |
| **Tile** | Other icons | A rounded tile in a light colour. |
| **Badge** | Other icons | A round badge in the main colour of the theme with a white icon. |
| **Outline** | Other icons | A round border around the icon. |

## Colour

- **Foreground colour** (called **Icon colour** for activity icons) and **Background colour** (**Box colour** for activities).
- Each colour has three ways to be set on one line: the small square opens a colour picker; the box takes a code such as
  `#e83e8c` (and a cross clears it); and the list on the right offers **every colour the active theme declares**, such as
  `--bs-primary`. Start typing to search that list.
- A colour chosen from the theme keeps following the theme: change the colours of the theme and the icon follows.
- **Gradient colour** and **Gradient angle** give the background a gradient from the background colour to a second colour.

## Artwork

Press **Upload an icon (SVG, PNG or WebP)** to replace Moodle's icon by a file of your own. SVG files are cleaned and PNG and
WebP files are decoded and written again, so a file can never carry a script. A single-colour file can be recoloured with
the foreground colour. The cross takes the artwork away, and the icon goes back to Moodle's own.

## Shape

- **Shape**: Default, Square, Rounded, Circle or Pill, and an exact **Corner radius**.
- **Border width**, **Border style** (solid, dashed, dotted, double) and **Border colour**.
- **Outline width**, **Outline offset** and **Outline colour**: an outline is drawn outside the border and takes no room.

## Spacing and size

- **Padding** and **Margin**, with a value for each side in em. The link between the four sides moves them together; unlink
  it to set one side only, which keeps a row of icons aligned when only the top or the bottom needs air.
- **Scale**: from 25 % to 400 %. A large icon pushes its neighbours aside instead of covering them.

## Rotation and flips

**Rotation**, **Skew horizontally** and **Skew vertically**, and the buttons **Flip horizontally** and **Flip vertically**.

## Effects

- **Opacity**.
- **Shadow** of the box: soft, medium, strong, glow, inner, lifted or hard, with its **Shadow colour**.
- **Icon shadow**: a shadow that follows the shape of the glyph and not its box.
- **Blend with the background** (multiply, screen, overlay, darken, lighten or difference).
- **When the pointer is over it**: grow, shrink, lift, tilt or fade, as a short transition and nothing that runs by itself.

## Filters

Brightness, contrast, saturation, grayscale, hue, sepia, invert and blur.

Effects and filters make the browser paint an icon in an extra step, so each design has a cost and the cost of a whole site is
limited (see [Administration](Administration.md)). Everything else, such as size, shape, spacing and border, costs nothing.

## Shared glyphs

Moodle sometimes draws two icons with the same glyph, for example `a/setting` and `t/edit`. They cannot be styled apart, so
the panel says **This glyph is shared by 2 icons including this one: changing it changes all of them.** Close the message
with its cross when you have read it.
