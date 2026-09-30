#!/usr/bin/env python3
"""Build the sample SD card library the reference frames and the port share.

For each line of `fixture.txt`, an empty ROM file under `<out>/Roms/<system>/`, and a box art
picture at `<out>/Roms/<system>/Imgs/<name>.png` - where PyUI looks for it
(`menus/games/utils/rom_select_options_builder.py:109`). The art is generated, seeded from the file
name, so every run draws the same pictures: a two-colour diagonal field and the game's initials.

The lists a line names go into `<out>/Saves/`: `pyui-favorites.json` and `pyui-recents.json`
(`devices/miyoo/miyoo_device.py:215-218`) and `gameswitcher.json` (`py-ui-config.json`
`gameSwitcherPath`), each a JSON array of `RomsListEntry` (`menus/games/utils/roms_list_manager.py:13`).
A Game Switcher game also gets the screenshot the switcher prefers, at
`Saves/states/.gameswitcher/<name>.state.auto.png` (`miyoo_trim_game_system_utils.py:238-278`): a
generated 640x480 "game" in the same colours as its box art.

Usage (in a container, from the repo root):

    python docs/themes/spruceos/reference/make-fixture.py <out>
"""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
SIZE = (250, 250)


def colours(name: str):
    h = hashlib.sha256(name.encode()).digest()
    a = tuple(40 + b % 160 for b in h[0:3])
    b = tuple(40 + c % 160 for c in h[3:6])
    return a, b


def art(name: str) -> Image.Image:
    a, b = colours(name)
    im = Image.new('RGB', SIZE, a)
    d = ImageDraw.Draw(im)
    d.polygon([(SIZE[0], 0), (SIZE[0], SIZE[1]), (0, SIZE[1])], fill=b)
    initials = ''.join(w[0] for w in name.replace('-', ' ').split() if w[0].isalnum())[:3].upper()
    font = ImageFont.load_default(size=96)
    box = d.textbbox((0, 0), initials, font=font)
    x = (SIZE[0] - (box[2] - box[0])) / 2 - box[0]
    y = (SIZE[1] - (box[3] - box[1])) / 2 - box[1]
    d.text((x, y), initials, font=font, fill=(245, 240, 225))
    return im


def screenshot(name: str) -> Image.Image:
    """A stand-in for a save state's screenshot: the box art's colours as a sky and a ground."""
    a, b = colours(name)
    im = Image.new('RGB', (640, 480), a)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 330, 640, 480], fill=b)
    for i in range(6):
        x = 40 + i * 100
        d.rectangle([x, 330 - 40 - (i % 3) * 30, x + 50, 330], fill=tuple(min(255, c + 50) for c in b))
    font = ImageFont.load_default(size=36)
    d.text((24, 20), name.upper(), font=font, fill=(245, 240, 225))
    return im


def main(out: Path) -> None:
    lists: dict[str, list[dict]] = {'fav': [], 'recent': [], 'gs': []}
    for line in (HERE / 'fixture.txt').read_text().splitlines():
        if not line or line.startswith('#'):
            continue
        system, file, tags = line.split('|')
        folder = out / 'Roms' / system
        (folder / 'Imgs').mkdir(parents=True, exist_ok=True)
        (folder / file).write_bytes(b'')
        stem = Path(file).stem
        art(stem).save(folder / 'Imgs' / f'{stem}.png', optimize=True)
        for tag in filter(None, tags.split(',')):
            lists[tag].append({'rom_file_path': f'/mnt/SDCARD/Roms/{system}/{file}', 'game_system_name': system,
                               'display_name': stem})
            if tag == 'gs':
                states = out / 'Saves' / 'states' / '.gameswitcher'
                states.mkdir(parents=True, exist_ok=True)
                screenshot(stem).save(states / f'{stem}.state.auto.png', optimize=True)
    saves = out / 'Saves'
    saves.mkdir(parents=True, exist_ok=True)
    for tag, file in [('fav', 'pyui-favorites.json'), ('recent', 'pyui-recents.json'), ('gs', 'gameswitcher.json')]:
        (saves / file).write_text(json.dumps(lists[tag], indent=2) + '\n')


if __name__ == '__main__':
    main(Path(sys.argv[1]))
