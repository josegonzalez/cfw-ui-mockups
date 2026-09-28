#!/usr/bin/env python3
"""Prepare the Wii Menu port's images from the WM4K texture pack.

WM4K (github.com/Alan-bur/WM4K at b04bd27) is a hand-redrawn Dolphin custom-texture pack for
System Menu 4.3U. Dolphin names every texture it replaces `tex1_<W>x<H>_<hash>_<format>.png`, where
`<W>x<H>` is the size of the texture the System Menu itself loads; the pack stores each at 4x or 8x
that. Every image here is resampled back to its native size, because the port lays out 1:1 in the
Wii's own 608x456 frame and the console sampled exactly those texels.

Only a selection is taken - the pieces the port's screens draw - and each is found by its hash, so
a texture the pack renames is a failure here rather than a missing picture later.

The Settings pages are different in kind. The System Menu draws each Settings page to a 608x456
texture and slides that, so the pack carries one whole frame per page per state: every button
focused, every option selected. Those are copied as whole frames (lossless WebP, to keep the
repository small) and the port shows the frame for its state rather than redrawing the page.

The Health & Safety texture is deliberately not taken: WM4K's copy carries the pack author's own
credit line, so that screen is drawn instead.

Run in a container, from the repo root:

    docker run --rm -v <WM4K>:/wm4k:ro -v "$PWD":/repo -w /repo python:3.12-slim sh -c \\
      'pip -q install pillow && python docs/themes/wii-menu/reference/extract-assets.py'
"""
import re
from pathlib import Path

from PIL import Image

SRC = Path('/wm4k/0000000100000002/USA')
OUT = Path('app/src/themes/wii-menu/assets')

