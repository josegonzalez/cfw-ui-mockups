import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DeviceFrame } from '../../device/DeviceFrame'
import type { Button } from '../../input/keymap'
import { DsStyle } from '.'
import { LIBRARY } from './library'
import { effectiveView, initialState, keyFor, launchReturned, reduce, snakeStep, type State } from './machine'
import { DS_STYLE_SCREENS } from './manifest'
import { cleanTitle, splitStartTitle, splitTitle, tr, wrapBox } from './text'
import { artSize } from './views/parts'

const REF = resolve(__dirname, '../../../../docs/themes/ds-style/reference')
const press = (s: State, ...buttons: Button[]) => buttons.reduce((acc, b) => reduce(acc, b), s)
const rows = (file: string) =>
  readFileSync(resolve(REF, file), 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('|'))

describe('DS Style reference parity', () => {
  it('poses every still with the same buttons as its reference frame', () => {
    const frames = rows('stills.txt')
    expect(DS_STYLE_SCREENS.map((s) => s.slug)).toEqual(frames.map(([slug]) => slug))
    for (const [slug, screen, events, env, flags] of frames) {
      const seed = DS_STYLE_SCREENS.find((s) => s.slug === slug)!.seed
      expect(seed.events ?? '', slug).toBe(events)
      expect(seed.launching ?? false, slug).toBe(env === 'DS_STYLE_PREVIEW_LAUNCHING=1')
      expect(seed.prefs?.lcd ?? false, slug).toBe(flags === '--lcd')
      expect(seed.hardware?.kind, slug).toBe(screen === 'volume' ? 1 : screen === 'brightness' ? 2 : undefined)
    }
  })

  it('lists the same games as the fixture the frames were rendered from', () => {
    const fixture: Record<string, string[]> = {}
    for (const [system, file] of rows('fixture.txt')) (fixture[system!] ??= []).push(file!)
    expect(LIBRARY).toEqual(fixture)
  })
})

describe('DS Style text', () => {
  it('cleans titles the way Launcher_CleanTitle does', () => {
    expect(cleanTitle('Garden Quest.gba')).toBe('Garden Quest')
    expect(cleanTitle('Tetris (World) [!].gb')).toBe('Tetris')
    expect(cleanTitle('(Proto).gba')).toBe('(Proto)')
  })

  it('splits carousel and Home titles on their own widths', () => {
    expect(splitTitle('The Legend of Zelda - A Link to the Past')).toEqual([
      'The Legend of Zelda',
      '- A Link to the Past',
    ])
    expect(splitStartTitle('The Legend of Zelda - A Link to the Past')).toEqual([
      'The Legend of',
      'Zelda - A Link to',
      'the Past',
    ])
    expect(splitStartTitle('')).toEqual(['No recent game'])
  })

  it('wraps a help box at 33 glyphs', () => {
    const lines = wrapBox('Choose where DS Style starts. Hold START at startup to skip automatic game launch.')
    expect(lines.every((l) => l.length <= 33)).toBe(true)
    expect(lines.join(' ')).toBe('Choose where DS Style starts. Hold START at startup to skip automatic game launch.')
  })

  it('translates by the English key and falls back to it', () => {
    expect(tr('Settings', 1)).not.toBe('Settings')
    expect(tr('Settings', 0)).toBe('Settings')
    expect(tr('no such string', 3)).toBe('no such string')
  })

  it('sizes a 480x320 picture to each slot', () => {
    expect(artSize(56, 37, 1, 2, true)).toEqual([55, 37])
    expect(artSize(120, 80, 0, 2, true)).toEqual([120, 80])
    expect(artSize(90, 60, 3, 2, true)).toEqual([90, 60])
  })
})

