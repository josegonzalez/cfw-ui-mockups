import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DeviceFrame } from '../../device/DeviceFrame'
import type { Button } from '../../input/keymap'
import { Tortos } from '.'
import { coverflowSlots, fitArt } from '../../widgets/Coverflow'
import { evaluateEasing } from '../../anim/easings'
import { ALBUMS, LIBRARY } from './library'
import {
  SHELF_MENU_W,
  closeMenus,
  currentView,
  cursorOf,
  focusedGame,
  gamesOf,
  initialState,
  isFavorite,
  letterJump,
  measuredShelfWidth,
  panelOf,
  reduce,
  shelfSystem,
  systemsOf,
  type State,
} from './machine'
import { TORTOS_SCREENS } from './manifest'
import { atRest, pacingFor, positionAt, retarget, ringDelta, tintStep } from './motion'
import { CF } from './spec'
import { fitText, pingpong, textWidth } from './text'

const press = (state: State, ...buttons: Button[]) => buttons.reduce(reduce, state)
const labels = (s: State) => panelOf(s, currentView(s)!).rows.map((r) => ('label' in r ? r.label : r.kind))

describe('TortOS shelf', () => {
  it('lists Favorites first, the consoles with games, and Muse last', () => {
    const tags = systemsOf(initialState()).map((s) => s.tag)
    expect(tags[0]).toBe('FAV')
    expect(tags.at(-1)).toBe('MUSE')
    expect(tags).toHaveLength(13)
  })

  it('steps the systems row both ways and wraps', () => {
    const s = initialState({ system: 'FAV' })
    expect(shelfSystem(press(s, 'left'))?.tag).toBe('MUSE')
    expect(shelfSystem(press(s, 'right'))?.tag).toBe('NES')
  })

  it('stands the row on end in Vertical, where up advances', () => {
    const s = initialState({ system: 'NES', dir: 'vertical' })
    expect(shelfSystem(press(s, 'up'))?.tag).toBe('SMS')
    expect(shelfSystem(press(s, 'right'))?.tag).toBe('NES')
  })

  it('enters a system with A and comes back with B', () => {
    const s = press(initialState({ system: 'SFC' }), 'a')
    expect(s.shelf).toBe('games')
    expect(focusedGame(s)?.title).toBe('Chrono Trigger')
    expect(press(s, 'b').shelf).toBe('systems')
  })

  it('does what the Controls page says the shelf does', () => {
    const s = initialState({ shelf: 'games', system: 'SFC' })
    expect(currentView(press(s, 'x'))).toBe('game-info')
    expect(isFavorite(press(s, 'y'), focusedGame(s))).toBe(true)
    expect(currentView(press(s, 'a'))).toBe('game')
    expect(currentView(press(s, 'menu'))).toBe('system-menu')
    expect(currentView(press(s, 'select'))).toBe('muse')
  })

  it('jumps a letter at a time across the row, and L1/R1 a screenful', () => {
    const s = initialState({ shelf: 'games', system: 'SFC' })
    const titles = LIBRARY['SFC']!.map((g) => g.title)
    expect(titles[cursorOf(press(s, 'down'), shelfSystem(s)!)]).toBe('Donkey Kong Country')
    expect(titles[cursorOf(press(s, 'r'), shelfSystem(s)!)]).toBe(titles[7])
    // Up lands on the first of this initial, and only then the previous one.
    const games = gamesOf(s, shelfSystem(s)!)
    expect(letterJump(games, 11, -1, false)).toBe(7)
    expect(letterJump(games, 7, -1, false)).toBe(6)
  })

  it('opens Muse from its card, straight to its albums', () => {
    const s = press(initialState({ system: 'MUSE' }), 'a')
    expect(currentView(s)).toBe('muse')
    expect(focusedGame(s)?.owner.tag).toBe('MUSE')
    expect(currentView(press(s, 'b'))).toBe(null)
  })

  it('turns Cubic on two axes, with B the system menu and MENU the TortOS one', () => {
    const s = initialState({ dir: 'cubic', system: 'NES', cursor: { NES: 1 } })
    expect(shelfSystem(press(s, 'up'))?.tag).toBe('SMS')
    expect(cursorOf(press(s, 'right'), shelfSystem(s)!)).toBe(2)
    expect(currentView(press(s, 'b'))).toBe('system-menu')
    expect(currentView(press(s, 'menu'))).toBe('tortos-menu')
  })
})

