import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import type { HudKind } from './library'
import { LIVE_TAGS, type ScreenTags } from '../taxonomy'

/**
 * One device.
 *
 * slot is bespoke for the Anbernic RG SP and says so in its first line. A second device would be
 * a fiction, the same way a second resolution would be.
 */
export const SLOT_DEVICES: readonly DeviceSlug[] = ['rg-sp']

export interface SlotScreenDef {
  readonly slug: string
  readonly title: string
  readonly view: string
  readonly selected?: number
  readonly seat?: number
  readonly hud?: HudKind
  readonly hudValue?: number
  readonly switcherSlot?: number
  readonly clockField?: number
  readonly wallpaper?: boolean
}

/**
 * The statics.
 *
 * The seven phases, plus five that pose a moment inside one of them. The insert is posed three
 * times on purpose: it is the set's signature motion and a single frame of it says nothing about
 * the catch, which is the whole point of the travel.
 */
/**
 * The cart the shelf is posed on: the third, so both neighbours are on screen. The live build opens
 * here too, which is what makes it comparable with the `shelf` still in `settle.spec.ts`.
 */
export const SHELF_SELECTED = 2

/**
 * Tags by screen. The three insert stills and the eject are `loading`: the cart travelling into
 * the slot is slot's launch. The playing still is the running game with nothing over it, and doze
 * is the panel off: neither draws anything the element vocabulary names.
 */
export const SLOT_TAGS: Record<string, ScreenTags> = {
  shelf: { types: ['game-list'], elements: ['shelf', 'hint-bar'] },
  'shelf-wallpaper': { types: ['game-list'], elements: ['shelf', 'hint-bar'] },
  'insert-falling': { types: ['loading'], elements: ['shelf'] },
  'insert-caught': { types: ['loading'], elements: ['shelf'] },
  'insert-seated': { types: ['loading'], elements: ['shelf'] },
  playing: { types: ['gameplay'], elements: [] },
  'hud-volume': { types: ['overlay'], elements: ['slider', 'artwork-panel'] },
  'hud-brightness': { types: ['overlay'], elements: ['slider', 'artwork-panel'] },
  'hud-rewind': { types: ['overlay'], elements: ['progress-bar', 'artwork-panel'] },
  ejecting: { types: ['loading'], elements: ['shelf'] },
  polaroids: {
    types: ['save-states', 'game-switcher'],
    elements: ['carousel', 'artwork-panel', 'page-indicator', 'hint-bar'],
  },
  'set-clock': { types: ['date-time'], elements: ['stepper', 'hint-bar'] },
  doze: { types: ['power'], elements: [] },
}

export const SLOT_SCREENS: readonly SlotScreenDef[] = [
  { slug: 'shelf', title: 'Shelf', view: 'shelf', selected: SHELF_SELECTED },
  {
    slug: 'shelf-wallpaper',
    title: 'Shelf with wallpaper',
    view: 'shelf',
    selected: 2,
    wallpaper: true,
  },
  { slug: 'insert-falling', title: 'Insert: falling', view: 'inserting', selected: 2, seat: 0.3 },
  {
    slug: 'insert-caught',
    title: 'Insert: on the lip',
    view: 'inserting',
    selected: 2,
    seat: 0.52,
  },
  /* Just seated, before the panel strikes: at 0.95 the picture already covers the cart. */
  { slug: 'insert-seated', title: 'Insert: seated', view: 'inserting', selected: 2, seat: 0.64 },
  { slug: 'playing', title: 'Playing', view: 'playing', selected: 2 },
  {
    slug: 'hud-volume',
    title: 'HUD: volume',
    view: 'playing',
    selected: 2,
    hud: 'volume',
    hudValue: 0.7,
  },
  {
    slug: 'hud-brightness',
    title: 'HUD: brightness',
    view: 'playing',
    selected: 2,
    hud: 'brightness',
    hudValue: 0.4,
  },
  {
    slug: 'hud-rewind',
    title: 'HUD: rewind',
    view: 'playing',
    selected: 2,
    hud: 'rewind',
    hudValue: 0.85,
  },
  { slug: 'ejecting', title: 'Ejecting', view: 'ejecting', selected: 2, seat: 0.55 },
  { slug: 'polaroids', title: 'Save states', view: 'polaroids', selected: 2, switcherSlot: 1 },
  { slug: 'set-clock', title: 'Set the clock', view: 'set-clock', clockField: 2 },
  { slug: 'doze', title: 'Doze', view: 'doze' },
]

export const SLOT_MANIFEST: readonly ScreenManifestEntry[] = SLOT_DEVICES.flatMap((device) => [
  {
    theme: 'slot' as const,
    device,
    screen: 'interactive',
    title: 'Interactive',
    interactive: true,
    ...LIVE_TAGS,
  },
  ...SLOT_SCREENS.map((s) => ({
    theme: 'slot' as const,
    device,
    screen: s.slug,
    title: s.title,
    interactive: false,
    ...SLOT_TAGS[s.slug]!,
  })),
])
