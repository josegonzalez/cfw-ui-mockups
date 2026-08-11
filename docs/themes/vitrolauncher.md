# Vitro Launcher

Mockups of [Vitro Launcher](https://github.com/KevDoy/VitroLauncher-muOS), a Love2D
home-screen game launcher for [muOS](https://muos.dev) handhelds. Three screens on an
animated background, switched with L1/R1 via a bottom glass nav pill.

- Source repository: `github.com/KevDoy/VitroLauncher-muOS`
- Detailed spec extracted from source: [`reference/source-notes.md`](vitrolauncher/reference/source-notes.md)
- What changed in the React port: [`porting/vitrolauncher.md`](../porting/vitrolauncher.md)

Implemented at `app/src/themes/vitrolauncher/`. The archived original is under
[`legacy/vitrolauncher/`](../../legacy/vitrolauncher/).

This is the only *launcher* in the repo rather than a frontend theme, and the only set whose
settings are a real feature of the app instead of a mockup affordance - so unlike the other three,
its options live in the theme and are changed on its own Settings screen.

## Screens

The primary deliverable is an interactive single page reproducing all three screens and
their transitions in place (the background and pills persist; only the content swaps and
the nav-pill bubble slides). Static per-screen snapshots are provided for handoff.

| Screen | Interactive | Static (640) | Static (720) |
| --- | --- | --- | --- |
| All three | `rg35xx/launcher.html`, `rg34xx/launcher.html` | - | - |
| Last Played | (in launcher) | `rg35xx/last-played.html` | `rg34xx/last-played.html` |
| All Titles | (in launcher) | `rg35xx/all-titles.html` | `rg34xx/all-titles.html` |
| Settings | (in launcher) | `rg35xx/settings.html` | `rg34xx/settings.html` |

Targets 640x480 (RG35XX) and 720x480 (RG34XX). The layout scales by `s = height / 480`,
so at both resolutions `s = 1` and every dimension is literal; only horizontally-centered
elements shift with width.

## Theme / config format

Settings layer from `defaults.cfg` (app defaults) and `config/config.json` (user
selections, which win). Notable keys: `theme` (waves/particles/clouds/simple-dark/
simple-light), `wave_color` (a `#RRGGBB` hex or a dual-color scheme id `black-blue` /
`white-blue`), `transparency`, `cover_size`, `all_icon_size`, `nav_autohide`, `tooltips`,
`show_titles`, `recent_limit`. The mockup's Settings screen live-switches Theme and Color
across all five themes and every accent, exactly like the app.

## Palette

Foreground is white `#FFFFFF` on dark schemes, `#1F242E` on the light `white-blue` scheme;
muting is alpha on the same color. Selection border is white (accent on light/simple
schemes). Accent (Color) options:

| Name | Accent | Background |
| --- | --- | --- |
| Blue | `#2245cc` | `#2245cc` |
| Purple | `#7a3fd4` | `#7a3fd4` |
| Red | `#c0264b` | `#c0264b` |
| Orange | `#d97b1f` | `#d97b1f` |
| Green | `#1f9e46` | `#1f9e46` |
| Teal | `#12939c` | `#12939c` |
| Pink | `#d4569b` | `#d4569b` |
| Silver | `#7f8c9b` | `#7f8c9b` |
| Black | `#101216` | `#101216` |
| Black & Blue (default) | `#1a9fff` | `#0e141b` |
| White & Blue (light) | `#20a0d6` | `#e9edf2` |

Glass pills are a translucent frosted-white stadium with a backdrop blur; with
`transparency = false` they become a Simple-gray gradient (dark `#333337`→`#202022`,
light `#F4F4F6`→`#DDDEE2`) with an outline.

## Fonts

Roboto Condensed Bold and Regular (`assets/fonts/`, from the source repo). Sizes (px):
settings title 30, settings label 19 / value 15; carousel title 21 / playtime 15; grid
title 21 / info 15; status bar 16.

## Input map

| Input (key) | Action |
| --- | --- |
| L1 / R1 (Q / W) | Switch screen: Last Played / All Titles / Settings |
| D-pad (arrows) | Scroll titles; in the grid, up/down and page-turn past the last column |
| A (Z) | Launch the focused game (shows the loading fade) |
| X (A) | All Titles: skip to the next page |
| Y (S) | All Titles: bookmark / unbookmark |
| SELECT (Right Shift) | Jump to Settings and back |
| B (X) | Leave Settings |
| Menu (Esc, hold 2s) | Fade to black, power off; release early to cancel |
| L1 + X + START (Q + A + Enter, hold 2s) | Exit-to-muOS progress bar |

All four transitions - the startup fade, the launch fade and the two hold gestures - are wired on
the interactive route and poseable as numbers on a static one.

**The navigation pill disappears after ten seconds.** That is the launcher's own Auto-Hide
Navigation setting at its shipped default, not a fault; any input brings it back. It is on the
subset panel below the device so it can be turned off without hunting for it on the Settings
screen, and on its own Settings row as in the app.

The on-screen buttons in the device frame dispatch the same actions, and the three icons in the
navigation pill switch screens when clicked. That last one is mockup chrome rather than launcher
behaviour - a handheld has no pointer, so the app would never handle a tap - but the pill reads as
a tab bar on a desktop and this repo's convention is that on-screen controls are clickable.

## Assets

`assets/` holds the fonts, nav icons (`lastplayed`, `allTitles`, `settings`), button
glyphs, glass pill slices, the glass page arrow, and the bookmark badge, all copied from
the source repo. Frosted glass is recreated in CSS (`backdrop-filter`) for the blur; the
backgrounds are reproduced by `backgrounds.js` (the wave shader is ported verbatim to
WebGL, particles/clouds are canvas 2D, simple is a CSS gradient). Cover art uses stylized
pixel-crisp SVG placeholders since the source ships no artwork.

## Files

| File | Job |
| --- | --- |
| `index.tsx` | the theme root: owns the settings, the cursors and the input map |
| `Interactive.tsx` | the live build's seeds, including the render-mode toggle |
| `routes.tsx` / `manifest.ts` | the 20 routes, and the screen list as plain data |
| `library.ts` | the sample library, the settings schema and its defaults |
| `palette.ts` | the eleven colour schemes resolved to tokens |
| `layout.ts` | cover metrics, carousel scroll and grid dimensions |
| `art.ts` / `assets.ts` | generated covers, and bundler-resolved asset paths |
| `backgrounds/` | the four renderers, the shader and its 2D fallback |
| `views/` | the three screens and the persistent chrome |
| `vitro.css` | fonts, the five palettes, the screen layouts and the transitions |

The backgrounds sit outside the shared animation system on purpose: they are a continuous render
loop, not a timeline, so there is no keyframe to settle to. A static screen renders exactly one
frame at t=0.

## How it is checked

`vitrolauncher.test.ts` covers the parts that are pure functions - the grid's paging and wrapping,
the settings windowing and value cycling, the palette's two different notions of "light", playtime
formatting, and the background maths. Every screen was also rendered beside its legacy page on both
devices; that pass found one fault, recorded in the porting notes.
