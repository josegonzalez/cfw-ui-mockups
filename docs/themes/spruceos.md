# spruceOS

Mockups of [spruceOS](https://github.com/spruceUI/spruceOS)'s launcher, PyUI, in the default SPRUCE
theme. A main menu of Favorites, Games, Apps and Settings; a grid of systems; game lists in four
views; Apps; Settings; and the Game Switcher, on every device spruceOS runs on that has a body in the
registry.

- Source: `spruceUI/spruceOS` at `2b7bc4a79`, PyUI in `App/PyUI/main-ui/` (Python, pysdl2)
- Detailed spec extracted from it: [`reference/source-notes.md`](spruceos/reference/source-notes.md)
- Where the reference material came from: [`reference/README.md`](spruceos/reference/README.md)
- What changed in the React port: [`porting/spruceos.md`](../porting/spruceos.md)

Implemented at `app/src/themes/spruceos/`. Mode: **reproduce** throughout.

PyUI renders headlessly with SDL's offscreen driver, so every still here has a reference frame drawn
by PyUI itself, on the same device, posed with the same buttons. `e2e/spruceos-reference.spec.ts`
holds each still to its frame.

## Devices

| Device | PyUI device | Panel | Stills |
| --- | --- | --- | --- |
| `miyoo-a30` | `MIYOO_A30` | 640x480 | all 35 |
| `miyoo-flip` | `MIYOO_FLIP` | 640x480 | 7: Bluetooth, Reboot, its apps and settings |
| `miyoo-mini` | `MIYOO_MINI` | 640x480 | 13: no Wi-Fi or volume, popups as lists |
| `rg35xx`, `rg40xx` | `ANBERNIC_RGXX640480` | 640x480 | 4 and 1 |
| `rg28xx` | `ANBERNIC_RG28XX` | 640x480 | 6: no Wi-Fi |
| `rg34xx` | `ANBERNIC_RGXX720480` | 720x480 | all 35 |
| `rg-cubexx` | `ANBERNIC_RGCUBEXX` | 720x720 | all 35 |
| `miyoo-mini-v4` | `MIYOO_MINI_V4` | 752x560 | all 35 |
| `miniloong-pocket1` | `MINILOONG_POCKET1` | 960x720 | all 35 |
| `trimui-brick` | `TRIMUI_BRICK` | 1024x768 | all 35 |
| `trimui-smart-pro` | `TRIMUI_SMART_PRO` | 1280x720 | all 35 |

Every device has the interactive route, which opens on the main menu, and the `main-menu` still it
settles to. A device that shares a panel with the A30 carries the stills whose frames differ from the
A30's in more than the Wi-Fi icon; the reference README says how that was decided.

## Screens

| Screen | Stills |
| --- | --- |
| Main menu, each entry focused, and its popup | `main-menu`, `main-games`, `main-apps`, `main-settings`, `main-popup`, `main-popup-down` |
| Games and its popup | `games`, `games-row2`, `system-popup` |
| A game list, its four views, popup and configuration | `game-list`, `game-list-down`, `game-list-grid`, `game-list-icons`, `game-list-carousel`, `game-popup`, `game-config` |
| The one-time box-art question | `boxart-prompt` |
| Favorites, Recents, Rom Search | `favorites`, `recents`, `search-keyboard` |
| Apps and its popup | `apps`, `apps-down`, `apps-popup` |
| Settings, its pages, the power prompt | `settings`, `settings-bottom`, `settings-power`, `settings-theme-settings`, `settings-sound`, `settings-additional`, `settings-animation`, `settings-tasks`, `settings-about` |
| Game Switcher and its popup | `game-switcher`, `game-switcher-next`, `game-switcher-popup` |

## Geometry

Everything is laid out per panel the way PyUI lays it out: from the theme's own images - a list row
is as tall as `bg-list-s.png`, the top bar as tall as `bg-title.png` - and from the panel's
multiplier, `min(w / 640, h / 480)`. `layout.ts` resolves every view for one panel; the formulas and
the per-panel values are in the source notes.

## Motion

| What | How |
| --- | --- |
| Game Switcher | The old picture out and the new one in by a screen's width or height, linear, `300 / speed` ms |
| Carousel | Each slot to its neighbour's place and size, `10 // speed` frames, linear, at 60 frames a second |
| Marquee | After a second on a row, its text rotates a character per redraw, 12 a second |
| Volume | The level and its icon in the top bar for 3s after it changes |

Screen changes have no transition: PyUI's fade exists but is never called.

## Colour

One scheme, `#282828` ground and `#504945` selection bars baked into the skin, and the theme's text
colours: `#EBDBB2` for the top bar and index, `#D65D0E` for the index total, `#7C6F64` and `#FBF1C7`
for grids, `#FBF1C7` for lists.

## Fonts

`nunwen.ttf`, the theme's merge of Nunito and WenQuanYi Micro Hei, shipped as its Latin subset. Sizes
come from the theme's `list` and `grid` sizes per panel.

## Input map

| Button | Main menu | Lists and grids | Settings | Game Switcher |
| --- | --- | --- | --- | --- |
| D-pad | Move, wrapping | Move, wrapping | UP/DOWN move; LEFT/RIGHT change the row | Previous and next |
| A | Open | Open, or play | Open or act | Play |
| B | - | Back | Back | Close |
| X | - | A game's configuration | - | A game's configuration |
| L1/R1 | Page | Page | Change the row | Five at a time |
| L2/R2 | Page by letter | Page by letter | Move by letter | - |
| SELECT | - | Next game view | - | - |
| MENU tap | Popup | Popup | - | Popup |
| MENU held 300ms | Game Switcher, from any screen | | | |

## Assets

From the SPRUCE theme, copied per panel by `extract-assets.py`: the skin images the screens draw, the
fixture's system icons, every app's icon, and the font. The box art and save-state screenshots are the
fixture's, generated by `make-fixture.py`.

## Files

| File | Job |
| --- | --- |
| `index.tsx` | The root: state, and PyUI's clocks - the MENU hold, marquee, volume, and time away |
| `machine.ts` | Every menu and button as a pure reducer |
| `cursor.ts` | PyUI's list and grid cursors, kept in its own arithmetic |
| `data.ts` | Each device's hardware answers and the rows PyUI builds |
| `layout.ts`, `panel.ts`, `text.ts` | Geometry per panel, the theme's data, and text metrics |
| `library.ts`, `palette.ts`, `assets.ts` | The fixture, the colours, the images |
| `manifest.ts`, `routes.tsx`, `Interactive.tsx` | The stills per device, their routes, the live build |
| `views/` | PyUI's drawing calls, and each screen drawn with them |

## How it is checked

- `spruceos.test.tsx`: the stills against `stills.txt`, the library against `fixture.txt`, every
  device's apps and settings rows against the views PyUI logged, and the menu graph.
- `e2e/spruceos-reference.spec.ts`: every still against PyUI's own frame, with a tight budget outside
  text and a looser one inside it, both measured, and a check that it can fail.
- `e2e/settle.spec.ts`: each device's live build against its `main-menu` still.
