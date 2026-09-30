# Dreamcast BIOS source notes

Every value the port uses that was not decoded straight from the ROM, and where it came from. Times
are into the recording `c69qVhS_WOU` (see `README.md`); frames are in `frames/`.

## The boot ROM

- **Version.** `dc_boot.bin` sha1 `8951d1bb219ab2ff8583033d2119c899cc81f18c` is v1.01d,
  MPR-21931/MPR-21933, on [dreamcast.wiki/BIOS](https://dreamcast.wiki/BIOS). (The row after it on
  that page, "v1.01d (hack)", is a Chinese translation with a different hash.)
- **Textures.** 18 `PVRT` chunks from `0x0728c0` to `0x08bb68`; a header is trusted only when its
  size is a power of two and its length matches its format. Five more `PVRT` byte runs, at
  `0x024128` and from `0x0b8144`, fail that check - they are inside code.
- **VQ.** A 2 KB codebook of 256 2x2 blocks, each block's texels in twiddled order, then one twiddled
  index byte per block - so a 256x256 VQ texture is 18,440 bytes with its header, as both are.
- **Font.** From `0x100020`: index 0 is the space and `!` is index 1, so a narrow glyph is at
  `(code - 32) * 36` for 33-126 and `(code - 64) * 36` for 160-255. Wide glyphs start 288 narrow
  cells in; JIS rows 16 and up start 658 wide cells after that; the Dreamcast icons start 7056 wide
  cells in, the A button at icon 11 and X and Y at 15 and 16. All as KallistiOS's
  [`dc/biosfont.h`](https://github.com/KallistiOS/KallistiOS/blob/master/kernel/arch/dreamcast/include/dc/biosfont.h)
  lays them out; each was checked by decoding it - `A`, `R`, the A and X buttons, and 日 and 語.
- **The font as drawn.** The glyphs are one-pixel strokes. On screen each stroke is two pixels wide
  and white, with a dark halo a pixel wider all round (`frames/zoom-text.png`, "Language" and
  "English"), so the fill face is the glyph with each lit pixel doubled to the right and the halo
  face that grown by one pixel in every direction.
- **Strings.** The English table runs from `0x323b8` (after the Shift-JIS Japanese one) to
  `0x33074`, where the French one begins: NUL-terminated, padded to four bytes with `0xff`.
  [madsonweb/SegaDreamcastBiosTextToPTBR](https://github.com/madsonweb/SegaDreamcastBiosTextToPTBR)
  gives `0x32ad0` for English, which is partway in, at the language names. `\x16` and `\x17` switch
  to and from yellow (`frames/file-list.png`, "Ⓐ Button." in yellow), and `\x01 n` is Dreamcast icon
  `n`.
- **BACK focused.** The texture's swirl is its only fully transparent area; focused, the menu fills
  it red, sampled `#df5142` (`frames/cards-back.png`).

## Measurements

Colours are 5x5 averages at the named point of a 640x480 frame; the recording is a capture over
an analogue output, so each is the nearest flat colour, not a byte. Geometry is read off the same
frames and is good to a pixel or two.

- **Top bar** (`main.png`): 62 pixels, `#c2bec2`; logo at (30, 29) drawn 136x34; the clock ends at
  x 612.
- **Sky** (`main.png`, `music-empty.png`): `#bcdbe8` at the top, `#87a6d6` mid, `#5070c9` at the
  bottom; the disc of cloud centred about y 340, from x 60 to 600.
- **Text advance.** The first-boot box's "11/27/1998 00:00" spans 188 pixels (`boot-clock.png`);
  a save's date 187 (`file-list.png`); the top bar's clock 173 (`main.png`); Settings' "Language" 88
  (`settings.png`); its "Auto start 'OFF'" 162; the Language box's title 255 over 26 glyphs
  (`settings-language.png`). Hence 12, 11, about 10.25 and 10 pixels a glyph.
- **Main menu pills** (`main.png`): 114x42 at (205, 202), (427, 202), (205, 365), (427, 365); fills
  `#a98a7a`, `#4f9a88`, `#3f90c8`, `#ae70b8`, each with a lighter 4-pixel rim.
- **Settings** (`settings.png`): rows 52 high at y 54, 130, 209, 286; names right-aligned to 224;
  fields from x 258, 354 wide; the focused field tan. BACK at (94, 372).
- **Dialogs**: near-black at about 90%, a 4-pixel rim - magenta `#a8155e` in Settings
  (`settings-language.png`), orange for Play (`no-disc.png`), green for File (`file-menu.png`).
  Options sit on 46x36 blobs, `#2a6a2e`, the focused one blinking `#b3ab22`; each box's positions
  are in `layout.ts` with the frame they were read from.
- **The delete box opens on No** (`file-delete.png`), and after Yes "File was deleted." stands over
  the list with a blob until pressed (`file-deleted.png`).
- **Settings' memory-card clock**: after Select, "Set all memory cards to / Date/Time of main
  console." (`settings-vmu-done.png`).
- **The first-boot clock** reads 11/27/1998 00:00 until it is changed (`boot-clock.png`, 11.5s), with
  the arrows over the month.
- **The memory card**: 88 blocks used and 110 free (`file-list.png`), 83 and 115 after a 5-block save
  is deleted (135s) - 198 in all.
- **Motion**: see `motion.ts` and the theme page. Read at 20 frames a second from 36.0s: the menu
  fades out over 36.65-36.75s, the sky alone until 36.9s, the no-disc box up by 37.0s; its blob
  yellow and green 200 ms each from 37.05s.

## Screens and the manual

The US manual (manualslib 318214, pages 9-24) gives the buttons: the D-pad moves, A selects, B
cancels or goes back; File's X and Y pick several files of one game; Music's repeat cycles off, one
track, all tracks.
