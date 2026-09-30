# Porting notes: spruceOS

What the React set does differently from PyUI, and why. The port was built from spruceOS at
`2b7bc4a79`, and every still was compared with a frame PyUI rendered of the same screen on the same
device ([`themes/spruceos/reference/`](../themes/spruceos/reference/)).

## What the source is

PyUI, spruceOS's own launcher: Python on pysdl2, composing every screen from anchored images and
anchored text. The theme is SPRUCE, which ships a config, skin and icons per panel. The reference
frames come from PyUI itself, run headlessly with the edge of the device replaced; the reference
README lists what the harness changes.

## Deviations

- **Text is the browser's.** SDL_ttf rounds every advance to a whole pixel and the browser does not,
  so a long string ends a pixel or several from where PyUI's does, and glyph edges differ by a level
  or so. Right-aligned and centred text is placed by the browser's width. The parity spec measures
  text apart from everything else for this reason.
- **The clock is fixed** at 12:34 PM, the reference frames' time.
- **The top bar's readings are the harness's:** battery 75% and not charging, Wi-Fi on at GOOD, the
  address 192.168.1.42.
- **Leaving PyUI is a black screen for 1.5s.** A game, an app, Power Off, Reboot and Reload UI all
  hand the device away; the port shows it off, then comes back where it was - to the list a game was
  launched from, with the game first in Recents and the Game Switcher, or to a fresh start.
- **The box-art question never asks in the live build**, as the harness answers it; its still asks
  it. Every answer opens the list: the port has no art to convert.
- **Launch Random Game** launches the list's first game rather than a random one, so it is repeatable.
- **The carousel's frames are paced at 60 a second.** PyUI draws them as fast as it can.
- **The Game Switcher's held run** does not shorten each step by 40ms as PyUI's does.
- **SNES and PSX configurations** list the generic core options; PyUI has per-device lists for them.
- **The strip in the Game Switcher** decides where to start from the font's advance widths, not
  SDL_ttf's measure.

## Not reproduced

- **Settings pages behind Theme Settings and Additional Settings**, other than Animation Settings;
  Tasks' tasks; WiFi and Bluetooth's own menus. Their rows are listed and A does nothing.
- **Theme** cycles through the card's theme folders; the port has only SPRUCE, so it stays.
- **Download BoxArt, Select BoxArt Download, collections**, and the apps themselves.
- **The screensaver**, and sound.
- **The Mini Plus, Mini Flip, Brick Pro and Smart Pro S**, which have no body in the registry.

## Found by looking

- **A popup redraws the bars.** The popup's frozen background is the screen beneath, but PyUI clears
  over it, redrawing the top bar with its icons and the bottom bar. That is why the Game Switcher's
  popup has a clock and loses its strip, and a grid's index vanishes under a popup. Found by setting
  the port's first popups beside PyUI's.
- **The keyboard's unfocused keys are grey**, the grid colour, not the list's.
- **The Pocket 1 shows box art** where the other devices show save-state screenshots; recorded as a
  device property, cause not traced.
- **macOS drew the text heavier** than SDL_ttf's greyscale coverage; the text is antialiased greyscale.
- **The Smart Pro's Recents still** first reached Collections, because its popup has no Recents row;
  `stills.txt` gained per-device overrides.

## Verification

- `e2e/spruceos-reference.spec.ts`: 276 stills on twelve devices against PyUI's frames. Outside text,
  at most 0.30% of pixels differ; inside text boxes, at most 8.7%. A focus change on the main menu is
  1.17% outside text and fails.
- Every still on the CubeXX and Smart Pro, and a dozen on the A30, looked at beside PyUI's frame.
- `spruceos.test.tsx`: each device's apps, settings pages, About rows and popups against the views
  PyUI logged while rendering.
- The four new device shells put beside their photographs.
