import { useCallback, useEffect, useRef, useState } from 'react'
import { useScreen } from '../../device/ScreenContext'
import { useButtonPress } from '../../input/InputProvider'
import { CARTS, viewBySlug, type HudKind } from './library'
import { AT_REST, settled, step, type Spring } from './motion'
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
 * **The spring runs as a loop, not a timeline.** That follows the precedent Vitro's backgrounds
 * set: a continuous integrator has no keyframe to settle to, so it lives in the theme rather than
 * in `anim/`. What keeps `animate={false}` honest is that its *resting* state is computable -
 * `scroll === target`, `vel === 0` - so a still is drawn at rest rather than by running a clock.
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

  useButtonPress(
    useCallback((button) => {
      /* L and R browse the shelf. The source binds the shoulders, not the pad. */
      const by = button === 'l' ? -1 : button === 'r' ? 1 : 0
      if (by === 0) return
      setIndex((i) => Math.max(0, Math.min(i + by, CARTS.length - 1)))
    }, []),
  )

  /*
   * Integrate toward the selection while there is anywhere to go.
   *
   * `dt` is real elapsed seconds, as in the source: a fixed step would make the motion depend on
   * frame rate, and the whole point of the spring is that it carries velocity between frames.
   */
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

  const scroll = animate ? scrollState : index

  return (
    <div className="slot" data-theme="slot" data-view={def.slug}>
      <Screen
        phase={def.phase}
        scroll={scroll}
        selected={index}
        seat={seat ?? (def.phase === 'ejecting' ? 0.55 : def.phase === 'inserting' ? 0.78 : 0)}
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
