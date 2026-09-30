import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DeviceSlug } from '../../device/devices'
import { useScreen } from '../../device/ScreenContext'
import { useButtonPress, useButtonRelease, useInteractive } from '../../input/InputProvider'
import type { Button } from '../../input/keymap'
import { current, holdMenu, initialState, reduce, returned, type Seed, type State } from './machine'
import { paletteFor } from './palette'
import { SpruceContext, type Spruce } from './views/parts'
import { Top } from './views/screens'
import './spruceos.css'

export interface SpruceOSProps extends Seed {
  readonly device: DeviceSlug
}

/** The reference frames' clock (`run.sh` starts libfaketime at 12:34:00), which every still shows. */
const CLOCK = '12:34 PM'

/** How long MENU must be held to open the Game Switcher rather than the popup (`controller.py:394`). */
const HOLD_MS = 300

/**
 * spruceOS's PyUI on the device it runs on.
 *
 * Every behaviour is `machine.ts`. This root holds the state and runs PyUI's clocks - the MENU hold,
 * the marquee, the volume indicator, and the time the device spends away from PyUI - and only the
 * live build runs them: a still has no input and stays the picture it was posed as.
 */
export function SpruceOS({ device, ...seed }: SpruceOSProps) {
  const [state, setState] = useState<State>(() => initialState(device, seed))
  const { animate } = useScreen()
  const live = useInteractive()

  // MENU is a tap when it is let go within 300ms, and opens the Game Switcher when it is not.
  const menuTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useButtonPress(
    useCallback((button: Button) => {
      if (button === 'menu') {
        if (menuTimer.current) return
        menuTimer.current = setTimeout(() => {
          menuTimer.current = null
          setState(holdMenu)
        }, HOLD_MS)
        return
      }
      setState((s) => reduce(s, button))
    }, []),
  )
  useButtonRelease(
    useCallback((button: Button) => {
      if (button !== 'menu' || !menuTimer.current) return
      clearTimeout(menuTimer.current)
      menuTimer.current = null
      setState((s) => reduce(s, 'menu'))
    }, []),
  )
  useEffect(() => () => void (menuTimer.current && clearTimeout(menuTimer.current)), [])

  // PyUI is away for a game, an app, a power command or a restart, then the device hands back.
  useEffect(() => {
    if (!live || !state.away) return
    const id = setTimeout(() => setState(returned), 1500)
    return () => clearTimeout(id)
  }, [live, state.away])

  // The volume shows in the top bar for 3s after it changes (`top_bar.py:128-133`): until the change
  // it belongs to has expired.
  const [volumeExpired, setVolumeExpired] = useState(0)
  useEffect(() => {
    if (!live || !state.volumeShown) return
    const change = state.volumeShown
    const id = setTimeout(() => setVolumeExpired(change), 3000)
    return () => clearTimeout(id)
  }, [live, state.volumeShown])

  // The focused row's marquee: after a second on one row, a character per redraw at PyUI's 12 a
  // second (`device_common.py:69`, `image_list_view.py:73-82`).
  const screen = current(state)
  // Any change to the screen on top - a move, a new screen - starts the wait again.
  const focus = `${state.stack.length}:${state.gameView}:${JSON.stringify(screen)}`
  // The count belongs to the focus it was counted on, so a new focus reads zero without a reset.
  const [counted, setCounted] = useState({ focus: '', n: 0 })
  const marquee = counted.focus === focus ? counted.n : 0
  useEffect(() => {
    if (!live || !animate) return
    let tick: ReturnType<typeof setInterval> | undefined
    const wait = setTimeout(() => {
      tick = setInterval(() => setCounted((c) => ({ focus, n: c.focus === focus ? c.n + 1 : 1 })), 1000 / 12)
    }, 1000)
    return () => {
      clearTimeout(wait)
      if (tick) clearInterval(tick)
    }
  }, [live, animate, focus])

  const value = useMemo<Spruce>(
    () => ({
      state,
      geo: state.geo,
      res: state.hw.res,
      palette: paletteFor(state.geo.panel),
      animate,
      clock: CLOCK,
      volumeShowing: live && state.volumeShown !== 0 && volumeExpired !== state.volumeShown,
      marquee,
    }),
    [state, animate, live, volumeExpired, marquee],
  )

  return (
    <SpruceContext value={value}>
      <div className="spruceos" data-theme="spruceos" data-screen-kind={screen.kind}>
        {/* While PyUI is down the display is off. */}
        {state.away ? <div className="spruceos__away" /> : <Top />}
      </div>
    </SpruceContext>
  )
}
