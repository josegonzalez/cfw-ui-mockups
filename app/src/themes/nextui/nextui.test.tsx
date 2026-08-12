import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { DeviceFrame } from '../../device/DeviceFrame'
import { NextUi } from '.'
import { NEXTUI_SCREENS } from './manifest'
import { applyChromeAction, DEFAULT_SUBSETS } from './Interactive'
import {
  HINT_Y,
  PILL_HEIGHT,
  TITLED_LIST_Y,
  VISIBLE,
  forwardWindow,
  listWindow,
  visibleRows,
} from './layout'
import { marqueeKeyframes, marqueeTiming, MARQUEE_HOLD_MS } from './marquee'
import { PALETTES, SLOT_ORDER, paletteById, paletteVariables, tokens } from './palette'
import { BROWSER, SETTINGS_ROWS, VIEWS, viewBySlug } from './library'
import { ENTRY_MENU, hintsFor, initialState, reduce, type NavButton, type NavState } from './nav'
import { resetTextWidths, textWidth } from './text'

describe('the visible area', () => {
  it('is the display less a symmetric overscan margin', () => {
    // 640x480 with a 32x24 inset. Every coordinate in the theme is derived from these four.
    expect([VISIBLE.x0, VISIBLE.y0, VISIBLE.x1, VISIBLE.y1]).toEqual([32, 24, 608, 456])
    expect([VISIBLE.w, VISIBLE.h]).toEqual([576, 432])
  })

  it('puts the hint bar exactly one pill height above the bottom edge', () => {
    expect(HINT_Y).toBe(VISIBLE.y1 - PILL_HEIGHT)
  })

  it('fits nine 40px rows above the hint bar', () => {
    // The browser draws from the top of the visible area, so the ninth row ends at 384.
    expect(VISIBLE.y0 + 9 * PILL_HEIGHT).toBeLessThanOrEqual(HINT_Y)
  })
})

describe('row counts', () => {
  it('gives Settings one fewer row than a list, because of its description line', () => {
    // (416 - 10 - 40 - 74) / 40 with the footer; (416 - 10 - 74) / 40 without.
    expect(visibleRows(40, 40)).toBe(7)
    expect(visibleRows(40)).toBe(8)
  })

  it('starts a titled list below the title', () => {
    expect(TITLED_LIST_Y).toBe(VISIBLE.y0 + PILL_HEIGHT + 10)
  })
})

describe('the file list window', () => {
  it('does not scroll a list shorter than the window', () => {
    expect(listWindow(0, 4)).toBe(0)
    expect(listWindow(3, 4)).toBe(0)
  })

  it('keeps the cursor inside the window rather than centring it', () => {
    // Moving down from 0 to 8 never scrolls: the ninth row is still on screen.
    for (let i = 0; i < 9; i++) expect(listWindow(i, 14)).toBe(0)
    expect(listWindow(9, 14)).toBe(1)
  })

  it('never leaves a gap at the end of a long list', () => {
    expect(listWindow(13, 14)).toBe(5)
    expect(listWindow(13, 14) + 9).toBe(14)
  })

  it('scrolls back up as soon as the cursor passes the top of the window', () => {
    // The clamp is two-sided, which the forward-only window below is not.
    expect(listWindow(2, 14, 9)).toBe(0)
  })

  it('is never negative for a list shorter than the window', () => {
    // `start > total - rows` fires first with a negative right-hand side; the floor catches it.
    expect(listWindow(0, 2, 9)).toBe(0)
  })
})

describe('the forward-only window', () => {
  it('shows the top of the list until the cursor runs off the bottom', () => {
    expect(forwardWindow(0, 8)).toBe(0)
    expect(forwardWindow(7, 8)).toBe(0)
    expect(forwardWindow(8, 8)).toBe(1)
  })
})

