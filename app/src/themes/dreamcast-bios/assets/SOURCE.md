# Dreamcast BIOS assets

| Directory | Source |
| --- | --- |
| `bios/` | Decoded from the Dreamcast boot ROM v1.01d (`dc_boot.bin`, MPR-21931/MPR-21933, sha1 `8951d1bb219ab2ff8583033d2119c899cc81f18c`) by [`extract-assets.py`](../../../../../docs/themes/dreamcast-bios/reference/extract-assets.py): every PowerVR texture the ROM carries, named where the port uses it and by its ROM offset where it does not. `back-focus.png` is `back.png` with its swirl filled red, as the menu draws it focused, and `wordmark-dark.png` is `wordmark.png` darkened as power-on draws it |
| `fonts/` | The BIOS system font, decoded from the same ROM by the same script and rebuilt as two TTFs: `DreamcastBiosFill.ttf` (the glyphs emboldened) and `DreamcastBiosEdge.ttf` (their halo). Latin-1, the four button icons the strings use, and 日本語 |
| `sounds/` | Decoded and rendered from the same ROM by `bios_sound.py`: `boot.wav` is the ROM's own boot stream, decoded; the rest are its menu sequences, played through its own tone bank by a model of the sound chip. Named by where the recording plays each; `error` and `sequence-4` are never heard, and not used |
| `models/` | Decoded from the same ROM by `bios_models.py`: the main menu's four models, each with its resting transform and the 60-frame motion it plays while focused; File's controller, memory card and empty-socket silhouette; the Settings rows' four icons; the CD player's disc, with the texture each of its parts wears; and in `music/` the rest of the CD player - its lozenges, figures, BACK and buttons - node by node, with each button's focus motion |
| `drawn/` | Drawn for this port: the power-on swirl (`swirl`) |

The ROM is not in this repository and is not needed to build it. The script is kept so the decoded
files can be checked against a dump, and it refuses a ROM whose hash it does not know.

The decoded textures, font, sounds and models are Sega's. They are here with the repository owner's approval and
are not covered by this repository's own licence. Sega and Dreamcast are Sega's trademarks.

| File | ROM offset | Format |
| --- | --- | --- |
| `repeat-one.png` | `0x0728c0` | 32x32 ARGB4444, twiddled |
| `repeat-all.png` | `0x0730e0` | 32x32 ARGB1555, twiddled |
| `back.png` | `0x073900` | 64x64 ARGB4444, twiddled |
| `disc-surface.png` | `0x075920` | 64x64 RGB565, twiddled - the disc's data side, environment-mapped |
| `disc-blue.png` | `0x077940` | 256x256 ARGB4444, VQ - not used |
| `disc-rim.png` | `0x07c160` | 32x32 RGB565, twiddled - the disc's hub, tiled into a ring |
| `wordmark.png` | `0x07c980` | 128x32 ARGB1555, rectangle - used darkened, at power-on |
| `next.png` | `0x07e9a0` | 32x32 ARGB4444, twiddled |
| `play-pause.png` | `0x07f1c0` | 32x32 ARGB4444, twiddled |
| `repeat.png` | `0x07f9e0` | 32x32 ARGB4444, twiddled |
| `prev.png` | `0x080200` | 32x32 ARGB4444, twiddled |
| `clouds.png` | `0x080a20` | 64x64 ARGB4444, twiddled - not used; the sky is procedural |
| `stop.png` | `0x082a40` | 32x32 ARGB4444, twiddled |
| `label-time.png` | `0x083260` | 128x16 ARGB4444, rectangle |
| `label-track.png` | `0x084280` | 128x16 ARGB4444, rectangle |
| `white.png` | `0x0852a0` | 8x8 RGB565, twiddled - not used |
| `disc-red.png` | `0x085340` | 256x256 ARGB4444, VQ - the disc's label |
| `logo.png` | `0x089b60` | 128x32 ARGB4444, rectangle |
