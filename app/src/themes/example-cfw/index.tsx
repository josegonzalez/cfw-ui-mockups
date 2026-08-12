import { useCallback, useMemo } from 'react'
import { useButtonPress } from '../../input/InputProvider'
import { useCursor } from '../../nav/useCursor'
import { useListWindow } from '../../nav/useListWindow'
import { useScreenNav } from '../../nav/useScreenNav'
import { useScreen } from '../../device/ScreenContext'
import { GAMES, MENU } from './data'
import { resolve } from './layout'
import { PALETTE } from './palette'
import { GameList } from './views/GameList'
import { MainMenu } from './views/MainMenu'

import type { ExampleView } from './manifest'

export interface ExampleOsProps {
  /** Which screen to show. Interactive builds treat it as the starting screen. */
  readonly view?: ExampleView | undefined
  /** Row to select. Static screens pin it; interactive builds treat it as the start. */
  readonly selected?: number | undefined
}

/**
 * Example OS.
 *
 * The scaffold reference: the smallest complete theme, and the only one that navigates between
 * screens rather than swapping views inside one mounted root. Copy this directory as the
 * starting point for a real firmware - see `docs/themes/example-cfw.md`.
 *
 * A theme root does four things, and this is all of them:
 *   1. resolve the layout for the device it was mounted at
 *   2. own the cursor and any navigation state
 *   3. translate button presses into cursor and navigation moves
 *   4. render the current view
 *
 * It reads the device and the motion flag from context rather than taking them as props, so the
 * same component renders live, static, or in fallback mode without knowing which.
 */
export function ExampleOs({ view = 'main-menu', selected = 0 }: ExampleOsProps) {
  const { device, animate } = useScreen()
  const layout = useMemo(() => resolve(device.slug), [device.slug])

  const nav = useScreenNav<ExampleView>({ initial: view, backButton: animate ? 'b' : null })
  // A static screen renders exactly what it was asked for; a live one follows the navigation.
  const current = animate ? nav.screen : view

  const menuCursor = useCursor({ count: MENU.length, initial: selected, wrap: true })
  const gameCursor = useCursor({ count: GAMES.length, initial: selected, wrap: true })
  const cursor = current === 'main-menu' ? menuCursor : gameCursor

  const visibleRows = Math.max(
    1,
    Math.floor(
      (layout.gameList.list.height + layout.gameList.gap) /
        (layout.gameList.rowHeight + layout.gameList.gap),
    ),
  )
  const firstVisible = useListWindow({
    selectedIndex: gameCursor.index,
    visibleCount: visibleRows,
    total: GAMES.length,
  })

  useButtonPress(
    useCallback(
      (button) => {
        if (button === 'up') cursor.move(-1)
        else if (button === 'down') cursor.move(1)
        else if (button === 'a' && current === 'main-menu') {
          // Only "Games" leads anywhere; the rest are inert, as in the original.
          const entry = MENU[menuCursor.index]
          if (entry?.opens) nav.navigate(entry.opens)
        }
      },
      [cursor, current, menuCursor.index, nav],
    ),
  )

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: PALETTE.background,
        color: PALETTE.text,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        imageRendering: 'auto',
      }}
      data-theme="example-cfw"
      data-view={current}
    >
      {current === 'main-menu' ? (
        <MainMenu layout={layout} selectedIndex={menuCursor.index} />
      ) : (
        <GameList
          layout={layout}
          selectedIndex={gameCursor.index}
          firstVisible={animate ? firstVisible : undefined}
        />
      )}
    </div>
  )
}
