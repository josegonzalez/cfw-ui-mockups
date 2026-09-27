#!/usr/bin/env python3
"""Prepare DS Style's assets for the port, applying the source's own drawing rules once.

DS Style draws every image with a hard edge: `blit` keeps a pixel only when its alpha is over 127
(`source/dsstyle.c:105`), and `icon` also drops pure black, the colour key its imported 16x14
icons use (`dsstyle.c:107`). Doing that here - rather than asking the browser to - keeps the port's
images byte-for-byte what the launcher composites, and lets them be drawn with no filter.

It also builds the font. `assets/font.bin` is DS Style's 8x12 bitmap face: 12 bytes per glyph,
most significant bit leftmost (`dsstyle.c:120-122`). The file holds 128 glyphs, ASCII, although the
launcher reserves 256; `font-latin.bin` adds the accented letters listed in `latin_codepoints`
(`original_layout.h:82`). Each lit bit becomes a square contour, 100 units a pixel on a 1200-unit
em, and every glyph advances six pixels while drawing eight, as `text()` does - neighbours
overlap by two columns. At 36px one font pixel is exactly three device pixels.

Run in a container, from the repo root:

    docker run --rm -v <rg-sp-ds-style>:/src:ro -v "$PWD":/repo -w /repo python:3.12-slim sh -c \\
      'pip -q install pillow fonttools && python docs/themes/ds-style/reference/extract-assets.py'
"""
import json
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from PIL import Image

SRC = Path('/src/device/Roms/APPS/DSStyle/assets')
LAYOUT = Path('/src/source/original_layout.h')
OUT = Path('app/src/themes/ds-style/assets')

# The systems the sample library lists (`app/src/themes/ds-style/library.ts`); the launcher ships
# wide art for 118, and only these are drawn.
SYSTEMS = ['GBA', 'GB', 'GBC', 'FC', 'SFC', 'MD', 'PS']
THEMES = ['pale_blue', 'light_blue', 'blue', 'dark_blue', 'green', 'pale_green', 'bright_green', 'lime',
          'yellow', 'red', 'orange', 'brown', 'pink', 'pale_pink', 'magenta', 'purple']
# `platform_icon_names` (`source/ui.h:42`); the PNG is preferred and the BMP is the fallback (`ui.h:81-85`).
PLATFORM_ICONS = ['GB', 'GBC', 'FC', 'GG', 'SMS', 'PCE', 'WS', 'MSX', 'TXT', 'other', 'folder', 'gba', 'PS', 'NDS',
                  'PSP', 'SFC', 'N64', 'MD', 'DREAMCAST', 'SATURN', 'disc', 'cart', 'apps']


def rgba(path: Path) -> Image.Image:
    return Image.open(path).convert('RGBA')


def hard(im: Image.Image, key_black: bool = False) -> Image.Image:
    """`blit`: alpha over 127 is opaque, the rest is not drawn; `icon` also drops pure black."""
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            keep = a > 127 and not (key_black and r == 0 and g == 0 and b == 0)
            px[x, y] = (r, g, b, 255) if keep else (0, 0, 0, 0)
    return out


def save(im: Image.Image, rel: str) -> None:
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, optimize=True)


def dark_power(im: Image.Image) -> Image.Image:
    """Dark mode recolours the RESET and POWER greys pair by pair at draw time (`ui.h:31-39`)."""
    light = [0, 73, 121, 162, 195, 211, 251]
    dark = [123, 97, 134, 93, 60, 44, 4]
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a and r == g == b and r in light:
                v = dark[light.index(r)]
                px[x, y] = (v, v, v, a)
    return out


def main() -> None:
    # Backgrounds: Home, the three browser views, Settings; and their dark copies (`dsstyle.c:125`).
    for name in ['START', 'SD_LIST', 'SD_HORIZONTAL', 'SD_VERTICAL', 'SET']:
        save(hard(rgba(SRC / f'{name}.bmp')), f'bg/{name}.png')
        save(hard(rgba(SRC / 'dark' / f'{name}.bmp')), f'bg/dark/{name}.png')
    for name in ['HELP.bmp', 'MENU.bmp', 'SPLASH.png', 'NOTFOUND.png']:
        save(hard(rgba(SRC / name)), f'ui/{Path(name).stem}.png')
    for name in ['RESET', 'POWER']:
        im = hard(rgba(SRC / f'{name}.png'))
        save(im, f'ui/{name}.png')
        save(dark_power(im), f'ui/dark/{name}.png')
    # Each accent theme: its title bar, drawn with `blit`, and its folder and GBA icons, with `icon`.
    for theme in THEMES:
        save(hard(rgba(SRC / 'themes' / theme / f'{theme}.bmp')), f'themes/{theme}/bar.png')
        for icon in ['folder', 'gba']:
            save(hard(rgba(SRC / 'themes' / theme / f'icon_{icon}.bmp'), True), f'themes/{theme}/icon_{icon}.png')
    for name in PLATFORM_ICONS:
        png, bmp = SRC / 'icons' / f'icon_{name}.png', SRC / 'icons' / f'icon_{name}.bmp'
        src = png if png.exists() else bmp
        if src.exists():
            save(hard(rgba(src), True), f'icons/icon_{name}.png')
    for system in SYSTEMS:
        save(hard(rgba(SRC / 'systems' / 'wide' / f'{system}.png')), f'systems/{system}.png')
    build_font()
    build_strings()


