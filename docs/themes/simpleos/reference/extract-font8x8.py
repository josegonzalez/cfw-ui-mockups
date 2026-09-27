"""Locate FONT8X8 through the ELF symbol table and print its bytes as glyph previews."""
import sys
from elftools.elf.elffile import ELFFile

path = sys.argv[1]
f = open(path, 'rb')
elf = ELFFile(f)
syms = []
for sec in elf.iter_sections():
    if sec.header.sh_type in ('SHT_SYMTAB', 'SHT_DYNSYM'):
        for s in sec.iter_symbols():
            if 'font' in s.name.lower() or 'FONT' in s.name:
                syms.append((s.name, s['st_value'], s['st_size'], s['st_info']['type']))
for s in syms:
    print(s)

target = [s for s in syms if s[0] == 'FONT8X8']
if not target:
    sys.exit('no FONT8X8 symbol')
name, addr, size, _ = target[0]
# Map the virtual address to a file offset through the section that holds it.
off = None
for sec in elf.iter_sections():
    a, sz = sec['sh_addr'], sec['sh_size']
    if a <= addr < a + sz and sec['sh_type'] != 'SHT_NOBITS':
        off = sec['sh_offset'] + (addr - a)
        print('section', sec.name, 'offset', hex(off))
        break
f.seek(off)
data = f.read(size)
open(sys.argv[2], 'wb').write(data)
print('size', size, 'glyphs if 8 bytes each:', size / 8)

def show(ch, lsb):
    rows = data[ord(ch) * 8:(ord(ch) + 1) * 8]
    print(repr(ch), 'lsb-left' if lsb else 'msb-left')
    for r in rows:
        print(''.join('#' if ((r >> b) & 1 if lsb else (r >> (7 - b)) & 1) else '.' for b in range(8)))

if size >= 128 * 8:
    for ch in 'A0a':
        show(ch, True)
        show(ch, False)
