import type { Button } from '../../input/keymap'
import { GAMES, gamesOf, systemDef, type Game, type LibState } from './library'

/**
 * The tabs past Systems: Search, NeoSync, Achievements, Scraper and RomM. Each is a pure reducer
 * over its own state; `machine.ts` hands them the button and applies what they ask for back - a
 * notification, a route, a launch.
 *
 * **The sample accounts.** The website's frames show a signed-in RetroAchievements user (every
 * game's pill), a signed-in NeoSync user on the Ultra plan (`site-07`) and a signed-in ScreenScraper
 * account scraping with ten threads (`site-09`). RomM is hidden in every frame; it starts signed
 * out, on its connect form. The NeoSync user's name, quota, plan and saves are `site-07`'s; the plan
 * list is the website's own (`neostation-web/src/pages/neosync.astro`).
 */

const wrap = (i: number, n: number) => (n <= 0 ? 0 : ((i % n) + n) % n)
const clamp = (i: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, i))

/** What a tab asks the machine to do besides changing its own state. */
export type Effect =
  | { readonly kind: 'notice'; readonly type: 'info' | 'success' | 'error'; readonly message: string }
  | { readonly kind: 'goto'; readonly game: string }
  | { readonly kind: 'launch'; readonly game: string }

export interface Result<T> {
  readonly state: T
  readonly effects?: readonly Effect[]
}

/* ---- Search --------------------------------------------------------------------------- */

export type FilterKey = 'platform' | 'rating' | 'developer' | 'genre' | 'year' | 'achievements'
/** `search_screen.dart:591-607`; Source only exists with RomM connected, which the sample is not. */
export const FILTER_KEYS: readonly FilterKey[] = ['platform', 'rating', 'developer', 'genre', 'year', 'achievements']

export interface SearchState {
  readonly region: 'search' | 'filters' | 'results' | 'menu' | 'action'
  /** The search band: 0 the field, 1 the Filters toggle (the query is empty, so no clear button). */
  readonly item: number
  readonly expanded: boolean
  readonly chip: number
  readonly row: number
  readonly filters: Partial<Record<FilterKey, string>>
  /** The open value menu, and the value it had when opened (B restores it). */
  readonly menu: { readonly key: FilterKey; readonly was: string | undefined } | null
  readonly action: number
}

export const INITIAL_SEARCH: SearchState = {
  region: 'search',
  item: 0,
  expanded: false,
  chip: 0,
  row: 0,
  filters: {},
  menu: null,
  action: 0,
}

/** The rating bucket the Search tab filters by: the stored 0-20, halved, rounded, 1-10. */
export const ratingOf = (g: Game) => (g.scraped?.rating ? clamp(Math.round(g.scraped.rating / 2), 1, 10) : 0)
const achievementsOf = (g: Game) => (g.cheevos?.total ? 'matched' : 'unknown')

function facet(g: Game, key: FilterKey): string | null {
  switch (key) {
    case 'platform':
      return systemDef(g.system).name
    case 'rating':
      return ratingOf(g) ? String(ratingOf(g)) : null
    case 'developer':
      return g.scraped?.developer ?? null
    case 'genre':
      return g.scraped?.genre ?? null
    case 'year':
      return g.scraped?.year ?? null
    case 'achievements':
      return achievementsOf(g)
  }
}

function matches(g: Game, filters: SearchState['filters'], skip?: FilterKey): boolean {
  return FILTER_KEYS.every((k) => k === skip || filters[k] === undefined || facet(g, k) === filters[k])
}

/** The whole library for an empty query, less hidden games, by name (`search_filter.dart:223-228`). */
export function searchResults(lib: LibState, s: SearchState): Game[] {
  const shown = GAMES.filter((g) => !lib.hidden.includes(g.id) && !lib.deleted.includes(g.id))
  return shown.filter((g) => matches(g, s.filters)).sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()))
}

