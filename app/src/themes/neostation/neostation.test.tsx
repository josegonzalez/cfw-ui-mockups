import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DeviceFrame } from '../../device/DeviceFrame'
import type { Button } from '../../input/keymap'
import { NeoStation } from '.'
import { gridGeometry } from './grid'
import { resolve } from './layout'
import { COLUMNS, systemsList } from './library'
import {
  dropdownRows,
  entries,
  gridMove,
  initialState,
  reduce,
  scanFinished,
  settingsTabs,
  top,
  virtualGrid,
  visibleTabs,
  wizardScanned,
  type State,
} from './machine'
import { NEOSTATION_DEVICES, screensFor } from './manifest'
import { PALETTES, RADII, THEME_IDS } from './palette'
import { generalRows } from './settings'
import { textWidth } from './text'
import { SCAN_POSE, wizardSteps } from './wizard'

const press = (state: State, ...buttons: Button[]) => buttons.reduce((s, b) => reduce(s, b), state)

describe('NeoStation units', () => {
  it('follows flutter_screenutil with splitScreenMode: .h floors the height at 700', () => {
    const odin = resolve('odin2-mini')
    expect([odin.lw, odin.lh, odin.dpr]).toEqual([640, 360, 3])
    expect(odin.r(32)).toBe(96)
    expect(odin.h(480)).toBeCloseTo(2100)
    const rg = resolve('rg40xx')
    expect(rg.r(32)).toBe(32)
    expect(rg.h(480)).toBeCloseTo(700)
    expect(odin.breakpoint).toBe('small')
    expect(rg.breakpoint).toBe('small')
  })
})

describe('NeoStation palettes', () => {
  it('carries all fourteen built-in themes in the provider order', () => {
    expect(THEME_IDS).toEqual([
      'dark',
      'light',
      'oled',
      'valentine',
      'dracula',
      'nord',
      'coffee',
      'tokyo_night',
      'retro',
      'abyss',
      'cyberpunk',
      'aqua',
      'palenight',
      'horizon',
    ])
    expect(PALETTES.dark.primary).toBe('#605dff')
    expect(PALETTES.dark.background).toBe('#15191e')
    expect(RADII[PALETTES.cyberpunk.radius]).toEqual({ external: 0, internal: 0 })
    expect(RADII[PALETTES.dracula.radius]).toEqual({ external: 24, internal: 20 })
  })
})

describe('NeoStation systems', () => {
  it('floats the virtual systems to the top and drops Android off Android', () => {
    const android = systemsList({ platform: 'android', sortBy: 'alphabetical', order: 'asc' })
    const linux = systemsList({ platform: 'linux', sortBy: 'alphabetical', order: 'asc' })
    const ids = (l: typeof android) => l.map((e) => (e.kind === 'recent' ? 'recent' : e.def.id))
    expect(ids(android).slice(0, 5)).toEqual(['recent', 'all', 'favorites', 'android', 'a2'])
    expect(ids(linux).slice(0, 4)).toEqual(['recent', 'all', 'favorites', 'a2'])
  })

  it('sorts by year the way site-03 shows the systems', () => {
    const year = systemsList({ platform: 'android', sortBy: 'year', order: 'asc', hideRecent: true })
    const ids = year.map((e) => (e.kind === 'system' ? e.def.id : ''))
    expect(ids.slice(0, 14)).toEqual([
      'all',
      'favorites',
      'android',
      'arc',
      'chf',
      'a2',
      '2600',
      'mo2',
      'vc4k',
      'a2001',
      'cv',
      'vect',
      'msx',
      'nes',
    ])
  })

  it('packs the Recent card into the top-left 3x2 block', () => {
    const grid = virtualGrid(systemsList({ platform: 'android', sortBy: 'alphabetical', order: 'asc' }), COLUMNS.M)
    expect(grid[0]).toEqual([0, 0, 0, 1, 2, 3])
    expect(grid[1]).toEqual([0, 0, 0, 4, 5, 6])
    expect(grid[2]).toEqual([7, 8, 9, 10, 11, 12])
  })

  it('wraps in every direction, and steps off the Recent card by its edge', () => {
    const grid = virtualGrid(systemsList({ platform: 'android', sortBy: 'alphabetical', order: 'asc' }), 6)
    expect(gridMove(grid, 0, 'right')).toBe(1)
    expect(gridMove(grid, 1, 'left')).toBe(0)
    expect(gridMove(grid, 0, 'left')).toBe(
      grid
        .at(-1)!
        .filter((i) => i !== -1)
        .at(-1),
    )
    // From the last column, right goes to the first card of the next row: the Recent card again.
    expect(gridMove(grid, 3, 'right')).toBe(0)
    expect(gridMove(grid, 6, 'right')).toBe(7)
    expect(gridMove(grid, 7, 'up')).toBe(0)
    // Up from the top row lands on the bottom row, in the same column or its nearest neighbour.
    const up = gridMove(grid, 1, 'up')
    expect(grid.at(-1)).toContain(up)
  })

  it('lays the grid out at the notes worked example on a 640x480 screen', () => {
    const geo = gridGeometry(
      resolve('rg40xx'),
      systemsList({ platform: 'linux', sortBy: 'alphabetical', order: 'asc' }),
      'M',
    )
    expect(geo.colWidth).toBeCloseTo(99.67, 2)
    expect(geo.cards[0]!.width).toBeCloseTo(311.0, 1)
    expect(geo.cards[0]!.height).toBeCloseTo(255.17, 2)
    expect(geo.viewport).toBe(480 - 46 - 42)
  })
})

