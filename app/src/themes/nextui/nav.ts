import { BROWSER, CHEAT_CODES, viewBySlug, type Hint } from './library'
import { PALETTES } from './palette'

/**
 * The menu's navigation, as a pure reducer.
 *
 * Every transition here is `menu->next_mode = MENU_MODE_*` from the view's own source, not a
 * guess: `browser.c` opens a ROM into the load screen and `START` into the settings editor,
 * `nextui_colors.c` opens row 0 into the palette picker and the slot rows into the colour editor,
 * `settings_editor.c` opens its `ROW_VIEW` rows into whichever mode each row names.
 *
 * **Back is a stack rather than a table.** The source keeps an origin per screen -
 * `nextui_origin_mode`, `origin_mode`, `load_origin_mode` - each recording the screen its owner
 * was opened from so `B` returns there. A stack says the same thing once, and gets the cases
 * those three variables exist to handle right for free: Settings opened from Favorites returns to
 * Favorites, and the colour editor returns through the hub to Settings to wherever Settings came
 * from.
 *
 * A reducer rather than a tangle of `useState` because this is the part of the theme most worth
 * testing, and a pure function of (state, button) is the only shape that can be.
 */

/** What a row in a context menu does when it is chosen. */
export interface MenuItem {
  readonly text: string
  /** The view it opens, if any. A row with none is inert here - it acts on the SD card. */
  readonly view?: string
}

export type Overlay =
  | {
      readonly kind: 'menu'
      readonly title?: string
      readonly items: readonly MenuItem[]
      readonly selected: number
    }
  | { readonly kind: 'message'; readonly text: string }
  /** The staged loading bar the menu draws while a ROM is read off the card. */
  | { readonly kind: 'loading'; readonly progress: number; readonly message: string }

export interface Frame {
  readonly view: string
  readonly cursor: number
}

export interface NavState {
  readonly view: string
  readonly cursor: number
  /** Where `B` goes, innermost last. */
  readonly stack: readonly Frame[]
  readonly overlay: Overlay | null
  /** Settings the live build can actually change, since `A` on those rows says it changes them. */
  readonly palette: string
  readonly titlePill: boolean
  readonly background: boolean
  readonly toggles: Readonly<Record<string, boolean>>
  readonly cheats: readonly boolean[]
  readonly paused: boolean
  /** Which slot the colour editor is editing, so its title is that slot's name. */
  readonly slot: number
}

export type NavButton =
  'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select' | 'l' | 'r'

export function initialState(
  view: string,
  cursor: number,
  palette: string,
  titlePill: boolean,
  background: boolean,
): NavState {
  return {
    view,
    cursor,
    stack: [],
    overlay: null,
    palette,
    titlePill,
    background,
    toggles: {},
    cheats: CHEAT_CODES.map((c) => c.enabled),
    paused: false,
    slot: 0,
  }
}

/* ---- the context menus ------------------------------------------------- */

/** `entry_context_menu` in `browser.c`. */
export const ENTRY_MENU: readonly MenuItem[] = [
  { text: 'Show entry properties', view: 'file-info' },
  { text: 'Add to favorites' },
  { text: 'Add to collection' },
  { text: 'Delete selected entry' },
  { text: 'Set current directory as default' },
]

/** `options_context_menu` in `load_rom.c`. */
export const LOAD_MENU: readonly MenuItem[] = [
  { text: 'Set CIC Type' },
  { text: 'Set Save Type' },
  { text: 'Set TV Type' },
  { text: 'Use Cheats' },
  { text: 'Datel Code Editor', view: 'datel-code-editor' },
  { text: 'Add to favorites' },
]

/** `settings_context_menu` - the classic theme's Start menu, reused for the Pak manager's `R`. */
export const CPAK_MENU: readonly MenuItem[] = [
  { text: 'Backup Controller Pak' },
  { text: 'Restore Controller Pak' },
  { text: 'Format Controller Pak' },
]

function menuFor(view: string): readonly MenuItem[] | null {
  if (view === 'browser' || view === 'history-favorites') return ENTRY_MENU
  if (view === 'load-rom' || view === 'load-disk') return LOAD_MENU
  if (view === 'cpakfs-manager') return CPAK_MENU
  if (view === 'datel-code-editor') return LOAD_MENU
  return null
}

