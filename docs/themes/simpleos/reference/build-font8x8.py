"""Build a pixel TTF from SimpleOS's own FONT8X8 table.

The table is 97 glyphs of 8 rows, one byte per row, most significant bit leftmost. Glyphs 0-94
are printable ASCII from space; glyph 96 is a right arrow, which the UI uses in its shader
legends. Glyph 95 (0x7F) is mapped nowhere, as DEL has no character to type.

One pixel is 100 units on an 800-unit em, so at font-size 8px a glyph fills exactly its 8x8
cell, and at any integer multiple of 8 every pixel edge lands on a device pixel.
"""
import sys
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

RAW, OUT = sys.argv[1], sys.argv[2]
data = open(RAW, 'rb').read()
assert len(data) == 97 * 8, len(data)

UPM, PX = 800, 100

def glyph_for(rows):
    pen = TTGlyphPen(None)
    for y, r in enumerate(rows):
        for x in range(8):
            if (r >> (7 - x)) & 1:
                # Rows 0-6 sit above the baseline and row 7 below it, which is where the table
                # puts the descenders of g, j, p, q and y.
                x0, x1 = x * PX, (x + 1) * PX
                y1 = (7 - y) * PX
                y0 = y1 - PX
                pen.moveTo((x0, y0))
                pen.lineTo((x0, y1))
                pen.lineTo((x1, y1))
                pen.lineTo((x1, y0))
                pen.closePath()
    return pen.glyph()

order = ['.notdef']
cmap, glyphs, metrics = {}, {}, {}
glyphs['.notdef'] = glyph_for([0x7E, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7E, 0x00])
metrics['.notdef'] = (UPM, 0)

def add(index, codepoint):
    name = f'uni{codepoint:04X}'
    order.append(name)
    cmap[codepoint] = name
    glyphs[name] = glyph_for(data[index * 8:(index + 1) * 8])
    metrics[name] = (UPM, 0)

for i in range(95):
    add(i, 0x20 + i)
add(96, 0x2192)

# The table has a right arrow and no left one, yet the legends read "←→". The left arrow is the
# right one mirrored - an inference, recorded as such in the porting notes.
rows = data[96 * 8:97 * 8]
mirrored = bytes(int(f'{r:08b}'[::-1], 2) for r in rows)
order.append('uni2190')
cmap[0x2190] = 'uni2190'
glyphs['uni2190'] = glyph_for(mirrored)
metrics['uni2190'] = (UPM, 0)

fb = FontBuilder(UPM, isTTF=True)
fb.setupGlyphOrder(order)
fb.setupCharacterMap(cmap)
fb.setupGlyf(glyphs)
fb.setupHorizontalMetrics(metrics)
fb.setupHorizontalHeader(ascent=700, descent=-100)
fb.setupNameTable({'familyName': 'SimpleOS 8x8', 'styleName': 'Regular'})
fb.setupOS2(sTypoAscender=700, sTypoDescender=-100, sTypoLineGap=0, usWinAscent=700, usWinDescent=100)
fb.setupPost()
fb.save(OUT)
print('wrote', OUT, len(order), 'glyphs')
