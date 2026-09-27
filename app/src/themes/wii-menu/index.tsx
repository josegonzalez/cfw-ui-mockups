import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Animated } from '../../anim/Animated'
import type { EasingName, StoryboardMap } from '../../anim/types'
import { useScreen } from '../../device/ScreenContext'
import { useButtonPress, useInteractive } from '../../input/InputProvider'
import type { Button } from '../../input/keymap'
import { BORDER_X, BORDER_Y, H, W } from './layout'
import { GRID } from './library'
import { finishBoot, finishLeave, finishPending, initialState, reduce, top, type Seed, type State, type View } from './machine'
import { MOTION } from './motion'
import { AddressBook, Board, BoardCalendar, BoardCreate, Memo, NoMiis } from './views/Board'
import { ChannelBanner } from './views/Channel'
import { Health } from './views/Health'
import { Home } from './views/Home'
import { Menu } from './views/Menu'
import { DataManagement, Options } from './views/Options'
import { GridSwell, Preview, PreviewBackdrop } from './views/Preview'
import { Sd } from './views/Sd'
import { SettingsChoice, SettingsList, SettingsPages, SystemUpdate } from './views/Settings'
import { abs } from './views/parts'
import './wii-menu.css'

export type WiiMenuProps = Seed

/**
 * A screen change fades the new screen up from black. Each screen is keyed by what it is, so moving
 * within one - a page turn, a new focus - never replays it.
 */
function FadeIn({ delay, duration, mode, children }: { delay: number; duration: number; mode: EasingName; children: ReactNode }) {
  const [defs] = useState<StoryboardMap>(() => ({
    open: { animations: [{ property: 'opacity', from: 0, begin: delay, duration, mode }] },
  }))
  return (
    <Animated storyboard={defs} event="open" style={abs({ x: 0, y: 0, w: W, h: H })}>
      {children}
    </Animated>
  )
}

/**
 * A running channel. The port has no channels to run, so the channel's banner stands in for it, on
 * black; it is there so the HOME Menu can be shown with the Wii Menu and Reset buttons it offers
 * over a title.
 */
function Running({ slot }: { slot: number }) {
  return (
    <div className="wii-running" style={{ ...abs({ x: 0, y: 0, w: W, h: H }), background: '#000' }}>
      <div style={{ ...abs({ x: 11, y: 62, w: 585, h: 332 }) }}>
        <ChannelBanner id={GRID[slot]!} />
      </div>
    </div>
  )
}

interface ScreenIn {
  readonly key: string
  readonly delay: number
  readonly duration: number
  readonly mode: EasingName
}

/** Which screen a view belongs to, for `FadeIn`'s key, and how that screen comes up. */
function screenOf(s: State, v: View): ScreenIn {
  const fade = (key: string, duration: number, mode: EasingName, delay = 0): ScreenIn => ({ key, delay, duration, mode })
  switch (v.kind) {
    case 'menu':
    case 'preview':
      return fade('menu', MOTION.boot, 'linear')
    case 'running':
      return fade(`running:${s.resets}`, MOTION.screen, 'easeOutCubic')
    // Wii Options comes up from black; its tiles follow, in `Options`.
    case 'options':
      return fade('options', MOTION.optionsIn.ground, 'linear', MOTION.optionsIn.black)
    // Data Management keeps Wii Options' ground: nothing fades but its own tab and tiles.
    case 'data':
      return fade('data', 1, 'linear')
    case 'settings':
    case 'list':
    case 'choice':
    case 'update':
      return fade(v.kind === 'settings' ? 'settings' : `${v.kind}:${'id' in v ? v.id : ''}`, MOTION.settings, 'easeIn')
    case 'sd':
      return fade('sd', MOTION.sd.in, 'linear', MOTION.sd.black)
    case 'no-miis':
      return fade('board-create', MOTION.screen, 'easeOutCubic')
    default:
      return fade(v.kind, MOTION.screen, 'easeOutCubic')
  }
}

/** How long the screen showing takes to leave for the one waiting in `pending`. */
function exitOf(s: State): number {
  const from = top(s).kind
  if (from === 'menu') return MOTION.menuOut
  // Wii Options: the other tile, the chosen one's flight, and for Wii Settings the fade to black.
  const tile = MOTION.tileOut.other + MOTION.tileOut.fly
  return s.pending?.kind === 'settings' ? tile + MOTION.tileOut.black : tile
}

