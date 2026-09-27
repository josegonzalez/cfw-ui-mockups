import { useCallback, useEffect, useMemo, useState } from 'react'
import { useScreen } from '../../device/ScreenContext'
import { useButtonPress, useInteractive } from '../../input/InputProvider'
import type { Button } from '../../input/keymap'
import { useWebEffects } from '../../render/RenderModeProvider'
import { initialState, launchReturned, reduce, snakeStep, type Seed, type State } from './machine'
import { Browser } from './views/Browser'
import { Home } from './views/Chrome'
import { LcdGrid, Overlays } from './views/Overlays'
import { DsContext, makeDs } from './views/parts'
import { About, Settings } from './views/Settings'
import './ds-style.css'

export type DsStyleProps = Seed

/**
 * DS Style, a Nintendo DS-inspired launcher on the Anbernic RG SP.
 *
 * Every behaviour is `machine.ts`; this root holds the state, runs the source's clocks, and draws
 * the page and its overlays in `draw()`'s order (`source/ui.h:319-338`).
 */
export function DsStyle(seed: DsStyleProps) {
  const [state, setState] = useState<State>(() => initialState(seed))
  const web = useWebEffects()
  const { animate } = useScreen()
  const live = useInteractive()

  useButtonPress(
    useCallback((button: Button) => {
      setState((s) => reduce(s, button))
    }, []),
  )

  // The source's clocks. Only the live build runs them: a still has no input and must stay the
  // picture it was posed as.
  useEffect(() => {
    if (!live || !state.homeMoving) return
    const id = setTimeout(() => setState((s) => ({ ...s, homeMoving: false })), 200)
    return () => clearTimeout(id)
  }, [live, state.homeMoving, state.homechoice])
  // A game or app runs, then hands the device back (`dsstyle.c:470-493`).
  useEffect(() => {
    if (!live || state.launching === null) return
    const id = setTimeout(() => setState(launchReturned), 1500)
    return () => clearTimeout(id)
  }, [live, state.launching])
  // The volume and brightness popups close after 1.4s (`dsstyle.c:367`).
  useEffect(() => {
    if (!live || !state.hardware) return
    const id = setTimeout(() => setState((s) => ({ ...s, hardware: null })), 1400)
    return () => clearTimeout(id)
  }, [live, state.hardware])
  // Binding gives up after 5s (`controller_state.h:1`).
  useEffect(() => {
    if (!live || state.capture === null) return
    const id = setTimeout(() => setState((s) => ({ ...s, capture: null })), 5000)
    return () => clearTimeout(id)
  }, [live, state.capture])
  // Choosing Last game warns after 2s (`dsstyle.c:556`, `extra_ui.h:69`).
  useEffect(() => {
    if (!live || !state.bootWarning) return
    const id = setTimeout(
      () => setState((s) => ({ ...s, bootWarning: false, settingHelp: s.prefs.bootTo === 4 ? -2 : s.settingHelp })),
      2000,
    )
    return () => clearTimeout(id)
  }, [live, state.bootWarning])
  // Snake steps every 134ms (`about_snake.h:178-182`).
  const snaking = state.snake.active && !state.snake.over && state.aboutPage >= 0
  useEffect(() => {
    if (!live || !snaking) return
    const id = setInterval(() => setState(snakeStep), 134)
    return () => clearInterval(id)
  }, [live, snaking])

  const ds = useMemo(() => makeDs(state, animate, web), [state, animate, web])

  return (
    <DsContext value={ds}>
      <div
        className="ds-style"
        data-theme="ds-style"
        data-page={state.page}
        // `draw()` starts from white (`ui.h:321`); the device handed back is black.
        style={{ background: state.exited ? '#000' : '#fff' }}
      >
        {state.exited ? null : (
          <>
            {state.aboutPage >= 0 ? (
              <About />
            ) : state.page === 0 ? (
              <Home />
            ) : state.page === 2 ? (
              <Settings />
            ) : (
              <Browser />
            )}
            <Overlays s={state} />
            {state.prefs.lcd && web ? <LcdGrid /> : null}
          </>
        )}
      </div>
    </DsContext>
  )
}