/** A filter's options, faceted on every other active filter (`search_filter.dart:370-379`). */
export function filterOptions(lib: LibState, s: SearchState, key: FilterKey): string[] {
  const pool = GAMES.filter((g) => !lib.hidden.includes(g.id) && !lib.deleted.includes(g.id) && matches(g, s.filters, key))
  const values = [...new Set(pool.map((g) => facet(g, key)).filter((v): v is string => v !== null))]
  if (key === 'year') return values.sort((a, b) => b.localeCompare(a))
  if (key === 'rating') return values.sort((a, b) => Number(a) - Number(b))
  if (key === 'achievements') return ['matched', 'noSet', 'unknown'].filter((v) => values.includes(v))
  return values.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
}

/** The chips on the row: each filter with options or a value, then Clear. */
export function searchChips(lib: LibState, s: SearchState): (FilterKey | 'clear')[] {
  return [...FILTER_KEYS.filter((k) => s.filters[k] !== undefined || filterOptions(lib, s, k).length), 'clear']
}

export const activeFilters = (s: SearchState) => FILTER_KEYS.filter((k) => s.filters[k] !== undefined).length

export function reduceSearch(s: SearchState, lib: LibState, button: Button): Result<SearchState> {
  const results = searchResults(lib, s)
  const chips = searchChips(lib, s)
  switch (s.region) {
    case 'menu': {
      const m = s.menu!
      const values = [undefined, ...filterOptions(lib, { ...s, filters: { ...s.filters, [m.key]: undefined } }, m.key)]
      const at = values.indexOf(s.filters[m.key])
      switch (button) {
        // Moving changes the value itself, a live preview (`search_screen.dart:1054-1071`).
        case 'up':
        case 'down': {
          const next = values[wrap(at + (button === 'up' ? -1 : 1), values.length)]
          return { state: { ...s, filters: { ...s.filters, [m.key]: next }, row: 0 } }
        }
        case 'a':
          return { state: { ...s, region: 'filters', menu: null } }
        case 'b':
          return { state: { ...s, region: 'filters', menu: null, filters: { ...s.filters, [m.key]: m.was } } }
        default:
          return { state: s }
      }
    }
    case 'action': {
      const g = results[s.row]
      switch (button) {
        case 'up':
        case 'down':
          return { state: { ...s, action: wrap(s.action + (button === 'up' ? -1 : 1), 2) } }
        case 'a':
          if (!g) return { state: s }
          return { state: { ...s, region: 'results' }, effects: [{ kind: s.action === 0 ? 'goto' : 'launch', game: g.id }] }
        case 'b':
          return { state: { ...s, region: 'results' } }
        default:
          return { state: s }
      }
    }
    case 'search':
      switch (button) {
        case 'left':
        case 'right':
          return { state: { ...s, item: clamp(s.item + (button === 'left' ? -1 : 1), 0, 1) } }
        case 'down':
          if (s.expanded) return { state: { ...s, region: 'filters' } }
          return results.length ? { state: { ...s, region: 'results' } } : { state: s }
        case 'a':
          if (s.item === 1) return { state: { ...s, expanded: !s.expanded, region: s.expanded ? 'search' : 'filters', chip: 0 } }
          return { state: s }
        default:
          return { state: s }
      }
    case 'filters':
      switch (button) {
        case 'left':
        case 'right':
          return { state: { ...s, chip: wrap(s.chip + (button === 'left' ? -1 : 1), chips.length) } }
        case 'up':
        case 'b':
          return { state: { ...s, region: 'search' } }
        case 'down':
          return results.length ? { state: { ...s, region: 'results' } } : { state: s }
        case 'a': {
          const chip = chips[s.chip]
          if (chip === 'clear') return { state: { ...s, filters: {}, row: 0 } }
          if (!chip) return { state: s }
          return { state: { ...s, region: 'menu', menu: { key: chip, was: s.filters[chip] } } }
        }
        default:
          return { state: s }
      }
    case 'results':
      switch (button) {
        case 'up':
          if (s.row === 0) return { state: { ...s, region: s.expanded ? 'filters' : 'search' } }
          return { state: { ...s, row: s.row - 1 } }
        case 'down':
          return { state: { ...s, row: Math.min(results.length - 1, s.row + 1) } }
        case 'left':
          return { state: { ...s, region: 'search', item: 0 } }
        case 'right':
          return { state: { ...s, region: 'search', item: 1 } }
        case 'a':
          return results[s.row] ? { state: { ...s, region: 'action', action: 0 } } : { state: s }
        case 'b':
          return { state: { ...s, region: 'search' } }
        default:
          return { state: s }
      }
  }
}

