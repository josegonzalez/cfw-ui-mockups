# NeoStation

Mockups of [NeoStation](https://github.com/misobadev/neostation-frontend), an emulation frontend
for Android, Linux, Windows and macOS written in Flutter. A header of tabs - the library, Search,
NeoSync cloud saves, RetroAchievements, the ScreenScraper scraper, RomM and Settings - over a
systems grid or carousel, and a games list whose details card carries art, game info and
achievements.

- Source: `misobadev/neostation-frontend` at `d9bece5`, Dart on Flutter
- Detailed spec extracted from it: [`reference/source-notes.md`](neostation/reference/source-notes.md)
- Where the reference material came from: [`reference/README.md`](neostation/reference/README.md)
- What changed in the React port: [`porting/neostation.md`](../porting/neostation.md)

Implemented at `app/src/themes/neostation/`. Mode: **reproduce** throughout. Every screen is drawn
from the current source; the ten frames from the project's website (`reference/site-01..10.webp`)
come from an older build and are a guide to look and colour.

## Devices

Two, one per display the source is laid out for:

| Device | Screen | Pixel ratio | Logical canvas | Platform branch |
| --- | --- | --- | --- | --- |
| `odin2-mini` (AYN Odin 2 Mini) | 1920x1080 | 3 | 640x360 | Android |
| `rg40xx` | 640x480 | 1 | 640x480 | Linux |

The website frames are 1920x1080 at three device pixels per unit, which is what the Odin reproduces.
The platform decides what the source draws: the Android card and apps grid, the wizard's
Permissions step and Android-only General rows on the Odin; Fullscreen and BarTOP Shutdown on the
rg40xx.

## Screens

The primary deliverable is the interactive route, which opens on the Systems grid in the Dark theme
and is driven from there. 53 stills are provided on the Odin and 51 on the rg40xx, which has no
Android apps grid and no Permissions step.

| Screen | Still | Reference frame |
| --- | --- | --- |
| Systems grid, by name and by year | `systems`, `systems-year` | `site-03.webp` |
| Systems carousel | `systems-carousel` | `site-02.webp` |
| View mode, Options menu, System Settings, its Emulators tab | `view-dropdown`, `context-menu`, `system-settings`, `system-emulators` | |
| Notifications | `notifications` | |
| Games list, in four themes | `games`, `games-valentine`, `games-abyss`, `games-retro` | `site-01`, `site-05`, `site-08`, `site-10` |
| Game info and Achievements tabs | `game-info`, `game-achievements` | `site-06.webp`, `site-04.webp` |
| Games grid and carousel | `games-grid`, `games-carousel` | |
| Game view dropdown, game menu, Game Settings and its tabs | `game-dropdown`, `game-menu`, `game-settings`, `game-scraping`, `game-manage` | |
| Launching, random game | `launch`, `random` | |
| Android apps (Odin only) | `android-apps` | |
| Search, its filters, a result's actions | `search`, `search-filters`, `search-results` | |
| Achievements, signed in and out | `achievements`, `achievements-login` | |
| NeoSync, its saves, plans and sign-in | `neosync`, `neosync-saves`, `neosync-plans`, `neosync-login` | `site-07.webp` (an older dashboard) |
| Scraper, running, Region, Systems, sign-in | `scraper`, `scraper-running`, `scraper-region`, `scraper-systems`, `scraper-login` | `site-09.webp` |
| RomM | `romm` | |
| Settings, General, Directories, Themes, About, Exit | `settings`, `settings-general`, `settings-directories`, `settings-themes`, `settings-about`, `settings-exit` | |
| Setup wizard, each step | `wizard`, `wizard-permissions` (Odin only), `wizard-rom`, `wizard-scan`, `wizard-esde`, `wizard-art` | |
| Scan splash | `splash` | |

## Geometry

Everything is in the units of `ScreenUtilInit(designSize: 640x480)`, resolved per device by
`layout.ts`:

- `.r` and `.sp` are `min(W/640, max(H,700)/480)` logical px, which is 1 on both devices, so one
  unit is 3 device px on the Odin and 1 on the rg40xx. `.w` is `W/640` and `.h` is `max(H,700)/480`,
  because the app runs with `splitScreenMode`.
- Both canvases are 640 logical px wide, the Small breakpoint, so the layouts differ only in height.
- The website frames were taken at Android's Small font size: every label measures 0.85 of its
  box. The Odin's text sizes carry that scale (`u.t`); boxes and icons do not.
- Text is measured from Anta's own advances and kerning (`advances.ts`, `text.ts`), because the
  source decides layout by text width: how many header tabs fit, and every pill that hugs its label.

## Motion

Every transition takes the source's duration and curve. Flutter's curves are in the easing registry
(`docs/animation.md`).

| What | How |
| --- | --- |
| Header tab highlight | 160ms `easeInOut` |
| Systems grid focus box | 256ms `fastOutSlowIn` |
| Systems grid and games list scroll | 360ms `easeOutQuart`, 180ms while a direction is held |
| Systems carousel pages | 260ms `easeOutQuart`, position and opacity together |
| Carousel chip bars | 200ms `easeOutCubic` scroll, 120ms `easeInOut` highlight |
| Details card tabs | 240ms `easeInOutCubic` slide, 160ms `easeInOut` tab indicator |
| Game info and achievements scroll | 140ms and 200ms `easeOut` |
| Games grid scroll, apps grid scroll | 500ms and 300ms `easeOutQuart` |
| Dropdown scroll | 150ms `easeInOut` |
| Settings and Scraper menus | the cursor row centred, 200ms `easeInOut` |
| Scan splash glint | follows the scan's progress, 250ms `easeOut` |
| Splash to library | the library fades in, 400ms linear |

All of it is transitions between resting states, so `animate={false}` draws each at its target:
a still is the live build with every transition removed.

## Colour

The 14 built-in themes (`palettes.ts`, generated from `lib/themes/*_theme.dart`): Dark, Light, OLED,
Valentine, Dracula, Nord, Coffee, Tokyo Night, Retro, Abyss, Cyberpunk, Aqua, Palenight and Horizon.
Each is a Material colour scheme plus a corner-radius tier. Settings > Themes switches them at
runtime; only colour and corner radius change, never layout. The default, System, resolves to Dark.

NeoGlass, the header's panel, is the scaffold colour at `(60 - transparency) / 60` with an optional
blur and a white rim in overlay blend. Blur is off by default; the rim is web-only, and without it
the glass is its flat tint.

## Fonts

- Anta, the only face the source uses, from `google/fonts` with its OFL licence. One upright
  weight: Flutter synthesises bold and italic from it, and so does the port.
- Material Symbols Rounded and Outlined, cut down to the glyphs the source names, filled as the
  app's icon theme draws them, plus an unfilled face for the five the source draws open.

## Input map

| Button | Systems | Games list | Tabs | Dialogs |
| --- | --- | --- | --- | --- |
| D-pad | move; the grid wraps, the carousel does not | up/down a game, wrapping; left/right a details tab | move | move |
| A | open the system, or launch the Recent game | launch, or enter the info or achievements panel | act | act |
| B | | back to the systems | back out of a page | close |
| X | view mode and sort | view mode | the tab's own action (log out, refresh) | |
| Y | options menu | game menu | the tab's own action | |
| START | System Settings | Game Settings | | |
| SELECT | notifications | | notifications (Delete in NeoSync's saves) | |
| L1 / R1 | previous / next visible tab, wrapping | | previous / next visible tab | a dialog's previous / next tab |

The wizard takes A for each step's action and B to skip its optional steps. Every pill a screen
draws for a button can also be clicked.

## Assets

- `assets/fonts/`: Anta and its OFL; the Material Symbols subsets.
- `assets/gamepad/`, `assets/icons/`, `assets/logos/`, `assets/brand/`, `assets/emulators/`: the
  app's own button glyphs, icons, system logos, logo and emulator icons, from `assets/images/` in the
  source, under its GPLv3 (`assets/LICENSE-neostation.md`, `assets/SOURCE.md`).
- No box art, fanart, screenshots or system art packs: `art.ts` generates deterministic stand-ins.

## Files

| File | Job |
| --- | --- |
| `index.tsx` | the root: state, the source's clocks, and what is drawn in which order |
| `machine.ts` | the reducer: tabs, the games route, overlays, the tab dispatch |
| `tabs.ts`, `settings.ts`, `wizard.ts` | each tab's, Settings' and first run's state and buttons |
| `layout.ts`, `grid.ts` | units per device; the systems and games grid geometry |
| `palette.ts`, `palettes.ts` | the 14 themes |
| `systems.ts`, `games.ts`, `library.ts`, `art.ts` | sample library and its generated art |
| `symbols.ts`, `advances.ts`, `text.ts`, `assets.ts` | icons, text measurement, asset lookup |
| `views/` | one file per screen family, `forms.tsx` for the sign-in cards, `parts.tsx` for the primitives |
| `manifest.ts`, `routes.tsx`, `Interactive.tsx` | the stills and the live build |

No widget from the shared kit is used. Every element is NeoStation's own - NeoGlass, the header's
tab pill, `GamepadControl`, the grid's focus box - and none says what an existing widget says.

## How it is checked

`neostation.test.tsx` checks the units against flutter_screenutil, the palettes, the system order,
the grid's moves, the reducer through every button a screen names, each tab and Settings page, the
wizard on both platforms, and renders every still. The e2e suite captures each still, web and
fallback, checks the compositing guard, and compares the live build settled with the `systems`
still. Each still was put beside its reference frame by eye;
[`porting/neostation.md`](../porting/neostation.md) records what that found.
