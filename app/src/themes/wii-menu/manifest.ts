import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import { LIVE_TAGS, type ScreenTags } from '../taxonomy'
import type { Seed } from './machine'

export const WII_MENU_DEVICES: readonly DeviceSlug[] = ['rg35xx']

export interface WiiScreenDef {
  readonly slug: string
  readonly title: string
  readonly seed: Seed
}

const CHANNEL: ScreenTags = { types: ['apps'], elements: ['artwork-panel'] }
const SETTINGS_LIST: ScreenTags = { types: ['settings'], elements: ['list'] }
const SETTINGS_PAGE: ScreenTags = { types: ['settings'], elements: ['list', 'page-indicator'] }
const MENU: ScreenTags = { types: ['home'], elements: ['grid', 'status-bar', 'page-indicator'] }
const BOARD: ScreenTags = { types: ['messages'], elements: ['list', 'page-indicator'] }

/** What each still is for and built from, keyed by screen slug. */
export const WII_MENU_TAGS: Record<string, ScreenTags> = {
  health: { types: ['boot'], elements: ['text-block'] },
  menu: MENU,
  'menu-page-2': MENU,
  'menu-page-4': MENU,
  'menu-wii-options': MENU,
  'menu-sd-card': MENU,
  'menu-message-board': MENU,
  'preview-disc': CHANNEL,
  'preview-mii': CHANNEL,
  'preview-photo': CHANNEL,
  'preview-shop': CHANNEL,
  'preview-forecast': CHANNEL,
  'preview-news': CHANNEL,
  'preview-internet': CHANNEL,
  'preview-votes': CHANNEL,
  'preview-cmoc': CHANNEL,
  'preview-nintendo': CHANNEL,
  'preview-start': CHANNEL,
  home: { types: ['in-game-menu'], elements: ['popup-menu', 'status-bar'] },
  'home-channel': { types: ['in-game-menu'], elements: ['popup-menu', 'status-bar'] },
  'home-channel-wii-menu': { types: ['in-game-menu'], elements: ['popup-menu', 'status-bar'] },
  'wii-options': { types: ['settings'], elements: ['grid'] },
  'data-management': { types: ['file-manager'], elements: ['grid'] },
  settings: SETTINGS_PAGE,
  'settings-2': SETTINGS_PAGE,
  'settings-3': SETTINGS_PAGE,
  'settings-sound': SETTINGS_LIST,
  'settings-screen': SETTINGS_LIST,
  'settings-widescreen': SETTINGS_LIST,
  'settings-tv-resolution': SETTINGS_LIST,
  'settings-burn-in': SETTINGS_LIST,
  'settings-calendar': { types: ['settings', 'date-time'], elements: ['list'] },
  'settings-sensor-bar': SETTINGS_LIST,
  'settings-sensor-bar-position': SETTINGS_LIST,
  'settings-update': { types: ['settings'], elements: ['dialog'] },
  'sd-card-menu': { types: ['file-manager'], elements: ['grid', 'page-indicator'] },
  'sd-about': { types: ['help'], elements: ['dialog', 'grid'] },
  'sd-about-2': { types: ['help'], elements: ['dialog', 'grid'] },
  board: BOARD,
  'board-calendar': { types: ['messages', 'date-time'], elements: ['grid'] },
  'board-create': { types: ['messages'], elements: ['list'] },
  'board-memo': { types: ['messages'], elements: ['popup-menu'] },
  'board-letter': { types: ['messages'], elements: ['dialog'] },
  'board-address-book': { types: ['messages'], elements: ['list'] },
  'board-posted': BOARD,
}

/**
 * The stills. Each is posed by pressing buttons from power-on, in `machine.ts`'s letters, with every
 * transition settled. `health` is where the live build starts, and its settle pair.
 */