describe('NeoStation input', () => {
  it('cycles only the visible tabs with the bumpers, wrapping', () => {
    const s = initialState({ hidden: ['search', 'romm'] })
    expect(visibleTabs(s)).toEqual(['systems', 'sync', 'achievements', 'scraper', 'settings'])
    expect(press(s, 'r').tab).toBe('sync')
    expect(press(s, 'l').tab).toBe('settings')
    expect(press(s, 'r', 'r', 'r', 'r', 'r').tab).toBe('systems')
  })

  it('opens the dropdown on X and applies a pick on A', () => {
    const s = press(initialState(), 'x')
    expect(top(s)?.kind).toBe('view-dropdown')
    const rows = dropdownRows(s)
    const year = rows.findIndex((r) => r.kind === 'sort' && r.value === 'year')
    const picked = press(s, ...Array<Button>(year).fill('down'), 'a')
    expect(top(picked)).toBeNull()
    expect(picked.sortBy).toBe('year')
  })

  it('steps the card size with left and right, wrapping, and applies at once', () => {
    const s = press(initialState(), 'x', 'down', 'down')
    expect(press(s, 'right').size).toBe('L')
    expect(press(s, 'left', 'left').size).toBe('XL')
    expect(top(press(s, 'right'))?.kind).toBe('view-dropdown')
  })

  it('drops card size from the dropdown in carousel mode', () => {
    expect(dropdownRows(initialState({ view: 'carousel' })).some((r) => r.kind === 'size')).toBe(false)
  })

  it('opens the context menu on Y, its submenu on right, and switches view', () => {
    const s = press(initialState(), 'y', 'down', 'right')
    expect(top(s)).toMatchObject({ kind: 'context-menu', sub: 0 })
    const carousel = press(s, 'down', 'a')
    expect(carousel.view).toBe('carousel')
    expect(top(carousel)).toBeNull()
    expect(top(press(s, 'left'))).toMatchObject({ kind: 'context-menu', sub: null })
    expect(top(press(s, 'y'))).toBeNull()
  })

  it('opens System Settings from Start and from the menu, and toggles with A', () => {
    const s = press(initialState({ sel: 5 }), 'start')
    expect(top(s)?.kind).toBe('system-settings')
    expect(top(press(initialState(), 'y', 'a'))?.kind).toBe('system-settings')
    const toggled = press(s, 'a')
    expect(toggled.sysSettings['arc']?.alwaysShowRomName).toBe(true)
    expect(top(press(s, 'b'))).toBeNull()
    expect(press(s, 'r')).toMatchObject({ overlays: [{ tab: 1 }] })
  })

  it('gives aggregate systems no Emulators tab', () => {
    expect(settingsTabs('all')).toEqual(['general', 'appearance', 'hidden'])
    expect(settingsTabs('android')).toEqual(['general', 'appearance'])
    expect(settingsTabs('gba')).toEqual(['general', 'emulators', 'appearance', 'hidden'])
  })

  it('opens the notification panel on Select and closes it on B or Select', () => {
    const s = press(initialState(), 'select')
    expect(top(s)?.kind).toBe('notifications')
    expect(top(press(s, 'b'))).toBeNull()
    expect(top(press(s, 'select'))).toBeNull()
  })

  it('keeps the carousel to left and right, without wrapping', () => {
    const s = initialState({ view: 'carousel' })
    expect(press(s, 'left').sel).toBe(0)
    expect(press(s, 'up').sel).toBe(0)
    expect(press(s, 'right').sel).toBe(1)
    const last = entries(s).length - 1
    expect(press({ ...s, sel: last }, 'right').sel).toBe(last)
  })
})

describe('NeoStation text', () => {
  it('measures Anta from its own advances', () => {
    expect(textWidth('', 12)).toBe(0)
    expect(textWidth('M', 20)).toBeGreaterThan(textWidth('i', 20))
    expect(textWidth('ab', 12, 1)).toBeCloseTo(textWidth('ab', 12) + 2)
  })
})

describe('NeoStation stills', () => {
  it.each(NEOSTATION_DEVICES.flatMap((d) => screensFor(d).map((s) => [`${d} ${s.slug}`, d, s] as const)))(
    'renders %s',
    (_, device, screen) => {
      const { container } = render(
        <DeviceFrame device={device} animate={false} interactive={false}>
          <NeoStation {...screen.seed} />
        </DeviceFrame>,
      )
      expect(container.querySelector('[data-theme="neostation"]')).not.toBeNull()
    },
  )
})

