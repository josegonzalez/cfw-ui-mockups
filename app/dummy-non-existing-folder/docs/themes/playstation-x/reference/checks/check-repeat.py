#!/usr/bin/env python3
"""Verify the compiler assumption: no (element, property) has two per-animation repeat=.

Walks every <storyboard> in the theme, groups its <animation> children by property,
and reports any group with more than one infinite (repeat=) track.
"""
import re, pathlib, collections

ROOT = pathlib.Path("/Users/josediazgonzalez/Dropbox/go/src/github.com/pajarorrojo/es-theme-PlayStation-X")

sb_re = re.compile(r"<storyboard\b([^>]*)>(.*?)</storyboard>", re.S)
an_re = re.compile(r"<animation\b([^>]*?)/>", re.S)
at_re = re.compile(r'(\w+)\s*=\s*"([^"]*)"')

violations = []
group_repeat = []
total_sb = 0
total_an = 0

for p in sorted(ROOT.rglob("*.xml")):
    text = p.read_text(encoding="utf-8", errors="replace")
    for m in sb_re.finditer(text):
        total_sb += 1
        sb_attrs = dict(at_re.findall(m.group(1)))
        line = text[: m.start()].count("\n") + 1
        by_prop = collections.defaultdict(list)
        for a in an_re.finditer(m.group(2)):
            total_an += 1
            attrs = dict(at_re.findall(a.group(1)))
            by_prop[attrs.get("property", "?")].append(attrs)
        if "repeat" in sb_attrs:
            group_repeat.append(f"{p.relative_to(ROOT)}:{line}")
        for prop, anims in by_prop.items():
            inf = [a for a in anims if "repeat" in a]
            if len(inf) > 1:
                violations.append(f"{p.relative_to(ROOT)}:{line} property={prop} infinite={len(inf)}")

print(f"storyboards: {total_sb}  animations: {total_an}")
print(f"storyboard-level repeat=: {len(group_repeat)}")
for g in group_repeat:
    print("   ", g)
print(f"\nVIOLATIONS (two per-animation repeat= on same property): {len(violations)}")
for v in violations:
    print("   ", v)
