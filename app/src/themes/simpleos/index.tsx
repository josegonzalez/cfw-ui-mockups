import { useCallback, useState } from 'react'
import { useButtonPress } from '../../input/InputProvider'
import {
  currentView,
  highlighted,
  initialState,
  listCursor,
  menuItems,
  reduce,
  rows,
  visibleGames,
  type Seed,
  type State,
} from './machine'
import { Boot } from './views/Boot'
import { ClockView } from './views/ClockView'
import { Home } from './views/Home'
import { InGame } from './views/InGame'
import { Settings } from './views/Settings'
import './simpleos.css'

export interface SimpleOsProps extends Seed {
  /** Pose the RetroAchievements unlock banner over the game. */
  readonly toast?: boolean | undefined
}

/**
 * SimpleOS, a DS-only frontend for the Anbernic RG DS.
 *
 * The first set in the repo drawn across two panels. One root owns both: the cursor on the bottom
 * panel decides what the top one shows, so they are one application, and `Panels` gives it the two
 * surfaces to draw that application into.
 *
 * All behaviour is in `machine.ts` as a pure reducer; this root holds the state and draws it. The
 * props seed the state - a still is posed by them, the live build starts from them - and from then
 * on the root owns it, back stack included, so every button a screen's legend names does what it
 * says.
 *
 * Nothing here animates. At 30fps the trailer moves cursors, flips pages and opens menus on a
 * single frame, so motion-off changes nothing and the settle invariant holds trivially.
 */
export function SimpleOs({ toast = false, ...seed }: SimpleOsProps) {
  const [state, setState] = useState<State>(() => initialState(seed))

  useButtonPress(
    useCallback((button) => {
      setState((prev) => reduce(prev, button))
    }, []),
  )

  const touchToContinue = useCallback(() => setState((prev) => reduce(prev, 'a')), [])
  const view = currentView(state)

  return (
    <div className="simpleos" data-theme="simpleos" data-view={view}>
      <Screen state={state} toast={toast} onTouch={touchToContinue} />
    </div>
  )
}

function Screen({ state, toast, onTouch }: { state: State; toast: boolean; onTouch: () => void }) {
  const view = currentView(state)

  switch (view) {
    case 'boot':
      return <Boot onTouch={onTouch} />
    case 'home':
      return <Home games={visibleGames(state)} selected={state.home} clock={state.clock} />
    case 'clock':
      return <ClockView clock={state.clock} draft={state.draft} field={state.clockField} />
    case 'game':
    case 'quick-menu':
      return (
        <InGame
          running={state.running ?? 0}
          menu={
            view === 'quick-menu'
              ? {
                  title: state.menuTitle,
                  items: menuItems(state),
                  cursor: Math.min(state.cursor['quick-menu'] ?? 0, menuItems(state).length - 1),
                }
              : null
          }
          osd={state.osd}
          toast={toast}
        />
      )
    default: {
      const list = rows(state, view)
      const status = state.binding
        ? 'Press a button or stick'
        : view === 'archive' && list.length === 0
          ? 'No games'
          : state.status
      return (
        <Settings
          view={view}
          rows={list}
          cursor={listCursor(state, view)}
          clock={state.clock}
          game={view === 'this-game' ? highlighted(state) : state.running ?? highlighted(state)}
          status={status}
        />
      )
    }
  }
}