/* ---- RetroAchievements -------------------------------------------------------------------- */

export interface RaState {
  readonly signedIn: boolean
  /** Signed out: the form's slot - username, API key, Get API Key, Login. */
  readonly slot: number
  /** The username is prefilled from the last saved user; logging out clears it. */
  readonly savedUser: string
  /** Signed in: the logout button is selected, and its confirm is up. */
  readonly logout: boolean
  readonly confirm: boolean
  /** The dashboard's scroll, in 160.r steps. */
  readonly scroll: number
}

export const RA_USER = 'Kezona'

export const INITIAL_RA: RaState = { signedIn: true, slot: 0, savedUser: RA_USER, logout: false, confirm: false, scroll: 0 }

export function reduceRa(s: RaState, button: Button): Result<RaState> {
  if (!s.signedIn) {
    switch (button) {
      case 'up':
      case 'down':
        return { state: { ...s, slot: wrap(s.slot + (button === 'up' ? -1 : 1), 4) } }
      case 'a':
        // The fields stay empty with no keyboard, so Login reports what the source reports.
        if (s.slot === 3) return { state: s, effects: [{ kind: 'notice', type: 'error', message: 'Please complete all fields' }] }
        return { state: s }
      default:
        return { state: s }
    }
  }
  if (s.confirm) {
    if (button === 'a')
      return {
        state: { ...INITIAL_RA, signedIn: false, savedUser: '' },
        effects: [{ kind: 'notice', type: 'success', message: 'Disconnected from RetroAchievements' }],
      }
    if (button === 'b') return { state: { ...s, confirm: false } }
    return { state: s }
  }
  switch (button) {
    case 'up':
      return { state: { ...s, logout: false, scroll: Math.max(0, s.scroll - 1) } }
    case 'down':
      return { state: { ...s, logout: false, scroll: s.scroll + 1 } }
    case 'right':
      return { state: { ...s, logout: true, scroll: 0 } }
    case 'left':
      return { state: { ...s, logout: false } }
    case 'a':
      return s.logout ? { state: { ...s, confirm: true } } : { state: s }
    default:
      return { state: s }
  }
}

/* ---- NeoSync -------------------------------------------------------------------------------- */

export interface Save {
  readonly path: string
  readonly size: string
  readonly date: string
  readonly system: string
  readonly emulator: string
}

/** The saves `site-07.webp` lists. */
export const SAVES: readonly Save[] = [
  { path: "saves/Beetle PSX HW/King of Fighters '98, The - Dream Match Never Ends (USA).1.mcr", size: '128.0 KB', date: '2026-07-16', system: 'PS1', emulator: 'Beetle PSX HW' },
  { path: "saves/Beetle PSX HW/King of Fighters '98, The - Dream Match Never Ends (USA).srm", size: '128.0 KB', date: '2026-07-16', system: 'PS1', emulator: 'Beetle PSX HW' },
  { path: 'saves/Beetle PSX HW/Final Fantasy VII (USA).1.mcr', size: '128.0 KB', date: '2026-07-15', system: 'PS1', emulator: 'Beetle PSX HW' },
  { path: 'saves/Beetle PSX HW/Final Fantasy VII (USA).srm', size: '128.0 KB', date: '2026-07-15', system: 'PS1', emulator: 'Beetle PSX HW' },
  { path: 'saves/Beetle PSX HW/Bust A Groove (USA).1.mcr', size: '128.0 KB', date: '2026-07-15', system: 'PS1', emulator: 'Beetle PSX HW' },
  { path: 'saves/Beetle PSX HW/Bust A Groove (USA).srm', size: '128.0 KB', date: '2026-07-15', system: 'PS1', emulator: 'Beetle PSX HW' },
]

export interface Plan {
  readonly id: 'micro' | 'mini' | 'mega' | 'ultra'
  readonly name: string
  readonly storage: string
  readonly price: string
}

