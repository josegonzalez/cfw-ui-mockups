import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DeviceFrame } from '../../device/DeviceFrame'
import type { Button } from '../../input/keymap'
import { DreamcastBios } from '.'
import { AUDIO_CD, BOOT_CLOCK, CARD_BLOCKS, CLOCK, FILES, formatClock } from './library'
import {
  CLOCK_CANCEL,
  CLOCK_SELECT,
  MUSIC_PLAY,
  SETTINGS_BACK,
  arrivalCue,
  cueOf,
  finishBoot,
  freeBlocks,
  initialState,
  reduce,
  screenKey,
  settle,
  tickPlayer,
  top,
  type State,
} from './machine'
import { DREAMCAST_BIOS_SCREENS } from './manifest'
import { S, asLatin1, cells, icon, runs } from './strings'

const press = (s: State, ...buttons: Button[]) => buttons.reduce((acc, b) => settle(reduce(acc, b)), s)
const menu = () => initialState()

describe('Dreamcast BIOS strings', () => {
  it('splits yellow runs and resolves icon escapes to the font glyphs', () => {
    expect(runs(S.selectCard)).toEqual([
      { text: 'Select a memory card and press ', hot: false },
      { text: `${icon(11)} Button`, hot: true },
      { text: '.', hot: false },
    ])
    expect(runs(S.selectFiles).at(-1)).toEqual({ text: `${icon(15)}/${icon(16)}`, hot: true })
  })

  it('counts wide glyphs as two cells', () => {
    expect(cells('File')).toBe(4)
    expect(cells('日本語')).toBe(6)
    expect(cells(S.selectCard)).toBe('Select a memory card and press '.length + 2 + ' Button.'.length)
  })

  it("shows a Shift-JIS comment as the BIOS does: lead bytes blank, trail bytes Latin-1", () => {
    expect(asLatin1('82d582e6')).toBe(' Õ æ')
    expect(asLatin1('50555930')).toBe('PUY0')
  })
})

describe('Dreamcast BIOS library', () => {
  it('fills the card as the capture shows it: 88 blocks used, 110 free', () => {
    expect(FILES.reduce((n, f) => n + f.blocks, 0)).toBe(88)
    expect(freeBlocks(menu())).toBe(110)
    expect(CARD_BLOCKS).toBe(198)
  })

  it('formats the clock as the English menu does', () => {
    expect(formatClock(CLOCK)).toBe('07/21/2021 19:42')
    expect(formatClock(BOOT_CLOCK)).toBe('11/27/1998 00:00')
  })
})

