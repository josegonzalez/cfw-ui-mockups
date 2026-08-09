# Vitro Launcher

Mockups of [Vitro Launcher](https://github.com/KevDoy/VitroLauncher-muOS), a Love2D
home-screen game launcher for [muOS](https://muos.dev) handhelds. Three screens on an
animated background, switched with L1/R1 via a bottom glass nav pill.

- Source repository: `github.com/KevDoy/VitroLauncher-muOS`
- Detailed spec extracted from source: [`reference/source-notes.md`](reference/source-notes.md)

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

The on-screen buttons in the device frame dispatch the same actions.

## Assets

`assets/` holds the fonts, nav icons (`lastplayed`, `allTitles`, `settings`), button
glyphs, glass pill slices, the glass page arrow, and the bookmark badge, all copied from
the source repo. Frosted glass is recreated in CSS (`backdrop-filter`) for the blur; the
backgrounds are reproduced by `backgrounds.js` (the wave shader is ported verbatim to
WebGL, particles/clouds are canvas 2D, simple is a CSS gradient). Cover art uses stylized
pixel-crisp SVG placeholders since the source ships no artwork.

## Files

- `vitro.css` - fonts, five theme palettes, glass, the three screen layouts, transitions
- `backgrounds.js` - the four animated backgrounds
- `screens.js` - sample library data, the settings schema, and the DOM builders
- `vitro.js` - the controller (input, screen switching, live theming, all transitions)