/** Every plan but free, cheapest first (`plan_selection_view.dart:53-62`), as the website prices them. */
export const PLANS: readonly Plan[] = [
  { id: 'micro', name: 'Micro', storage: '16 MB', price: '2' },
  { id: 'mini', name: 'Mini', storage: '64 MB', price: '3' },
  { id: 'mega', name: 'Mega', storage: '256 MB', price: '4' },
  { id: 'ultra', name: 'Ultra', storage: '1 GB', price: '5' },
]

export const SYNC_USER = { name: 'Kezona', plan: 'ultra' as const, used: '88.4 MB', total: '1.0 GB', pct: 8.6 }

export interface SyncState {
  readonly signedIn: boolean
  readonly section: 'dashboard' | 'saves' | 'folders' | 'plans'
  readonly menu: number
  /** Signed out: the form's slot - email, password, Login, Sign Up link, Forgot link. */
  readonly slot: number
  readonly saveRow: number
  readonly planRow: number
  readonly confirm: 'logout' | 'delete' | 'cancelPlan' | null
  readonly saves: readonly Save[]
  readonly refreshed: boolean
}

export const INITIAL_SYNC: SyncState = {
  signedIn: true,
  section: 'dashboard',
  menu: 0,
  slot: 0,
  saveRow: 0,
  planRow: PLANS.findIndex((p) => p.id === 'ultra'),
  confirm: null,
  saves: SAVES,
  refreshed: false,
}

export function reduceSync(s: SyncState, button: Button): Result<SyncState> {
  if (!s.signedIn) {
    switch (button) {
      case 'up':
      case 'down':
        return { state: { ...s, slot: wrap(s.slot + (button === 'up' ? -1 : 1), 5) } }
      case 'a':
        if (s.slot === 2) return { state: s, effects: [{ kind: 'notice', type: 'error', message: 'Please enter email' }] }
        return { state: s }
      default:
        return { state: s }
    }
  }
  if (s.confirm) {
    if (button === 'b') return { state: { ...s, confirm: null } }
    if (button !== 'a') return { state: s }
    if (s.confirm === 'logout') return { state: { ...INITIAL_SYNC, signedIn: false } }
    if (s.confirm === 'delete') {
      const saves = s.saves.filter((_, i) => i !== s.saveRow)
      return {
        state: { ...s, confirm: null, saves, saveRow: Math.min(s.saveRow, Math.max(0, saves.length - 1)) },
        effects: [{ kind: 'notice', type: 'success', message: 'Save file deleted successfully' }],
      }
    }
    // Ending the subscription opens the checkout site in the source; here it stops at the confirm.
    return { state: { ...s, confirm: null } }
  }
  switch (s.section) {
    case 'dashboard':
      switch (button) {
        case 'up':
        case 'down':
          return { state: { ...s, menu: wrap(s.menu + (button === 'up' ? -1 : 1), 3) } }
        case 'a':
          return { state: { ...s, section: (['saves', 'folders', 'plans'] as const)[s.menu]! } }
        case 'y':
          return { state: { ...s, section: 'plans' } }
        case 'x':
          return { state: { ...s, confirm: 'logout' } }
        default:
          return { state: s }
      }
    case 'saves':
      switch (button) {
        case 'up':
        case 'down':
          return { state: { ...s, saveRow: wrap(s.saveRow + (button === 'up' ? -1 : 1), s.saves.length) } }
        case 'a':
        case 'select':
          return s.saves.length ? { state: { ...s, confirm: 'delete' } } : { state: s }
        case 'x':
          return { state: { ...s, refreshed: true } }
        case 'b':
        case 'y':
          return { state: { ...s, section: 'dashboard', refreshed: false } }
        default:
          return { state: s }
      }
    case 'folders':
      return button === 'b' ? { state: { ...s, section: 'dashboard' } } : { state: s }
    case 'plans':
      switch (button) {
        case 'up':
        case 'down':
          return { state: { ...s, planRow: wrap(s.planRow + (button === 'up' ? -1 : 1), PLANS.length) } }
        case 'a':
          return PLANS[s.planRow]!.id === SYNC_USER.plan ? { state: { ...s, confirm: 'cancelPlan' } } : { state: s }
        case 'b':
          return { state: { ...s, section: 'dashboard' } }
        default:
          return { state: s }
      }
  }
}

