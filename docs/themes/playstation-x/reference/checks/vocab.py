#!/usr/bin/env python3
"""Extract the storyboard attribute vocabulary and per-file animation counts."""
import re, pathlib, collections

ROOT = pathlib.Path("/Users/josediazgonzalez/Dropbox/go/src/github.com/pajarorrojo/es-theme-PlayStation-X")
an_re = re.compile(r"<animation\b([^>]*?)/>", re.S)
sb_re = re.compile(r"<storyboard\b([^>]*)>", re.S)
at_re = re.compile(r'(\w+)\s*=\s*"([^"]*)"')

counts = collections.defaultdict(collections.Counter)
per_file = collections.Counter()
events = collections.Counter()

for p in sorted(ROOT.rglob("*.xml")):
    text = p.read_text(encoding="utf-8", errors="replace")
    n = 0
    for a in an_re.finditer(text):
        n += 1
        for k, v in at_re.findall(a.group(1)):
            counts[k][v] += 1
    if n:
        per_file[str(p.relative_to(ROOT))] = n
    for s in sb_re.finditer(text):
        d = dict(at_re.findall(s.group(1)))
        events[d.get("event", "(none)")] += 1

for key in ("property", "mode", "repeat", "autoreverse", "autoReverse", "enabled"):
    if key in counts:
        print(f"\n{key}:")
        for v, c in counts[key].most_common():
            print(f"   {v:<28} {c}")

print("\nstoryboard event=:")
for v, c in events.most_common():
    print(f"   {v:<20} {c}")

print("\nanimations per file:")
for f, c in per_file.most_common():
    print(f"   {c:>4}  {f}")

print("\nbegin values:", sorted({int(v) for v in counts['begin']}))
print("duration values:", sorted({int(v) for v in counts['duration']}))