export const WII_MENU_SCREENS: readonly WiiScreenDef[] = [
  { slug: 'health', title: 'Health & Safety', seed: {} },
  { slug: 'menu', title: 'Wii Menu', seed: { events: 'a' } },
  { slug: 'menu-page-2', title: 'Wii Menu, page 2', seed: { events: 'aw' } },
  { slug: 'menu-page-4', title: 'Wii Menu, page 4', seed: { events: 'awww' } },
  { slug: 'menu-wii-options', title: 'Wii Menu, Wii button', seed: { events: 'addd' } },
  { slug: 'menu-sd-card', title: 'Wii Menu, SD Card Menu button', seed: { events: 'adddr' } },
  { slug: 'menu-message-board', title: 'Wii Menu, Message Board button', seed: { events: 'adddrr' } },
  { slug: 'preview-disc', title: 'Disc Channel', seed: { events: 'aa' } },
  { slug: 'preview-mii', title: 'Mii Channel', seed: { events: 'ara' } },
  { slug: 'preview-photo', title: 'Photo Channel', seed: { events: 'arra' } },
  { slug: 'preview-shop', title: 'Wii Shop Channel', seed: { events: 'arrra' } },
  { slug: 'preview-forecast', title: 'Forecast Channel', seed: { events: 'ada' } },
  { slug: 'preview-news', title: 'News Channel', seed: { events: 'adra' } },
  { slug: 'preview-internet', title: 'Internet Channel', seed: { events: 'adrra' } },
  { slug: 'preview-votes', title: 'Everybody Votes Channel', seed: { events: 'adrrra' } },
  { slug: 'preview-cmoc', title: 'Check Mii Out Channel', seed: { events: 'adda' } },
  { slug: 'preview-nintendo', title: 'Nintendo Channel', seed: { events: 'addra' } },
  { slug: 'preview-start', title: 'Preview, Start', seed: { events: 'arar' } },
  { slug: 'home', title: 'HOME Menu', seed: { events: 'am' } },
  { slug: 'home-channel', title: 'HOME Menu, over a channel', seed: { events: 'araram' } },
  { slug: 'home-channel-wii-menu', title: 'HOME Menu, Wii Menu', seed: { events: 'araramd' } },
  { slug: 'wii-options', title: 'Wii Options', seed: { events: 'addda' } },
  { slug: 'data-management', title: 'Data Management', seed: { events: 'adddala' } },
  { slug: 'settings', title: 'Wii Settings 1', seed: { events: 'adddaa' } },
  { slug: 'settings-2', title: 'Wii Settings 2', seed: { events: 'adddaar' } },
  { slug: 'settings-3', title: 'Wii Settings 3', seed: { events: 'adddaarr' } },
  { slug: 'settings-sound', title: 'Sound', seed: { events: 'adddaaddda' } },
  { slug: 'settings-screen', title: 'Screen', seed: { events: 'adddaadda' } },
  { slug: 'settings-widescreen', title: 'Widescreen Settings', seed: { events: 'adddaaddada' } },
  { slug: 'settings-tv-resolution', title: 'TV Resolution', seed: { events: 'adddaaddadda' } },
  { slug: 'settings-burn-in', title: 'Screen Burn-in Reduction', seed: { events: 'adddaaddaddda' } },
  { slug: 'settings-calendar', title: 'Calendar', seed: { events: 'adddaada' } },
  { slug: 'settings-sensor-bar', title: 'Sensor Bar', seed: { events: 'adddaarda' } },
  { slug: 'settings-sensor-bar-position', title: 'Sensor Bar Position', seed: { events: 'adddaardaa' } },
  { slug: 'settings-update', title: 'Wii System Update', seed: { events: 'adddaarrdda' } },
  { slug: 'sd-card-menu', title: 'SD Card Menu', seed: { events: 'adddra' } },
  { slug: 'sd-about', title: 'About the SD Card Menu', seed: { events: 'adddrara' } },
  { slug: 'sd-about-2', title: 'About the SD Card Menu, 2', seed: { events: 'adddraraa' } },
  { slug: 'board', title: 'Wii Message Board', seed: { events: 'adddrra' } },
  { slug: 'board-calendar', title: 'Message Board calendar', seed: { events: 'adddrralla' } },
  { slug: 'board-create', title: 'New message', seed: { events: 'adddrrala' } },
  { slug: 'board-memo', title: 'Memo', seed: { events: 'adddrralaa' } },
  { slug: 'board-letter', title: 'Letter, no Miis', seed: { events: 'adddrralara' } },
  { slug: 'board-address-book', title: 'Address Book', seed: { events: 'adddrralarra' } },
  { slug: 'board-posted', title: 'Message Board, a memo posted', seed: { events: 'adddrralaaa' } },
]

export const WII_MENU_MANIFEST: readonly ScreenManifestEntry[] = WII_MENU_DEVICES.flatMap((device) => [
  { theme: 'wii-menu' as const, device, screen: 'interactive', title: 'Interactive', interactive: true, ...LIVE_TAGS },
  ...WII_MENU_SCREENS.map((s) => ({
    theme: 'wii-menu' as const,
    device,
    screen: s.slug,
    title: s.title,
    interactive: false,
    ...WII_MENU_TAGS[s.slug]!,
  })),
])