describe('Dreamcast BIOS machine', () => {
  it('starts on the main menu with Play focused, and moves in the 2x2 grid without wrapping', () => {
    const s = menu()
    expect(top(s).kind).toBe('main')
    expect(s.main).toBe(0)
    expect(press(s, 'right').main).toBe(1)
    expect(press(s, 'down').main).toBe(2)
    expect(press(s, 'right', 'down').main).toBe(3)
    expect(press(s, 'left', 'up').main).toBe(0)
    expect(press(s, 'right', 'right').main).toBe(1)
  })

  it('opens each item with A, and B or BACK brings every screen home', () => {
    expect(top(press(menu(), 'a')).kind).toBe('no-disc')
    expect(top(press(menu(), 'right', 'a')).kind).toBe('cards')
    expect(top(press(menu(), 'down', 'a'))).toEqual({ kind: 'music', focus: MUSIC_PLAY })
    expect(top(press(menu(), 'right', 'down', 'a'))).toEqual({ kind: 'settings', focus: 0 })
    for (const path of [['a'], ['right', 'a'], ['down', 'a'], ['right', 'down', 'a']] as Button[][]) {
      expect(top(press(menu(), ...path, 'b')).kind, path.join()).toBe('main')
    }
    expect(top(press(menu(), 'down', 'a', 'left', 'left', 'left', 'a')).kind).toBe('main')
    const settings = press(menu(), 'right', 'down', 'a', ...(Array(SETTINGS_BACK).fill('down') as Button[]))
    expect(top(settings)).toEqual({ kind: 'settings', focus: SETTINGS_BACK })
    expect(top(press(settings, 'a')).kind).toBe('main')
  })

  it('fades between screens but opens a dialog at once', () => {
    const toSettings = reduce(press(menu(), 'right', 'down'), 'a')
    expect(toSettings.pending).not.toBeNull()
    expect(top(toSettings).kind).toBe('main')
    // Nothing is taken until the next screen is up.
    expect(reduce(toSettings, 'b')).toBe(toSettings)
    const settings = settle(toSettings)
    const box = reduce(settings, 'a')
    expect(box.pending).toBeNull()
    expect(top(box).kind).toBe('language')
    expect(screenKey(box.stack)).toBe('settings')
  })

  it('sets the language, sound and auto start, and Cancel or B changes nothing', () => {
    const settings = press(menu(), 'right', 'down', 'a')
    expect(press(settings, 'a', 'down', 'down', 'a').prefs.language).toBe(3)
    expect(press(settings, 'a', 'down', 'down', 'b').prefs.language).toBe(1)
    expect(press(settings, 'a', ...(Array(6).fill('down') as Button[]), 'a').prefs.language).toBe(1)
    expect(press(settings, 'down', 'down', 'a', 'down', 'a').prefs.stereo).toBe(false)
    expect(press(settings, 'down', 'down', 'down', 'a', 'up', 'a').prefs.autoStart).toBe(true)
    expect(top(press(settings, 'down', 'down', 'down', 'down', 'a', 'down', 'a'))).toEqual({ kind: 'settings', focus: 4 })
  })

  it('says the memory cards were set, over the box that asked, and closes both', () => {
    const set = press(menu(), 'right', 'down', 'a', 'down', 'down', 'down', 'down', 'a', 'a')
    expect(set.stack.map((v) => v.kind)).toEqual(['main', 'settings', 'card-clock', 'card-clock-done'])
    expect(top(press(set, 'a'))).toEqual({ kind: 'settings', focus: 4 })
    expect(top(press(set, 'b'))).toEqual({ kind: 'settings', focus: 4 })
  })

  it('edits the clock field by field, keeps it on Select and drops it on Cancel', () => {
    const editor = press(menu(), 'right', 'down', 'a', 'down', 'a')
    expect(top(editor)).toMatchObject({ kind: 'clock', focus: 0 })
    const changed = press(editor, 'up', 'right', 'right', 'right', 'down')
    expect(top(changed)).toMatchObject({ kind: 'clock', focus: 3, draft: { month: 8, hour: 18 } })
    const toSelect = press(changed, 'right', 'right')
    expect(top(toSelect)).toMatchObject({ focus: CLOCK_SELECT })
    expect(press(toSelect, 'a').clock).toMatchObject({ month: 8, hour: 18 })
    expect(top(press(toSelect, 'down'))).toMatchObject({ focus: CLOCK_CANCEL })
    expect(press(toSelect, 'down', 'a').clock).toEqual(CLOCK)
    expect(press(changed, 'b').clock).toEqual(CLOCK)
  })

  it('holds the power-on logo, taking no input, until its clock hands over to the next screen', () => {
    const boot = initialState({ boot: true })
    expect(top(boot)).toEqual({ kind: 'boot', next: { kind: 'main' } })
    // A still posed on it stays on it: the logo is a screen, not a transition to settle.
    expect(settle(boot)).toBe(boot)
    expect(reduce(boot, 'a')).toBe(boot)
    expect(top(settle(finishBoot(boot))).kind).toBe('main')
    const first = initialState({ boot: true, firstBoot: true })
    expect(top(settle(finishBoot(first))).kind).toBe('boot-clock')
  })

  it('asks for the clock at first boot, and Select alone carries on to the menu', () => {
    const boot = initialState({ firstBoot: true })
    expect(top(boot)).toMatchObject({ kind: 'boot-clock', focus: 0, draft: BOOT_CLOCK })
    expect(press(boot, 'b')).toEqual(boot)
    const set = press(boot, 'up', 'right', 'right', 'right', 'right', 'right', 'a')
    expect(top(set).kind).toBe('main')
    expect(set.clock).toMatchObject({ month: 12, day: 27 })
  })

  it('opens the card in A-1 and nothing in an empty socket', () => {
    const cards = press(menu(), 'right', 'a')
    expect(top(cards)).toMatchObject({ kind: 'cards', focus: 0, purpose: 'browse' })
    expect(top(press(cards, 'right', 'a'))).toMatchObject({ kind: 'cards', focus: 2 })
    expect(top(press(cards, 'a'))).toEqual({ kind: 'files', focus: 0 })
    expect(top(press(cards, 'left'))).toMatchObject({ focus: 'back' })
    expect(top(press(cards, 'left', 'a')).kind).toBe('main')
  })

  it('walks the file grid, with ALL above-left and BACK below', () => {
    const list = press(menu(), 'right', 'a', 'a')
    expect(top(press(list, 'right', 'right'))).toEqual({ kind: 'files', focus: 2 })
    expect(top(press(list, 'down'))).toEqual({ kind: 'files', focus: 8 })
    expect(top(press(list, 'down', 'down'))).toEqual({ kind: 'files', focus: 'back' })
    expect(top(press(list, 'left'))).toEqual({ kind: 'files', focus: 'all' })
    expect(top(press(list, 'b'))).toMatchObject({ kind: 'cards' })
  })

  it('deletes a save after Yes, shows the box saying so, and frees its blocks', () => {
    const list = press(menu(), 'right', 'a', 'a')
    const confirm = press(list, 'a', 'down', 'a')
    // The box opens on No.
    expect(top(confirm)).toEqual({ kind: 'delete', focus: 1, all: false })
    expect(press(confirm, 'a').files).toHaveLength(FILES.length)
    const done = press(confirm, 'up', 'a')
    expect(top(done).kind).toBe('deleted')
    expect(done.files).not.toContain('bangaio')
    expect(freeBlocks(done)).toBe(115)
    expect(top(press(done, 'a'))).toEqual({ kind: 'files', focus: 0 })
  })

  it('offers Copy all and Delete all on ALL, and Delete all empties the card', () => {
    const all = press(menu(), 'right', 'a', 'a', 'left', 'a')
    expect(top(all)).toEqual({ kind: 'file-menu', focus: 0, all: true })
    const emptied = press(all, 'down', 'a', 'up', 'a', 'a')
    expect(emptied.files).toEqual([])
    expect(freeBlocks(emptied)).toBe(CARD_BLOCKS)
    expect(top(emptied)).toEqual({ kind: 'files', focus: 'all' })
  })

  it('takes Copy as far as the destination picker, where there is no second card', () => {
    const dest = press(menu(), 'right', 'a', 'a', 'a', 'a')
    expect(top(dest)).toMatchObject({ kind: 'cards', purpose: 'copy' })
    expect(press(dest, 'a')).toEqual(dest)
    expect(top(press(dest, 'b'))).toEqual({ kind: 'files', focus: 0 })
  })

  it('picks saves of one game with X and Y, and a save of another game starts over', () => {
    const list = press(menu(), 'right', 'a', 'a')
    expect(press(list, 'x').marked).toEqual(['bangaio'])
    expect(press(list, 'x', 'y').marked).toEqual([])
    expect(press(list, 'x', 'right', 'x').marked).toEqual(['dino'])
  })

  it('moves along the transport and cycles repeat off, one, all', () => {
    const music = press(menu(), 'down', 'a')
    const repeat = press(music, 'right', 'right')
    expect(top(repeat)).toEqual({ kind: 'music', focus: 5 })
    expect(press(repeat, 'a').repeat).toBe(1)
    expect(press(repeat, 'a', 'a').repeat).toBe(2)
    expect(press(repeat, 'a', 'a', 'a').repeat).toBe(0)
    expect(press(music, 'a')).toEqual(music)
  })
})