describe('NeoStation tabs', () => {
  it('walks NeoSync from the dashboard into the saves and deletes one', () => {
    let s = initialState({ tab: 'sync' })
    const before = s.sync.saves.length
    s = press(s, 'a')
    expect(s.sync.section).toBe('saves')
    s = press(s, 'a')
    expect(s.sync.confirm).toBe('delete')
    s = press(s, 'a')
    expect(s.sync.saves).toHaveLength(before - 1)
    expect(s.notices.at(-1)?.message).toBe('Save file deleted successfully')
    expect(press(s, 'b').sync.section).toBe('dashboard')
  })

  it('keeps the bumpers inside a tab confirm, and closes it with B', () => {
    const s = press(initialState({ tab: 'sync' }), 'x')
    expect(s.sync.confirm).toBe('logout')
    expect(press(s, 'r').tab).toBe('sync')
    expect(press(s, 'b').sync.confirm).toBeNull()
  })

  it('carries a region up and down the scraper priority list', () => {
    let s = initialState({ tab: 'scraper', scraper: { menu: 4 } })
    s = press(s, 'right', 'down', 'a', 'down')
    expect(s.scraper.regions.slice(0, 3)).toEqual(['wor', 'eu', 'us'])
    expect(s.scraper.item).toBe(2)
    s = press(s, 'b')
    expect(s.scraper.moving).toBe(false)
    expect(press(s, 'left').scraper.inContent).toBe(false)
  })

  it('starts and stops a scrape from the Scraping page', () => {
    const s = press(initialState({ tab: 'scraper', scraper: { menu: 1 } }), 'right', 'a')
    expect(s.scraper.running).toBe(true)
    expect(press(s, 'a').scraper.running).toBe(false)
  })
})

describe('NeoStation settings', () => {
  it('lists the General rows each platform draws', () => {
    const android = initialState({ platform: 'android', tab: 'settings' })
    const linux = initialState({ platform: 'linux', tab: 'settings' })
    expect(generalRows(android.platform)[0]).toBe('androidSettings')
    expect(generalRows(android.platform)).not.toContain('bartop')
    expect(generalRows(linux.platform)).toContain('bartop')
    expect(generalRows(linux.platform)).not.toContain('defaultLauncher')
  })

  it('wraps the menu, clamps the page, and hides a tab from General', () => {
    let s = initialState({ platform: 'linux', tab: 'settings' })
    expect(press(s, 'up').settings.menu).toBe(7)
    s = press(s, 'a')
    expect(s.settings.inPane).toBe(true)
    expect(press(s, 'up').settings.item).toBe(0)
    const at = generalRows('linux').indexOf('tab:search')
    s = press(s, ...Array.from({ length: at }, () => 'down' as const), 'a')
    expect(s.hidden).toContain('search')
    expect(visibleTabs(s)).not.toContain('search')
    expect(press(s, 'a').hidden).not.toContain('search')
  })

  it('exits on Confirm Exit and restarts on any button', () => {
    let s = press(initialState({ tab: 'settings', settings: { menu: 7 } }), 'a', 'a')
    expect(s.settings.exited).toBe(true)
    s = press(s, 'b')
    expect(s.settings.exited).toBe(false)
    expect(s.tab).toBe('systems')
  })
})

describe('NeoStation first run', () => {
  it('asks for permissions only on Android', () => {
    expect(wizardSteps('android')).toEqual(['userData', 'permissions', 'rom', 'scan', 'esde', 'art'])
    expect(wizardSteps('linux')).toEqual(['userData', 'rom', 'scan', 'esde', 'art'])
  })

  it('walks the Android wizard to the library', () => {
    let s = initialState({ platform: 'android', wizard: {} })
    s = press(s, 'b')
    expect(s.wizard?.step).toBe(0)
    s = press(s, 'a', 'a')
    expect(s.wizard?.storage).toBe(true)
    s = press(s, 'a', 'a')
    expect(s.wizard).toMatchObject({ step: 3, romFolder: true, scan: SCAN_POSE })
    // Next waits for the scan.
    expect(press(s, 'a').wizard?.step).toBe(3)
    s = press(wizardScanned(s), 'a')
    expect(s.wizard?.step).toBe(4)
    s = press(s, 'a')
    expect(s.wizard?.esde).toBe(true)
    s = press(s, 'a', 'a')
    expect(s.wizard).toBeNull()
  })

  it('skips the ROM folder with B on Linux, into the scan', () => {
    const s = press(initialState({ platform: 'linux', wizard: {} }), 'a', 'b')
    expect(s.wizard).toMatchObject({ step: 2, romFolder: false, scan: SCAN_POSE })
  })

  it('seeds a step by name on either platform', () => {
    expect(initialState({ platform: 'android', wizard: { at: 'rom' } }).wizard?.step).toBe(2)
    expect(initialState({ platform: 'linux', wizard: { at: 'rom' } }).wizard?.step).toBe(1)
  })

  it('holds the systems cursor behind the scan splash and fades in after it', () => {
    const s = initialState({ scan: SCAN_POSE })
    expect(press(s, 'right').sel).toBe(0)
    expect(press(s, 'r').tab).not.toBe('systems')
    const done = scanFinished(s)
    expect(done).toMatchObject({ scan: null, scanEnded: true })
    expect(press(done, 'right').scanEnded).toBe(false)
  })
})
