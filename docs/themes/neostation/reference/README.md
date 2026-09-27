# NeoStation reference material

Where each file here came from. Everything was fetched in a container, never on the host.

| File | Source |
| --- | --- |
| `source-notes.md` | Read from [misobadev/neostation-frontend](https://github.com/misobadev/neostation-frontend) at `d9bece5`, every value cited into that commit |
| `strings.txt` | The English map `lib/l10n/app_locale_en.dart`, keys from `lib/l10n/app_locale.dart`, same commit |
| `flutter_screenutil-5.9.3-screen_util.dart.txt` | `lib/src/screen_util.dart` from flutter_screenutil 5.9.3, the version `pubspec.lock` pins; the scale rule in `source-notes.md` is derived from it |
| `site-01.webp` to `site-10.webp` | `public/screenshots/neostation-01..10.webp` from [misobadev/neostation-web](https://github.com/misobadev/neostation-web) at `677ec3f`. 1920x1080, taken on an older build than `d9bece5`: a guide to look and colour, not a pixel reference |
| `odin2-mini.webp` | Product photograph of the AYN Odin 2 Mini Pro, from the Google Shopping image the user supplied: `https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcSPq2C3JbdB9ZRRXzddnFLdSxXJjOY3_dRgmX60IJyEXMjDoAhhI9tD4WTs9Zo7v3w63fl8vrJs63YI44oTu4HseHKyalur569wah0oZT2mQhT95-hKWTj1kQ`. The reference for the `odin2-mini` device frame |

## Generators

Each writes a file under `app/src/themes/neostation/` from the upstream checkout, so the port's data
is regenerated rather than retyped. Their headers give the exact command.

| Script | Writes |
| --- | --- |
| `extract-palettes.py` | `palettes.ts`: the 14 built-in themes' colour schemes and radius tiers |
| `extract-systems.py` | `systems.ts`: system ids, colours, release, manufacturer, type, logo, RetroAchievements flag and emulators per platform |
| `subset-symbols.py` | the Material Symbols subsets under `assets/fonts/`, and `symbols.ts` |
| `extract-advances.mjs` | `advances.ts`: Anta's advance widths and pair kerning, for measuring text the way the source lays it out |
