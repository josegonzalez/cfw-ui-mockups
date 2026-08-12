import type { DeviceSlug } from '../device/devices'
import type { ThemeSlug } from '../widgets/types'

import elementerialPreview from '../assets/previews/elementerial.png'
import playstationXPreview from '../assets/previews/playstation-x.png'
import vitrolauncherPreview from '../assets/previews/vitrolauncher.png'
import nextuiPreview from '../assets/previews/nextui.png'
import slotPreview from '../assets/previews/slot.png'
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
  /** Representative colours from the set's own palette. */
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
    swatches: ['#0070d1', '#003791', '#F3C300', '#00AD9E', '#F2001A', '#666666'],
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
    // The shell table's own colours, which are the only thing that varies between carts.
    swatches: ['#c2332e', '#2f5cc0', '#249c60', '#d85224', '#63b044', '#c6c6c9', '#35353a'],
    views: 7,
    devices: ['rg-sp'],
    fonts: ['Open Sans'],
    ported: true,
    docPath: 'docs/themes/slot.md',
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
    // Light to dark, so the row reads as a ramp rather than as three broken boxes.
    swatches: ['#4cc9f0', '#e7e9f0', '#8b90a3', '#2a2e40', '#1b1e2b', '#12141c'],
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