/* ---- what A does ------------------------------------------------------- */

/**
 * The settings rows that open another screen, and which one.
 *
 * `nextui_rows[]` gives each `ROW_VIEW` row a `view_mode`; these are those five, in row order.
 */
const SETTINGS_TARGETS: Readonly<Record<number, string>> = {
  0: 'rtc',
  1: 'credits',
  2: 'flashcart-info',
  3: 'system-info',
  5: 'menu-colors',
}

/** How far the cursor may travel on a view. */
export function limitFor(state: NavState): number {
  const def = viewBySlug(state.view)
  if (def.kind === 'palette') return PALETTES.length
  if (def.slug === 'browser') return BROWSER.length
  return def.items ?? 1
}

function push(state: NavState, view: string, cursor = 0): NavState {
  return {
    ...state,
    stack: [...state.stack, { view: state.view, cursor: state.cursor }],
    view,
    cursor,
    overlay: null,
  }
}

function pop(state: NavState): NavState {
  const previous = state.stack[state.stack.length - 1]
  if (!previous) return { ...state, overlay: null }
  return {
    ...state,
    view: previous.view,
    cursor: previous.cursor,
    stack: state.stack.slice(0, -1),
    overlay: null,
  }
}

/** `A` inside an open context menu: take the row, or close if it does nothing here. */
function chooseMenuItem(state: NavState, overlay: Extract<Overlay, { kind: 'menu' }>): NavState {
  const item = overlay.items[overlay.selected]
  if (item?.view) return push({ ...state, overlay: null }, item.view)
  /*
   * Every other row acts on the SD card - deleting a file, writing a collection, formatting a pak.
   * A mockup has no card, so it says so rather than pretending.
   */
  return {
    ...state,
    overlay: { kind: 'message', text: `${item?.text ?? ''}\n\nNot available in the mockup.` },
  }
}

function enter(state: NavState): NavState {
  const def = viewBySlug(state.view)

  switch (def.kind) {
    case 'browser':
    case 'titled-browser': {
      if (def.slug === 'collections') return push(state, 'history-favorites')
      if (def.slug === 'history-favorites') return push(state, 'load-rom')

      const entry = BROWSER[Math.min(state.cursor, BROWSER.length - 1)]
      if (!entry) return state
      /* A folder opens in place rather than pushing a screen: it is still the browser. */
      if (entry.folder) return { ...state, cursor: 0 }
      if (entry.name === 'Menu Jingle') return push(state, 'music-player')
      return push(state, 'load-rom')
    }

    case 'settings': {
      const target = SETTINGS_TARGETS[state.cursor]
      if (target) return push(state, target)
      /* Everything else is a toggle, and `A` flips it in place. */
      const row = String(state.cursor)
      return { ...state, toggles: { ...state.toggles, [row]: !state.toggles[row] } }
    }

    case 'colors': {
      if (state.cursor === 0) return push(state, 'palette-picker')
      if (state.cursor === 8) return { ...state, titlePill: !state.titlePill }
      return push({ ...state, slot: state.cursor - 1 }, 'color-editor')
    }

    /* Apply the highlighted palette and return to the hub, which is what `apply_selected` does. */
    case 'palette':
      return pop({ ...state, palette: PALETTES[Math.min(state.cursor, PALETTES.length - 1)]!.id })

    /* Save and return. The channel values are not editable here - see the porting notes. */
    case 'editor':
      return pop(state)

    case 'load':
      return {
        ...state,
        overlay: { kind: 'loading', progress: 0.35, message: viewBySlug(state.view).title ?? '' },
      }

    case 'cheats': {
      const cheats = state.cheats.map((on, i) => (i === state.cursor ? !on : on))
      return { ...state, cheats }
    }

    case 'music':
      return { ...state, paused: !state.paused }

    case 'image':
      return {
        ...state,
        background: !state.background,
        overlay: { kind: 'message', text: 'Background image set.' },
      }

    case 'cpak':
      return {
        ...state,
        overlay: { kind: 'message', text: 'Backup Controller Pak?\n\nA: Yes, B: Back' },
      }

    default: {
      /* `extract_file` and `rtc` both promise an action; the information screens promise none. */
      if (def.slug === 'extract-file') {
        return { ...state, overlay: { kind: 'message', text: 'Extracted to sd:/games.' } }
      }
      if (def.slug === 'rtc') {
        return {
          ...state,
          overlay: { kind: 'message', text: 'Adjusting the clock is not available in the mockup.' },
        }
      }
      if (def.slug === 'file-info') return push(state, 'cpak-dump-info')
      return state
    }
  }
}