describe('Dreamcast BIOS CD player', () => {
  const music = () => press(initialState({ disc: true }), 'down', 'a')

  it('plays, pauses and stops the disc from its transport', () => {
    const s = music()
    expect(s.player).toMatchObject({ disc: true, state: 'stopped' })
    expect(press(s, 'a').player.state).toBe('playing')
    expect(press(s, 'a', 'a').player.state).toBe('paused')
    expect(press(s, 'a', 'left', 'a').player).toMatchObject({ state: 'stopped', track: 1, elapsed: 0 })
  })

  it('counts a playing track up a second at a time, and moves on at its end', () => {
    let s = press(music(), 'a')
    for (let i = 0; i < 5; i++) s = tickPlayer(s)
    expect(s.player).toMatchObject({ track: 1, elapsed: 5 })
    for (let i = 0; i < AUDIO_CD[0]!; i++) s = tickPlayer(s)
    expect(s.player).toMatchObject({ track: 2, elapsed: 5 })
    // A paused or stopped disc holds its time.
    const paused = press(s, 'a')
    expect(tickPlayer(paused)).toBe(paused)
  })

  it('changes track with previous and next while playing', () => {
    const s = press(music(), 'a', 'right', 'a')
    expect(s.player).toMatchObject({ track: 2, elapsed: 0 })
    expect(press(s, 'left', 'left', 'a').player.track).toBe(1)
  })

  it("stops at the disc's end unless repeat says otherwise", () => {
    const atEnd = (repeat: 0 | 1 | 2) => {
      const s = press(music(), 'a')
      return tickPlayer({ ...s, repeat, player: { ...s.player, track: AUDIO_CD.length, elapsed: AUDIO_CD.at(-1)! - 1 } }).player
    }
    expect(atEnd(0)).toMatchObject({ state: 'stopped', track: 1 })
    expect(atEnd(1)).toMatchObject({ state: 'playing', track: AUDIO_CD.length, elapsed: 0 })
    expect(atEnd(2)).toMatchObject({ state: 'playing', track: 1, elapsed: 0 })
  })

  it('poses a still partway into a track, and the hidden 3D mode from its seed', () => {
    const s = initialState({ realMode: true, disc: true, events: 'daa', seconds: 4 })
    expect(s.realMode).toBe(true)
    expect(s.player).toMatchObject({ state: 'playing', track: 1, elapsed: 4 })
    expect(initialState().realMode).toBe(false)
  })

  it('does nothing but repeat with no disc in', () => {
    const s = press(menu(), 'down', 'a')
    expect(press(s, 'a')).toEqual(s)
  })
})

