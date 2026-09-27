# TortOS

Mockups of [TortOS](https://github.com/ericreinsmidt/TortOS), a custom firmware for the TrimUI
Brick: a launcher that is a shelf. A coverflow of consoles, then of one console's games, that can
be stood on end or folded into a cube, with every other screen - settings, game details,
achievements, Muse the music player - one panel drawn over it.

- Source: `ericreinsmidt/TortOS` at `v1.0-3-g9b9c342`, C on SDL2
- Detailed spec extracted from it: [`reference/source-notes.md`](tortos/reference/source-notes.md)
- What changed in the React port: [`porting/tortos.md`](../porting/tortos.md)

Implemented at `app/src/themes/tortos/`. Mode: **reproduce** throughout - the source draws every
screen, and ten of them are in the reference frames under `tortos/reference/`.

## Screens

The primary deliverable is the interactive route, which opens on the systems row and is driven from
there. Thirty stills are provided for handoff.

| Screen | Still | Reference frame |
| --- | --- | --- |
| Systems row, Fancy Pants / Plain Jane / Vertical | `systems`, `systems-plain`, `systems-vertical` | `readme-systems.png` |
| Games shelf, horizontal / Vertical / Favorites | `games`, `games-vertical`, `favorites` | `readme-shelf.png`, `readme-vertical.png` |
| Cubic | `cubic` | `readme-cubic.png` |
| No games found | `no-games` | |
| TortOS menu | `tortos-menu` | `readme-menu.png` |
| System menu | `system-menu` | |
| Wi-Fi, Bluetooth, Play Time, Controls, About TortOS | `wifi`, `bluetooth`, `play-time`, `controls`, `about` | |
| Over The Hare | `hare` | `readme-hare.png` (an older build - see the porting notes) |
| Box Art | `box-art` | |
| Keyboard | `keyboard` | |
| Confirm, wait panel | `confirm`, `notice` | |
| Game details, synopsis | `game-info`, `synopsis` | `readme-info.png` |
| Achievements, one achievement | `cheevos`, `cheevo` | `readme-cheevos.png` |
| In-game menu, Save to, Load from | `game-menu`, `save`, `load` | |
| Muse shelf, tracks, Now Playing | `muse`, `muse-tracks`, `now-playing` | `readme-muse.png`, `readme-nowplaying.png` |

## Geometry

1024x768, one panel, in literal pixels. Every number is the source's own constant or derived from
one the way the source derives it (`spec.ts`):

- **The shelf** is eight coverflow layouts - size, aspect, step, side scale, centre, tilt, reflection
  floor, side alpha, fit - drawn by the `Coverflow` widget.
- **Every list** is one panel, `menu_draw_ex`, cut from the menu font's line: 73px rows, 54px
  padding, a 12px border in the accent, a white plate at alpha 34 under the selected row. Its width
  is the widest row or one fixed across every state; its height is the rows', capped at the screen
  less 48, past which the rows window or the body scrolls itself.
- **Text** is placed where SDL_ttf draws it: Josefin's line is exactly its size, so a text box of
  that height at `top: y` is a surface drawn at y. Widths are measured from the font's own advances
  and kerning (`advances.ts`, `text.ts`), because the source makes layout decisions by width.

## Motion

| What | How |
| --- | --- |
| Shelf, Horizontal | 240ms ease-out cubic |
| Shelf, Vertical | 360ms smoothstep |
| Cubic | 450ms smoothstep, never more than a step behind; the cube backs away 18% mid-turn |
| Long moves | a departure of up to eight cards on ease-in cubic, then a cut |
| Vertical systems name | fades out over the first 30%, back over the last 30% |
| Background tint | exponential chase, `1 - e^(-9 dt)` |
| Menu plate | eased 110ms; snapped on a wrap or a jump |
| Long text | ping-pong at 70px/s after a 1.4s hold |

All of it is driven from the theme root (`index.tsx`, `motion.ts`) rather than descriptors, because
every shelf move restarts from where the cards are drawn. Every track's resting value is known, so
`animate={false}` draws each shelf at its cursor and the tint at its target.

## Colour

One palette (`palette.ts`): near-black (7,8,12), three text greys, TortOS cyan 0x3DD6FF, Muse green
0x9CD345, a panel fill of (22,24,32,252). Each of the eleven systems has an accent from
`config/systems.cfg`, and that is what changes screen to screen - the bottom wash, the glow behind
the focused card, the rail, a system's menu, game details.

## Fonts

Josefin Sans Regular, TortOS's own `res/fonts/menu.ttf`, at 60, 49, 55 and 37 for title, menu,
label and meta text, 71 on a generated card and 560 for its watermark.

## Input map

| Button | Shelf | Menus | Muse |
| --- | --- | --- | --- |
| D-pad | move; across the row, jump a letter | move, skipping dead rows; Left/Right cycle a value | move; Left/Right seek |
| A | enter / play | act | open / play / pause |
| B | back (Cubic: the system's menu) | back one screen | back |
| X | game details | forget (Wi-Fi, Bluetooth) | |
| Y | favourite | rescan / search / by system | play mode |
| L1 / R1 | a screenful | page achievements | track |
| START | | done (keyboard) | |
| SELECT | Muse | Muse | close Muse |
| MENU | TortOS menu (games: the system's) | out of every menu | Muse's menu |

## Assets

- `assets/fonts/JosefinSans-Regular.ttf` and its OFL licence, from `res/fonts/`.
- `assets/cards/classic/*.png`, the Plain Jane cards, and `assets/cards/fancy/*.png`, Evan Amos's
  public-domain console photographs, from `res/cards/`.
- No box art or album covers: every game and album is TortOS's own generated card.

## Files

| File | Job |
| --- | --- |
| `index.tsx` | the root: machine state, shelf tweens, tint, the frame loop, the top of the stack |
| `machine.ts` | the reducer, the back stack, every panel's rows |
| `motion.ts` | the shelf tween, the label crossfade, the tint chase |
| `spec.ts`, `palette.ts` | geometry and colour |
| `text.ts`, `advances.ts` | measuring, fitting and wrapping text; the marquee |
| `library.ts`, `cards.ts` | sample data; card art and its measurements |
| `views/` | `Shelf`, `Keyboard`, `InGame`, `NowPlaying`, and `parts` - the panel and the primitives |
| `manifest.ts`, `routes.tsx`, `Interactive.tsx` | the stills and the live build |

## How it is checked

`tortos.test.tsx` drives the reducer through every button a screen names and renders every still.
The e2e suite captures each still, web and fallback, checks the compositing guard, and compares the
live build settled with the `systems` still. Each still was put beside its reference frame by eye;
[`porting/tortos.md`](../porting/tortos.md) records what that found.
