import type { DeviceSlug } from '../device/devices'
import type { ThemeSlug } from '../widgets/types'

import elementerialPreview from '../assets/previews/elementerial.png'
import playstationXPreview from '../assets/previews/playstation-x.png'
import vitrolauncherPreview from '../assets/previews/vitrolauncher.png'
import nextuiPreview from '../assets/previews/nextui.png'
import slotPreview from '../assets/previews/slot.png'
import simpleosPreview from '../assets/previews/simpleos.png'
import tortosPreview from '../assets/previews/tortos.png'
import neostationPreview from '../assets/previews/neostation.png'
import dsStylePreview from '../assets/previews/ds-style.png'
import wiiMenuPreview from '../assets/previews/wii-menu.png'
import spruceosPreview from '../assets/previews/spruceos.png'
import dreamcastBiosPreview from '../assets/previews/dreamcast-bios.png'
import exampleCfwPreview from '../assets/previews/example-cfw.png'

/**
 * What each mockup set is, for the landing page.
 *
 * Descriptive rather than structural - the screens themselves come from `manifest.ts`. Every
 * figure here is read from the set's own source: palettes from its palette module, view counts
 * from its view list, devices from the directories it shipped.
 *
 * Preview art is captured from the mockups by `e2e/previews.spec.ts` rather than drawn, so a
 * preview cannot flatter a screen that no longer looks like that.
 */
export interface ThemeEntry {
  readonly slug: ThemeSlug
  readonly name: string
  /** Who made the firmware theme this reproduces. Absent for the fictional scaffold. */
  readonly author?: string
  readonly kind: string
  readonly summary: string
  /** The two or three things that make this set distinctive. */
  readonly highlights: readonly string[]
  readonly preview: string
  readonly previewAlt: string
  readonly accent: string
  /**
   * Representative colours from the set's colour themes. Empty for a set that has none to switch
   * between: a strip on the card says the launcher offers a choice of colours.
   */
  readonly swatches: readonly string[]
  readonly views: number
  readonly devices: readonly DeviceSlug[]
  readonly fonts: readonly string[]
  /** Every set is implemented; the flag remains so a work-in-progress set can say so. */
  readonly ported: boolean
  readonly docPath: string
}