# dest (under OUT, without extension) -> (folder under SRC, hash prefix)
TEXTURES = {
    # The Wii Menu: seven-segment clock, bottom bar buttons, page arrows, the empty slot's static.
    'menu/digit-0': ('Wii Menu', 'd53f4c'),
    'menu/digit-1': ('Wii Menu', 'b8878c'),
    'menu/digit-2': ('Wii Menu', '79bde8'),
    'menu/digit-3': ('Wii Menu', '3b4cbc'),
    'menu/digit-4': ('Wii Menu', '64667c'),
    'menu/digit-5': ('Wii Menu', '2ea353'),
    'menu/digit-6': ('Wii Menu', '2e5294'),
    'menu/digit-7': ('Wii Menu', 'eb0ca4'),
    'menu/digit-8': ('Wii Menu', '5e347a'),
    'menu/digit-9': ('Wii Menu', '14de30'),
    'menu/colon': ('Wii Menu', '7b618e'),
    'menu/am': ('Wii Menu', '8eb1ab'),
    'menu/pm': ('Wii Menu', '279f65'),
    'menu/static-0': ('Wii Menu', '131e0a'),
    'menu/static-1': ('Wii Menu', '1cb501'),
    'menu/static-2': ('Wii Menu', '2fc749'),
    'menu/static-3': ('Wii Menu', '876aa5'),
    'menu/wii-button': ('Wii Menu', '328029'),
    'menu/sd': ('Wii Menu', '891a9f'),
    'menu/sd-lit': ('Wii Menu', '4c49e8'),
    'menu/mail': ('Wii Menu', '439cb2'),
    'menu/arrow-right': ('Wii Menu', '992b93'),
    'menu/arrow-left': ('Wii Menu', 'ab27dd'),
    'menu/wii-console': ('Wii Menu', '59fb9f'),
    # Channel art: the pieces each stock channel's icon and banner are built from.
    'channels/disc-band': ('Channels/Disc Channel', 'ee1367'),
    'channels/disc-gamecube': ('Channels/Disc Channel', '1d1a47'),
    'channels/disc-wii': ('Channels/Disc Channel', '3f349d'),
    'channels/disc-icon': ('Channels/Disc Channel', 'c96c21'),
    'channels/mii-logo': ('Channels/Mii Channel', '7f178e'),
    'channels/mii-face-1': ('Channels/Mii Channel', '055a5f'),
    'channels/mii-face-2': ('Channels/Mii Channel', '087f68'),
    'channels/mii-face-3': ('Channels/Mii Channel', '1ab798'),
    'channels/mii-face-4': ('Channels/Mii Channel', '39bcb9'),
    'channels/mii-face-5': ('Channels/Mii Channel', '4c9ee4'),
    'channels/mii-face-6': ('Channels/Mii Channel', '55064d'),
    'channels/mii-face-7': ('Channels/Mii Channel', '79d157'),
    'channels/mii-face-8': ('Channels/Mii Channel', '8df23a'),
    'channels/mii-face-9': ('Channels/Mii Channel', '9335fa'),
    'channels/mii-face-10': ('Channels/Mii Channel', '98d226'),
    'channels/mii-face-11': ('Channels/Mii Channel', 'a2ffd9'),
    'channels/mii-face-12': ('Channels/Mii Channel', 'b1670a'),
    'channels/mii-face-13': ('Channels/Mii Channel', 'e0dc10'),
    'channels/mii-face-14': ('Channels/Mii Channel', 'f2a734'),
    'channels/mii-face-15': ('Channels/Mii Channel', 'f4b5c0'),
    'channels/photo-cork': ('Channels/Photo Channel', '9747ef'),
    'channels/photo-1': ('Channels/Photo Channel', '1a571a'),
    'channels/photo-2': ('Channels/Photo Channel', '369db8'),
    'channels/photo-3': ('Channels/Photo Channel', '9770f8'),
    'channels/photo-4': ('Channels/Photo Channel', 'cbb1c2'),
    'channels/photo-5': ('Channels/Photo Channel', '54b046'),
    'channels/photo-card-1': ('Channels/Photo Channel', '414bb8'),
    'channels/photo-card-2': ('Channels/Photo Channel', 'f83b51'),
    'channels/photo-card-3': ('Channels/Photo Channel', '032a23'),
    'channels/shop-label': ('Channels/Wii Shop Channel', 'dbd099'),
    'channels/shop-bag': ('Channels/Wii Shop Channel', '3d9fcb'),
    'channels/shop-card': ('Channels/Wii Shop Channel', 'c5d23d'),
    'channels/forecast-logo': ('Channels/Forecast Channel', 'bc225d'),
    'channels/forecast-sun': ('Channels/Forecast Channel', '21824c'),
    'channels/forecast-moon': ('Channels/Forecast Channel', '4b31bb'),
    'channels/forecast-cloud': ('Channels/Forecast Channel', 'f534ec'),
    'channels/news-label': ('Channels/News Channel', '1a3dd9'),
    'channels/news-title': ('Channels/News Channel', '45a883'),
    'channels/news-map': ('Channels/News Channel', '4376e5'),
    'channels/internet-opera': ('Channels/Internet Channel', '5febc1'),
    'channels/votes-label': ('Channels/Everybody Votes Channel', 'e7e782'),
    'channels/votes-hand': ('Channels/Everybody Votes Channel', 'eace70'),
    'channels/cmoc-label': ('Channels/Check Mii Out Channel', '4f3061'),
    'channels/cmoc-tiles': ('Channels/Check Mii Out Channel', '2c9ae7'),
    'channels/cmoc-walk': ('Channels/Check Mii Out Channel', '219ede'),
    'channels/cmoc-cheer': ('Channels/Check Mii Out Channel', '5199e2'),
    'channels/cmoc-pair': ('Channels/Check Mii Out Channel', 'a47fc9'),
    'channels/nintendo-label': ('Channels/Nintendo Channel', '5c7f34'),
    'channels/nintendo-ring': ('Channels/Nintendo Channel', '7a862d'),
    # The HOME Menu.
    'home/home-icon': ('Home Menu', '703bcc'),
    'home/battery': ('Home Menu', 'dcbb9b'),
    'home/remote': ('Home Menu', 'ee403b'),
    'home/remote-buttons': ('Home Menu', 'c301cc'),
    # Wii Options.
    'options/data-management': ('Settings', '23ed8b3'),
    'options/wii-settings': ('Settings', '3494014'),
    'options/wii-logo': ('Settings', 'b34b52e1b'),
    'options/save-data': ('Settings', '2417f8'),
    'options/channels': ('Settings', 'e5bee54'),
    # The SD Card Menu.
    'sd/wii-button': ('SD Menu', '14d655'),
    'sd/help-button': ('SD Menu', 'b6990c'),
    # The Wii Message Board.
    'mail/memo': ('Mail', '833356'),
    'mail/envelope-back': ('Mail', 'd1f0cc'),
    'mail/envelope-flap': ('Mail', '9be385'),
    'mail/address-book': ('Mail', '693c6a'),
    'mail/memo-card': ('Mail', '63f0c7'),
    'mail/calendar-button': ('Mail', '8f465a'),
    'mail/create-button': ('Mail', '0ed501'),
    'mail/wii-button': ('Mail', '14d655'),
    'mail/smiley': ('Mail', '26fcc5'),
}

