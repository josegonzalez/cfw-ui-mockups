import { render } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DeviceFrame } from '../../device/DeviceFrame'
import type { DeviceSlug } from '../../device/devices'
import type { Button } from '../../input/keymap'
import { SpruceOS } from '.'
import { additionalSettings, hardwareFor } from './data'
import { FIXTURE_LINES } from './library'
import {
  appRows,
  current,
  gameList,
  gameText,
  holdMenu,
  initialState,
  mainPopupRows,
  reduce,
  returned,
  settingRows,
  titleOf,
  type State,
} from './machine'
import { SPRUCEOS_DEVICES, SPRUCEOS_SCREENS, seedFor, stillsFor } from './manifest'
import { isAlphabetized, scrollString } from './text'

const REF = resolve(__dirname, '../../../../docs/themes/spruceos/reference')
const press = (s: State, ...buttons: Button[]) => buttons.reduce((acc, b) => reduce(acc, b), s)
const rows = (file: string) =>
  readFileSync(resolve(REF, file), 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('|'))

interface LoggedView {
  readonly still: string
  readonly title: string
  readonly rows: readonly { readonly text: string; readonly value: string | null }[]
}

/** The views PyUI built for a still, last first: the one on screen when the frame was taken. */
function logged(device: string, still: string): LoggedView {
  const lines = readFileSync(resolve(REF, 'render', device === 'rg40xx' ? 'rg35xx' : device, 'views.jsonl'), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as LoggedView)
    .filter((v) => v.still === still)
  return lines[lines.length - 1]!
}

describe('spruceOS reference parity', () => {
  it('poses every still with the same buttons as its reference frame', () => {
    const frames = rows('stills.txt')
    expect(SPRUCEOS_SCREENS.map((s) => s.slug)).toEqual(frames.map(([slug]) => slug))
    for (const [slug, events, env, overrides] of frames) {
      const def = SPRUCEOS_SCREENS.find((s) => s.slug === slug)!
      expect(def.seed.events ?? '', slug).toBe(events)
      expect(def.seed.gsTrigger ?? false, slug).toBe(env === 'GS_TRIGGER=1')
      expect(def.seed.boxartPrompt ?? false, slug).toBe(env === 'BOXART_PROMPT=1')
      const own = Object.fromEntries(
        (overrides ?? '')
          .split(' ')
          .filter(Boolean)
          .map((o) => o.split('=')),
      )
      expect(def.overrides ?? {}, slug).toEqual(own)
    }
  })

  it('lists the same games as the fixture the frames were rendered from', () => {
    expect(FIXTURE_LINES.map((l) => l.join('|'))).toEqual(rows('fixture.txt').map((r) => r.join('|')))
  })

  it('has a reference frame for every still it carries', () => {
    for (const device of SPRUCEOS_DEVICES) {
      for (const { slug } of stillsFor(device)) {
        const dir = device === 'rg40xx' ? 'rg35xx' : device
        expect(existsSync(resolve(REF, 'render', dir, `${slug}.png`)), `${device} ${slug}`).toBe(true)
      }
    }
  })

  it.each(SPRUCEOS_DEVICES.map((d) => [d] as const))('builds the rows PyUI built on %s', (device: DeviceSlug) => {
    const hw = hardwareFor(device)
    const at = (still: string) =>
      initialState(
        device,
        seedFor(
          SPRUCEOS_SCREENS.find((s) => s.slug === still)!,
          device,
        ),
      )
    // The apps, every settings page and the main menu's popup, row for row and value for value.
    expect(appRows(at('apps'))).toEqual(logged(device, 'apps').rows.map((r) => r.text))
    for (const [still, page] of [
      ['settings', 'root'],
      ['settings-theme-settings', 'theme'],
      ['settings-sound', 'sound'],
      ['settings-additional', 'additional'],
      ['settings-animation', 'animation'],
      ['settings-tasks', 'tasks'],
      ['settings-about', 'about'],
    ] as const) {
      const ours = settingRows(at(still), page).map((r) => [r.text, r.value ?? null])
      const theirs = logged(device, still).rows.map((r) => [r.text, r.value])
      expect(
        ours.map((r) => r[0]),
        `${device} ${still}`,
      ).toEqual(theirs.map((r) => r[0]))
      for (const [i, [, value]] of ours.entries()) {
        const want = theirs[i]![1]
        // PyUI hands back `None` or an empty string for a row without a value; both draw nothing.
        expect(value || null, `${device} ${still} ${ours[i]![0]}`).toBe(want || null)
      }
    }
    expect(additionalSettings(hw)).toEqual(logged(device, 'settings-additional').rows.map((r) => r.text))
    expect(mainPopupRows(at('main-menu'))).toEqual(logged(device, 'main-popup').rows.map((r) => r.text))
  })

  it.each(SPRUCEOS_DEVICES.map((d) => [d] as const))('titles every still as PyUI did on %s', (device: DeviceSlug) => {
    for (const def of stillsFor(device)) {
      const s = initialState(device, seedFor(def, device))
      const screen = current(s)
      if (screen.kind === 'boxart' || screen.kind === 'power' || screen.kind === 'keyboard' || screen.kind === 'popup')
        continue
      const view = logged(device, def.slug)
      // A grid, a carousel and the Game Switcher are built titled with their page but put the focused
      // game in the top bar (`set_top_bar_text_to_selection`), which the parity spec holds instead.
      const bySelection =
        screen.kind === 'switcher' || (screen.kind === 'games' && (s.gameView === 'GRID' || s.gameView === 'CAROUSEL'))
      if (!view || bySelection) continue
      expect(titleOf(s, screen), `${device} ${def.slug}`).toBe(view.title)
    }
  })
})

