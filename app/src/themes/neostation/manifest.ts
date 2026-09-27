import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import type { Seed } from './machine'
import { SCAN_POSE } from './wizard'

/**
 * Two devices, one per display the source is laid out for: the 640x480 its design size describes,
 * on a Linux handheld, and the 1920x1080 of the website's frames, on an Android one.
 */
export const NEOSTATION_DEVICES: readonly DeviceSlug[] = ['odin2-mini', 'rg40xx']

export interface NeoScreenDef {
  readonly slug: string
  readonly title: string
  readonly seed: Seed
  /** The devices it exists on, when not both: the Android apps grid is the Android device's only. */
  readonly devices?: readonly DeviceSlug[]
}

/** The Search and RomM tabs are hidden in every website frame (Settings > General). */
const SITE = { hidden: ['search', 'romm'] } as const

/**
 * The stills. `systems` is the live build's opening screen - the source's defaults, every tab
 * visible - and the settle pair. The others are posed like their reference frames where one exists.
 */
export const NEOSTATION_SCREENS: readonly NeoScreenDef[] = [
  { slug: 'systems', title: 'Systems', seed: {} },
  {
    slug: 'systems-year',
    title: 'Systems, by year',
    seed: { ...SITE, size: 'S', sortBy: 'year', sel: 1 },
  },
  // site-01: Goodboy Galaxy on the Game Boy Advance list, dark.
  { slug: 'games', title: 'Games', seed: { games: { system: 'gba', sel: 3 } } },
  // site-06: Mega Man: The Power Battle's info tab, CPS1.
  { slug: 'game-info', title: 'Game info', seed: { games: { system: 'cps1', sel: 9 }, detailTab: 'gameInfo' } },
  // site-04: 19XX's achievements, the seventh badge focused, CPS2.
  {
    slug: 'game-achievements',
    title: 'Achievements tab',
    seed: { games: { system: 'cps2', sel: 1, cheevo: 6 }, detailTab: 'achievements' },
  },
  // site-05: Bishoujo Senshi Sailor Moon in Valentine.
  {
    slug: 'games-valentine',
    title: 'Games, Valentine',
    seed: { theme: 'valentine', games: { system: 'snes', sel: 16 } },
  },
  // site-08: Boogerman in Abyss.
  { slug: 'games-abyss', title: 'Games, Abyss', seed: { theme: 'abyss', games: { system: 'snes', sel: 0 } } },
  // site-10: Bubble Bobble in Retro.
  { slug: 'games-retro', title: 'Games, Retro', seed: { theme: 'retro', games: { system: 'gba', sel: 0 } } },
  { slug: 'games-grid', title: 'Games, grid', seed: { games: { system: 'snes', sel: 3 }, gameView: 'grid' } },
  {
    slug: 'games-carousel',
    title: 'Games, carousel',
    seed: { games: { system: 'gba', sel: 3 }, gameView: 'carousel' },
  },
  {
    slug: 'game-dropdown',
    title: 'Games view mode',
    seed: { games: { system: 'gba', sel: 3 }, overlays: [{ kind: 'game-dropdown', focus: 0 }] },
  },
  {
    slug: 'game-menu',
    title: 'Game menu',
    seed: { games: { system: 'gba', sel: 3 }, overlays: [{ kind: 'game-menu', focus: 2, sub: 0 }] },
  },
  {
    slug: 'game-settings',
    title: 'Game Settings',
    seed: {
      games: { system: 'gba', sel: 3 },
      overlays: [{ kind: 'game-settings', tab: 0, focus: 0, sub: 0, editing: false }],
    },
  },
  {
    slug: 'game-scraping',
    title: 'Game Settings, Scraping',
    seed: {
      games: { system: 'cps1', sel: 9 },
      overlays: [{ kind: 'game-settings', tab: 1, focus: 1, sub: 0, editing: false }],
    },
  },
  {
    slug: 'game-manage',
    title: 'Game Settings, Manage',
    seed: {
      games: { system: 'gba', sel: 3 },
      overlays: [{ kind: 'game-settings', tab: 2, focus: 1, sub: 0, editing: false }],
    },
  },
  {
    slug: 'launch',
    title: 'Launching',
    seed: {
      games: { system: 'gba', sel: 3 },
      overlays: [{ kind: 'launch', game: 'gba:Goodboy Galaxy (World) (v1.3) (Aftermarket).zip', phase: 'launching' }],
    },
  },
  {
    slug: 'random',
    title: 'Random game',
    seed: { games: { system: 'gba', sel: 3 }, overlays: [{ kind: 'random', pick: 9, spinning: false }] },
  },
  { slug: 'android-apps', title: 'Android apps', seed: { apps: true }, devices: ['odin2-mini'] },
  { slug: 'search', title: 'Search', seed: { tab: 'search' } },
  { slug: 'search-filters', title: 'Search, filters', seed: { tab: 'search', search: { expanded: true, region: 'filters', chip: 0, filters: { platform: 'Super Nintendo Entertainment System' } } } },
  { slug: 'search-results', title: 'Search, a result', seed: { tab: 'search', search: { region: 'action', row: 3, action: 0 } } },
  { slug: 'achievements', title: 'Achievements', seed: { tab: 'achievements' } },
  { slug: 'achievements-login', title: 'Achievements, signed out', seed: { tab: 'achievements', ra: { signedIn: false, savedUser: '' } } },
  // site-07 is NeoSync; its older build drew a different dashboard, so this is the current one.
  { slug: 'neosync', title: 'NeoSync', seed: { ...SITE, tab: 'sync' } },
  { slug: 'neosync-saves', title: 'NeoSync, saves', seed: { ...SITE, tab: 'sync', sync: { section: 'saves' } } },
  { slug: 'neosync-plans', title: 'NeoSync, plans', seed: { ...SITE, tab: 'sync', sync: { section: 'plans' } } },
  { slug: 'neosync-login', title: 'NeoSync, signed out', seed: { tab: 'sync', sync: { signedIn: false } } },
  { slug: 'scraper', title: 'Scraper', seed: { tab: 'scraper' } },
  // site-09: a run in progress, in Horizon.
  { slug: 'scraper-running', title: 'Scraping', seed: { ...SITE, theme: 'horizon', tab: 'scraper', scraper: { menu: 1, running: true } } },
  { slug: 'scraper-region', title: 'Scraper, region', seed: { tab: 'scraper', scraper: { menu: 4, inContent: true, item: 1, moving: true } } },
  { slug: 'scraper-systems', title: 'Scraper, systems', seed: { tab: 'scraper', scraper: { menu: 6, inContent: true, item: 3 } } },
  { slug: 'scraper-login', title: 'Scraper, signed out', seed: { tab: 'scraper', scraper: { signedIn: false } } },
  { slug: 'romm', title: 'RomM', seed: { tab: 'romm' } },
  { slug: 'settings', title: 'Settings', seed: { tab: 'settings' } },
  { slug: 'settings-general', title: 'Settings, General', seed: { tab: 'settings', settings: { inPane: true, item: 2 } } },
  { slug: 'settings-directories', title: 'Settings, Directories', seed: { tab: 'settings', settings: { menu: 1, inPane: true, item: 3 } } },
  { slug: 'settings-themes', title: 'Settings, Themes', seed: { tab: 'settings', settings: { menu: 4, inPane: true, item: 4 } } },
  { slug: 'settings-about', title: 'Settings, About', seed: { tab: 'settings', settings: { menu: 6 } } },
  { slug: 'settings-exit', title: 'Settings, Exit', seed: { tab: 'settings', settings: { menu: 7, inPane: true } } },
  // First run: the wizard's steps, then the scan splash the library opens behind.
  { slug: 'wizard', title: 'Setup wizard', seed: { wizard: {} } },
  { slug: 'wizard-permissions', title: 'Setup, permissions', seed: { wizard: { at: 'permissions' } }, devices: ['odin2-mini'] },
  { slug: 'wizard-rom', title: 'Setup, ROM folder', seed: { wizard: { at: 'rom' } } },
  { slug: 'wizard-scan', title: 'Setup, scanning', seed: { wizard: { at: 'scan', romFolder: true, scan: SCAN_POSE } } },
  { slug: 'wizard-esde', title: 'Setup, ES-DE', seed: { wizard: { at: 'esde', romFolder: true, scan: 1 } } },
  { slug: 'wizard-art', title: 'Setup, art pack', seed: { wizard: { at: 'art', romFolder: true, scan: 1 } } },
  { slug: 'splash', title: 'Scanning', seed: { scan: SCAN_POSE } },
  { slug: 'systems-carousel', title: 'Systems, carousel', seed: { ...SITE, view: 'carousel', sel: 5 } },
  {
    slug: 'view-dropdown',
    title: 'View mode',
    seed: { overlays: [{ kind: 'view-dropdown', focus: 0 }] },
  },
  {
    slug: 'context-menu',
    title: 'Options',
    seed: { sel: 3, overlays: [{ kind: 'context-menu', focus: 1, sub: 0 }] },
  },
  {
    slug: 'system-settings',
    title: 'System Settings',
    seed: { sel: 5, overlays: [{ kind: 'system-settings', tab: 0, focus: 0 }] },
  },
  {
    slug: 'system-emulators',
    title: 'System Settings, Emulators',
    seed: { sel: 5, overlays: [{ kind: 'system-settings', tab: 1, focus: 0 }] },
  },
  {
    slug: 'notifications',
    title: 'Notifications',
    seed: { overlays: [{ kind: 'notifications', focus: 0 }] },
  },
]

/** The stills that exist on `device`. */
export const screensFor = (device: DeviceSlug): readonly NeoScreenDef[] =>
  NEOSTATION_SCREENS.filter((s) => !s.devices || s.devices.includes(device))

export const NEOSTATION_MANIFEST: readonly ScreenManifestEntry[] = NEOSTATION_DEVICES.flatMap((device) => [
  {
    theme: 'neostation' as const,
    device,
    screen: 'interactive',
    title: 'Interactive',
    interactive: true,
  },
  ...screensFor(device).map((s) => ({
    theme: 'neostation' as const,
    device,
    screen: s.slug,
    title: s.title,
    interactive: false,
  })),
])
