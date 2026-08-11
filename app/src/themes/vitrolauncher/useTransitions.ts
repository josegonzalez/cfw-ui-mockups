import { useCallback, useEffect, useRef, useState } from 'react'
import { useButtonPress, useButtonRelease, useOptionalInput } from '../../input/InputProvider'

/**
 * The launcher's four full-screen transitions.
 *
 * They are gathered here rather than spread through the theme root because they share one shape:
 * each is a 0-1 number driven by a clock, and each is *poseable* - a static screen sets the number
 * directly and never starts a timer. That is what lets the exit banner have a screenshot at 62%
 * without anyone having to catch it mid-hold.
 *
 * Two are hold gestures, which is why the input layer's release events and held-set matter here.
 * The original tracked both by hand on `document`, and a window that lost focus mid-hold never
 * delivered the keyup, stranding the fade at full black.
 */
export const POWER_OFF_MS = 2000
export const EXIT_MS = 2000
export const LOADING_MS = 1100
export const LOADING_HOLD_MS = 250
export const LOADING_OUT_MS = 500
export const STARTUP_MS = 1100

export type BootPhase = 'none' | 'black' | 'bg' | 'ui'

export interface Transitions {
  /** 0-1, the hold-to-power-off fade. */
  readonly powerOff: number
  /** 0-1, the exit-to-muOS progress. Null when the banner is not showing. */
  readonly exit: number | null
  /** 0-1, the launch fade. */
  readonly loading: number
  /** Which stage of the startup fade is running. */
  readonly boot: BootPhase
  /** Start the launch fade. Ignored while one is already running. */
  readonly launch: () => void
}

/** A monotonic ramp from 0 to 1 over `ms`, cancelled when `active` goes false. */
function useRamp(active: boolean, ms: number, animate: boolean): number {
  const [value, setValue] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    // No reset write when inactive: the returned value is already gated on `active`, so writing
    // state here would only cost a render.
    if (!animate || !active) return
    let start: number | null = null
    const tick = (ts: number) => {
      if (start === null) start = ts
      const t = Math.min(1, (ts - start) / ms)
      setValue(t)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [active, ms, animate])

  return active ? value : 0
}

export interface UseTransitionsOptions {
  readonly animate: boolean
  readonly startupFade: boolean
}

export function useTransitions({ animate, startupFade }: UseTransitionsOptions): Transitions {
  const input = useOptionalInput()

  /* ---- hold Menu to power off ---- */
  const [holdingPower, setHoldingPower] = useState(false)
  const powerOff = useRamp(holdingPower, POWER_OFF_MS, animate)

  /* ---- L1 + X + Start, the exit chord ---- */

  /*
   * Watched rather than tested inside the press handler. Press handlers run synchronously while
   * the provider's `pressed` update is still queued, so the button that *completes* the chord is
   * not in the set yet when its own handler runs - the test would be permanently one button
   * behind and the chord would never fire. Reading it as state instead means it has settled, and
   * it picks up the on-screen buttons for free.
   */
  const chordHeld =
    input !== null &&
    input.pressed.has('l') &&
    input.pressed.has('x') &&
    input.pressed.has('start')

  const exitValue = useRamp(chordHeld, EXIT_MS, animate)

  useButtonPress(
    useCallback(
      (button) => {
        if (animate && button === 'menu') setHoldingPower(true)
      },
      [animate],
    ),
  )

  useButtonRelease(
    useCallback((button) => {
      if (button === 'menu') setHoldingPower(false)
    }, []),
  )

  /* ---- launch ---- */
  const [loading, setLoading] = useState(0)
  const launching = useRef(false)

  const launch = useCallback(() => {
    if (!animate || launching.current) return
    launching.current = true
    setLoading(1)
    const hold = setTimeout(() => {
      setLoading(0)
      const done = setTimeout(() => {
        launching.current = false
      }, LOADING_OUT_MS)
      timers.current.push(done)
    }, LOADING_MS + LOADING_HOLD_MS)
    timers.current.push(hold)
  }, [animate])

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => {
    const list = timers
    return () => {
      for (const id of list.current) clearTimeout(id)
      list.current = []
    }
  }, [])

  /* ---- startup fade ---- */
  const booting = animate && startupFade
  const [phase, setPhase] = useState<BootPhase>('black')
  useEffect(() => {
    if (!booting) return
    // Black, then the background fades up, then the UI on top of it.
    const a = setTimeout(() => setPhase('bg'), 16)
    const b = setTimeout(() => setPhase('ui'), 600)
    const c = setTimeout(() => setPhase('none'), STARTUP_MS)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
      clearTimeout(c)
    }
  }, [booting])
  const boot: BootPhase = booting ? phase : 'none'

  return {
    powerOff,
    exit: chordHeld ? exitValue : null,
    loading,
    boot,
    launch,
  }
}