/** `R`. Opens the view's own options menu, or runs the reset its hint pill names. */
function options(state: NavState): NavState {
  const def = viewBySlug(state.view)

  if (def.slug === 'settings-editor') {
    return { ...state, overlay: { kind: 'message', text: 'Reset settings?\n\nA: Yes, B: Back' } }
  }
  if (def.slug === 'menu-colors') {
    return { ...state, palette: 'Default', titlePill: false }
  }
  if (def.slug === 'history-favorites') {
    return {
      ...state,
      overlay: { kind: 'message', text: 'Remove from Favorites?\n\nA: Yes, B: Back' },
    }
  }

  const items = menuFor(def.slug)
  if (!items) return state
  return { ...state, overlay: { kind: 'menu', items, selected: 0 } }
}

/** `START`. Opens Settings from the browser and the list screens; extended info on a load screen. */
function settings(state: NavState): NavState {
  const def = viewBySlug(state.view)
  if (def.kind === 'load') return push(state, 'file-info')
  if (!def.topHints) return state
  return push(state, 'settings-editor')
}

export function reduce(state: NavState, button: NavButton): NavState {
  const overlay = state.overlay

  /* An overlay takes the input while it is up, which is what makes it modal. */
  if (overlay) {
    if (overlay.kind === 'menu') {
      if (button === 'up') {
        return {
          ...state,
          overlay: {
            ...overlay,
            selected: (overlay.selected - 1 + overlay.items.length) % overlay.items.length,
          },
        }
      }
      if (button === 'down') {
        return {
          ...state,
          overlay: { ...overlay, selected: (overlay.selected + 1) % overlay.items.length },
        }
      }
      if (button === 'a') return chooseMenuItem(state, overlay)
      if (button === 'b' || button === 'r') return { ...state, overlay: null }
      return state
    }
    /* A message and the loading bar both take any of A, B or R to dismiss. */
    if (button === 'a' || button === 'b' || button === 'r') return { ...state, overlay: null }
    return state
  }

  switch (button) {
    case 'up':
    case 'down': {
      const limit = limitFor(state)
      const step = button === 'up' ? -1 : 1
      /* NextUI wraps at both ends of a list, and the theme adopts that. */
      return { ...state, cursor: (state.cursor + step + limit) % limit }
    }
    case 'left':
    case 'right': {
      /* `Left`/`Right` page a list, as in NextUI. */
      const limit = limitFor(state)
      const page = button === 'left' ? -9 : 9
      return { ...state, cursor: Math.max(0, Math.min(state.cursor + page, limit - 1)) }
    }
    case 'a':
      return enter(state)
    case 'b':
      return pop(state)
    case 'r':
      return options(state)
    case 'start':
      return settings(state)
    default:
      return state
  }
}

/**
 * The hints a view shows, given the state.
 *
 * Mostly the view's own table, but two screens change their own labels: the browser names the
 * action the highlighted entry takes, and the music player toggles PAUSE and PLAY.
 */
export function hintsFor(state: NavState, group: 'top' | 'left' | 'right'): readonly Hint[] {
  const def = viewBySlug(state.view)
  if (group === 'top') return def.topHints ?? []
  if (group === 'left') {
    /* `mp3player_is_playing() ? "PAUSE" : "PLAY"`. */
    if (def.slug === 'music-player') {
      return [{ button: 'A', label: state.paused ? 'PLAY' : 'PAUSE' }]
    }
    return def.leftHints ?? []
  }

  if (def.slug === 'browser') {
    /* `draw_nextui` picks the label from the highlighted entry's type. */
    const entry = BROWSER[Math.min(state.cursor, BROWSER.length - 1)]
    return [
      { button: 'B', label: 'BACK' },
      { button: 'A', label: entry?.folder ? 'OPEN' : 'PLAY' },
    ]
  }
  return def.rightHints
}
