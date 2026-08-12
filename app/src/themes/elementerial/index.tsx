import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import { useButtonPress } from '../../input/InputProvider'
import { useScreen } from '../../device/ScreenContext'
import { useCursor } from '../../nav/useCursor'
import { gamesFor, SYSTEMS } from './library'
import { resolve, ICON_STYLE, type ElementerialDevice, type FontSize, type GridDirection } from './layout'
import { schemeById, schemeVariables, type SchemeStyle } from './palette'
import { Chrome } from './views/Chrome'
import { SystemView } from './views/SystemView'
import { BasicView, DetailedView, VideoView } from './views/ListViews'
import { BoxesView, ElementflixView, GridView } from './views/GridViews'
import { MenuView, MENU_ENTRIES } from './views/MenuView'
import './elementerial.css'

export type ElementerialView =
  | 'system'
  | 'basic'
  | 'detailed'
  | 'video'
  | 'grid'
  | 'boxes'
  | 'elementflix'
  | 'menu'

export interface ElementerialProps {
  readonly view?: ElementerialView | undefined
  readonly scheme?: string | undefined
  readonly style?: SchemeStyle | undefined
  readonly fontSize?: FontSize | undefined
  readonly gridDirection?: GridDirection | undefined
  /** Which system's library to show. */
  readonly system?: string | undefined
  readonly selected?: number | undefined
  /**
   * What the menu is drawn over.
   *
   * The menu is an overlay, not a view: whatever was showing stays up behind it. A fresh boot
   * has nothing behind it yet, so the engine falls back to the system carousel.
   */
  readonly behind?: Exclude<ElementerialView, 'menu'> | undefined
}

const GAMELIST_VIEWS = new Set<ElementerialView>([
  'basic',
  'detailed',
  'video',
  'grid',
  'boxes',
  'elementflix',
])

const selectableMenuRows = MENU_ENTRIES.filter((entry) => entry.kind === 'row').length

/**
 * Elementerial.
 *
 * An EmulationStation theme built around Android TV, with Material Design principles and the
 * elementary OS palette. Eight ways to look at the same library, from a plain text list to a
 * full-bleed cover carousel.
 *
 * The scheme is applied as custom properties on this root. That is the one place in the repo
 * where the cascade genuinely earns its keep: a scheme change is a single style recalc across
 * every view, with no rebuild and no re-render, which is exactly how the source behaves. Widgets
 * still receive their colours as props.
 */
export function Elementerial({
  view = 'system',
  scheme = 'strawberry',
  style = 'dark',
  fontSize = 'medium',
  gridDirection = 'horizontal',
  system = 'gba',
  selected = 0,
  behind = 'system',
}: ElementerialProps) {
  const { device, animate } = useScreen()
  const layout = useMemo(
    () => resolve(device.slug as ElementerialDevice, { fontSize, gridDirection }),
    [device.slug, fontSize, gridDirection],
  )

  const schemeDef = schemeById(scheme)
  const tokens = schemeDef[style === 'light' ? 'light' : 'dark']
  const vars = useMemo(() => schemeVariables(scheme, style), [scheme, style])

  const systemIndex = Math.max(
    0,
    SYSTEMS.findIndex((s) => s.theme === system),
  )
  const games = useMemo(() => gamesFor(SYSTEMS[systemIndex]!.theme), [systemIndex])

  const systemCursor = useCursor({ count: SYSTEMS.length, initial: systemIndex, wrap: true })
  const gameCursor = useCursor({ count: games.length, initial: selected, wrap: true })
  const menuCursor = useCursor({ count: selectableMenuRows, initial: selected, wrap: true })

  // Which system was showing before the last change, so its artwork can fade out on top.
  const [outgoing, setOutgoing] = useState<number | undefined>(undefined)

  useButtonPress(
    useCallback(
      (button) => {

        if (view === 'system') {
          if (button === 'left' || button === 'right') {
            setOutgoing(systemCursor.index)
            systemCursor.move(button === 'left' ? -1 : 1)
          }
          return
        }

        if (view === 'menu') {
          if (button === 'up') menuCursor.move(-1)
          else if (button === 'down') menuCursor.move(1)
          return
        }

        // The grids run horizontally, so left and right move within a row.
        if (button === 'up') gameCursor.move(view === 'elementflix' ? -1 : -1)
        else if (button === 'down') gameCursor.move(1)
        else if (button === 'left') gameCursor.move(-1)
        else if (button === 'right') gameCursor.move(1)
      },
      [view, systemCursor, gameCursor, menuCursor],
    ),
  )

  const beneath = view === 'menu' ? behind : view
  const activeSystemIndex = animate && view === 'system' ? systemCursor.index : systemIndex
  const activeSystem = SYSTEMS[activeSystemIndex]!
  const gameIndex = animate ? gameCursor.index : selected
  const art = { accent: `#${tokens.mainColor}`, sect: `#${tokens.sectColor}` }
  const placeholder = { grid: schemeDef.grid, iconStyle: ICON_STYLE.Square }

  const listProps = {
    layout,
    system: activeSystem,
    games,
    selectedIndex: Math.min(gameIndex, games.length - 1),
    art,
  }
  const gridProps = { ...listProps, placeholder, animate }

  return (
    <div
      className={`el-root ${style === 'light' ? 'style-light' : 'style-dark'}`}
      style={vars as CSSProperties}
      data-theme="elementerial"
      data-view={view}
      data-scheme={scheme}
      data-style={style}
      data-ratio={layout.ratio}
    >
      {/* The menu is an overlay, so what it is an overlay *of* is what renders underneath. */}
      {beneath === 'system' ? (
        <SystemView
          layout={layout}
          index={activeSystemIndex}
          outgoing={animate ? outgoing : undefined}
          animate={animate}
        />
      ) : null}

      {beneath === 'basic' ? <BasicView {...listProps} /> : null}
      {beneath === 'detailed' ? <DetailedView {...listProps} /> : null}
      {beneath === 'video' ? <VideoView {...listProps} /> : null}
      {beneath === 'grid' ? <GridView {...gridProps} /> : null}
      {beneath === 'boxes' ? <BoxesView {...gridProps} /> : null}
      {beneath === 'elementflix' ? <ElementflixView {...gridProps} /> : null}

      {view === 'menu' ? (
        <MenuView layout={layout} selectedIndex={animate ? menuCursor.index : selected} />
      ) : null}

      {/* The engine hides its hint bar behind the menu, so the menu's own hints are the ones read. */}
      <Chrome
        layout={layout}
        which={view === 'menu' ? 'none' : GAMELIST_VIEWS.has(view) ? 'gamelist' : 'system'}
      />
    </div>
  )
}
