#!/usr/bin/env python3
"""Decode the textures the Dreamcast boot ROM carries for its menu.

The boot ROM (`dc_boot.bin`, 2 MB) stores its menu textures as ordinary PowerVR `PVRT` chunks,
packed back to back from 0x0728c0. A PVRT chunk is `PVRT`, a u32 length, a pixel-format byte, a
data-format byte, two pad bytes and u16 width/height, then texels. Three data formats occur:

- twiddled (0x01): texels in Morton order, y taking the low bit of each pair;
- VQ (0x03): a 256-entry codebook of 2x2 texel blocks (2 KB), then one twiddled byte per block;
- rectangle (0x09): plain row-major texels, for the non-square strips.

The scan is by header rather than by fixed offset, and a header is only trusted when its size is a
power of two and its length matches what its format implies - the ROM holds a handful of `PVRT`
byte runs inside code, and those decode to noise.

The menu's text is the system font every Dreamcast program reads through the BIOS (KallistiOS
`dc/biosfont.h` has the layout): 1bpp glyphs from 0x100020, 12x24 for ISO 8859-1 and 24x24 for
JIS X 0208 and the Dreamcast's own icons. Its strokes are one pixel wide, and the menu draws them
emboldened - each stroke doubled a pixel to the right - in white, over a dark halo a pixel wider
all round (`frames/zoom-text.png`). So the font is rebuilt as two TTFs, the bold face and its halo,
which the port stacks halo first.

Only a ROM whose hash is listed is accepted, so the names in NAMES keep meaning the same pictures.
The ROM is not in this repository: run this against your own dump.

Run in a container, from the repo root:

    docker run --rm -v <dir holding dc_boot.bin>:/bios:ro -v "$PWD":/repo -w /repo python:3.12-slim \\
      sh -c 'pip -q install pillow fonttools && python docs/themes/dreamcast-bios/reference/extract-assets.py'
"""
import hashlib
import struct
import sys
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from PIL import Image

ROM = Path(sys.argv[1] if len(sys.argv) > 1 else '/bios/dc_boot.bin')
OUT = Path('app/src/themes/dreamcast-bios/assets/bios')
FONTS = Path('app/src/themes/dreamcast-bios/assets/fonts')
STRINGS = Path('docs/themes/dreamcast-bios/reference/strings-en.txt')

# The system font (`dc/biosfont.h`): the narrow table, then the wide one, then the Dreamcast icons.
FONT = 0x100020
NARROW = 36
WIDE = 72
WIDE_START = FONT + 288 * NARROW
JIS_ROW16 = WIDE_START + 658 * WIDE
DC_ICONS = WIDE_START + 7056 * WIDE
# The Dreamcast icons the strings name (`\x16\x01<n>`), put in the Private Use Area at U+E000 + n.
ICONS = {11: 'A button', 12: 'B button', 15: 'X button', 16: 'Y button'}
# The only wide text the port draws: the Language dialog's own name for Japanese.
KANJI = '日本語'

# sha1 -> the version dreamcast.wiki/BIOS names it by. Offsets below were read from this dump.
KNOWN = {
    '8951d1bb219ab2ff8583033d2119c899cc81f18c': 'v1.01d (MPR-21931, MPR-21933)',
}

# The English string table: NUL-terminated strings, each padded with 0xff to a 4-byte boundary.
# It follows the Shift-JIS Japanese table and ends where the French one begins. The 0x32AD0 that
# github.com/madsonweb/SegaDreamcastBiosTextToPTBR gives is partway in, at the language names.
STRINGS_EN = (0x323B8, 0x33074)

# Offset -> name for the textures the port uses. Anything not named is still written, under its
# offset, so a texture nobody has identified yet is there to look at.
NAMES: dict[int, str] = {
    0x0728C0: 'repeat-one',
    0x0730E0: 'repeat-all',
    0x073900: 'back',
    0x077940: 'disc-blue',
    0x07C160: 'disc-rim',
    0x07C980: 'wordmark',
    0x07E9A0: 'next',
    0x07F1C0: 'play-pause',
    0x07F9E0: 'repeat',
    0x080200: 'prev',
    0x080A20: 'clouds',
    0x082A40: 'stop',
    0x083260: 'label-time',
    0x084280: 'label-track',
    0x0852A0: 'white',
    0x085340: 'disc-red',
    0x089B60: 'logo',
}

# The focused BACK's swirl, sampled from `frames/file-dest.png`.
BACK_RED = (223, 81, 66, 255)