# The Settings frames, by the port's name for each state. A state is `<focus>` on a page with no
# options, and `<selected>-<focus>` on one with: `none` is nothing focused, `back` and `confirm`
# the two buttons along the bottom. Each was identified by where its lavender focus fill and orange
# selection corners fall, and is recorded here by hash so a rerun is checked against the pack.
SETTINGS = {
    'Pages': {
        '1-none': 'b0fb03', '1-0': '9e2c07', '1-1': '2241fa', '1-2': '17fac1', '1-3': '01f889',
        '1-back': '651a38', '1-next': 'e404e5',
        '2-none': '8efc8b', '2-0': '045a4b', '2-1': '8c6c23', '2-2': '03456a', '2-3': '771762',
        '2-back': '1a6792', '2-prev': 'd4bece', '2-next': '4938cc',
        '3-none': '61637d', '3-0': 'a04388', '3-1': '286a3c', '3-2': 'e574a9', '3-3': 'b4e7a3',
        '3-back': 'b0d866', '3-prev': '5b7457',
    },
    'Sound': {
        '0-none': '8e2a73', '0-0': 'b91d7e', '0-1': 'dd8154', '0-2': '55be22', '0-back': 'd6deaa', '0-confirm': 'b8a64e',
        '1-none': '1bc1f8', '1-0': '0f17c6', '1-1': 'f4d99d', '1-2': '56ff5d', '1-back': '7cf5c7', '1-confirm': '03dce0',
        '2-none': '784ad3', '2-0': 'fef2b7', '2-1': '3ecf75', '2-2': 'a317b0', '2-back': '31cdac', '2-confirm': '75db15',
    },
    'Screen': {'none': 'eb4974', '0': 'bb42c8', '1': 'bdd886', '2': 'df89f3', '3': 'c9e815', 'back': 'f998f0'},
    'Screen/Widescreen Settings': {
        '0-none': '885e89', '0-0': 'fe64fb', '0-1': 'b56def', '0-back': '4cf78b', '0-confirm': 'fa02b9',
        '1-none': '1af5f5', '1-0': 'f1957a', '1-1': '965e73', '1-back': '12883e', '1-confirm': 'f889a3',
    },
    'Screen/TV Resolution': {
        '0-none': 'f509ba', '0-0': 'e9f78f', '0-1': '8248f9', '0-back': '15bbf0', '0-confirm': '15d222',
        '1-none': '4d7354', '1-0': 'a9faee', '1-1': '42cd19', '1-back': '328ca0', '1-confirm': '6adccb',
    },
    'Screen/Screen Burn.in Reduction': {
        '0-none': '0bb925', '0-0': '304fbf', '0-1': '4edd89', '0-back': 'cc8733', '0-confirm': 'fee2a8',
        '1-none': '1d5b07', '1-0': 'eb88c6', '1-1': '6b5922', '1-back': 'cfa67f', '1-confirm': 'e06ce9',
    },
    'Calendar': {'none': '814723', '0': 'ba5bb0', '1': 'a346f8', 'back': '8dacb8'},
    'Sensor Bar': {'none': '9570a4', '0': '254778', '1': 'd5fb64', 'back': 'd4093b'},
    'Sensor Bar/Sensor Bar Position': {
        '0-none': '40ca76', '0-0': '37b60b', '0-1': 'e56e54', '0-back': 'ce894c', '0-confirm': '3f64d8',
        '1-none': 'ec30e1', '1-0': '698aff', '1-1': '567991', '1-back': 'c16d95', '1-confirm': '33dbdf',
    },
    'Wii System Update': {'none': '41239f', 'yes': 'c1de32', 'no': '8d93d6'},
}

