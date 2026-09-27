import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { StoryboardMap } from '../../anim/types'
import { useStoryboard } from '../../anim/useStoryboard'
import { useScreen } from '../../device/ScreenContext'
import { useButtonPress, useOptionalInput } from '../../input/InputProvider'
import type { Button } from '../../input/keymap'
import { useWebEffects } from '../../render/RenderModeProvider'
import { PLATFORM, resolve } from './layout'
import {
  initialState,
  launchStarted,
  reduce,
  scanFinished,
  scrapeFinished,
  spinSettled,
  top,
  wizardScanned,
  type Seed,
  type State,
} from './machine'
import { paletteOf } from './palette'
import { GamesList } from './views/GamesList'
import { AppsGrid, GamesCarousel, GamesGrid } from './views/GamesViews'
import { Header } from './views/Header'
import { ScraperTab } from './views/ScraperTab'
import { SettingsTab } from './views/SettingsTab'
import { AchievementsTab, RommTab, SearchTab, SyncTab } from './views/TabViews'
import { Overlays } from './views/Overlays'
import { NeoContext, makeNeo } from './views/parts'
import { SystemsCarousel } from './views/SystemsCarousel'
import { SystemsFooter, SystemsGrid } from './views/SystemsGrid'
import { ScanSplash, SetupWizard } from './views/FirstRun'
import './neostation.css'

export type NeoStationProps = Seed

/**
 * NeoStation, a Flutter emulation frontend for Android, Linux, Windows and macOS.
 *
 * Every behaviour is `machine.ts`; this root holds the state, resolves the source's units for the
 * device, and draws the app the way `AppScreen` stacks it (`lib/screens/app_screen.dart:708-751`):
 * the scaffold colour, the tab's content, the header over both, then any overlay.
 *
 * Motion is CSS transitions declared as data, so with motion off every element is drawn where its
 * transition would come to rest - a still is the live build settled, not a second drawing of it.
 */
export function NeoStation(seed: NeoStationProps) {
  const { animate, device } = useScreen()
  const web = useWebEffects()
  const [state, setState] = useState<State>(() =>
    initialState({ platform: PLATFORM[device.slug] ?? 'android', ...seed }),
  )

  useButtonPress(
    useCallback((button: Button, meta: { repeat: boolean }) => {
      setState((s) => reduce(s, button, meta.repeat))
    }, []),
  )

  const dispatch = useCallback((f: (s: State) => State) => setState(f), [])
  const u = useMemo(() => resolve(device.slug), [device.slug])
  const p = paletteOf(state.theme)
  const { glassBlur, glassTransparency, glassBorder } = state.settings
  const neo = useMemo(
    () => makeNeo(u, p, animate, web, { blur: glassBlur, transparency: glassTransparency, border: glassBorder }),
    [u, p, animate, web, glassBlur, glassTransparency, glassBorder],
  )
  const overlay = top(state)
  const games = state.route?.kind === 'games' && overlay?.kind !== 'launch' ? state.route : null

  // The source's own clocks: a launch turns to "Game executing..." after its two-second minimum
  // (`game_launch_utils.dart:47-84`), a random spin lands after 18 ticks of 80ms
  // (`random_game_dialog.dart:57-59`), a scrape reports back. Only the live build runs them - a
  // still has no input and must stay the picture it was posed as.
  const live = useOptionalInput() !== null
  const phase =
    overlay?.kind === 'launch' ? overlay.phase : overlay?.kind === 'random' && overlay.spinning ? 'spin' : null
  useEffect(() => {
    if (!live || !phase) return
    const id = setTimeout(
      () => setState(phase === 'spin' ? spinSettled : launchStarted),
      phase === 'spin' ? 18 * 80 : 2000,
    )
    return () => clearTimeout(id)
  }, [live, phase, overlay])
  useEffect(() => {
    if (!live || !state.scraping) return
    const id = setTimeout(() => setState(scrapeFinished), 2500)
    return () => clearTimeout(id)
  }, [live, state.scraping])
  // A scan, in the wizard or behind the splash, reports done after the same interval.
  const wizardScanning = state.wizard !== null && state.wizard.scan > 0 && state.wizard.scan < 1
  useEffect(() => {
    if (!live || !wizardScanning) return
    const id = setTimeout(() => setState(wizardScanned), 2500)
    return () => clearTimeout(id)
  }, [live, wizardScanning])
  const scanning = state.scan !== null
  useEffect(() => {
    if (!live || !scanning) return
    const id = setTimeout(() => setState(scanFinished), 2500)
    return () => clearTimeout(id)
  }, [live, scanning])

  return (
    <NeoContext value={neo}>
      <div
        className="neostation"
        data-theme="neostation"
        data-tab={state.tab}
        data-overlay={overlay?.kind}
        // The scaffold colour, on the root rather than as a layer under the content. Confirm Exit
        // quits, and what is left is the screen the app ran on.
        style={{ background: state.settings.exited ? '#000' : p.background }}
        data-exited={state.settings.exited || undefined}
      >
        {/* The wizard is shown instead of the app, not over it (`permission_check_wrapper.dart:103-141`). */}
        {state.wizard && !state.settings.exited && (
          <SetupWizard state={state} w={state.wizard} press={live ? (b) => dispatch((s) => reduce(s, b)) : undefined} />
        )}
        {!state.wizard && !state.settings.exited && (
          <>
            {/* The games screen takes its content down while a game launches (`my_games_list.dart:881-882`). */}
            {games && state.gameView === 'list' && <GamesList state={state} route={games} />}
            {games && state.gameView === 'grid' && <GamesGrid state={state} route={games} />}
            {games && state.gameView === 'carousel' && <GamesCarousel state={state} route={games} />}
            {state.route?.kind === 'apps' && <AppsGrid route={state.route} />}
            {!state.route && state.tab === 'systems' && (
              <>
                {state.scan !== null ? (
                  <ScanSplash progress={state.scan} />
                ) : (
                  <FadeIn run={state.scanEnded}>
                    {state.view === 'grid' ? <SystemsGrid state={state} /> : <SystemsCarousel state={state} />}
                    <SystemsFooter
                      state={state}
                      onA={() => dispatch((s) => reduce(s, 'a'))}
                      onY={() => dispatch((s) => reduce(s, 'y'))}
                    />
                  </FadeIn>
                )}
              </>
            )}
            {!state.route && state.tab === 'search' && <SearchTab state={state} />}
            {!state.route && state.tab === 'sync' && <SyncTab state={state} />}
            {!state.route && state.tab === 'achievements' && <AchievementsTab state={state} />}
            {!state.route && state.tab === 'scraper' && <ScraperTab state={state} />}
            {!state.route && state.tab === 'romm' && <RommTab state={state} />}
            {!state.route && state.tab === 'settings' && <SettingsTab state={state} />}
            {/* A pushed route covers the whole app, header and all. */}
            {!state.route && <Header state={state} dispatch={dispatch} />}
            <Overlays state={state} />
          </>
        )}
      </div>
    </NeoContext>
  )
}

/**
 * `AnimatedSwitcher(400ms)` from the scan splash to the library (`system_content.dart:104-107`):
 * the library fades in, once, when a scan has just ended.
 */
const FADE: StoryboardMap = { _: { animations: [{ property: 'opacity', from: 0, duration: 400, mode: 'linear' }] } }

function FadeIn({ run, children }: { run: boolean; children: ReactNode }) {
  const { attach, style, className } = useStoryboard(run ? FADE : undefined, '_')
  return (
    <div ref={attach} className={className} style={{ ...style, position: 'absolute', inset: 0 }}>
      {children}
    </div>
  )
}