describe('spruceOS text', () => {
  it('shows the index letter only for rows in sorted() order', () => {
    expect(isAlphabetized(["Kirby's Dream Land", 'Pokemon Red', 'Tetris'])).toBe(true)
    expect(isAlphabetized(['Pokemon Red (GB)', 'Metroid Fusion (GBA)'])).toBe(false)
    // Python compares code points: upper case sorts before lower.
    expect(isAlphabetized(['Zelda', 'apple'])).toBe(true)
  })

  it('rotates a row with at least eight spaces of padding', () => {
    const s = scrollString('Tetris', 0, 0, 24)
    expect(s).toBe(`Tetris${' '.repeat(8)}`)
    expect(scrollString('Tetris', 2, 0, 24)).toBe(`tris${' '.repeat(8)}Te`)
  })
})

describe('spruceOS input', () => {
  it('opens on Favorites, and reaches the same entries by wrapping left whatever leads the row', () => {
    for (const device of ['miyoo-a30', 'trimui-smart-pro'] as const) {
      const s = initialState(device)
      const label = (x: State) => {
        const screen = current(x)
        return screen.kind === 'main' ? screen.cur.sel : -1
      }
      const labels =
        device === 'trimui-smart-pro'
          ? ['Recents', 'Favorites', 'Games', 'Apps', 'Settings']
          : ['Favorites', 'Games', 'Apps', 'Settings']
      expect(labels[label(press(s, 'left'))]).toBe('Settings')
      expect(labels[label(press(s, 'left', 'left', 'left'))]).toBe('Games')
    }
  })

  it('does nothing on B at the main menu', () => {
    const s = initialState('miyoo-a30')
    expect(press(s, 'b')).toEqual(s)
  })

  it('opens a system from Games, and B walks back', () => {
    const list = initialState('miyoo-a30', { events: 'lllaa' })
    const screen = current(list)
    expect(screen.kind).toBe('games')
    expect(
      gameList(list, (screen as Extract<typeof screen, { kind: 'games' }>).source).games.map((g) => gameText(g, false)),
    ).toEqual(["Kirby's Dream Land", 'Pokemon Red', 'Tetris'])
    expect(current(press(list, 'b')).kind).toBe('systems')
    expect(current(press(list, 'b', 'b')).kind).toBe('main')
  })

  it('cycles the four game views with SELECT', () => {
    let s = initialState('miyoo-a30', { events: 'lllaa' })
    const views = []
    for (let i = 0; i < 4; i++) {
      views.push(s.gameView)
      s = press(s, 'select')
    }
    expect(views).toEqual(['TEXT_AND_IMAGE', 'GRID', 'ICON_AND_DESC', 'CAROUSEL'])
    expect(s.gameView).toBe('TEXT_AND_IMAGE')
  })

  it('toggles a favourite from the game popup', () => {
    const s = press(initialState('miyoo-a30', { events: 'lllaa' }), 'menu', 'down', 'down', 'a')
    expect(s.favourites).toContain("GB/Kirby's Dream Land.gb")
    expect(current(s).kind).toBe('games')
  })

  it('launches a game, and adds it to Recents and the Game Switcher on return', () => {
    const s = press(initialState('miyoo-a30', { events: 'lllaa' }), 'a')
    expect(s.away).toEqual({ kind: 'game', game: "GB/Kirby's Dream Land.gb" })
    const back = returned(s)
    expect(back.recents[0]).toBe("GB/Kirby's Dream Land.gb")
    expect(back.switcher[0]).toBe("GB/Kirby's Dream Land.gb")
    expect(current(back).kind).toBe('games')
  })

  it('opens the Game Switcher on a held MENU from anywhere, and B closes it', () => {
    const s = holdMenu(initialState('miyoo-a30', { events: 'la' }))
    expect(current(s).kind).toBe('switcher')
    expect(current(press(s, 'b')).kind).toBe('settings')
  })

  it('shows the volume after it changes, and not before', () => {
    const s = initialState('miyoo-a30', { events: 'la' })
    const louder = press(s, 'down', 'down', 'right')
    expect(louder.volume).toBe(1)
    expect(louder.volumeShown).toBe(s.volumeShown + 1)
  })

  it('offers Reboot only where the device has a reboot command', () => {
    expect(hardwareFor('miyoo-a30').reboot).toBe(false)
    expect(press(initialState('miyoo-a30', { events: 'laa' }), 'x').away).toBeNull()
    expect(press(initialState('miyoo-flip', { events: 'laa' }), 'x').away).toEqual({ kind: 'reboot' })
  })

  it('searches the upper-cased text across every system', () => {
    // Rom Search, then S from the home row, U and P from the row above it, and START.
    let s = initialState('miyoo-a30', { events: 'ma' })
    s = press(s, 'down', 'down', 'down', 'right', 'right', 'a') // s
    s = press(s, 'up', 'right', 'right', 'right', 'right', 'a') // u
    s = press(s, 'right', 'right', 'right', 'a', 'start') // p
    const screen = current(s)
    expect(screen.kind).toBe('games')
    const found = gameList(s, (screen as Extract<typeof screen, { kind: 'games' }>).source)
    expect(found.title).toBe('Game Search')
    expect(found.games.map((g) => g.name)).toEqual(['Super Mario Bros.', 'Super Metroid'])
  })

  it('hides an app and shows it again marked hidden', () => {
    const s = press(initialState('miyoo-a30', { events: 'lla' }), 'menu', 'a')
    expect(appRows(s)).not.toContain('A Firmware Update Is Available')
    const shown = press(s, 'menu', 'down', 'a')
    expect(appRows(shown)).toContain('A Firmware Update Is Available(Hidden)')
  })
})

describe('spruceOS stills', () => {
  const all = SPRUCEOS_DEVICES.flatMap((d) => stillsFor(d).map((s) => [`${d} ${s.slug}`, d, s] as const))
  it.each(all)('renders %s', (_, device, screen) => {
    const { container } = render(
      <DeviceFrame device={device} animate={false} interactive={false}>
        <SpruceOS device={device} {...seedFor(screen, device)} />
      </DeviceFrame>,
    )
    expect(container.querySelector('[data-theme="spruceos"]')).not.toBeNull()
  })
})