describe('the palette format', () => {
  it('carries eighteen palettes of seven colours each', () => {
    expect(PALETTES).toHaveLength(18)
    for (const p of PALETTES) {
      expect(p.colors).toHaveLength(7)
      for (const c of p.colors) expect(c).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('has unique ids, since the config file stores the id', () => {
    expect(new Set(PALETTES.map((p) => p.id)).size).toBe(PALETTES.length)
  })

  it('maps colour1..colour7 onto the seven named slots in file order', () => {
    const t = tokens(paletteById('Default'))
    expect(SLOT_ORDER.map((slot) => t[slot])).toEqual([...paletteById('Default').colors])
  })

  it('falls back to Default for an id that is not installed', () => {
    expect(paletteById('Not A Palette').id).toBe('Default')
  })

  it('emits one custom property per slot and nothing else', () => {
    const vars = paletteVariables(paletteById('Catppuccin_Mocha'))
    expect(Object.keys(vars)).toHaveLength(SLOT_ORDER.length)
    expect(vars['--nx-bg']).toBe('#1E1E2E')
  })

  it('leaves the title pill off in every built-in, as the source says', () => {
    // `title_pill=1` is an N64FlashcartMenu extension; a palette written for a NextUI device
    // cannot carry it, so none of the eighteen do.
    expect(PALETTES.some((p) => p.titlePill)).toBe(false)
  })
})

describe('the marquee', () => {
  it('does not run for a label that fits', () => {
    expect(marqueeTiming(100, 200)).toBeNull()
    expect(marqueeTiming(200, 200)).toBeNull()
  })

  it('scrolls exactly the overflow, at two pixels a frame', () => {
    const t = marqueeTiming(300, 200)!
    expect(t.distance).toBe(100)
    // 45 frames hold, 50 frames scrolling, 45 frames hold, at 60fps.
    expect(t.durationMs).toBeCloseTo((45 + 50 + 45) * (1000 / 60), 5)
  })

  it('holds at both ends and snaps back with no easing', () => {
    const t = marqueeTiming(300, 200)!
    const frames = marqueeKeyframes(t)
    expect(frames).toContain('0% { transform: translateX(0); }')
    expect(frames).toContain('translateX(-100px)')
    // Both holds are the same length, so the first and last segments are symmetric.
    expect(t.offsets[1]).toBeCloseTo(MARQUEE_HOLD_MS / t.durationMs, 10)
    expect(1 - t.offsets[2]).toBeCloseTo(MARQUEE_HOLD_MS / t.durationMs, 10)
  })

  it('takes twice as long for twice the overflow', () => {
    // The step is constant, so cycle length is not shared between two labels on one screen.
    const near = marqueeTiming(250, 200)!
    const far = marqueeTiming(300, 200)!
    expect(far.durationMs - MARQUEE_HOLD_MS * 2).toBeCloseTo(
      (near.durationMs - MARQUEE_HOLD_MS * 2) * 2,
      5,
    )
  })
})

describe('text measurement', () => {
  it('is zero for an empty string, as the source returns early', () => {
    expect(textWidth('', 20)).toBe(0)
  })

  it('grows with both the string and the size', () => {
    expect(textWidth('AA', 20)).toBeGreaterThan(textWidth('A', 20))
    expect(textWidth('A', 32)).toBeGreaterThan(textWidth('A', 20))
  })

  it('can be discarded when the real font arrives', () => {
    const before = textWidth('Banjo-Kazooie', 20)
    resetTextWidths()
    expect(textWidth('Banjo-Kazooie', 20)).toBe(before)
  })
})

describe('the view table', () => {
  it('covers the twenty-three views that render this theme', () => {
    // The menu has twenty-six; error, fault and startup never draw it.
    expect(VIEWS).toHaveLength(23)
  })

  it('names a source file for every view', () => {
    for (const v of VIEWS) expect(v.source).toMatch(/^views\/\w+\.c$/)
  })

  it('has unique slugs and gallery labels', () => {
    expect(new Set(VIEWS.map((v) => v.slug)).size).toBe(VIEWS.length)
    expect(new Set(VIEWS.map((v) => v.label)).size).toBe(VIEWS.length)
  })

  it('gives every view a right-hand hint group, because every view can be left', () => {
    for (const v of VIEWS) {
      expect(v.rightHints.length).toBeGreaterThan(0)
      expect(v.rightHints.some((h) => h.button === 'B')).toBe(true)
    }
  })

  it('falls back to the browser for an unknown slug', () => {
    expect(viewBySlug('nope').slug).toBe('browser')
  })
})

describe('the settings rows', () => {
  it('carries the description the source shows under the list', () => {
    for (const row of SETTINGS_ROWS) expect(row.description).not.toBe('')
  })

  it('marks rows that lead elsewhere with a chevron rather than a value', () => {
    const dateTime = SETTINGS_ROWS.find((r) => r.label === 'Date-Time Settings')
    expect(dateTime?.value).toBe('>')
  })
})

describe('the interactive subsets', () => {
  it('cycles views in both directions and wraps', () => {
    const first = DEFAULT_SUBSETS
    const back = applyChromeAction(first, 'prevView')
    expect(back.view).toBe(VIEWS[VIEWS.length - 1]!.slug)
    expect(applyChromeAction(back, 'nextView').view).toBe(first.view)
  })

  it('cycles palettes and wraps', () => {
    const back = applyChromeAction(DEFAULT_SUBSETS, 'prevSubsetA')
    expect(back.palette).toBe(PALETTES[PALETTES.length - 1]!.id)
  })

  it('toggles the title pill and the background image', () => {
    expect(applyChromeAction(DEFAULT_SUBSETS, 'toggleStyle').titlePill).toBe(true)
    expect(applyChromeAction(DEFAULT_SUBSETS, 'cycleSecondary').background).toBe(true)
  })

  it('ignores an action it does not bind', () => {
    expect(applyChromeAction(DEFAULT_SUBSETS, 'cycleSystem')).toEqual(DEFAULT_SUBSETS)
  })
})

describe('the manifest', () => {
  it('poses every view, then five palette and treatment variants', () => {
    expect(NEXTUI_SCREENS).toHaveLength(VIEWS.length + 5)
  })

  it('has unique slugs, since they become route ids', () => {
    expect(new Set(NEXTUI_SCREENS.map((s) => s.slug)).size).toBe(NEXTUI_SCREENS.length)
  })

  it('only poses views that exist', () => {
    for (const s of NEXTUI_SCREENS) {
      expect(VIEWS.some((v) => v.slug === s.view)).toBe(true)
    }
  })

  it('only names palettes that are installed', () => {
    for (const s of NEXTUI_SCREENS) {
      if (s.palette) expect(PALETTES.some((p) => p.id === s.palette)).toBe(true)
    }
  })
})

describe('rendering', () => {
  function draw(props: Parameters<typeof NextUi>[0]) {
    return render(
      <DeviceFrame device="n64" animate={false} interactive={false}>
        <NextUi {...props} />
      </DeviceFrame>,
    )
  }

  it('renders every view without throwing', () => {
    for (const v of VIEWS) {
      const { container, unmount } = draw({ view: v.slug })
      expect(container.querySelector(`[data-view="${v.slug}"]`)).not.toBeNull()
      unmount()
    }
  })

  it('renders every palette without throwing', () => {
    for (const p of PALETTES) {
      const { container, unmount } = draw({ view: 'browser', palette: p.id })
      expect(container.querySelector(`[data-palette="${p.id}"]`)).not.toBeNull()
      unmount()
    }
  })

  it('draws the browser with no title, and Collections with one', () => {
    // The browser's first row starts at the top of the visible area; a title would push it down.
    expect(viewBySlug('browser').title).toBeNull()
    expect(viewBySlug('collections').title).toBe('Collections')
  })

  it('previews the highlighted palette rather than the applied one', () => {
    const { container } = draw({ view: 'palette-picker', selected: 3, palette: 'Default' })
    expect(container.querySelector('.nx')?.getAttribute('data-palette')).toBe(PALETTES[3]!.id)
  })

  it('never draws a background image on the palette picker', () => {
    // It clears flat in the previewed background colour, so that slot is always visible.
    const { container } = draw({ view: 'palette-picker', background: true })
    expect(container.querySelector('.nx-bg-image')).toBeNull()
  })

  it('draws the background image with the menu’s own overlay when one is set', () => {
    const { container } = draw({ view: 'browser', background: true })
    expect(container.querySelector('.nx-bg-image')).not.toBeNull()
    expect(container.querySelector('.nx-bg-overlay')).not.toBeNull()
  })

  it('lists every browser entry it has room for', () => {
    const { container } = draw({ view: 'browser' })
    const labels = [...container.querySelectorAll('.nx-text, .nx-marquee__text')].map(
      (n) => n.textContent,
    )
    expect(labels).toContain(BROWSER[0]!.name)
    expect(labels).toContain(BROWSER[8]!.name)
    // The tenth entry is past the ninth row and must not be drawn.
    expect(labels).not.toContain(BROWSER[9]!.name)
  })
})

describe('navigation', () => {
  const start = () => initialState('browser', 0, 'Default', false, false)
  const walk = (state: NavState, ...buttons: NavButton[]) => buttons.reduce(reduce, state)

  it('opens a ROM into the load screen and comes back to the row it left', () => {
    // `browser.c`: ENTRY_TYPE_ROM -> MENU_MODE_LOAD_ROM.
    const onRom = walk(start(), 'down', 'down', 'down', 'down', 'down')
    expect(BROWSER[onRom.cursor]?.name).toBe('Wave Race 64')

    const load = reduce(onRom, 'a')
    expect(load.view).toBe('load-rom')

    const back = reduce(load, 'b')
    expect(back.view).toBe('browser')
    expect(back.cursor).toBe(onRom.cursor)
  })

  it('opens a folder in place rather than pushing a screen', () => {
    // A folder is still the browser, so B from inside it must not land on the load screen.
    const opened = reduce(start(), 'a')
    expect(opened.view).toBe('browser')
    expect(opened.stack).toHaveLength(0)
  })

  it('opens the music player from the one music entry', () => {
    const onMusic = walk(start(), 'down', 'down', 'down', 'down')
    expect(BROWSER[onMusic.cursor]?.name).toBe('Menu Jingle')
    expect(reduce(onMusic, 'a').view).toBe('music-player')
  })

  it('walks Settings to Menu Colors to the palette picker', () => {
    const picker = walk(start(), 'start', 'down', 'down', 'down', 'down', 'down', 'a', 'a')
    expect(picker.view).toBe('palette-picker')
    expect(picker.stack.map((f) => f.view)).toEqual(['browser', 'settings-editor', 'menu-colors'])
  })

  it('applies the highlighted palette and returns to the hub', () => {
    // `apply_selected` sets the palette and next_mode = MENU_MODE_NEXTUI_COLORS in one step.
    const picker = walk(start(), 'start', 'down', 'down', 'down', 'down', 'down', 'a', 'a')
    const applied = walk(picker, 'down', 'down', 'down', 'a')
    expect(applied.view).toBe('menu-colors')
    expect(applied.palette).toBe(PALETTES[3]!.id)
  })

  it('unwinds the whole stack one B at a time', () => {
    const deep = walk(start(), 'start', 'down', 'down', 'down', 'down', 'down', 'a', 'a')
    const out = walk(deep, 'b', 'b', 'b')
    expect(out.view).toBe('browser')
    expect(out.stack).toHaveLength(0)
  })

  it('does nothing on B at the root, rather than unwinding past it', () => {
    expect(reduce(start(), 'b').view).toBe('browser')
  })

  it('opens Settings from the screens that advertise START, and no others', () => {
    // `draw_nextui` only draws the START/SETTINGS pill on the browser and the two list screens.
    expect(reduce(start(), 'start').view).toBe('settings-editor')
    const credits = { ...start(), view: 'credits' }
    expect(reduce(credits, 'start').view).toBe('credits')
  })

  it('opens the extended info view from a load screen’s START', () => {
    const load = { ...start(), view: 'load-rom' }
    expect(reduce(load, 'start').view).toBe('file-info')
  })

  it('flips a settings toggle in place and leaves chevron rows alone', () => {
    const settings = reduce(start(), 'start')
    const flipped = walk(settings, 'down', 'down', 'down', 'down', 'down', 'down', 'a')
    expect(flipped.view).toBe('settings-editor')
    expect(flipped.toggles['6']).toBe(true)
  })

  it('toggles the title pill from the Menu Colors row that names it', () => {
    const colors = walk(start(), 'start', 'down', 'down', 'down', 'down', 'down', 'a')
    const toggled = walk(
      colors,
      'down',
      'down',
      'down',
      'down',
      'down',
      'down',
      'down',
      'down',
      'a',
    )
    expect(toggled.titlePill).toBe(true)
    expect(toggled.view).toBe('menu-colors')
  })

  it('resets the colours on R, which is what its hint pill says', () => {
    const colors = walk(start(), 'start', 'down', 'down', 'down', 'down', 'down', 'a')
    const changed = { ...colors, palette: 'MinUI', titlePill: true }
    const reset = reduce(changed, 'r')
    expect(reset.palette).toBe('Default')
    expect(reset.titlePill).toBe(false)
  })
})

describe('overlays', () => {
  const start = () => initialState('browser', 0, 'Default', false, false)
  const walk = (state: NavState, ...buttons: NavButton[]) => buttons.reduce(reduce, state)

  it('opens the browser’s entry menu on R', () => {
    const menu = reduce(start(), 'r')
    expect(menu.overlay).toEqual({ kind: 'menu', items: ENTRY_MENU, selected: 0 })
  })

  it('takes the input while it is up, so the cursor behind it does not move', () => {
    const menu = walk(start(), 'r', 'down', 'down')
    expect(menu.cursor).toBe(0)
    expect(menu.overlay?.kind === 'menu' && menu.overlay.selected).toBe(2)
  })

  it('wraps inside the menu', () => {
    const menu = walk(start(), 'r', 'up')
    expect(menu.overlay?.kind === 'menu' && menu.overlay.selected).toBe(ENTRY_MENU.length - 1)
  })

  it('opens the view a row names, and closes the menu doing it', () => {
    const opened = walk(start(), 'r', 'a')
    expect(opened.view).toBe('file-info')
    expect(opened.overlay).toBeNull()
  })

  it('says so rather than pretending, for a row that needs an SD card', () => {
    const chosen = walk(start(), 'r', 'down', 'a')
    expect(chosen.overlay?.kind).toBe('message')
    expect(chosen.view).toBe('browser')
  })

  it('closes on B without navigating', () => {
    const closed = walk(start(), 'r', 'b')
    expect(closed.overlay).toBeNull()
    expect(closed.view).toBe('browser')
    expect(closed.stack).toHaveLength(0)
  })

  it('shows the loading bar when a load screen is entered', () => {
    const loading = walk(start(), 'down', 'down', 'down', 'down', 'down', 'a', 'a')
    expect(loading.overlay?.kind).toBe('loading')
  })

  it('prompts before resetting settings, as the source does', () => {
    const prompt = walk(start(), 'start', 'r')
    expect(prompt.overlay?.kind).toBe('message')
  })
})

describe('hint labels', () => {
  const start = () => initialState('browser', 0, 'Default', false, false)

  it('names OPEN on a folder and PLAY on a ROM', () => {
    // `draw_nextui` picks the label from the highlighted entry's type.
    expect(hintsFor(start(), 'right').at(-1)?.label).toBe('OPEN')
    const onRom = [...Array(5)].reduce<NavState>((s) => reduce(s, 'down'), start())
    expect(hintsFor(onRom, 'right').at(-1)?.label).toBe('PLAY')
  })

  it('swaps PAUSE for PLAY once the music player is paused', () => {
    const playing = { ...start(), view: 'music-player' }
    expect(hintsFor(playing, 'left')[0]?.label).toBe('PAUSE')
    expect(hintsFor(reduce(playing, 'a'), 'left')[0]?.label).toBe('PLAY')
  })

  it('gives every view a B pill, because every view can be left', () => {
    for (const v of VIEWS) {
      const state = { ...start(), view: v.slug }
      expect(
        hintsFor(state, 'right').some((h) => h.button === 'B'),
        v.slug,
      ).toBe(true)
    }
  })
})

describe('the porting notes', () => {
  const dir = resolvePath(__dirname, 'views')

  it('opens every view module with a PORTING NOTES block', () => {
    const files = readdirSync(dir).filter((f) => f.endsWith('.tsx'))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const text = readFileSync(resolvePath(dir, file), 'utf8')
      expect(text.slice(0, 200)).toContain('PORTING NOTES')
    }
  })
})