describe('Dreamcast BIOS sounds', () => {
  /** The sound the last of `buttons` makes, after the rest have been pressed. */
  const cue = (...buttons: Button[]) => {
    const prev = press(menu(), ...buttons.slice(0, -1))
    return cueOf(prev, reduce(prev, buttons.at(-1)!), buttons.at(-1)!)
  }

  it('sounds the cursor, confirm and back as the recording does', () => {
    expect(cue('right')).toBe('cursor')
    expect(cue('right', 'down', 'a')).toBe('confirm')
    expect(cue('right', 'down', 'a', 'b')).toBe('back')
    // A on the on-screen BACK sounds as B.
    expect(cue('down', 'a', 'left', 'left', 'left', 'a')).toBe('back')
    // Every step of the clock editor is the cursor.
    expect(cue('right', 'down', 'a', 'down', 'a', 'up')).toBe('cursor')
  })

  it('is silent when a press changes nothing', () => {
    expect(cue('left')).toBeNull()
    expect(cue('right', 'a', 'right', 'a')).toBeNull()
  })

  it('sounds the alert as Delete opens its warning, and its own sound for the memory-card clock', () => {
    expect(cue('right', 'a', 'a', 'a', 'down', 'a')).toBe('alert')
    expect(cue('right', 'down', 'a', 'down', 'down', 'down', 'down', 'a')).toBe('card-clock')
  })

  it("follows Play's confirm with the alert as the no-disc box arrives", () => {
    expect(cue('a')).toBe('confirm')
    expect(arrivalCue({ kind: 'no-disc' })).toBe('alert')
    expect(arrivalCue({ kind: 'main' })).toBeNull()
  })
})

describe('Dreamcast BIOS stills', () => {
  it('poses every still on the view its name says', () => {
    const view = (slug: string) => top(initialState(DREAMCAST_BIOS_SCREENS.find((s) => s.slug === slug)!.seed))
    const kinds: Record<string, string> = {
      main: 'main',
      'main-settings': 'main',
      boot: 'boot',
      'boot-clock': 'boot-clock',
      'no-disc': 'no-disc',
      settings: 'settings',
      'settings-language': 'language',
      'settings-clock': 'clock',
      'settings-sound': 'sound',
      'settings-auto-start': 'auto',
      'settings-card-clock': 'card-clock',
      'settings-cards-set': 'card-clock-done',
      'file-cards': 'cards',
      'file-list': 'files',
      'file-menu': 'file-menu',
      'file-all-menu': 'file-menu',
      'file-delete': 'delete',
      'file-deleted': 'deleted',
      'file-destination': 'cards',
      music: 'music',
      'music-repeat': 'music',
      'music-disc': 'music',
      'music-disc-playing': 'music',
      'music-disc-visualizer-3d': 'music',
    }
    for (const s of DREAMCAST_BIOS_SCREENS) expect(view(s.slug).kind, s.slug).toBe(kinds[s.slug.replace(/-3d$/, '')] ?? kinds[s.slug])
    // Every 3D still is its normal one in the hidden 3D mode.
    for (const s of DREAMCAST_BIOS_SCREENS.filter((x) => x.slug.endsWith('-3d'))) {
      expect(initialState(s.seed).realMode, s.slug).toBe(true)
    }
    expect(DREAMCAST_BIOS_SCREENS.some((s) => s.slug === 'boot-3d')).toBe(false)
    expect(initialState({ events: 'rd' }).main).toBe(3)
    expect(initialState({ events: 'darra' }).repeat).toBe(1)
    expect(view('file-all-menu')).toMatchObject({ all: true })
    expect(view('file-destination')).toMatchObject({ purpose: 'copy' })
    const disc = (slug: string) => initialState(DREAMCAST_BIOS_SCREENS.find((s) => s.slug === slug)!.seed).player
    expect(disc('music-disc')).toMatchObject({ disc: true, state: 'stopped' })
    expect(disc('music-disc-playing')).toMatchObject({ disc: true, state: 'playing', track: 1, elapsed: 0 })
  })

  it.each(DREAMCAST_BIOS_SCREENS.map((s) => [s.slug, s] as const))('renders %s', (_, screen) => {
    const { container } = render(
      <DeviceFrame device="dreamcast" animate={false} interactive={false}>
        <DreamcastBios {...screen.seed} />
      </DeviceFrame>,
    )
    expect(container.querySelector('[data-theme="dreamcast-bios"]')).not.toBeNull()
  })
})