SETTINGS_DIRS = {
    'Pages': 'pages', 'Sound': 'sound', 'Screen': 'screen', 'Screen/Widescreen Settings': 'widescreen',
    'Screen/TV Resolution': 'tv-resolution', 'Screen/Screen Burn.in Reduction': 'burn-in', 'Calendar': 'calendar',
    'Sensor Bar': 'sensor-bar', 'Sensor Bar/Sensor Bar Position': 'sensor-bar-position',
    'Wii System Update': 'system-update',
}


# The System Menu tints several of its greyscale textures when it draws them: the clock's digits,
# the mail icon and the Nintendo Channel's name are white in the pack and grey on screen
# (`frames/menu.png`). The tint is baked in here, so the port draws a plain image rather than
# needing a mask.
TINTS = {
    **{f'menu/digit-{d}': (0x8a, 0x90, 0x94) for d in range(10)},
    'menu/colon': (0x8a, 0x90, 0x94),
    'menu/am': (0x8a, 0x90, 0x94),
    'menu/pm': (0x8a, 0x90, 0x94),
    'menu/mail': (0xa8, 0xac, 0xae),
    'channels/nintendo-label': (0x8e, 0x93, 0x96),
}


def tint(im: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    """Multiply a white mask by a colour, keeping its alpha."""
    r, g, b, a = im.split()
    lum = im.convert('L')
    out = Image.merge('RGBA', [lum.point(lambda v, c=c: v * c // 255) for c in rgb] + [a])
    return out


def find(folder: str, prefix: str) -> Path:
    hits = [p for p in (SRC / folder).rglob('tex1_*.png') if re.search(rf'_{prefix}[0-9a-f]*_', p.name)]
    # The pack sometimes ships a texture twice, the copy suffixed `-1`; the unsuffixed one is canonical.
    if len(hits) > 1:
        hits = [p for p in hits if not re.search(r'-\d+\.png$', p.name)]
    if len(hits) != 1:
        raise SystemExit(f'{folder}/{prefix}: {len(hits)} matches')
    return hits[0]


def native(path: Path) -> Image.Image:
    w, h = map(int, re.match(r'tex1_(\d+)x(\d+)_', path.name).groups())
    return Image.open(path).convert('RGBA').resize((w, h), Image.LANCZOS)


def main() -> None:
    for dest, (folder, prefix) in TEXTURES.items():
        out = OUT / f'{dest}.png'
        out.parent.mkdir(parents=True, exist_ok=True)
        im = native(find(folder, prefix))
        if dest in TINTS:
            im = tint(im, TINTS[dest])
        im.save(out, optimize=True)
    for folder, states in SETTINGS.items():
        for state, prefix in states.items():
            src = find(f'Settings/{folder}', prefix)
            if '608x456' not in src.name:
                raise SystemExit(f'{src.name} is not a whole frame')
            out = OUT / 'settings' / SETTINGS_DIRS[folder] / f'{state}.webp'
            out.parent.mkdir(parents=True, exist_ok=True)
            native(src).convert('RGB').save(out, lossless=True, method=6)
    print('done')


if __name__ == '__main__':
    main()
