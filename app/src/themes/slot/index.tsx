import { useCallback, useEffect, useRef, useState } from 'react'
import { useScreen } from '../../device/ScreenContext'
import { useButtonPress } from '../../input/InputProvider'
import {
  CARTS,
  afterTravel,
  browseStep,
  nextPhase,
  viewBySlug,
  type HudKind,
  type Phase,
} from './library'
import { AT_REST, TIMING, settled, step, type Spring } from './motion'
import { Screen } from './views/Screens'
import './slot.css'

export interface SlotProps {
  readonly view?: string | undefined
  readonly selected?: number | undefined
  /** Insert progress, for the posed insert and eject stills. */
  readonly seat?: number | undefined
  readonly hud?: HudKind | null | undefined
  readonly hudValue?: number | undefined
  readonly switcherSlot?: number | undefined
  readonly clockField?: number | undefined
  readonly wallpaper?: boolean | undefined
}

/**
 * slot, a GBA-only frontend for the Anbernic RG SP.
 *
 * One system, one device, one output size - so there is no resolve step, no palette and no
 * per-system anything. What it has instead is motion that no other set here has: the shelf is a
 * critically damped spring rather than a tween, and the cart going into the slot is a three-part
 * travel driving six things off one progress.
 *
 * **The shelf's spring runs as a loop, not a timeline.** That follows the precedent Vitro's
 * backgrounds set: a continuous integrator has no keyframe to settle to, so it lives here rather
 * than in `anim/`. What keeps `animate={false}` honest is that its *resting* state is computable -
 * `scroll === target`, `vel === 0` - so a still is drawn at rest rather than by running a clock.
 *
 * **A plays, and B comes back.** The shelf's footer says `A play`, so it has to: the phase machine
 * below runs the insert, holds on the game, and plays the same travel backwards on the way out.
 * The props seed the opening phase; the theme owns it from there.
 */
export function Slot({
  view = 'shelf',
  selected = 0,
  seat,
  hud = null,
  hudValue = 0.6,
  switcherSlot = 0,
  clockField = 0,
  wallpaper = false,
}: SlotProps) {
  const { animate } = useScreen()
  const def = viewBySlug(view)

  const [index, setIndex] = useState(selected)
  /*
   * The integrator's own state is a ref, not React state: it is written every frame and only its
   * position is worth a render. `scroll` is what the screen reads.
   */
  const spring = useRef<Spring>(AT_REST(selected))
  const [scrollState, setScroll] = useState(selected)
  const frame = useRef<number | null>(null)
  const last = useRef<number>(0)

  /*
   * The phase machine. `t` is seconds into whichever travel is running, and it is the only clock
   * in the theme - the shelf's spring integrates rather than counting.
   */
  const [phase, setPhase] = useState<Phase>(def.phase)
  const [t, setT] = useState(0)
  const travelFrame = useRef<number | null>(null)
  const travelLast = useRef<number>(0)

  useButtonPress(
    useCallback(
      (button) => {
        if (phase === 'shelf') {
          const by = browseStep(button)
          if (by !== 0) {
            setIndex((i) => Math.max(0, Math.min(i + by, CARTS.length - 1)))
            return
          }
        }
        /* `A play`. A tap resumes and a hold starts clean; both put the same cart in. */
        const next = nextPhase(phase, button)
        if (next) {
          setPhase(next)
          setT(0)
        }
      },
      [phase],
    ),
  )

  /* The shelf spring: integrate toward the selection while there is anywhere to go. */
  useEffect(() => {
    /* Motion off holds the resting value, which is computable rather than integrated. */
    if (!animate) return

    const tick = (now: number) => {
      const dt = last.current ? Math.min(0.05, (now - last.current) / 1000) : 1 / 60
      last.current = now
      spring.current = step(spring.current, index, dt)
      setScroll(spring.current.scroll)
      frame.current = settled(spring.current, index) ? null : requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
      last.current = 0
    }
  }, [animate, index])

  /*
   * The travel clock. Runs only while a cart is moving, and hands over at the end rather than
   * stopping: the insert becomes Playing, the eject becomes the shelf.
   */
  const moving = phase === 'inserting' || phase === 'ejecting'
  const duration = phase === 'inserting' ? TIMING.insertS : TIMING.ejectS

  useEffect(() => {
    if (!animate || !moving) return

    const tick = (now: number) => {
      const dt = travelLast.current ? Math.min(0.05, (now - travelLast.current) / 1000) : 1 / 60
      travelLast.current = now
      setT((prev) => {
        const next = prev + dt
        if (next >= duration) {
          const handover = afterTravel(phase)
          if (handover) setPhase(handover)
          return duration
        }
        return next
      })
      travelFrame.current = requestAnimationFrame(tick)
    }
    travelFrame.current = requestAnimationFrame(tick)

    return () => {
      if (travelFrame.current !== null) cancelAnimationFrame(travelFrame.current)
      travelFrame.current = null
      travelLast.current = 0
    }
  }, [animate, moving, duration, phase])

  const scroll = animate ? scrollState : index

  /*
   * `seat` is 0 at the shelf and 1 seated, so the eject is the insert's progress read backwards -
   * which is why the source gives them the same length. A posed still overrides the clock.
   */
  const progress = Math.min(1, t / duration)
  const live = phase === 'inserting' ? progress : phase === 'ejecting' ? 1 - progress : 0
  const posed = seat ?? (def.phase === 'ejecting' ? 0.55 : def.phase === 'inserting' ? 0.78 : 0)

  return (
    <div
      className="slot"
      data-theme="slot"
      data-view={def.slug}
      data-phase={phase}
      // Doze is the panel off. Nothing is drawn, and the e2e check for an empty screen is told so.
      data-screen-off={phase === 'doze' || undefined}
    >
      <Screen
        phase={phase}
        scroll={scroll}
        selected={index}
        seat={animate && moving ? live : posed}
        hud={hud}
        hudValue={hudValue}
        switcherSlot={switcherSlot}
        clockField={clockField}
        wallpaper={wallpaper}
        shake={0}
      />
    </div>
  )
}