export const THEMES: readonly ThemeEntry[] = [
  {
    slug: 'elementerial',
    name: 'Elementerial',
    author: 'mluizvitor',
    kind: 'EmulationStation theme',
    summary:
      'Built around Android TV, with Material Design principles and the elementary OS palette. Eight ways to look at the same library, from a plain text list to a full-bleed cover carousel.',
    highlights: [
      '14 colour schemes, each in light and dark',
      'Eight views: carousel, three list styles, three grid styles, and a settings menu',
      'Layout resolves per aspect ratio, from 480x320 up to 1920x1152',
    ],
    preview: elementerialPreview,
    previewAlt: 'Elementerial main screen: a Game Boy Advance backdrop above a row of system logos',
    accent: '#ED5353',
    swatches: ['#ED5353', '#F37329', '#F9C440', '#68B723', '#28BCA3', '#3689E6', '#A56DE2'],
    views: 8,
    devices: ['rg35xx', 'rg351m', 'rg552', 'rg-cubexx'],
    fonts: ['Inter', 'Roboto Condensed'],
    ported: true,
    docPath: 'docs/themes/elementerial.md',
  },
  {
    slug: 'playstation-x',
    name: 'PlayStation X',
    author: 'pajarorrojo',
    kind: 'Batocera EmulationStation theme',
    summary:
      'A reproduction of the PS3, PS4 and PS5 interfaces on a handheld, down to the character cutouts and the drifting background. The most animated set in the repo by a wide margin.',
    highlights: [
      '97 animation tracks across 22 storyboards, carried as data and compiled at runtime',
      'Eleven views, including a boot splash, a game launch and a media diagnostic screen',
      'Two colour sets and eight accent overrides',
    ],
    preview: playstationXPreview,
    previewAlt: 'PlayStation X game list: a tile row over a character cutout and game metadata',
    accent: '#0070d1',
    // The two colorsets and nothing else: each one's menu selector gradient, blue then black.
    swatches: ['#0070d1', '#003791', '#2d2828', '#000000'],
    views: 11,
    devices: ['rg34xx', 'rg35xx', 'rg552', 'trimui-smart-pro'],
    fonts: ['SST'],
    ported: true,
    docPath: 'docs/themes/playstation-x.md',
  },
  {
    slug: 'vitrolauncher',
    name: 'Vitro Launcher',
    author: 'KevDoy',
    kind: 'Love2D launcher for muOS',
    summary:
      'A home screen rather than a game browser. Three screens float on a live animated background, switched with the shoulder buttons through a frosted glass nav pill.',
    highlights: [
      'Four animated backgrounds, one of them a WebGL port of the original GLSL wave shader',
      'Frosted glass chrome that genuinely samples the moving background beneath it',
      'Eleven colour schemes, switchable from the launcher’s own settings screen',
    ],
    preview: vitrolauncherPreview,
    previewAlt: 'Vitro Launcher last-played carousel: three cover tiles over an animated wave background',
    accent: '#1a9fff',
    swatches: ['#2245cc', '#7a3fd4', '#c0264b', '#d97b1f', '#1f9e46', '#12939c', '#d4569b'],
    views: 3,
    devices: ['rg34xx', 'rg35xx'],
    fonts: ['Roboto Condensed'],
    ported: true,
    docPath: 'docs/themes/vitrolauncher.md',
  },
  {
    slug: 'nextui',
    name: 'NextUI',
    author: 'the N64FlashcartMenu project',
    kind: 'Nintendo 64 flashcart menu theme',
    summary:
      'A flashcart menu for the Nintendo 64, drawn to a television rather than a handheld screen. It borrows its look and its palette format from LoveRetro’s NextUI firmware, so palettes made for a handheld drop straight in.',
    highlights: [
      'Eighteen palettes of seven slots, switchable live with no reboot',
      'Twenty-three views, from the file browser to a cheat editor and a Controller Pak manager',
      'Every pill is measured to its own label, so no two selections are the same width',
    ],
    preview: nextuiPreview,
    previewAlt: 'NextUI file browser: a white selection pill over a list of N64 games, box art right',
    accent: '#9b2257',
    // One Main colour per palette family, rather than the Default palette's seven slots -
    // three of which are white, black and near-black, and would read as a broken row.
    swatches: ['#9b2257', '#B5442E', '#F2A93B', '#B7DD5B', '#45CFC3', '#6C4BC9', '#D6559E'],
    views: 23,
    devices: ['n64'],
    fonts: ['BPreplay Bold'],
    ported: true,
    docPath: 'docs/themes/nextui.md',
  },
  {
    slug: 'slot',
    name: 'slot',
    author: 'BrandonKowalski',
    kind: 'Bespoke GBA frontend',
    summary:
      'A single-system frontend for the Anbernic RG SP. Games are a carousel of cartridges; pick one and it is inserted into the slot, falling to the lip before the mechanism takes it.',
    highlights: [
      'The only set whose motion is physics: the shelf is a critically damped spring',
      'One progress drives six things at once as the cart goes in',
      'No palette, no scraped art, one console - it is bespoke, not configurable',
    ],
    preview: slotPreview,
    previewAlt: 'slot shelf: three GBA cartridges on a row, the middle one full size above an empty slot',
    accent: '#249c60',
    // No palette to show: slot has none, and its cart shell colours are not one.
    swatches: [],
    views: 7,
    devices: ['rg-sp'],
    fonts: ['Open Sans'],
    ported: true,
    docPath: 'docs/themes/slot.md',
  },
  {
    slug: 'simpleos',
    name: 'SimpleOS',
    author: 'boorngos',
    kind: 'DS frontend for the RG DS',
    summary:
      'An overlay on Anbernic Linux that turns the RG DS into a DSi-style DS machine. A game grid on the bottom panel, the highlighted title on the top, and a quick menu inside DraStic that also switches between games.',
    highlights: [
      'The only set drawn across two panels, with one application spanning both',
      'Every string in its own 8x8 bitmap font, recovered from the binary',
      'An in-game menu that doubles as a game switcher',
    ],
    preview: simpleosPreview,
    previewAlt: 'SimpleOS home: the highlighted title on the top panel over a grid of game tiles on the bottom',
    accent: '#2e6cc9',
    // One fixed look and no colour themes to switch between.
    swatches: [],
    views: 15,
    devices: ['rg-ds'],
    fonts: ['SimpleOS 8x8'],
    ported: true,
    docPath: 'docs/themes/simpleos.md',
  },
  {
    slug: 'tortos',
    name: 'TortOS',
    author: 'ericreinsmidt',
    kind: 'Custom firmware for the TrimUI Brick',
    summary:
      'A launcher that is a shelf: a coverflow of consoles, then of one console\'s games, that can be stood on end or folded into a cube. Every other screen - settings, game details, achievements, Muse the music player - is one panel drawn over it.',
    highlights: [
      'A coverflow whose cards turn in perspective and reflect onto one floor',
      'Cubic: two axes on one surface, each turn a quarter of a cube',
      'Every menu one panel, with a highlight that chases the cursor',
    ],
    preview: tortosPreview,
    previewAlt: 'TortOS games shelf: Chrono Trigger centred in a coverflow of SNES games, its neighbours turned away',
    accent: '#3dd6ff',
    // One palette. What a player switches is the card art and which way the shelf runs.
    swatches: [],
    views: 30,
    devices: ['trimui-brick'],
    fonts: ['Josefin Sans'],
    ported: true,
    docPath: 'docs/themes/tortos.md',
  },
  {
    slug: 'neostation',
    name: 'NeoStation',
    author: 'misobadev',
    kind: 'Emulation frontend for Android, Linux, Windows and macOS',
    summary:
      'A Flutter frontend laid out on a 640x480 design canvas and scaled to the screen. A tab bar of library, search, cloud saves, achievements, scraper, RomM and settings over a systems grid, with a games list whose details card carries art, game info and RetroAchievements.',
    highlights: [
      '14 built-in colour themes, switchable from Settings',
      'One layout on two screens: the 640x480 it is designed for, and 1080p at three pixels per unit',
      'Platform branches: the Android build has an apps grid and a permissions step the Linux one does not',
    ],
    preview: neostationPreview,
    previewAlt: 'NeoStation games list: Goodboy Galaxy selected in the Game Boy Advance list, beside its PLAY footer',
    accent: '#605dff',
    swatches: ['#605dff', '#422ad5', '#f43098', '#ff79c6', '#5e81ac', '#db924c', '#bdff00', '#13ecf3', '#e95678'],
    views: 53,
    devices: ['odin2-mini', 'rg40xx'],
    fonts: ['Anta'],
    ported: true,
    docPath: 'docs/themes/neostation.md',
  },
  {
    slug: 'ds-style',
    name: 'DS Style',
    author: 'FrankieT19',
    kind: 'Launcher for the Anbernic RG SP stock OS',
    summary:
      'A Nintendo DS-inspired launcher, first made for the GBA, drawn at the GBA\'s 240x160 and shown at exactly 3x. A home screen of a recent game, Games and Apps, then lists and carousels of systems and games, all in an 8x12 bitmap font.',
    highlights: [
      'Drawn at 240x160 and scaled 3x, with artwork sampled at the full 720x480',
      '16 accent themes, a dark mode, and an LCD grid filter',
      'Every still matches a frame rendered by the launcher itself, pixel for pixel',
    ],
    preview: dsStylePreview,
    previewAlt: 'DS Style Games in Horizontal view: Garden Quest centred between its neighbours, the title in a box below',
    accent: '#52738c',
    swatches: ['#52738c', '#299cce', '#005af7', '#00a539', '#00c600', '#d6c600', '#ff0010', '#ff9400', '#ff18a5', '#8c00d6'],
    views: 44,
    devices: ['rg-sp'],
    fonts: ['DS Style 8x12 bitmap'],
    ported: true,
    docPath: 'docs/themes/ds-style.md',
  },
  {
    slug: 'wii-menu',
    name: 'Wii Menu',
    author: 'Nintendo',
    kind: 'Console system menu, System Menu 4.3U',
    summary:
      'The Wii\'s own menu as System Menu 4.3U draws it: four pages of channels in a 4x3 grid over a seven-segment clock, channel previews that grow out of their slot, the HOME Menu, Wii Settings, the SD Card Menu and the Wii Message Board. Built from captures of the console and the WM4K texture pack.',
    highlights: [
      'Laid out 1:1 in the Wii\'s 608x456 frame, inside the 640x480 signal the console sends',
      'Wii Settings shown from WM4K\'s whole-page textures, one for every focus and choice',
      'Channel previews grow out of their grid slot and shrink back into it',
    ],
    preview: wiiMenuPreview,
    previewAlt: 'The Wii Menu: the stock channels in a 4x3 grid, the Disc Channel highlighted, the clock reading 9:12 PM',
    accent: '#34bee6',
    // One look, with nothing to switch between.
    swatches: [],
    views: 45,
    devices: ['rg35xx'],
    fonts: ['M PLUS 1p, for Rodin NTLG'],
    ported: true,
    docPath: 'docs/themes/wii-menu.md',
  },
  {
    slug: 'spruceos',
    name: 'spruceOS',
    author: 'spruceUI',
    kind: 'Custom firmware, with its own launcher PyUI',
    summary:
      'spruceOS\'s launcher, PyUI, in its default SPRUCE theme, on every device spruceOS runs on that has a body here - seven panels from 640x480 to 1280x720. A main menu of four icons, a grid of systems, game lists in four views, Apps, Settings and the Game Switcher.',
    highlights: [
      'Every still held to a frame PyUI itself rendered, on the same device',
      'Laid out per panel from the theme\'s own images and config, as PyUI lays it out',
      'Each device\'s own rows: its apps, Bluetooth, Wi-Fi, Reboot, and popups where it has them',
    ],
    preview: spruceosPreview,
    previewAlt: 'spruceOS on the Miyoo A30: the GB list with Kirby\'s Dream Land selected beside its box art',
    accent: '#d65d0e',
    // One theme, with nothing to switch between.
    swatches: [],
    views: 35,
    devices: [
      'miyoo-a30',
      'miyoo-flip',
      'miyoo-mini',
      'miyoo-mini-v4',
      'trimui-brick',
      'trimui-smart-pro',
      'rg35xx',
      'rg40xx',
      'rg34xx',
      'rg28xx',
      'rg-cubexx',
      'miniloong-pocket1',
    ],
    fonts: ['nunwen (Nunito with WenQuanYi Micro Hei)'],
    ported: true,
    docPath: 'docs/themes/spruceos.md',
  },
  {
    slug: 'dreamcast-bios',
    name: 'Dreamcast BIOS',
    author: 'Sega',
    kind: 'Console system menu, boot ROM v1.01d',
    summary:
      'The menu the Dreamcast boots to with no disc in: Play, File, Music and Settings over a sky it renders live, the memory card manager, the CD player and every Settings box. Its textures, its system font and its strings are decoded from the boot ROM itself.',
    highlights: [
      'Textures, font and strings decoded from the boot ROM by a script you run on your own dump',
      'The system font rebuilt as two faces, fill and outline, stacked as the menu draws them',
      'A live sky as a shader, with the same function drawn on the CPU as its fallback',
    ],
    preview: dreamcastBiosPreview,
    previewAlt: 'The Dreamcast BIOS main menu: the controller, memory card, note and alarm clock over a blue sky, Play focused',
    accent: '#e0632a',
    // One look, with nothing to switch between.
    swatches: [],
    views: 20,
    devices: ['dreamcast'],
    fonts: ['The Dreamcast BIOS system font'],
    ported: true,
    docPath: 'docs/themes/dreamcast-bios.md',
  },
  {
    slug: 'example-cfw',
    name: 'Example OS',
    kind: 'Scaffold reference',
    summary:
      'A fictional launcher, and the template for adding a real one. The smallest complete theme: two screens, one palette, no assets, and the only set that navigates between screens rather than swapping views in place.',
    highlights: [
      'The starting point for a new firmware theme',
      'Built entirely from the shared widget vocabulary, with no widget of its own',
      'Layout resolves from fractions, so it renders on any device in the registry',
    ],
    preview: exampleCfwPreview,
    previewAlt: 'Example OS main menu: five icon rows with the first selected in cyan',
    accent: '#4cc9f0',
    // One palette and no colour themes to switch between.
    swatches: [],
    views: 2,
    devices: ['rg35xx', 'rg-cubexx'],
    fonts: ['System sans'],
    ported: true,
    docPath: 'docs/themes/example-cfw.md',
  },
]

/** Totals for the landing page, derived so they cannot drift from the catalogue. */
export function catalogueTotals() {
  const devices = new Set(THEMES.flatMap((t) => t.devices))
  return {
    themes: THEMES.length,
    views: THEMES.reduce((sum, t) => sum + t.views, 0),
    devices: devices.size,
    ported: THEMES.filter((t) => t.ported).length,
  }
}