PIXEL = {0:'argb1555', 1: 'rgb565', 2: 'argb4444'}
POW2 = {8, 16, 32, 64, 128, 256, 512, 1024}


def texel(fmt: int, v: int) -> tuple[int, int, int, int]:
    if fmt == 0:
        a = 255 if v & 0x8000 else 0
        r, g, b = (v >> 10) & 31, (v >> 5) & 31, v & 31
        return (r * 255 // 31, g * 255 // 31, b * 255 // 31, a)
    if fmt == 1:
        r, g, b = (v >> 11) & 31, (v >> 5) & 63, v & 31
        return (r * 255 // 31, g * 255 // 63, b * 255 // 31, 255)
    a, r, g, b = (v >> 12) & 15, (v >> 8) & 15, (v >> 4) & 15, v & 15
    return (r * 17, g * 17, b * 17, a * 17)


def untwiddle(x: int, y: int) -> int:
    i = 0
    for bit in range(11):
        i |= ((y >> bit) & 1) << (2 * bit)
        i |= ((x >> bit) & 1) << (2 * bit + 1)
    return i


def twiddled_index(x: int, y: int, w: int, h: int) -> int:
    # A non-square twiddled texture is a row of square twiddled tiles along its long side.
    side = min(w, h)
    tile = (x // side) if w > h else (y // side)
    return tile * side * side + untwiddle(x % side, y % side)


def decode(data: bytes, off: int) -> tuple[Image.Image, str] | None:
    length, pix, kind, w, h = struct.unpack_from('<IBBxxHH', data, off + 4)
    if pix not in PIXEL or w not in POW2 or h not in POW2:
        return None
    body = off + 16
    img = Image.new('RGBA', (w, h))
    px = img.load()
    if kind in (0x01, 0x09):
        if length != 8 + w * h * 2:
            return None
        vals = struct.unpack_from(f'<{w * h}H', data, body)
        for y in range(h):
            for x in range(w):
                i = twiddled_index(x, y, w, h) if kind == 0x01 else y * w + x
                px[x, y] = texel(pix, vals[i])
    elif kind == 0x03:
        if length != 8 + 2048 + (w // 2) * (h // 2):
            return None
        book = struct.unpack_from('<1024H', data, body)
        idx = data[body + 2048 : body + 2048 + (w // 2) * (h // 2)]
        for by in range(h // 2):
            for bx in range(w // 2):
                e = idx[twiddled_index(bx, by, w // 2, h // 2)] * 4
                # A codebook entry is itself twiddled: (0,0) (0,1) (1,0) (1,1).
                for n, (dx, dy) in enumerate(((0, 0), (0, 1), (1, 0), (1, 1))):
                    px[bx * 2 + dx, by * 2 + dy] = texel(pix, book[e + n])
    else:
        return None
    return img, f'{PIXEL[pix]}-{ {0x01: "twiddled", 0x03: "vq", 0x09: "rect"}[kind] }'


Bitmap = list[list[bool]]


def glyph(data: bytes, off: int, w: int) -> Bitmap:
    # Rows are packed back to back, most significant bit first: a narrow glyph's 12-pixel rows
    # share bytes two to three.
    size = w * 24 // 8
    bits = int.from_bytes(data[off : off + size], 'big')
    total = size * 8
    return [[bool(bits >> (total - 1 - (r * w + c)) & 1) for c in range(w)] for r in range(24)]


# A glyph as the set of its lit (column, row) pixels, and the width it advances by. A pixel may sit
# a column or row outside the cell: the bold and halo faces spill over it.
Pixels = tuple[frozenset[tuple[int, int]], int]


def pixels(g: Bitmap) -> Pixels:
    return frozenset((c, r) for r, row in enumerate(g) for c, on in enumerate(row) if on), len(g[0])


def bold(g: Pixels) -> Pixels:
    """Each stroke doubled a pixel to the right, as the menu draws its text."""
    lit, w = g
    return lit | {(c + 1, r) for c, r in lit}, w


def halo(g: Pixels) -> Pixels:
    """The bold face grown a pixel all round: the dark edge the menu draws under it."""
    lit, w = bold(g)
    return frozenset((c + dc, r + dr) for c, r in lit for dc in (-1, 0, 1) for dr in (-1, 0, 1)), w


def font_glyphs(data: bytes) -> dict[int, Bitmap]:
    out: dict[int, Bitmap] = {32: [[False] * 12 for _ in range(24)]}
    for code in range(33, 127):
        out[code] = glyph(data, FONT + (code - 32) * NARROW, 12)
    for code in range(160, 256):
        out[code] = glyph(data, FONT + (code - 64) * NARROW, 12)
    for n in ICONS:
        out[0xE000 + n] = glyph(data, DC_ICONS + n * WIDE, 24)
    for ch in KANJI:
        euc = ch.encode('euc_jp')
        row, cell = euc[0] - 0x80, euc[1] - 0x80
        base = JIS_ROW16 + ((row - 0x30) * 94 + cell - 0x21) * WIDE if row >= 0x30 else WIDE_START + ((row - 0x21) * 94 + cell - 0x21) * WIDE
        out[ord(ch)] = glyph(data, base, 24)
    return out


def build_font(glyphs: dict[int, Pixels], family: str, path: Path) -> None:
    # One font pixel is 100 units and the em is the 24-pixel cell, so at font-size 24px every edge
    # lands on a whole device pixel. The whole cell sits above the baseline.
    upm, px = 2400, 100
    names = {code: f'u{code:04X}' for code in glyphs}
    order = ['.notdef', *names.values()]
    fb = FontBuilder(upm, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({code: name for code, name in names.items()})
    outlines = {'.notdef': TTGlyphPen(None).glyph()}
    advances = {'.notdef': 12 * px}
    for code, (lit, width) in glyphs.items():
        pen = TTGlyphPen(None)
        # Sorted, so the same ROM always builds the same bytes.
        for c, r in sorted(lit):
            x0, y1 = c * px, upm - r * px
            pen.moveTo((x0, y1 - px))
            pen.lineTo((x0, y1))
            pen.lineTo((x0 + px, y1))
            pen.lineTo((x0 + px, y1 - px))
            pen.closePath()
        outlines[names[code]] = pen.glyph()
        advances[names[code]] = width * px
    fb.setupGlyf(outlines)
    glyf = fb.font['glyf']
    fb.setupHorizontalMetrics({name: (advances[name], getattr(glyf[name], 'xMin', 0)) for name in order})
    fb.setupHorizontalHeader(ascent=upm, descent=0)
    fb.setupNameTable({'familyName': family, 'styleName': 'Regular'})
    fb.setupOS2(sTypoAscender=upm, sTypoDescender=0, sTypoLineGap=0, usWinAscent=upm, usWinDescent=0)
    fb.setupPost()
    path.parent.mkdir(parents=True, exist_ok=True)
    fb.save(str(path))


def main() -> None:
    data = ROM.read_bytes()
    digest = hashlib.sha1(data).hexdigest()
    if digest not in KNOWN:
        sys.exit(f'{ROM}: unknown boot ROM {digest}; offsets were read from {list(KNOWN)}')
    OUT.mkdir(parents=True, exist_ok=True)
    found = 0
    off = data.find(b'PVRT')
    while off >= 0:
        got = decode(data, off)
        if got:
            img, kind = got
            name = NAMES.get(off, f'{off:06x}-{img.width}x{img.height}')
            img.save(OUT / f'{name}.png', optimize=True)
            print(f'{off:#08x} {img.width:>4}x{img.height:<4} {kind:<22} {name}')
            found += 1
        off = data.find(b'PVRT', off + 4)
    start, end = STRINGS_EN
    table = [s.lstrip(b'\xff') for s in data[start:end].split(b'\0')]
    STRINGS.write_text(
        ''.join(f'{s.decode("latin-1")!r}\n' for s in table if s.strip()), encoding='utf-8'
    )
    # BACK's swirl is the texture's only fully transparent area. Idle, the menu shows through it;
    # focused, the menu fills it red behind the texture (`frames/file-dest.png`). The fill is baked
    # here so the port draws one image either way.
    back = Image.open(OUT / 'back.png').convert('RGBA')
    red = Image.new('RGBA', back.size, (0, 0, 0, 0))
    src, dst = back.load(), red.load()
    for y in range(back.height):
        for x in range(back.width):
            if src[x, y][3] == 0:
                dst[x, y] = BACK_RED
    red.alpha_composite(back)
    red.save(OUT / 'back-focus.png', optimize=True)

    glyphs = font_glyphs(data)
    build_font({c: bold(pixels(g)) for c, g in glyphs.items()}, 'Dreamcast BIOS Fill', FONTS / 'DreamcastBiosFill.ttf')
    build_font({c: halo(pixels(g)) for c, g in glyphs.items()}, 'Dreamcast BIOS Edge', FONTS / 'DreamcastBiosEdge.ttf')
    print(f'{found} textures and {len(glyphs)} glyphs from boot ROM {KNOWN[digest]}')


if __name__ == '__main__':
    main()
