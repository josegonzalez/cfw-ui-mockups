#!/usr/bin/env python3
"""Copy the SPRUCE theme's images and font into the port, for every resolution spruceOS runs at.

PyUI picks a theme's files by the panel: `config_<w>x<h>.json`, `skin_<w>x<h>/` and
`icons_<w>x<h>/` when the config exists, and `config.json`, `skin/` and `icons/` otherwise
(`themes/theme.py:39-58, 147-155`). This does the same for the seven panels, copying only the files
PyUI draws on the screens the port has, and writes `assets/theme.json`: each panel's config values
and the pixel size of every copied image, because PyUI lays out from image sizes (a list row is as
tall as `bg-list-s.png`) and the port has to as well.

The box art and the Game Switcher's screenshots are the fixture's, from `make-fixture.py`, so the
port draws the same pictures the reference frames were rendered with. The font is `nunwen.ttf`
subset to Latin as WOFF2; its CJK half is never drawn by the port's strings.

Run in a container, from the repo root, with the spruceOS checkout mounted at /src:

    docker run --rm -v <spruceOS>:/src:ro -v "$PWD":/repo -w /repo python:3.12-slim \
      sh -c 'pip -q install pillow==12.3.0 fonttools brotli && python docs/themes/spruceos/reference/extract-assets.py'
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

SRC = Path('/src')
THEME = SRC / 'Themes/SPRUCE'
HERE = Path(__file__).resolve().parent
OUT = Path('app/src/themes/spruceos/assets')

PANELS = ['640x480', '720x480', '720x720', '752x560', '960x720', '1024x768', '1280x720']

# The skin images the port's screens draw: grounds and bars, the selection bars, the main menu's
# icons, and the top bar's indicators (`theme.py:250-441`).
SKIN = [
    'background', 'bg-title', 'tips-bar-bg',
    'bg-list-s', 'bg-list-l', 'bg-list-s2', 'bg-pop-menu-4', 'bg-game-item-f', 'grid-game-selected', 'bg-btn-01-f',
    'bg-grid-s',
    'ic-favorite-mark',
    *[f'ic-{entry}-{state}' for entry in ('favorite', 'game', 'app', 'setting', 'recent', 'collection') for state in 'nf'],
    'power-full-icon', 'power-80%-icon', 'power-50%-icon', 'power-20%-icon', 'power-0%-icon',
    *[f'icon-wifi-signal-0{n}' for n in range(1, 5)], 'icon-wifi-locked',
    *[f'icon-volume-{n:02}' for n in range(21)],
]


def fixture_systems():
    """The system folders `fixture.txt` puts games in, in file order."""
    seen = []
    for line in (HERE / 'fixture.txt').read_text().splitlines():
        if line and not line.startswith('#'):
            system = line.split('|')[0]
            if system not in seen:
                seen.append(system)
    return seen


def app_icons():
    """Every app's icon file name (`App/*/config.json`), plus PyUI's two built-in apps'
    (`menus/app/app_menu.py:40-72`)."""
    names = {'scraper.png', 'rtc.png'}
    for config in sorted(SRC.glob('App/*/config.json')):
        icon = json.loads(config.read_text()).get('icon')
        if icon:
            names.add(Path(icon).name)
    return sorted(names)


def app_icon_source(icons: Path, name: str):
    """`AppUtils.get_icon`: the theme's copy first, then the app's own (`menus/app/app_utils.py`)."""
    themed = icons / 'app' / name
    if themed.is_file():
        return themed
    for config in SRC.glob('App/*/config.json'):
        if json.loads(config.read_text()).get('icon') == name and (config.parent / name).is_file():
            return config.parent / name
    raise SystemExit(f'no icon {name}')


def copy(src: Path, dest: Path, sizes: dict, key: str):
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dest)
    with Image.open(src) as im:
        sizes[key] = list(im.size)


def panel(res: str) -> dict:
    w, h = res.split('x')
    config = THEME / f'config_{res}.json'
    if config.is_file():
        skin, icons = THEME / f'skin_{res}', THEME / f'icons_{res}'
    else:
        config, skin, icons = THEME / 'config.json', THEME / 'skin', THEME / 'icons'
    sizes: dict = {}
    for name in SKIN:
        # Vite cannot import a file whose name has a `%` in it, so the battery icons become `pct`.
        safe = name.replace('%', 'pct')
        copy(skin / f'{name}.png', OUT / res / 'skin' / f'{safe}.png', sizes, f'skin/{safe}')
    for system in fixture_systems():
        for sub in ('', 'sel/'):
            copy(icons / f'{sub}{system.lower()}.png', OUT / res / 'icons' / f'{sub}{system.lower()}.png', sizes,
                 f'icons/{sub}{system.lower()}')
    for name in app_icons():
        copy(app_icon_source(icons, name), OUT / res / 'icons' / 'app' / name, sizes, f'icons/app/{Path(name).stem}')
    return {'w': int(w), 'h': int(h), 'config': json.loads(config.read_text()), 'sizes': sizes}


def fixture_art():
    """The fixture's box art and switcher screenshots, as the reference frames drew them."""
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([sys.executable, str(HERE / 'make-fixture.py'), tmp], check=True)
        for art in sorted(Path(tmp).glob('Roms/*/Imgs/*.png')):
            dest = OUT / 'art' / art.parent.parent.name / art.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(art, dest)
        for shot in sorted(Path(tmp).glob('Saves/states/.gameswitcher/*.png')):
            dest = OUT / 'switcher' / shot.name.replace('.state.auto', '')
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(shot, dest)