describe('TortOS menus', () => {
  it('builds the TortOS menu in the source order', () => {
    const s = press(initialState(), 'menu')
    expect(labels(s)).toEqual([
      'Play Time',
      'Wi-Fi',
      'Bluetooth',
      'Audio Output',
      'Over The Hare',
      'Auto Off',
      'UI Theme',
      'UI Direction',
      'Box Art',
      'Cheevos',
      'ScreenScraper',
      'Controls',
      'About TortOS',
    ])
  })

  it('skips dead rows and wraps', () => {
    const s = press(initialState(), 'menu')
    // Over The Hare is dead with Wi-Fi off, so down from Audio Output lands on Auto Off.
    expect(press(s, 'down', 'down', 'down', 'down').sel['tortos-menu']).toBe(5)
    expect(press(s, 'up').sel['tortos-menu']).toBe(12)
  })

  it('changes UI Theme and Direction in place, and the shelf follows', () => {
    const menu = press(initialState({ cards: 'classic' }), 'menu')
    const theme = press(menu, 'down', 'down', 'down', 'down', 'down')
    expect(press(theme, 'right').cards).toBe('fancy')
    expect(press(theme, 'down', 'right', 'right').dir).toBe('cubic')
  })

  it('leaves one screen with B and every menu with MENU', () => {
    const deep = press(initialState(), 'menu', 'a')
    expect(currentView(deep)).toBe('play-time')
    expect(currentView(press(deep, 'b'))).toBe('tortos-menu')
    expect(currentView(press(deep, 'menu'))).toBe(null)
    expect(closeMenus(deep).stack).toEqual([])
  })

  it('pages Controls with left and right, and names the page', () => {
    const s = initialState({ stack: ['tortos-menu', 'controls'] })
    expect(panelOf(press(s, 'right'), 'controls').heading).toBe('Controls: In a game')
    expect(panelOf(press(s, 'left'), 'controls').heading).toBe('Controls: Moving')
  })

  it('keeps Play Time footer notes on the panel', () => {
    const s = initialState({ stack: ['tortos-menu', 'play-time'] })
    const rows = panelOf(s, 'play-time').rows
    expect(rows.at(-1)).toMatchObject({ kind: 'note', label: 'A: go    Y: by system    L/R: window' })
  })

  it('turns Wi-Fi on from its first row and forgets a saved network with confirmation', () => {
    const s = initialState({ stack: ['tortos-menu', 'wifi'] })
    const on = press(s, 'a')
    expect(on.wifiOn).toBe(true)
    const asked = press(on, 'down', 'x')
    expect(currentView(asked)).toBe('confirm')
    expect(currentView(press(asked, 'a'))).toBe('wifi')
    const forgot = press(asked, 'up', 'a')
    expect(currentView(forgot)).toBe('notice')
    expect(forgot.forgotten).toContain('Tortoise Den')
  })

  it('signs in through two keyboards', () => {
    let s = initialState({ wifiOn: true, wifiNet: 'Tortoise Den', stack: ['tortos-menu'], sel: { 'tortos-menu': 9 } })
    s = press(s, 'a')
    expect(currentView(s)).toBe('keyboard')
    s = press(s, 'a', 'right', 'a', 'start')
    expect(s.keyboard?.purpose).toBe('ra-pass')
    s = press(s, 'a', 'start')
    expect(currentView(s)).toBe('notice')
    expect(s.raUser).toBe('ab')
  })

  it('opens game details with X and closes them with X', () => {
    const s = initialState({ shelf: 'games', system: 'MD', cursor: { MD: 10 }, wifiOn: true, wifiNet: 'x', stack: ['game-info'] })
    expect(labels(s)).toEqual(['Synopsis', 'Year', 'Genre', 'Cheevos', 'Replace Box Art'])
    expect(currentView(press(s, 'a'))).toBe('synopsis')
    expect(currentView(press(s, 'x'))).toBe(null)
  })

  it('walks earned and unearned achievements alike, and opens one with A', () => {
    const s = initialState({ shelf: 'games', system: 'SFC', cursor: { SFC: 4 }, stack: ['game-info', 'cheevos'] })
    expect(panelOf(s, 'cheevos').heading).toBe('Hagane: The Final Conflict\n3/36 cheevos   25/415 points')
    expect(press(s, 'down', 'down', 'down').cheevo).toBe(3)
    expect(press(s, 'up').cheevo).toBe(5)
    expect(currentView(press(s, 'a'))).toBe('cheevo')
  })

  it('measures the shelf menus to within a few pixels of the reference frame', () => {
    expect(Math.abs(measuredShelfWidth() - SHELF_MENU_W)).toBeLessThanOrEqual(6)
  })
})

describe('TortOS in a game', () => {
  const game = initialState({ shelf: 'games', system: 'NES', cursor: { NES: 1 } })

  it('pauses into the menu, and B continues', () => {
    const s = press(game, 'a', 'menu')
    expect(currentView(s)).toBe('game-menu')
    expect(currentView(press(s, 'b'))).toBe('game')
    expect(press(s, 'up', 'a').stack).toEqual([])
  })

  it('opens Save on the first empty slot and resumes on A', () => {
    const s = press(game, 'a', 'menu', 'down', 'a')
    expect(currentView(s)).toBe('slots')
    expect(s.slot).toBe(3)
    expect(press(s, 'left').slot).toBe(2)
    const saved = press(s, 'a')
    expect(currentView(saved)).toBe('game')
    expect(saved.slotsHave[3]).toBe(true)
  })

  it('never lets Load aim at an empty slot', () => {
    const s = press(game, 'a', 'menu', 'down', 'down', 'a')
    expect(s.slot).toBe(0)
    expect(press(s, 'left').slot).toBe(2)
  })
})

