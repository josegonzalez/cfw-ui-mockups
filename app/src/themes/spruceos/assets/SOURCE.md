# Where these came from

Written by `docs/themes/spruceos/reference/extract-assets.py` from spruceOS at `2b7bc4a79`. Do not edit
them by hand; rerun the script.

| Path | Source |
| --- | --- |
| `<panel>/skin/*.png` | `Themes/SPRUCE/skin_<panel>/`, or `skin/` at 640x480; `%` in a name is written `pct` |
| `<panel>/icons/*.png`, `icons/sel/*.png` | `Themes/SPRUCE/icons_<panel>/`, or `icons/`, for the fixture's systems |
| `<panel>/icons/app/*.png` | The theme's app icons, or the app's own where the theme has none (Songo#5) |
| `theme.json` | Each panel's config and the pixel size of every image above |
| `font.json` | `nunwen.ttf`'s advance widths for printable ASCII |
| `fonts/nunwen-latin.woff2` | `Themes/SPRUCE/nunwen.ttf`, subset to Latin, punctuation and arrows |
| `art/`, `switcher/` | The fixture's generated box art and save-state screenshots (`make-fixture.py`) |
| `licenses/` | spruceOS's `LICENSE`, PyUI's `LICENSE.md` and the SPRUCE theme's README |