def font():
    dest = OUT / 'fonts'
    dest.mkdir(parents=True, exist_ok=True)
    # Basic Latin, Latin-1, general punctuation and the arrows the keyboard draws: every string the port has.
    subprocess.run(['pyftsubset', str(THEME / 'nunwen.ttf'), '--unicodes=U+0020-007E,U+00A0-00FF,U+2010-2027,U+2190-21FF',
                    '--layout-features=*', '--flavor=woff2', f'--output-file={dest / "nunwen-latin.woff2"}'],
                   check=True)


def advances():
    """The font's advance widths for printable ASCII, in font units: the marquee pads a row with as
    many spaces as its free width holds (`views/text_utils.py`), so the port needs string widths."""
    from fontTools.ttLib import TTFont
    font = TTFont(THEME / 'nunwen.ttf')
    cmap, hmtx = font.getBestCmap(), font['hmtx']
    return {'unitsPerEm': font['head'].unitsPerEm,
            'advances': {chr(c): hmtx[cmap[c]][0] for c in range(32, 127) if c in cmap}}


def main():
    if OUT.exists():
        for child in OUT.iterdir():
            if child.name not in ('SOURCE.md', 'licenses'):
                shutil.rmtree(child) if child.is_dir() else child.unlink()
    OUT.mkdir(parents=True, exist_ok=True)
    theme = {res: panel(res) for res in PANELS}
    (OUT / 'font.json').write_text(json.dumps(advances(), indent=1, sort_keys=True) + '\n')
    (OUT / 'theme.json').write_text(json.dumps(theme, indent=1, sort_keys=True) + '\n')
    fixture_art()
    font()
    licences = OUT / 'licenses'
    licences.mkdir(exist_ok=True)
    shutil.copyfile(SRC / 'LICENSE', licences / 'LICENSE-spruceOS.txt')
    shutil.copyfile(SRC / 'App/PyUI/LICENSE.md', licences / 'LICENSE-PyUI.md')
    shutil.copyfile(THEME / 'README.md', licences / 'README-SPRUCE-theme.md')
    print('copied', sum(1 for _ in OUT.rglob('*.png')), 'images')


if __name__ == '__main__':
    main()
