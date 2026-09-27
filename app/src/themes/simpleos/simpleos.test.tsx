import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DeviceFrame } from '../../device/DeviceFrame'
import { Panels } from '../../device/Panels'
import type { Button } from '../../input/keymap'
import { SimpleOs } from '.'
import { GAMES, MENU_CURRENT, MENU_OTHER } from './library'
import {
  currentView,
  highlighted,
  initialState,
  menuItems,
  reduce,
  rows,
  visibleGames,
  type State,
} from './machine'
import { SIMPLEOS_SCREENS } from './manifest'
import { clipChars } from './views/parts'

const press = (state: State, ...buttons: Button[]) => buttons.reduce(reduce, state)

describe('SimpleOS navigation', () => {
  it('continues from the boot splash to home', () => {
    expect(currentView(press(initialState(), 'a'))).toBe('home')
    expect(currentView(press(initialState(), 'start'))).toBe('home')
    expect(currentView(press(initialState(), 'b'))).toBe('boot')
  })

  it('does what every item in the home legend says', () => {
    const home = initialState({ view: 'home', home: 3 })
    // A play
    const playing = press(home, 'a')
    expect(currentView(playing)).toBe('game')
    expect(playing.running).toBe(3)
    // X archive
    expect(currentView(press(home, 'x'))).toBe('archive')
    // START options, SELECT clock, HOME game config
    expect(currentView(press(home, 'start'))).toBe('options')
    expect(currentView(press(home, 'select'))).toBe('clock')
    expect(currentView(press(home, 'menu'))).toBe('this-game')
  })

  it('moves the grid row-major across pages without wrapping', () => {
    const home = initialState({ view: 'home', home: 5 })
    expect(press(home, 'right').home).toBe(6)
    expect(press(home, 'down').home).toBe(8)
    expect(press(initialState({ view: 'home', home: 0 }), 'left', 'up').home).toBe(0)
    expect(press(initialState({ view: 'home', home: GAMES.length - 1 }), 'right').home).toBe(
      GAMES.length - 1,
    )
  })

  it('walks back the way it came', () => {
    const deep = press(initialState({ view: 'home' }), 'start', 'a', 'down', 'down', 'a')
    expect(currentView(deep)).toBe('retroachievements')
    expect(currentView(press(deep, 'b'))).toBe('network')
    expect(currentView(press(deep, 'b', 'b'))).toBe('options')
    expect(currentView(press(deep, 'b', 'b', 'b'))).toBe('home')
  })

  it('seeds a posed still with the path to it, so B works from a still too', () => {
    expect(initialState({ view: 'retroachievements' }).stack).toEqual([
      'home',
      'options',
      'network',
      'retroachievements',
    ])
  })
})

describe('SimpleOS settings', () => {
  it('moves an archived title back to the library with A', () => {
    const archive = initialState({ view: 'archive', archived: [4, 7] })
    expect(rows(archive).map((r) => r.label)).toEqual([GAMES[4], GAMES[7]])
    const restored = press(archive, 'a')
    expect(restored.archived).toEqual([7])
    expect(visibleGames(restored)).toContain(4)
    expect(highlighted(press(restored, 'b'))).toBe(0)
  })

  it('toggles a setting with A and shows it in the row', () => {
    const network = initialState({ view: 'network' })
    expect(rows(network)[0]!.value).toBe('OFF')
    expect(rows(press(network, 'a'))[0]!.value).toBe('ON')
  })

  it('cycles the shader with left and right', () => {
    const shader = initialState({ view: 'game-settings', cursor: 3 })
    expect(rows(press(shader, 'right'))[3]!.value).toBe('LCD1x')
    expect(rows(press(shader, 'left'))[3]!.value).toBe('zFast + NDS + NV')
  })

  it('cycles a per-game override GLOBAL, ON, OFF', () => {
    const game = initialState({ view: 'this-game', home: 3 })
    expect(rows(game)[0]!.value).toBe('GLOBAL')
    expect(rows(press(game, 'a'))[0]!.value).toBe('ON')
    expect(rows(press(game, 'a', 'a'))[0]!.value).toBe('OFF')
    expect(rows(press(game, 'a', 'a', 'a'))[0]!.value).toBe('GLOBAL')
  })

  it('binds the next press on Controls, and X adds rather than replaces', () => {
    const controls = initialState({ view: 'controls' })
    const bound = press(controls, 'a', 'y')
    expect(bound.bindings.A).toEqual(['Y'])
    const added = press(controls, 'x', 'l')
    expect(added.bindings.A).toEqual(['A', 'L'])
  })

  it('saves the clock with A and discards the draft with B', () => {
    const clock = press(initialState({ view: 'home' }), 'select', 'right', 'right', 'right', 'up')
    expect(clock.draft.hour).toBe(10)
    expect(press(clock, 'a').clock.hour).toBe(10)
    expect(press(clock, 'b').clock.hour).toBe(9)
  })
})

describe('SimpleOS in game', () => {
  it('opens the menu on MENU and resumes on B', () => {
    const game = initialState({ view: 'game', running: 2 })
    const menu = press(game, 'menu')
    expect(currentView(menu)).toBe('quick-menu')
    expect(menuItems(menu)).toEqual(MENU_CURRENT)
    expect(currentView(press(menu, 'b'))).toBe('game')
  })

  it('shortens the menu for another title, and LOAD switches to it', () => {
    const menu = initialState({ view: 'quick-menu', running: 11 })
    const other = press(menu, 'right')
    expect(other.menuTitle).toBe(0)
    expect(menuItems(other)).toEqual(MENU_OTHER)
    const switched = press(other, 'a')
    expect(currentView(switched)).toBe('game')
    expect(switched.running).toBe(0)
    expect(switched.osd).toBe('LOADED')
  })

  it('goes home from HOME and archives the running title from ARCHIVE', () => {
    const menu = initialState({ view: 'quick-menu', running: 2 })
    const toHome = press(menu, 'up', 'a')
    expect(currentView(toHome)).toBe('home')
    expect(toHome.running).toBeNull()

    const archive = press(menu, 'down', 'down', 'down', 'a')
    expect(currentView(archive)).toBe('home')
    expect(visibleGames(archive)).not.toContain(2)
  })
})

describe('SimpleOS rendering', () => {
  it('hard-clips text with no ellipsis', () => {
    expect(clipChars(GAMES[4]!, 33)).toBe("Dr Kawashima's Brain Training - H")
  })

  it.each(SIMPLEOS_SCREENS.map((s) => [s.slug, s] as const))('draws %s on both panels', (_, screen) => {
    const { container } = render(
      <DeviceFrame device="rg-ds" animate={false} interactive={false}>
        <SimpleOs
          view={screen.view}
          home={screen.home}
          cursor={screen.cursor}
          running={screen.running}
          menuTitle={screen.menuTitle}
          osd={screen.osd}
          binding={screen.binding}
          clockField={screen.clockField}
          toast={screen.toast}
          archived={screen.archived}
        />
      </DeviceFrame>,
    )
    for (const name of ['top', 'bottom']) {
      const panel = container.querySelector(`[data-panel="${name}"]`)
      expect(panel, `${name} panel`).not.toBeNull()
      expect(panel!.childElementCount, `${name} panel content`).toBeGreaterThan(0)
    }
  })

  it('refuses to split a one-panel device', () => {
    expect(() =>
      render(
        <DeviceFrame device="rg35xx" animate={false} interactive={false}>
          <Panels top={<div />} bottom={<div />} />
        </DeviceFrame>,
      ),
    ).toThrow('two-panel')
  })
})