/* ---- Scraper -------------------------------------------------------------------------------- */

export const SCRAPER_MENU = ['account', 'scraping', 'scrapeMode', 'media', 'region', 'language', 'systems'] as const
export type ScraperEntry = (typeof SCRAPER_MENU)[number]

export const MEDIA_KEYS = ['fanart', 'ss', 'wheel', 'box2D', 'video'] as const
export const REGIONS = ['wor', 'us', 'eu', 'fr', 'sp', 'it', 'de', 'jp', 'kr', 'cn'] as const
export const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt'] as const

/** The systems the Systems grid lists: every real system on the card. */
export const SCRAPE_SYSTEMS = (): string[] =>
  gamesOf('all')
    .map((g) => g.system)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => systemDef(a).name.localeCompare(systemDef(b).name))

export interface ScraperState {
  readonly signedIn: boolean
  readonly slot: number
  readonly menu: number
  readonly inContent: boolean
  readonly item: number
  readonly mode: 'new_only' | 'all'
  readonly media: Readonly<Record<(typeof MEDIA_KEYS)[number], boolean>>
  readonly regions: readonly string[]
  readonly moving: boolean
  readonly language: (typeof LANGUAGES)[number]
  readonly disabledSystems: readonly string[]
  readonly running: boolean
  readonly confirm: boolean
}

export const INITIAL_SCRAPER: ScraperState = {
  signedIn: true,
  slot: 0,
  menu: 0,
  inContent: false,
  item: 0,
  mode: 'new_only',
  media: { fanart: true, ss: true, wheel: true, box2D: true, video: true },
  regions: REGIONS,
  moving: false,
  language: 'en',
  disabledSystems: [],
  running: false,
  confirm: false,
}

/** How many items a menu entry's content has (`new_scraper_options_screen.dart:338-352`). */
export function scraperItems(s: ScraperState): number {
  switch (SCRAPER_MENU[s.menu]) {
    case 'account':
    case 'scraping':
      return 1
    case 'scrapeMode':
      return 2
    case 'media':
      return 5
    case 'region':
      return REGIONS.length
    case 'language':
      return 6
    case 'systems':
      return 1 + SCRAPE_SYSTEMS().length
    default:
      return 0
  }
}

/** The Systems grid is five cards a row under the toggle-all button (index 0). */
function systemsMove(item: number, n: number, button: Button): number {
  const cards = n - 1
  const cols = 5
  const rows = Math.ceil(cards / cols)
  if (item === 0) {
    if (button === 'down') return 1
    if (button === 'up') return 1 + (rows - 1) * cols
    return 0
  }
  const i = item - 1
  const row = Math.floor(i / cols)
  const col = i % cols
  switch (button) {
    case 'down':
      return row + 1 < rows ? 1 + Math.min(cards - 1, i + cols) : 0
    case 'up':
      return row === 0 ? 0 : 1 + i - cols
    case 'right':
      return 1 + (col + 1 < cols && i + 1 < cards ? i + 1 : row * cols)
    case 'left':
      return 1 + i - 1
    default:
      return item
  }
}