function Screen({ s, v }: { s: State; v: View }) {
  switch (v.kind) {
    case 'health':
      return <Health leaving={s.boot !== null} />
    case 'menu':
      return <Menu page={s.page} focus={s.focus} label={s.bootLabel} leaving={s.pending !== null} />
    case 'preview':
      // The grid is only there while the zoom moves: once the preview is open it is black behind.
      return (
        <>
          {s.zoom === 'open' ? null : (
            <GridSwell slot={v.slot} zoom={s.zoom}>
              <Menu page={s.page} focus={s.focus} label={false} leaving={false} />
            </GridSwell>
          )}
          <PreviewBackdrop zoom={s.zoom} />
          <Preview slot={v.slot} focus={v.focus} zoom={s.zoom} stepped={v.stepped ?? false} />
        </>
      )
    case 'running':
      return <Running slot={v.slot} />
    case 'options':
      return <Options focus={v.focus} leaving={s.pending?.kind ?? null} />
    case 'data':
      return <DataManagement focus={v.focus} />
    case 'settings':
      return <SettingsPages page={v.page} focus={v.focus} />
    case 'list':
      return <SettingsList id={v.id} focus={v.focus} />
    case 'choice':
      return <SettingsChoice id={v.id} selected={v.selected} focus={v.focus} />
    case 'update':
      return <SystemUpdate focus={v.focus} />
    case 'sd':
      return <Sd page={v.page} dialog={v.dialog} focus={v.focus} loading={s.sdLoading} />
    case 'board':
      return <Board day={v.day} focus={v.focus} memos={s.memos.filter((d) => d === v.day).length} />
    case 'board-calendar':
      return <BoardCalendar />
    case 'board-create':
      return <BoardCreate focus={v.focus} />
    case 'memo':
      return <Memo focus={v.focus} />
    case 'address':
      return <AddressBook focus={v.focus} />
    case 'no-miis':
      return (
        <>
          <BoardCreate focus={1} />
          <NoMiis />
        </>
      )
  }
}

/**
 * The Wii Menu, System Menu 4.3U, on a 640x480 handheld.
 *
 * Every behaviour is `machine.ts`; this root holds the state, finishes the preview's zoom on its
 * clock, and draws the current screen inside the Wii's 608x456 frame with the HOME Menu over it.
 */
export function WiiMenu(seed: WiiMenuProps) {
  const [state, setState] = useState<State>(() => initialState(seed))
  const { animate } = useScreen()
  const live = useInteractive()

  useButtonPress(
    useCallback((button: Button) => {
      setState((s) => reduce(s, button))
    }, []),
  )

  // The zoom's clocks. The panel is first drawn over its slot, then let go so its transition runs,
  // and the grid behind is dropped once it has faded; on the way back the panel shrinks into the
  // slot before the preview is dropped. A still never gets here - its seed settles every
  // transition - and the live build with motion off settles at once.
  useEffect(() => {
    if (!live || state.zoom !== 'enter') return
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setState((s) => (s.zoom === 'enter' ? { ...s, zoom: 'opening' } : s)))
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [live, state.zoom])
  useEffect(() => {
    if (!live || state.zoom !== 'opening') return
    const id = setTimeout(() => setState((s) => (s.zoom === 'opening' ? { ...s, zoom: 'open' } : s)), animate ? MOTION.zoomIn : 0)
    return () => clearTimeout(id)
  }, [live, animate, state.zoom])
  useEffect(() => {
    if (!live || state.zoom !== 'leave') return
    const id = setTimeout(() => setState((s) => (s.zoom === 'leave' ? finishLeave(s) : s)), animate ? MOTION.zoomGridOut.total : 0)
    return () => clearTimeout(id)
  }, [live, animate, state.zoom])

  // Leaving Health & Safety: the fade to black, then the black while the menu loads.
  useEffect(() => {
    if (!live || state.boot === null) return
    const wait = !animate ? 0 : state.boot === 'out' ? MOTION.healthOut : MOTION.bootBlack
    const id = setTimeout(
      () => setState((s) => (s.boot === 'out' ? { ...s, boot: 'black' } : s.boot === 'black' ? finishBoot(s) : s)),
      wait,
    )
    return () => clearTimeout(id)
  }, [live, animate, state.boot])
  // The screen showing leaving for the one waiting: the menu fading to black, or a tile's flight.
  const exit = state.pending === null ? 0 : exitOf(state)
  useEffect(() => {
    if (!live || state.pending === null) return
    const id = setTimeout(() => setState(finishPending), animate ? exit : 0)
    return () => clearTimeout(id)
  }, [live, animate, state.pending, exit])
  // "Wii Menu" in the clock's place after boot: it shows while the menu fades up and holds.
  useEffect(() => {
    if (!live || !state.bootLabel) return
    const id = setTimeout(() => setState((s) => ({ ...s, bootLabel: false })), animate ? MOTION.bootLabel.hold : 0)
    return () => clearTimeout(id)
  }, [live, animate, state.bootLabel])
  // The SD Card Menu's loading box: through the black, the fade up, and its own time on screen.
  useEffect(() => {
    if (!live || !state.sdLoading) return
    const id = setTimeout(
      () => setState((s) => ({ ...s, sdLoading: false })),
      animate ? MOTION.sd.black + MOTION.sd.in + MOTION.sd.loading : 0,
    )
    return () => clearTimeout(id)
  }, [live, animate, state.sdLoading])

  const v = top(state)
  const screen = screenOf(state, v)
  return (
    <div className="wii-menu" data-theme="wii-menu" data-view={v.kind}>
      <div className="wii-frame" style={{ left: BORDER_X, top: BORDER_Y, width: W, height: H }}>
        <FadeIn key={screen.key} delay={screen.delay} duration={screen.duration} mode={screen.mode}>
          <Screen s={state} v={v} />
        </FadeIn>
        {state.home !== null ? <Home focus={state.home} running={v.kind === 'running'} /> : null}
      </div>
    </div>
  )
}
