import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useButtonPress } from '../../input/InputProvider'
import { useScreen } from '../../device/ScreenContext'
import { useCursor } from '../../nav/useCursor'
import { gamesForSystem, SYSTEMS } from './library'
import { resolve, type PsxDevice, type PsxState, type PsxView } from './layout'
import { paletteVariables, type ColorSet, type SecondaryColor } from './palette'
import { Backdrop, BottomChrome, TopInfo } from './views/Chrome'
import {
  CarouselView,
  FullGrid,
  GridView,
  Ps4Style,
  Ps5Style,
  SingleView,
} from './views/GamelistViews'
import { DetailedView, MediaTester } from './views/ListViews'
import { GamesplashView, SplashView } from './views/SplashViews'
import { SystemView } from './views/SystemView'
import type { StoryboardEventKey } from '../../anim/types'
import './playstation-x.css'

export type { PsxView }

export interface PlayStationXProps {
  readonly view?: PsxView | undefined
  readonly system?: string | undefined
  readonly selected?: number | undefined
  readonly colorset?: ColorSet | undefined
  readonly secondary?: SecondaryColor | undefined
  readonly carouselType?: 'PS5' | 'PS4' | 'PS3' | undefined
  readonly carousel?: 'big' | 'medium' | 'small' | undefined
  readonly topInfo?: 'default' | 'no-numbers' | 'clean' | undefined
}

/** The views whose cursor moves by a row rather than by one. */
const PAGED = new Set<PsxView>(['grid', 'ps5Style', 'fullGrid'])

/** The ticker's cycle, from `top-info.xml`: two blocks, 5350ms apart. */
const TICKER_MS = 5350

/**
 * PlayStation X.
 *
 * A reproduction of the PS3, PS4 and PS5 interfaces on a handheld, down to the character
 * cutouts and the drifting background - the most animated set in the repo by a wide margin.
 *
 * Eleven views over one library, eight live subsets, and 97 animation tracks carried as data
 * and compiled at runtime. The theme root's job is small: resolve the layout, own the cursor,
 * translate button presses, and pick a view. Everything else is in the views and the widgets.
 *
 * The scheme is written as custom properties on this root. Same reasoning as Elementerial: a
 * colour change is one style recalc across every view with no re-render, which is what the
 * source does. Widgets still take their colours as values.
 */
export function PlayStationX({
  view = 'ps4Style',
  system = 'psx',
  selected = 0,
  colorset = 'blue',
  secondary = 'default',
  carouselType = 'PS4',
  carousel = 'medium',
  topInfo = 'default',
}: PlayStationXProps) {
  const { device, animate } = useScreen()

  const state = useMemo<PsxState>(
    () => ({
      carousel,
      'carousel-type': carouselType,
      'top-info': topInfo,
      /*
       * The key the original never supplied. Two rows of the help bar are conditioned on it,
       * so without it the hint text was always sized for the system view.
       */
      view: view === 'system' ? 'system' : 'gamelist',
    }),
    [carousel, carouselType, topInfo, view],
  )

  const layout = useMemo(() => resolve(device.slug as PsxDevice, state), [device.slug, state])
  const vars = useMemo(() => paletteVariables(colorset, secondary), [colorset, secondary])

  const systemIndex = Math.max(
    0,
    SYSTEMS.findIndex((s) => s.theme === system),
  )
  const activeSystem = SYSTEMS[systemIndex]!
  const games = useMemo(() => gamesForSystem(activeSystem), [activeSystem])

  const systemCursor = useCursor({ count: SYSTEMS.length, initial: systemIndex, wrap: true })
  const gameCursor = useCursor({ count: games.length, initial: selected, wrap: true })

  /*
   * Which storyboard event the cursor's last move produced. `open` on arrival, then
   * activateNext or activatePrev - the direction matters, because the panel slides in from the
   * side the cursor came from.
   */
  const [event, setEvent] = useState<StoryboardEventKey>('open')

  const [tickerIndex, setTickerIndex] = useState(0)
  useEffect(() => {
    if (!animate) return
    const id = setInterval(() => setTickerIndex((i) => (i === 0 ? 1 : 0)), TICKER_MS)
    return () => clearInterval(id)
  }, [animate])

  const isSystemView = view === 'system'
  const cols = PAGED.has(view) ? (layout[view]?.gamegrid?.cols ?? 1) : 1

  useButtonPress(
    useCallback(
      (button) => {
        if (!animate) return
        const cursor = isSystemView ? systemCursor : gameCursor

        const step =
          button === 'left' ? -1 : button === 'right' ? 1 : button === 'up' ? -cols : button === 'down' ? cols : 0
        if (step === 0) return

        setEvent(step > 0 ? 'activateNext' : 'activatePrev')
        cursor.move(step)
      },
      [animate, isSystemView, systemCursor, gameCursor, cols],
    ),
  )

  const cursorIndex = animate ? (isSystemView ? systemCursor.index : gameCursor.index) : selected
  const shownSystem = isSystemView && animate ? SYSTEMS[systemCursor.index]! : activeSystem
  const shownGames = useMemo(() => gamesForSystem(shownSystem), [shownSystem])
  const game = shownGames[Math.min(cursorIndex, shownGames.length - 1)]

  const chrome = {
    layout,
    which: (isSystemView ? 'system' : 'gamelist') as 'system' | 'gamelist',
    system: shownSystem,
    game,
    colorset,
    carouselType,
    tickerIndex,
    event,
  }

  const list = {
    layout,
    system: shownSystem,
    games: shownGames,
    selectedIndex: Math.min(cursorIndex, shownGames.length - 1),
    event,
  }

  /* The two boot screens are their own theme roots and carry none of the shared chrome. */
  if (view === 'splash') {
    return (
      <Root vars={vars} view={view} colorset={colorset}>
        <SplashView layout={layout} colorset={colorset} />
      </Root>
    )
  }

  if (view === 'gamesplash') {
    return (
      <Root vars={vars} view={view} colorset={colorset}>
        {game ? <GamesplashView layout={layout} system={shownSystem} game={game} /> : null}
      </Root>
    )
  }

  return (
    <Root vars={vars} view={view} colorset={colorset}>
      <Backdrop {...chrome} />

      {view === 'system' ? (
        <SystemView
          layout={layout}
          system={shownSystem}
          selectedIndex={animate ? systemCursor.index : systemIndex}
          colorset={colorset}
          carouselType={carouselType}
        />
      ) : null}

      {view === 'ps4Style' ? <Ps4Style {...list} /> : null}
      {view === 'ps5Style' ? <Ps5Style {...list} /> : null}
      {view === 'grid' ? <GridView {...list} /> : null}
      {view === 'carousel' ? <CarouselView {...list} /> : null}
      {view === 'fullGrid' ? <FullGrid {...list} /> : null}
      {view === 'single' ? <SingleView {...list} /> : null}
      {view === 'detailed' ? <DetailedView {...list} /> : null}
      {view === 'mediaTester' ? <MediaTester {...list} /> : null}

      <TopInfo {...chrome} />
      <BottomChrome {...chrome} />
    </Root>
  )
}

function Root({
  vars,
  view,
  colorset,
  children,
}: {
  vars: Record<string, string>
  view: PsxView
  colorset: ColorSet
  children: React.ReactNode
}) {
  return (
    <div
      className="psx"
      style={vars as CSSProperties}
      data-theme="playstation-x"
      data-view={view}
      data-colorset={colorset}
    >
      {children}
    </div>
  )
}
