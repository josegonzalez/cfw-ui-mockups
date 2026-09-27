import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import type { Seed } from './machine'

/**
 * One device. TortOS is a custom firmware for the TrimUI Brick and runs on nothing else - the
 * README's first line says so, and its geometry is the Brick's 1024x768.
 */
export const TORTOS_DEVICES: readonly DeviceSlug[] = ['trimui-brick']

export interface TortosScreenDef {
  readonly slug: string
  readonly title: string
  readonly seed: Seed
}

const LITTLE_VOICE = { album: 4, track: 0, paused: false, at: 95 }
const ONLINE = { wifiOn: true, wifiNet: 'Tortoise Den' } as const

/**
 * The stills.
 *
 * Every screen once. Where a reference frame shows one (`docs/themes/tortos/reference/`), the still
 * is posed as the frame is: the SNES console in Fancy Pants, Chrono Trigger first on the SNES
 * shelf, Contra second of ten on the cube, the TortOS menu over Game Gear with Wi-Fi off, Streets of
 * Rage 2's details with it on, Hagane's achievements, The xx sixth on Muse's shelf and Little Voice
 * playing 1:35 into its first track.
 */
export const TORTOS_SCREENS: readonly TortosScreenDef[] = [
  { slug: 'systems', title: 'Systems', seed: { cards: 'fancy', system: 'SFC' } },
  { slug: 'systems-plain', title: 'Systems, Plain Jane', seed: { cards: 'classic', system: 'SFC' } },
  { slug: 'systems-vertical', title: 'Systems, Vertical', seed: { cards: 'fancy', dir: 'vertical', system: 'SFC' } },
  { slug: 'games', title: 'Games', seed: { shelf: 'games', system: 'SFC', cursor: { SFC: 0 } } },
  { slug: 'games-vertical', title: 'Games, Vertical', seed: { shelf: 'games', dir: 'vertical', system: 'MD', cursor: { MD: 0 } } },
  { slug: 'favorites', title: 'Favorites', seed: { shelf: 'games', system: 'FAV', cursor: { FAV: 0 } } },
  { slug: 'cubic', title: 'Cubic', seed: { dir: 'cubic', system: 'NES', cursor: { NES: 1 } } },
  { slug: 'no-games', title: 'No games found', seed: { empty: true } },
  { slug: 'tortos-menu', title: 'TortOS menu', seed: { cards: 'fancy', system: 'GG', stack: ['tortos-menu'] } },
  { slug: 'system-menu', title: 'System menu', seed: { shelf: 'games', system: 'SFC', stack: ['system-menu'], sel: { 'system-menu': 2 } } },
  { slug: 'wifi', title: 'Wi-Fi', seed: { cards: 'fancy', system: 'GG', ...ONLINE, stack: ['tortos-menu', 'wifi'], sel: { 'tortos-menu': 1 } } },
  { slug: 'bluetooth', title: 'Bluetooth', seed: { cards: 'fancy', system: 'GG', stack: ['tortos-menu', 'bluetooth'], sel: { 'tortos-menu': 2, bluetooth: 1 } } },
  { slug: 'play-time', title: 'Play Time', seed: { cards: 'fancy', system: 'GG', stack: ['tortos-menu', 'play-time'], sel: { 'play-time': 0 } } },
  { slug: 'controls', title: 'Controls', seed: { cards: 'fancy', system: 'GG', stack: ['tortos-menu', 'controls'], sel: { 'tortos-menu': 11 } } },
  { slug: 'about', title: 'About TortOS', seed: { cards: 'fancy', system: 'GG', stack: ['tortos-menu', 'about'], sel: { 'tortos-menu': 12 } } },
  // `readme-hare.png` shows the SNES games shelf behind the panel.
  { slug: 'hare', title: 'Over The Hare', seed: { shelf: 'games', system: 'SFC', ...ONLINE, stack: ['tortos-menu', 'hare'], sel: { 'tortos-menu': 4 } } },
  { slug: 'box-art', title: 'Box Art', seed: { cards: 'fancy', system: 'GG', ...ONLINE, stack: ['tortos-menu', 'box-art'], sel: { 'tortos-menu': 8 } } },
  { slug: 'keyboard', title: 'Keyboard', seed: { cards: 'fancy', system: 'GG', ...ONLINE, stack: ['tortos-menu', 'keyboard'], sel: { 'tortos-menu': 9 }, keyboard: { text: 'tortoise', cur: 8, row: 2, col: 4 } } },
  {
    slug: 'confirm',
    title: 'Forget a network',
    seed: {
      cards: 'fancy',
      system: 'GG',
      ...ONLINE,
      stack: ['tortos-menu', 'wifi', 'confirm'],
      sel: { 'tortos-menu': 1, wifi: 1 },
      confirm: {
        heading: 'Wi-Fi',
        msg: 'Forget Tortoise Den? You are connected to it and will lose the network.',
        yes: 'Forget',
        sel: 2,
        then: { kind: 'forget', ssid: 'Tortoise Den' },
      },
    },
  },
  {
    slug: 'notice',
    title: 'Scanning',
    seed: {
      shelf: 'games',
      system: 'SFC',
      stack: ['system-menu', 'notice'],
      sel: { 'system-menu': 5 },
      notice: { heading: 'SNES', text: 'Scanning...', live: false, ms: 900, then: { kind: 'close-menus' } },
    },
  },
  { slug: 'game-info', title: 'Game details', seed: { shelf: 'games', system: 'MD', cursor: { MD: 10 }, ...ONLINE, stack: ['game-info'] } },
  { slug: 'synopsis', title: 'Synopsis', seed: { shelf: 'games', system: 'MD', cursor: { MD: 10 }, ...ONLINE, stack: ['game-info', 'synopsis'] } },
  { slug: 'cheevos', title: 'Achievements', seed: { shelf: 'games', system: 'SFC', cursor: { SFC: 4 }, stack: ['game-info', 'cheevos'], sel: { 'game-info': 0 } } },
  { slug: 'cheevo', title: 'Achievement', seed: { shelf: 'games', system: 'SFC', cursor: { SFC: 4 }, stack: ['game-info', 'cheevos', 'cheevo'], cheevo: 1 } },
  { slug: 'game-menu', title: 'In-game menu', seed: { shelf: 'games', system: 'NES', cursor: { NES: 1 }, running: { tag: 'NES', name: 'Contra (USA)' }, stack: ['game', 'game-menu'] } },
  { slug: 'save', title: 'Save to', seed: { shelf: 'games', system: 'NES', cursor: { NES: 1 }, running: { tag: 'NES', name: 'Contra (USA)' }, stack: ['game', 'game-menu', 'slots'], sel: { 'game-menu': 1 }, slotSaving: true } },
  { slug: 'load', title: 'Load from', seed: { shelf: 'games', system: 'NES', cursor: { NES: 1 }, running: { tag: 'NES', name: 'Contra (USA)' }, stack: ['game', 'game-menu', 'slots'], sel: { 'game-menu': 2 }, slotSaving: false } },
  { slug: 'muse', title: 'Muse', seed: { stack: ['muse'], cursor: { MUSE: 5 } } },
  { slug: 'muse-tracks', title: 'Muse, tracks', seed: { stack: ['muse', 'muse-tracks'], cursor: { MUSE: 4 }, now: LITTLE_VOICE } },
  { slug: 'now-playing', title: 'Now Playing', seed: { stack: ['muse', 'muse-tracks', 'now-playing'], cursor: { MUSE: 4 }, now: LITTLE_VOICE, sel: { 'muse-tracks': 0 } } },
]

export const TORTOS_MANIFEST: readonly ScreenManifestEntry[] = TORTOS_DEVICES.flatMap((device) => [
  { theme: 'tortos' as const, device, screen: 'interactive', title: 'Interactive', interactive: true },
  ...TORTOS_SCREENS.map((s) => ({ theme: 'tortos' as const, device, screen: s.slug, title: s.title, interactive: false })),
])
