# Example OS

> **Status:** this page still describes the original vanilla-JS mockup, whose screens now live
> under [`legacy/example-cfw/`](../../legacy/example-cfw/). It is rewritten when this set is
> ported, at which point it also becomes the template for declaring a theme in the shared
> widget vocabulary rather than for authoring a pair of HTML files.

A fictional launcher used as the scaffold reference. Copy this file as the template
for a real CFW and fill each section from the firmware's source repository.

## Source

- Repository: n/a (template). For a real CFW, link the repo that compiles the UI.
- UI code: the file(s) that draw each screen.
- Theme / config format: where colors, fonts, and layout live in the source, and the
  key names to mirror.

## Palette

| Name       | Hex       | Use                          |
| ---------- | --------- | ---------------------------- |
| background | `#12141c` | screen background            |
| panel      | `#1b1e2b` | footer, detail pane          |
| accent     | `#4cc9f0` | selection, highlights        |
| text       | `#e7e9f0` | primary text                 |
| muted      | `#8b90a3` | secondary text               |
| selected   | `#0b0d13` | text on an accent-filled row |

## Fonts

- System sans placeholder. In a real port, embed the firmware font with `@font-face`
  from its asset directory. Sizes: title 18px, list rows 20px (menu) / 16px (list),
  footer 13px.

## Screens

| Screen         | Device   | File                          |
| -------------- | -------- | ----------------------------- |
| Main menu      | rg35xx   | `rg35xx/main-menu.html`       |
| Game list      | rg35xx   | `rg35xx/game-list.html`       |

## Input map

| Button | Action                                    |
| ------ | ----------------------------------------- |
| D-pad  | move selection                            |
| A      | open / launch focused item                |
| B      | back to the previous screen               |
| START  | menu (unmapped in the scaffold)           |