def build_strings() -> None:
    """`tr()` looks a string up by its English (UK) text and returns the chosen language's
    (`source/locale.h:169`). The table is `source/locale.json`: one row per string, eight columns in
    `language_names` order (`locale.h:2`)."""
    rows = json.loads(Path('/src/source/locale.json').read_text(encoding='utf-8'))
    lines = ['// Generated by docs/themes/ds-style/reference/extract-assets.py from source/locale.json. Do not edit.',
             '/** One row per string, in `LANGUAGES` order; column 0 is the English (UK) key `tr()` looks up. */',
             'export const LOCALE_ROWS: readonly (readonly string[])[] = [']
    for row in rows:
        lines.append('  [' + ', '.join(json.dumps(v, ensure_ascii=False) for v in row) + '],')
    lines.append(']')
    Path('app/src/themes/ds-style/strings.ts').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    names = ['English (UK)', 'Français', 'Deutsch', 'Español', 'Português', 'Italiano', 'Nederlands', 'English (US)']
    out = ['# DS Style interface strings, from source/locale.json at 2847683.',
           '# One block per string: the English (UK) key, then each language (`source/locale.h:2`).', '']
    for row in rows:
        out.append(row[0])
        for name, value in zip(names[1:], row[1:]):
            out.append(f'  {name}: {value}')
        out.append('')
    Path('docs/themes/ds-style/reference/strings.txt').write_text('\n'.join(out), encoding='utf-8')


def build_font() -> None:
    upm, px, advance = 1200, 100, 600
    glyphs = {'.notdef': (b'\0' * 12)}
    cmap = {}
    ascii_table = (SRC / 'font.bin').read_bytes()
    for code in range(len(ascii_table) // 12):
        rows = ascii_table[code * 12:(code + 1) * 12]
        if code >= 32:
            glyphs[f'u{code:04X}'] = rows
            cmap[code] = f'u{code:04X}'
    text = LAYOUT.read_text()
    start = text.index('latin_codepoints[]={') + len('latin_codepoints[]={')
    latin = [int(v) for v in text[start:text.index('}', start)].split(',')]
    latin_table = (SRC / 'font-latin.bin').read_bytes()
    for i, code in enumerate(latin):
        glyphs[f'u{code:04X}'] = latin_table[i * 12:(i + 1) * 12]
        cmap[code] = f'u{code:04X}'
    order = list(glyphs)
    fb = FontBuilder(upm, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    outlines = {}
    for name, rows in glyphs.items():
        pen = TTGlyphPen(None)
        for row, bits in enumerate(rows):
            for col in range(8):
                if bits & (128 >> col):
                    # Row 0 is the top of the 12-row cell; the whole cell sits above the baseline.
                    x0, y1 = col * px, upm - row * px
                    pen.moveTo((x0, y1 - px))
                    pen.lineTo((x0, y1))
                    pen.lineTo((x0 + px, y1))
                    pen.lineTo((x0 + px, y1 - px))
                    pen.closePath()
        outlines[name] = pen.glyph()
    fb.setupGlyf(outlines)
    fb.setupHorizontalMetrics({name: (advance, 0) for name in order})
    fb.setupHorizontalHeader(ascent=upm, descent=0)
    fb.setupNameTable({'familyName': 'DS Style Bitmap', 'styleName': 'Regular'})
    fb.setupOS2(sTypoAscender=upm, sTypoDescender=0, sTypoLineGap=0, usWinAscent=upm, usWinDescent=0)
    fb.setupPost()
    path = OUT / 'fonts' / 'DSStyleBitmap.ttf'
    path.parent.mkdir(parents=True, exist_ok=True)
    fb.save(str(path))


if __name__ == '__main__':
    main()