describe('TortOS Muse', () => {
  const playing = { album: 4, track: 0, paused: false, at: 95 }

  it('opens straight to Now Playing when something is loaded, and B walks back', () => {
    const s = press(initialState({ now: playing }), 'select')
    expect(s.stack).toEqual(['muse', 'muse-tracks', 'now-playing'])
    expect(currentView(press(s, 'b'))).toBe('muse-tracks')
    expect(press(s, 'select').stack).toEqual([])
  })

  it('does what the Now Playing hint line says', () => {
    const s = initialState({ now: playing, stack: ['muse', 'muse-tracks', 'now-playing'], cursor: { MUSE: 4 } })
    expect(press(s, 'a').now?.paused).toBe(true)
    expect(press(s, 'r').now?.track).toBe(1)
    expect(press(s, 'right').now?.at).toBe(105)
    expect(press(s, 'y').playMode).toBe(1)
    expect(currentView(press(s, 'menu'))).toBe('system-menu')
    expect(currentView(press(s, 'menu', 'menu'))).toBe('now-playing')
  })

  it('plays a track from the list and opens Now Playing', () => {
    const s = press(initialState({ stack: ['muse'], cursor: { MUSE: 6 } }), 'a', 'down', 'a')
    expect(currentView(s)).toBe('now-playing')
    expect(ALBUMS[s.now!.album]!.name).toBe('Flood')
    expect(s.now?.track).toBe(1)
  })
})

describe('TortOS motion', () => {
  it('takes the shortest way round a ring, and believes the press on a ring of two', () => {
    expect(ringDelta(12, 0, 13)).toBe(1)
    expect(ringDelta(0, 12, 13)).toBe(-1)
    expect(ringDelta(0, 1, 2, -1)).toBe(-1)
  })

  it('restarts a move from where the cards are drawn', () => {
    const p = pacingFor('horizontal')
    const a = retarget(atRest(0, p), 1, 0, p)
    const mid = positionAt(a, 120)
    const b = retarget(a, 1, 120, p)
    expect(b.from).toBeCloseTo(mid)
    expect(positionAt(b, 120 + 240)).toBe(2)
  })

  it('cuts a move longer than the warm window, but never a chase', () => {
    const p = pacingFor('horizontal')
    expect(retarget(atRest(0, p), 20, 0, p).cutTo).toBe(8)
    const c = pacingFor('cubic')
    const chased = retarget(atRest(0, c), 5, 0, c)
    expect(chased.cutTo).toBeNull()
    expect(chased.from).toBe(4)
  })

  it('settles the tint on its target', () => {
    let t = 0x000000
    for (let i = 0; i < 60; i++) t = tintStep(t, 0x816eba, 1 / 60)
    expect(t).toBe(0x816eba)
  })

  it('evaluates smoothstep exactly', () => {
    for (const u of [0.1, 0.3, 0.5, 0.8]) expect(evaluateEasing('smoothstep', u)).toBeCloseTo(u * u * (3 - 2 * u), 4)
  })
})

describe('TortOS text', () => {
  it('cuts with three full stops', () => {
    expect(fitText('Hold On To Your Potatoes, Here Comes Hagane', 49, 560)).toMatch(/\.\.\.$/)
    expect(fitText('SNES', 60, 1000)).toBe('SNES')
  })

  it('kerns', () => {
    expect(textWidth('To', 100)).toBeLessThan(textWidth('T', 100) + textWidth('o', 100))
  })

  it('holds a marquee at its start, which is its resting value', () => {
    expect(pingpong(100, 0)).toBe(0)
    expect(pingpong(100, 1400 + 1428 + 10)).toBe(100)
  })
})

describe('Coverflow', () => {
  it('draws each item once on a ring, far to near', () => {
    const slots = coverflowSlots(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], 0, 3, 0)
    expect(slots.map((s) => s.item)).toHaveLength(7)
    expect(slots.at(-1)).toEqual({ item: 'a', d: 0 })
  })

  it('puts a two-item ring behind the direction of travel', () => {
    expect(coverflowSlots(['a', 'b'], 0, 3, 1).find((s) => s.item === 'b')?.d).toBe(-1)
    expect(coverflowSlots(['a', 'b'], 0, 3, -1).find((s) => s.item === 'b')?.d).toBe(1)
  })

  it('gives wide art the frame area', () => {
    const { ahw, ahh } = fitArt(CF.games, { width: 1410, height: 1000 }, 166, 230, 1.2)
    expect(ahw * ahh).toBeCloseTo(166 * 230)
    expect(ahw / ahh).toBeCloseTo(1.41)
  })
})

describe('TortOS stills', () => {
  it.each(TORTOS_SCREENS.map((s) => [s.slug, s]))('renders %s', (_, screen) => {
    const { container } = render(
      <DeviceFrame device="trimui-brick" animate={false} interactive={false}>
        <Tortos {...screen.seed} />
      </DeviceFrame>,
    )
    expect(container.querySelector('[data-theme="tortos"]')).not.toBeNull()
  })
})
