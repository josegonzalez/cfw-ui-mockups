import { useCallback, useEffect, useState } from 'react'
import { useScreen } from '../../device/ScreenContext'
import { useButtonPress } from '../../input/InputProvider'
import type { Button } from '../../input/keymap'
import { usePhase } from './clock'
import {
  accentOf,
  backdropOf,
  currentView,
  cursorOf,
  finishNotice,
  focusedGame,
  gamesOf,
  initialState,
  museOpen,
  panelOf,
  reduce,
  shelfScreen,
  shelfSystem,
  systemsOf,
  type Seed,
  type State,
  type View,
} from './machine'
import { active, atRest, labelAt, pacingFor, positionAt, retarget, ringDelta, tintStep, type Tween } from './motion'
import { CYAN, UI } from './palette'
import { DIM, FONT, SCREEN } from './spec'
import { textWidth } from './text'
import { PausedFrame, Slots } from './views/InGame'
import { Keyboard } from './views/Keyboard'
import { NowPlaying } from './views/NowPlaying'
import { Dim, Panel } from './views/parts'
import { Shelf, type ShelfMotion } from './views/Shelf'
import './tortos.css'

export type TortosProps = Seed

/**
 * Everything the root holds: the machine's state, and the motion the machine does not know about -
 * where each shelf is drawn on its way to where the machine says it is, and the background's tint
 * on its way to the focused system's colour.
 */
interface World {
  readonly s: State
  readonly sys: Tween
  readonly games: Readonly<Record<string, Tween>>
  readonly tint: number
}

const tintTarget = (s: State) => shelfSystem(s)?.accent ?? CYAN

function initialWorld(seed: Seed): World {
  const s = initialState(seed)
  const pacing = pacingFor(s.dir)
  const games: Record<string, Tween> = {}
  for (const sys of systemsOf(s)) games[sys.tag] = atRest(cursorOf(s, sys), pacing)
  return { s, sys: atRest(s.sys, pacing), games, tint: tintTarget(s) }
}

/**
 * One press: run the machine, then retarget whichever shelves it moved from where they are drawn.
 * A shelf that was entered, re-sorted or rebuilt starts at rest instead, as `cf_reset` does.
 */
function press(w: World, button: Button, now: number): World {
  const prev = w.s
  const next = reduce(prev, button)
  if (next === prev) return w
  const pacing = pacingFor(next.dir)
  const before = systemsOf(prev)
  const after = systemsOf(next)

  let sys = w.sys
  if (before.length !== after.length) sys = atRest(next.sys, pacing)
  else if (next.sys !== prev.sys) sys = retarget(w.sys, ringDelta(prev.sys, next.sys, after.length, next.lastDir['sys'] ?? 0), now, pacing)

  const games: Record<string, Tween> = { ...w.games }
  const entered = shelfScreen(next) !== shelfScreen(prev) || museOpen(next) !== museOpen(prev)
  const reordered = prev.favorites !== next.favorites || prev.museSort !== next.museSort
  for (const sy of after) {
    const a = cursorOf(prev, sy)
    const b = cursorOf(next, sy)
    const rebuilt = reordered && (sy.tag === 'FAV' || sy.tag === 'MUSE')
    if (!games[sy.tag] || rebuilt || (entered && shelfSystem(next)?.tag === sy.tag)) games[sy.tag] = atRest(b, pacing)
    else if (a !== b)
      games[sy.tag] = retarget(games[sy.tag]!, ringDelta(a, b, gamesOf(next, sy).length, next.lastDir[sy.tag] ?? 0), now, pacing)
  }
  return { s: next, sys, games, tint: w.tint }
}

/**
 * TortOS, a custom firmware for the TrimUI Brick.
 *
 * A launcher that is a shelf: a coverflow of consoles, then of one console's games, that can be
 * turned on end or folded into a cube, with every other screen a panel drawn over it. All of its
 * behaviour is `machine.ts`; this root holds the state, runs the clocks and draws the top of the
 * stack over whatever is under it.
 *
 * **Motion lives here and settles to the machine.** The shelves and the tint move on a frame loop
 * that runs only while something is moving. With motion off every shelf is drawn at its cursor and
 * the tint is the focused system's colour, which is exactly where the loop would come to rest - so
 * a still is the live build settled, not a second implementation of it.
 */