describe('DS Style input', () => {
  it('opens on Home and walks the six targets', () => {
    const s = initialState()
    expect(s.page).toBe(0)
    expect(press(s, 'down').homechoice).toBe(1)
    expect(press(s, 'down', 'right').homechoice).toBe(2)
    expect(press(s, 'down', 'down').homechoice).toBe(3)
    expect(press(s, 'down', 'down', 'right', 'right', 'right').homechoice).toBe(5)
    expect(press(s, 'down', 'down', 'up').homechoice).toBe(1)
  })

  it('ignores X on Home, because the search handler takes it first', () => {
    const s = initialState()
    expect(press(s, 'x')).toEqual(s)
  })

  it('cycles Games, Apps and Settings with L and R from a list', () => {
    const games = initialState({ events: 'da' })
    expect(press(games, 'r').section).toBe(3)
    expect(press(games, 'l').page).toBe(2)
    expect(press(games, 'r', 'r').page).toBe(2)
    expect(press(games, 'r', 'r', 'r').section).toBe(0)
  })

  it('opens Recents and Favourites with L2 and R2 from anywhere, and returns', () => {
    const s = initialState({ events: 'daddar' })
    const recents = press(s, 'l2')
    expect([recents.section, recents.entries.map((e) => e.name)]).toEqual([
      2,
      ['Garden Quest.gba', 'Super Metroid.sfc'],
    ])
    const back = press(recents, 'b')
    expect([back.here, back.choice]).toEqual([s.here, s.choice])
    expect(press(initialState(), 'r2').section).toBe(1)
  })

  it('treats a list of folders as a list whatever the view', () => {
    const systems = initialState({ events: 'da' })
    expect(systems.prefs.viewmode).toBe(2)
    expect(effectiveView(systems)).toBe(0)
  })

  it('launches behind "Launching" and adds the game to Recents on return', () => {
    const s = press(initialState({ events: 'daddar' }), 'right', 'a')
    expect(s.launching).toBe('Roms/GBA/Pocket Rally.gba')
    expect(launchReturned(s).recents[0]).toBe('Roms/GBA/Pocket Rally.gba')
  })

  it('toggles a favourite and says so', () => {
    const s = press(initialState({ events: 'daddar' }), 'y')
    expect(s.favourites).toContain('Roms/GBA/Garden Quest.gba')
    expect(s.notice).toBe('Added to favourites')
    expect(press(s, 'a').notice).toBeNull()
  })

  it('searches every game from the Systems list', () => {
    let s = press(initialState({ events: 'da' }), 'x')
    expect(s.search?.global).toBe(true)
    // S, then T, filtering every game on the card as each is typed, case-insensitively.
    s = press(s, 'down', ...Array<Button>(8).fill('right'), 'a', 'right', 'a')
    expect(s.search?.query).toBe('ST')
    expect(s.entries.map((e) => e.name)).toEqual([
      'Aster Trail.gba',
      'Garden Quest.gba',
      'The Legend of Zelda - A Link to the Past.sfc',
    ])
    expect(press(s, 'b').search).toBeNull()
  })

  it('binds the next button and swaps the one it displaces', () => {
    let s = initialState({ events: 'mdddddda' })
    s = press(s, 'down', 'down', 'a')
    expect(s.capture).toBe(0)
    s = press(s, 'b')
    expect(s.bindings.slice(0, 2)).toEqual(['b', 'a'])
    // Accept is now on B, and Back on A.
    expect([keyFor(s, 'b'), keyFor(s, 'a')]).toEqual(['accept', 'back'])
    expect(press(initialState({ events: 'mdddddda' }), 'down', 'down', 'a', 'left').capture).toBe(null)
  })

  it('plays Snake: it steps, grows on food, and ends at a wall', () => {
    let s = initialState({ events: 'mddddddddat' })
    expect(s.snake.body[0]).toEqual([10, 7])
    s = snakeStep(s)
    expect(s.snake.body[0]).toEqual([11, 7])
    // Food straight ahead: one step eats it, and the snake is a cell longer.
    const fed = snakeStep({ ...s, snake: { ...s.snake, food: [12, 7] } })
    expect(fed.snake.body).toHaveLength(5)
    for (let i = 0; i < 20; i++) s = snakeStep(s)
    expect(s.snake.over).toBe(true)
  })

  it('hands the device back on Shutdown, and starts again on any button', () => {
    const off = press(initialState(), 'down', 'down', 'right', 'right', 'a', 'a')
    expect(off.exited).toBe('shutdown')
    expect(press(off, 'a').exited).toBeNull()
  })
})

describe('DS Style stills', () => {
  it.each(DS_STYLE_SCREENS.map((s) => [s.slug, s] as const))('renders %s', (_, screen) => {
    const { container } = render(
      <DeviceFrame device="rg-sp" animate={false} interactive={false}>
        <DsStyle {...screen.seed} />
      </DeviceFrame>,
    )
    expect(container.querySelector('[data-theme="ds-style"]')).not.toBeNull()
  })
})