export function reduceScraper(s: ScraperState, button: Button): Result<ScraperState> {
  if (!s.signedIn) {
    switch (button) {
      case 'up':
      case 'down':
        return { state: { ...s, slot: wrap(s.slot + (button === 'up' ? -1 : 1), 3) } }
      case 'a':
        if (s.slot === 2) return { state: s, effects: [{ kind: 'notice', type: 'error', message: 'Please complete all fields' }] }
        return { state: s }
      default:
        return { state: s }
    }
  }
  if (s.confirm) {
    if (button === 'a') return { state: { ...INITIAL_SCRAPER, signedIn: false }, effects: [{ kind: 'notice', type: 'success', message: 'Successfully logged out' }] }
    if (button === 'b') return { state: { ...s, confirm: false } }
    return { state: s }
  }
  const entry = SCRAPER_MENU[s.menu]!
  const n = scraperItems(s)
  if (!s.inContent) {
    switch (button) {
      case 'up':
      case 'down':
        return { state: { ...s, menu: wrap(s.menu + (button === 'up' ? -1 : 1), SCRAPER_MENU.length), item: 0 } }
      case 'right':
        return n ? { state: { ...s, inContent: true, item: 0 } } : { state: s }
      default:
        return { state: s }
    }
  }
  // Region: A picks an item up, and while it is held Up/Down carry it; A, B or Left drop it.
  if (entry === 'region' && s.moving) {
    if (button === 'a' || button === 'b' || button === 'left') return { state: { ...s, moving: false } }
    if (button !== 'up' && button !== 'down') return { state: s }
    const to = s.item + (button === 'up' ? -1 : 1)
    if (to < 0 || to >= s.regions.length) return { state: s }
    const regions = [...s.regions]
    ;[regions[s.item], regions[to]] = [regions[to]!, regions[s.item]!]
    return { state: { ...s, regions, item: to } }
  }
  switch (button) {
    case 'up':
    case 'down':
      if (entry === 'systems') return { state: { ...s, item: systemsMove(s.item, n, button) } }
      return { state: { ...s, item: clamp(s.item + (button === 'up' ? -1 : 1), 0, n - 1) } }
    case 'right':
      if (entry === 'systems' && s.item > 0) return { state: { ...s, item: systemsMove(s.item, n, button) } }
      return { state: s }
    case 'left':
      if (entry === 'systems' && s.item > 0 && (s.item - 1) % 5 !== 0) return { state: { ...s, item: systemsMove(s.item, n, button) } }
      return { state: { ...s, inContent: false, item: 0 } }
    case 'a':
      switch (entry) {
        case 'account':
          return { state: { ...s, confirm: true } }
        case 'scraping':
          return { state: { ...s, running: !s.running } }
        case 'scrapeMode': {
          const mode = s.item === 0 ? 'new_only' : 'all'
          return {
            state: { ...s, mode },
            effects: [{ kind: 'notice', type: 'success', message: `Scrape mode updated to: ${mode === 'new_only' ? 'New content only' : 'All content'}` }],
          }
        }
        case 'media': {
          const key = MEDIA_KEYS[s.item]!
          return { state: { ...s, media: { ...s.media, [key]: !s.media[key] } } }
        }
        case 'region':
          return { state: { ...s, moving: true } }
        case 'language':
          return { state: { ...s, language: LANGUAGES[s.item]! } }
        case 'systems': {
          const all = SCRAPE_SYSTEMS()
          if (s.item === 0) return { state: { ...s, disabledSystems: s.disabledSystems.length ? [] : all } }
          const id = all[s.item - 1]!
          const off = s.disabledSystems.includes(id)
          return { state: { ...s, disabledSystems: off ? s.disabledSystems.filter((x) => x !== id) : [...s.disabledSystems, id] } }
        }
      }
      return { state: s }
    default:
      return { state: s }
  }
}

/* ---- RomM ---------------------------------------------------------------------------------- */

export interface RommState {
  readonly mode: 'password' | 'apikey'
  readonly slot: number
}

export const INITIAL_ROMM: RommState = { mode: 'password', slot: 0 }

/** `[url, switch, user, password, Login]`, or `[url, switch, apiKey, Login]` (`romm_connect_content.dart:73-80`). */
export const rommSlots = (s: RommState) => (s.mode === 'password' ? 5 : 4)

export function reduceRomm(s: RommState, button: Button): Result<RommState> {
  const n = rommSlots(s)
  switch (button) {
    case 'up':
    case 'down':
      return { state: { ...s, slot: wrap(s.slot + (button === 'up' ? -1 : 1), n) } }
    case 'left':
    case 'right':
      if (s.slot !== 1) return { state: s }
      return { state: { ...s, mode: button === 'left' ? 'password' : 'apikey' } }
    case 'a':
      if (s.slot === 1) {
        const mode = s.mode === 'password' ? 'apikey' : 'password'
        return { state: { ...s, mode, slot: 1 } }
      }
      if (s.slot === n - 1)
        return {
          state: s,
          effects: [
            {
              kind: 'notice',
              type: 'error',
              message: s.mode === 'password' ? 'Enter the server URL, username and password' : 'Enter the server URL and API key',
            },
          ],
        }
      return { state: s }
    default:
      return { state: s }
  }
}
