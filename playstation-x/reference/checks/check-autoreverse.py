#!/usr/bin/env python3
"""How do finite autoreverse animations appear? Alone on their property, or merged with others?

Matters because a merged track cannot express autoreverse via WAAPI direction:'alternate' -
the reverse has to be expanded into the keyframes instead.
"""
import re, pathlib, collections

ROOT = pathlib.Path("/Users/josediazgonzalez/Dropbox/go/src/github.com/pajarorrojo/es-theme-PlayStation-X")
sb_re = re.compile(r"<storyboard\b([^>]*)>(.*?)</storyboard>", re.S)
an_re = re.compile(r"<animation\b([^>]*?)/>", re.S)
at_re = re.compile(r'(\w+)\s*=\s*"([^"]*)"')

alone = 0
merged = []

for p in sorted(ROOT.rglob("*.xml")):
    text = p.read_text(encoding="utf-8", errors="replace")
    for m in sb_re.finditer(text):
        line = text[: m.start()].count("\n") + 1
        by_prop = collections.defaultdict(list)
        for a in an_re.finditer(m.group(2)):
            d = dict(at_re.findall(a.group(1)))
            by_prop[d.get("property", "?")].append(d)
        for prop, anims in by_prop.items():
            fin = [a for a in anims
                   if "repeat" not in a
                   and ("autoreverse" in a or "autoReverse" in a)]
            if not fin:
                continue
            siblings = [a for a in anims if "repeat" not in a]
            if len(siblings) == 1:
                alone += 1
            else:
                merged.append(f"{p.relative_to(ROOT)}:{line} property={prop} finite_siblings={len(siblings)}")

print(f"finite autoreverse ALONE on its property: {alone}")
print(f"finite autoreverse MERGED with siblings:  {len(merged)}")
for x in merged:
    print("   ", x)
