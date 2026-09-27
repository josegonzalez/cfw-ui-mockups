# Wii Menu reference material

Where each file here came from. Everything was fetched and cut in a container, never on the host.
The recordings are listed in `source-notes.md`, with the id each note cites.

| File | Source |
| --- | --- |
| `source-notes.md` | Every measured value, texture and quoted string, each citing its recording, texture or article |
| `frames/*.png` | Frames of the 4:3 recordings (`tv`, `dolphin`), the Wii's 608x456 picture cut out and placed 1:1 at (16, 12) in 640x480, as the console's signal carries it |
| `frames/widescreen/*.png` | Frames of the 16:9 recordings (`showcase`), squeezed to 640x480; only what they show is used, not where |
| `extract-assets.py` | Copies the selected WM4K textures into `app/src/themes/wii-menu/assets/` at their native size |
| `build-fonts.sh` | Fetches M PLUS 1p and cuts it to Latin |

## Frames

| Frame | Recording, time |
| --- | --- |
| `menu.png`, `menu-hover.png`, `menu-page-2.png` | `tv` 1.0s, 8.0s, 17.5s |
| `zoom-in-a.png`, `zoom-in-b.png` | `tv` 22.9s, 23.1s |
| `preview-disc.png`, `preview-mii.png`, `preview-internet.png`, `preview-photo.png` | `tv` 23.5s, 26.5s, 31.5s, 34.0s |
| `preview-forecast.png`, `preview-news.png`, `preview-wii-shop.png` | `tv` 36.0s, 40.0s, 44.5s |
| `preview-check-mii-out.png`, `preview-nintendo.png` | `tv` 53.0s, 57.5s |
| `health-safety-early.png`, `health-safety.png` | `dolphin` 1s, 13s |
| `home-menu.png` | `dolphin` 117s, over a game |
| `widescreen/sd-card-menu.png`, `widescreen/sd-about.png` | `showcase` 32s, 34s |
| `widescreen/board-create.png`, `widescreen/board-address-book.png` | `showcase` 66s, 70s |

The recordings carry the console's own interface; the frames are kept only as the reference each
still is compared with.

## WM4K

[WM4K](https://github.com/Alan-bur/WM4K), at `b04bd27`, is Alan Burcet's hand-redrawn Dolphin
texture pack for System Menu 4.3U. Its README says it continues SuperDuperRob's 2019 "HD Wii Texture
Pack" with his permission, and its `DISCLAIMER.txt` that every texture was drawn by hand. The pack
has no licence file. The selection the port uses is committed with the user's approval, credited
here and in `app/src/themes/wii-menu/assets/SOURCE.md`.

## The fan recreations

Issue #8 lists three browser recreations of the Wii Menu. They were read for comparison only; the
port takes nothing from them.

| Project | Licence |
| --- | --- |
| [tobieche110/wii-portfolio](https://github.com/tobieche110/wii-portfolio) | MIT |
| [andrewplus/Wii.JS](https://github.com/andrewplus/Wii.JS) | GPLv3 |
| [cornetespoir/wii-menu-page](https://github.com/cornetespoir/wii-menu-page) | none stated |

## Scripts

Both scripts' headers give the exact container command. `extract-assets.py` finds every texture by
its hash and fails if the pack no longer has it, so a rerun is checked rather than trusted.