export function Tortos(seed: TortosProps) {
  const { animate } = useScreen()
  const [world, setWorld] = useState<World>(() => initialWorld(seed))
  const [now, setNow] = useState(0)
  const s = world.s

  useButtonPress(
    useCallback((button: Button) => {
      setWorld((w) => press(w, button, performance.now()))
    }, []),
  )

  const target = tintTarget(s)
  const moving = active(world.sys, now) || Object.values(world.games).some((g) => active(g, now))
  const busy = animate && (moving || world.tint !== target)

  useEffect(() => {
    if (!busy) return
    let last = performance.now()
    let frame = requestAnimationFrame(function tick(t) {
      const dt = (t - last) / 1000
      last = t
      setWorld((w) => ({ ...w, tint: tintStep(w.tint, tintTarget(w.s), dt) }))
      setNow(t)
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [busy])

  // A notice stands for as long as the source blocks on it, then carries on.
  const view = currentView(s)
  const notice = view === 'notice' ? s.notice : null
  useEffect(() => {
    if (!animate || !notice) return
    const id = setTimeout(() => setWorld((w) => ({ ...w, s: finishNotice(w.s) })), notice.ms)
    return () => clearTimeout(id)
  }, [animate, notice])

  const tint = animate ? world.tint : target
  const sysNow = shelfSystem(s)
  const game = focusedGame(s)
  const titleLong = !!game && textWidth(game.title, FONT.title) > SCREEN.w - 2 * (Math.trunc(FONT.title / 2) + 3 * Math.trunc((FONT.title * 2) / 5))
  const titlePhase = usePhase(`title:${sysNow?.tag}:${sysNow ? cursorOf(s, sysNow) : 0}`, titleLong)
  const npPhase = usePhase(`np:${s.now?.album}:${s.now?.track}`, view === 'now-playing')

  const motion: ShelfMotion = {
    sysPos: animate ? positionAt(world.sys, now) : s.sys,
    gamePos: (tag) => {
      const sys = systemsOf(s).find((x) => x.tag === tag)
      const cur = sys ? cursorOf(s, sys) : 0
      const tw = world.games[tag]
      return animate && tw ? positionAt(tw, now) : cur
    },
    label: animate ? labelAt(world.sys, now) : { at: s.sys, alpha: 1 },
    lastDir: (key) => s.lastDir[key] ?? 0,
    titlePhase,
  }

  const backdrop = backdropOf(s)

  return (
    <div
      className="tortos"
      data-theme="tortos"
      data-view={view ?? shelfScreen(s)}
      data-dir={s.dir}
      data-cards={s.cards}
      // The screen's clear colour: the launcher's near black, or black under a paused game.
      style={{ background: backdrop === 'game' ? '#000' : UI.bg }}
    >
      {backdrop === 'shelf' && <Shelf state={s} motion={motion} tint={tint} />}
      {backdrop === 'game' && <PausedFrame state={s} />}
      <Top state={s} view={view} tint={tint} backdrop={backdrop} npPhase={npPhase} />
    </div>
  )
}

/** The top of the stack, over its backdrop. */
function Top({ state, view, tint, backdrop, npPhase }: { state: State; view: View | null; tint: number; backdrop: string; npPhase: number }) {
  switch (view) {
    case null:
    case 'muse':
    case 'game':
      return null
    case 'now-playing':
      return state.now ? <NowPlaying now={state.now} mode={state.playMode} phase={npPhase} /> : null
    case 'keyboard':
      return state.keyboard ? (
        <>
          <Dim alpha={DIM.keyboard} />
          <Keyboard k={state.keyboard} accent={CYAN} />
        </>
      ) : null
    case 'slots':
      return (
        <>
          <Dim alpha={DIM.deep} />
          <Slots state={state} tint={tint} />
        </>
      )
    default: {
      const deep = backdrop === 'game' && (view === 'cheevos' || view === 'cheevo')
      return (
        <>
          <Dim alpha={deep ? DIM.deep : DIM.panel} />
          <Panel key={view} model={panelOf(state, view)} accent={accentOf(state, view, tint)} />
        </>
      )
    }
  }
}
