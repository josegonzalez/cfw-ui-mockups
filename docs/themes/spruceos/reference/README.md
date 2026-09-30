# spruceOS reference material

Where each file here came from. Everything was built or rendered in a container, never on the host.

| File | Source |
| --- | --- |
| `source-notes.md` | Read from [spruceUI/spruceOS](https://github.com/spruceUI/spruceOS) at `2b7bc4a79`, with every value cited into `App/PyUI/main-ui` at that commit |
| `render/<device>/*.png` | Frames drawn by PyUI itself, one per line of `stills.txt`, on that device, against the card `make-fixture.py` builds from `fixture.txt` |
| `render/<device>/views.jsonl` | Every view PyUI built on the way to each still: its title, type and rows, as `harness.py` logged them |
| `stills.txt` | The stills, the buttons that pose each one, the harness's environment, and per-device overrides |
| `fixture.txt` | The sample library: system folder, file name, and the lists each game is on |
| `devices/*` | Product photographs of the four devices this set added to the registry, supplied with the task |

## Scripts

| Script | What it does |
| --- | --- |
| `render-reference.sh` | Installs PyUI's dependencies, builds the fixture card and renders `render/` with `harness.py` |
| `harness.py` | Runs PyUI unmodified for one device and one still: SDL's offscreen driver, scripted buttons, pinned hardware readings, and the last frame PyUI presents saved |
| `make-fixture.py` | Builds the card: empty ROMs, generated box art, the Favorites, Recents and Game Switcher lists, and save-state screenshots |
| `extract-assets.py` | Copies the SPRUCE theme's images for the seven panels into the port, with their sizes and config, the fixture's art, the font's advance widths, and `nunwen.ttf` subset to Latin |

Their headers give the exact commands.

## What the harness changes

PyUI runs as the device name selects it (`mainui.py:63-117`); only the edge of the device is replaced:

- **Display.** `SDL_VIDEODRIVER=offscreen` and the software renderer. The Flip asks for KMSDRM and is
  set back. Frames are read with `SDL_RenderReadPixels` at every `Display.present`.
- **Input.** `Controller.get_input` hands out the still's buttons, then saves the last frame and exits.
  The key watchers, which read `/dev/input`, do nothing.
- **Hardware.** Battery 75% and not charging, Wi-Fi on with a GOOD signal and the address
  192.168.1.42. The constructors' writes to the backlight, `/dev/disp` and GPIO are skipped.
- **Clock.** libfaketime from 12:34:00, running, since PyUI waits on elapsed time.
- **Prompts.** The one-time "optimize boxart?" question is answered in advance except for its own
  still (`BOXART_PROMPT=1`). `GS_TRIGGER=1` leaves the file the shell leaves when MENU is held in a
  game, so PyUI starts in the Game Switcher.
- **Theme.** SPRUCE is copied onto the card rather than linked, because SELECT's view toggle writes
  back into the theme's config.

What PyUI cannot reach in a container shows as it does there: Mac Address and FW Version read
"Unknown", and the RetroArch, PPSSPP and DSperate versions and the SD card's usage come from scripts
that cannot run, so they are empty.

## Which frames are kept

Every still was rendered on all fifteen PyUI device names and the frames of devices sharing a panel
compared. The differences are all data a device class answers for itself: the Wi-Fi icon, the
Bluetooth, Volume and WiFi rows, the apps the device lists, the power prompt's Reboot, the Minis
drawing popups as full lists, their animation speed of 2, and the shorter About page.

The committed set is every still on one device per panel (the A30, RG34XX, RG CubeXX, Mini v4,
Pocket 1, Brick and Smart Pro), and on the Flip, Mini, RG35XX and RG28XX the stills that differ from
the A30 in more than the top bar's Wi-Fi icon, plus the main menu. The RG40XX is the RG35XX's PyUI
device and is held to its frames. The Mini Plus, Mini Flip, Brick Pro and Smart Pro S have no body
in the registry; their frames differ from their siblings' by the Wi-Fi icon, and the Smart Pro S's
top bar by one level of grey, for a reason not traced.

On the Pocket 1, Recents and the Game Switcher show box art where every other device shows the
fixture's save-state screenshots. It uses the same lookup class as the others
(`MiyooTrimGameSystemUtils`); why it does not find them is not traced.

## Licences

spruceOS is CC BY-NC 4.0 (`LICENSE`). PyUI is under a modified BSD 3-clause licence for
non-commercial use (`App/PyUI/LICENSE.md`), which asks for attribution: PyUI, Copyright (c) 2025
Christopher Jacobs. The SPRUCE theme is by tenlevels; its font merges Nunito (OFL) with WenQuanYi
Micro Hei, and the port ships only the Latin subset. Copies are in
`app/src/themes/spruceos/assets/licenses/`.
