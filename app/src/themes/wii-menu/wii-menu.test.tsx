import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DeviceFrame } from '../../device/DeviceFrame'
import { BUTTONS, type Button } from '../../input/keymap'
import { WiiMenu } from '.'
import { hasSettingsFrame } from './assets'
import { CHANNELS, FILLED, GRID, SLOTS } from './library'
import { DEFAULT_PREFS, dayLabel, initialState, reduce, settle, top, type State, type View } from './machine'
import { WII_MENU_SCREENS } from './manifest'
import { compileStoryboard, restingValues } from '../../anim/compile'
import { loop } from './views/parts'

const press = (s: State, ...buttons: Button[]) => buttons.reduce((acc, b) => settle(reduce(acc, b)), s)
const menu = () => initialState({ events: 'a' })

/** The Settings frame a view shows, as `views/Settings.tsx` names it. */
function frameOf(v: View): [string, string] | null {
  switch (v.kind) {
    case 'settings':
      return ['pages', `${v.page + 1}-${v.focus}`]
    case 'list':
      return [v.id, String(v.focus)]
    case 'choice':
      return [v.id, `${v.selected}-${v.focus}`]
    case 'update':
      return ['system-update', v.focus]
    default:
      return null
  }
}

describe('Wii Menu library', () => {
  it('has 48 slots with the Disc Channel fixed in the first', () => {
    expect(GRID).toHaveLength(SLOTS)
    expect(SLOTS).toBe(48)
    expect(GRID[0]).toBe('disc')
    expect(FILLED).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('dates the board within the month, Friday the 25th being today', () => {
    expect(dayLabel(0)).toBe('Fri 2/25')
    expect(dayLabel(-1)).toBe('Thu 2/24')
    expect(dayLabel(-24)).toBe('Tue 2/1')
  })
})

describe('Wii Menu machine', () => {
  it('starts on Health & Safety, and A reaches the menu', () => {
    const s = initialState()
    expect(top(s).kind).toBe('health')
    expect(top(press(s, 'b', 'start', 'menu')).kind).toBe('health')
    expect(top(press(s, 'a')).kind).toBe('menu')
  })

  it('fades Health & Safety to black, waits, then shows the menu', () => {
    const out = reduce(initialState(), 'a')
    expect([top(out).kind, out.boot]).toEqual(['health', 'out'])
    // Nothing is taken until the menu is up.
    expect(reduce(out, 'a')).toBe(out)
    const menuUp = settle(out)
    expect([top(menuUp).kind, menuUp.boot]).toEqual(['menu', null])
  })

  it('plays the chosen tile out of Wii Options before opening its screen', () => {
    const options = initialState({ events: 'addda' })
    const leaving = reduce(options, 'a')
    expect([top(leaving).kind, leaving.pending]).toEqual(['options', { kind: 'settings', page: 0, focus: 0 }])
    expect(reduce(leaving, 'b')).toBe(leaving)
    expect(top(settle(leaving)).kind).toBe('settings')
    expect(top(press(options, 'left', 'a')).kind).toBe('data')
  })

  it('turns the page past the last column and with - and +, never past the ends', () => {
    let s = menu()
    s = press(s, 'right', 'right', 'right', 'right')
    expect([s.page, s.focus]).toEqual([1, { area: 'grid', slot: 0 }])
    s = press(s, 'left')
    expect([s.page, s.focus]).toEqual([0, { area: 'grid', slot: 3 }])
    expect(press(menu(), 'l').page).toBe(0)
    expect(press(menu(), 'r', 'r', 'r', 'r').page).toBe(3)
    expect(press(menu(), 'start', 'select').page).toBe(0)
  })

  it('drops from the grid into the bar and back up', () => {
    let s = press(menu(), 'down', 'down', 'down')
    expect(s.focus).toEqual({ area: 'bar', item: 'wii' })
    s = press(s, 'right', 'right', 'right')
    expect(s.focus).toEqual({ area: 'bar', item: 'mail' })
    expect(press(s, 'up').focus).toEqual({ area: 'grid', slot: 11 })
  })

  it('opens a channel preview, and an empty slot opens nothing', () => {
    const s = press(menu(), 'a')
    expect(top(s)).toEqual({ kind: 'preview', slot: 0, focus: 'menu' })
    const empty = press(menu(), 'down', 'down', 'right', 'right', 'a')
    expect(top(empty).kind).toBe('menu')
  })

  it('zooms: a preview enters, settles open, and B shrinks it back into its slot', () => {
    const entering = reduce(menu(), 'a')
    expect(entering.zoom).toBe('enter')
    // Nothing is taken while the zoom runs.
    expect(reduce(entering, 'b')).toBe(entering)
    const open = settle(entering)
    const leaving = reduce(open, 'b')
    expect([leaving.zoom, top(leaving).kind]).toEqual(['leave', 'preview'])
    expect(top(settle(leaving)).kind).toBe('menu')
  })

  it('steps channels in the preview with - and +, and the grid follows', () => {
    let s = press(menu(), 'a', 'select')
    expect(top(s)).toMatchObject({ kind: 'preview', slot: 9 })
    expect([s.page, s.focus]).toEqual([0, { area: 'grid', slot: 9 }])
    s = press(s, 'start', 'start')
    expect(top(s)).toMatchObject({ kind: 'preview', slot: 1 })
  })

  it('cannot focus the Disc Channel Start button without a disc', () => {
    expect(CHANNELS.disc.startable).toBe(false)
    expect(top(press(menu(), 'a', 'right'))).toMatchObject({ focus: 'menu' })
    expect(top(press(menu(), 'right', 'a', 'right'))).toMatchObject({ focus: 'start' })
  })

  it('offers Wii Menu and Reset in the HOME Menu only over a running channel', () => {
    const overMenu = press(menu(), 'menu')
    expect(overMenu.home).toBe('close')
    expect(press(overMenu, 'down').home).toBe('remote')
    const running = press(menu(), 'right', 'a', 'right', 'a', 'menu')
    expect(top(running).kind).toBe('running')
    expect(press(running, 'down').home).toBe('wii-menu')
    expect(press(running, 'down', 'right').home).toBe('reset')
    const back = press(running, 'down', 'a')
    expect([back.home, back.stack]).toEqual([null, [{ kind: 'menu' }]])
    const reset = press(running, 'down', 'right', 'a')
    expect([reset.home, reset.resets, top(reset).kind]).toEqual([null, 1, 'running'])
    expect(press(running, 'b').home).toBeNull()
    expect(press(running, 'menu').home).toBeNull()
  })

  it('confirms a Settings choice, and Back discards it', () => {
    const sound = initialState({ events: 'adddaaddda' })
    expect(top(sound)).toEqual({ kind: 'choice', id: 'sound', selected: DEFAULT_PREFS.sound, focus: 0 })
    const picked = press(sound, 'a')
    expect(top(picked)).toMatchObject({ selected: 0 })
    expect(press(picked, 'down', 'down', 'down', 'right', 'a').prefs.sound).toBe(0)
    expect(press(picked, 'down', 'down', 'down', 'a').prefs.sound).toBe(DEFAULT_PREFS.sound)
    // Reopened, the page starts from what was saved.
    const saved = press(picked, 'down', 'down', 'down', 'right', 'a', 'a')
    expect(top(saved)).toMatchObject({ id: 'sound', selected: 0 })
  })

  it('lays Widescreen Settings across, and the rest down', () => {
    const wide = initialState({ events: 'adddaaddada' })
    expect(top(wide)).toMatchObject({ id: 'widescreen', focus: 0 })
    expect(top(press(wide, 'right'))).toMatchObject({ focus: 1 })
    expect(top(press(wide, 'down'))).toMatchObject({ focus: 'back' })
  })

  it('posts a memo to the day the board is showing', () => {
    const s = initialState({ events: 'adddrraqlaaa' })
    expect(top(s)).toMatchObject({ kind: 'board', day: -1 })
    expect(s.memos).toEqual([-1])
  })

  it('never turns the board past today', () => {
    const s = initialState({ events: 'adddrra' })
    expect(press(s, 'r')).toEqual(s)
  })

  it('has a Settings frame for every state a button press can reach', () => {
    // Walk every state reachable from the Wii Settings pages, and check the frame each one shows.
    const start = initialState({ events: 'adddaa' })
    const seen = new Set<string>()
    const queue: State[] = [start]
    const missing = new Set<string>()
    while (queue.length) {
      const s = queue.shift()!
      const key = JSON.stringify([s.stack, s.prefs])
      if (seen.has(key)) continue
      seen.add(key)
      const frame = frameOf(top(s))
      if (!frame) continue
      if (!hasSettingsFrame(...frame)) missing.add(frame.join('/'))
      for (const b of BUTTONS) queue.push(settle(reduce(s, b)))
    }
    expect([...missing]).toEqual([])
    expect(seen.size).toBeGreaterThan(100)
  })
})

describe('Wii Menu loops', () => {
  const ctx = { w: 640, h: 480 }
  const sb = loop(1000, { opacity: [[0, 1], [400, 1], [600, 0], [1000, 1]] })._!

  it('spans the whole period on every channel, so the group stays in step', () => {
    for (const track of compileStoryboard(sb, ctx)) {
      expect(track.timing.duration).toBe(1000)
      expect(track.timing.iterations).toBe(Infinity)
    }
  })

  it('rests on its first breakpoint, and an offset starts it later in the cycle', () => {
    expect(restingValues(sb, ctx).get('opacity')).toBe(1)
    const turned = loop(1000, { opacity: [[0, 1], [400, 1], [600, 0], [1000, 1]] }, 500)._!
    expect(restingValues(turned, ctx).get('opacity')).toBeCloseTo(0.5)
    expect(compileStoryboard(turned, ctx)[0]!.timing.duration).toBe(1000)
  })
})

describe('Wii Menu transitions', () => {
  it('shows the boot label once the menu is up, and a still settles past it', () => {
    const black = { ...reduce(initialState(), 'a'), boot: 'black' as const }
    expect(settle(black).bootLabel).toBe(false)
    expect(top(settle(black)).kind).toBe('menu')
  })

  it('fades the menu out before Wii Options and the SD Card Menu open', () => {
    const bar = press(menu(), 'down', 'down', 'down')
    const options = reduce(bar, 'a')
    expect([top(options).kind, options.pending?.kind]).toEqual(['menu', 'options'])
    expect(top(settle(options)).kind).toBe('options')
    const sd = reduce(press(bar, 'right'), 'a')
    expect(sd.pending?.kind).toBe('sd')
    // The SD Card Menu opens on its loading box; a still settles past it.
    expect(settle(sd).sdLoading).toBe(false)
  })

  it('marks a preview reached with - or + as stepped', () => {
    expect(top(press(menu(), 'a'))).not.toHaveProperty('stepped')
    expect(top(press(menu(), 'a', 'start'))).toMatchObject({ stepped: true })
  })
})

describe('Wii Menu stills', () => {
  it('poses every still on the view its name says', () => {
    const kind = (slug: string) => top(initialState(WII_MENU_SCREENS.find((s) => s.slug === slug)!.seed))
    expect(kind('health').kind).toBe('health')
    expect(kind('preview-nintendo')).toMatchObject({ kind: 'preview', slot: 9 })
    expect(kind('settings-3')).toMatchObject({ kind: 'settings', page: 2 })
    expect(kind('settings-update').kind).toBe('update')
    expect(kind('sd-about-2')).toMatchObject({ kind: 'sd', dialog: 2 })
    expect(kind('board-letter').kind).toBe('no-miis')
    expect(kind('board-address-book').kind).toBe('address')
    expect(kind('data-management').kind).toBe('data')
    for (const s of WII_MENU_SCREENS.filter((x) => x.slug.startsWith('preview-') && x.slug !== 'preview-start')) {
      const v = kind(s.slug)
      expect(v.kind, s.slug).toBe('preview')
      expect(`preview-${GRID[(v as { slot: number }).slot]}`, s.slug).toBe(s.slug)
    }
  })

  it.each(WII_MENU_SCREENS.map((s) => [s.slug, s] as const))('renders %s', (_, screen) => {
    const { container } = render(
      <DeviceFrame device="rg35xx" animate={false} interactive={false}>
        <WiiMenu {...screen.seed} />
      </DeviceFrame>,
    )
    expect(container.querySelector('[data-theme="wii-menu"]')).not.toBeNull()
  })
})
