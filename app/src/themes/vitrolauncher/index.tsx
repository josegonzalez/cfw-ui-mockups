import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useScreen } from '../../device/ScreenContext'
import { useButtonPress } from '../../input/InputProvider'
import { Background } from './backgrounds'
import { GAMES, SETTINGS, defaults, sortedGames, type VitroSettings } from './library'
import { paletteVariables, tokens } from './palette'
import { useTransitions } from './useTransitions'
import { NavPill, Overlays, StatusPill, SCREEN_ORDER, type VitroScreen } from './views/Chrome'
import { AllTitles, gridMove, skipPage } from './views/AllTitles'
import { LastPlayed } from './views/LastPlayed'
import { Settings, changeSetting, scrollTop } from './views/Settings'
import './vitro.css'

export type { VitroScreen }

export interface VitroLauncherProps {
  readonly screen?: VitroScreen | undefined
  readonly settings?: Partial<VitroSettings> | undefined
  /** Battery level, so the low and charging states are reachable. */
  readonly battery?: number | undefined
  readonly charging?: boolean | undefined
  /**
   * Overlay poses. A static screen sets these directly, which is how the exit banner gets a
   * screenshot at 62% without anyone catching it mid-hold. The live build drives them from input
   * and ignores these.
   */
  readonly powerOff?: number | undefined
  readonly exitProgress?: number | null | undefined
  readonly loading?: number | undefined
}

/** A fixed clock, so two captures of the same screen match. */
const CLOCK = '10:24 AM'

/**
 * Vitro Launcher.
 *
 * A home screen rather than a game browser: three screens that persist their background and their
 * chrome, with only the content swapping between them.
 *
 * The launcher's settings are its own state and drive almost everything on screen - the palette,
 * the background renderer, how big the covers are, how the grid pages, whether the chrome is
 * frosted. That is why they live here rather than in the interactive wrapper: unlike the other
 * themes' subset keys, these are a real feature of the app, and the Settings screen is where a
 * user changes them.
 */
export function VitroLauncher({
  screen: initialScreen,
  settings: overrides,
  battery = 85,
  charging = false,
  powerOff = 0,
  exitProgress = null,
  loading = 0,
}: VitroLauncherProps) {
  const { w, animate } = useScreen()

  const [settings, setSettings] = useState<VitroSettings>(() => ({ ...defaults(), ...overrides }))
  const [screen, setScreen] = useState<VitroScreen>(initialScreen ?? settings.default_screen)
  const [recentIndex, setRecentIndex] = useState(0)
  const [allIndex, setAllIndex] = useState(0)
  const [settingsIndex, setSettingsIndex] = useState(0)
  const [settingsTop, setSettingsTop] = useState(0)
  const [navHidden, setNavHidden] = useState(false)
  const [bookmarks, setBookmarks] = useState<ReadonlySet<string>>(
    () => new Set(GAMES.filter((g) => g.bookmarked).map((g) => g.id)),
  )

  const transitions = useTransitions({ animate, startupFade: settings.startup_fade })

  const t = useMemo(() => tokens(settings), [settings])
  const vars = useMemo(() => paletteVariables(settings), [settings])

  const recent = useMemo(() => GAMES.slice(0, settings.recent_limit), [settings.recent_limit])
  const all = useMemo(() => {
    const list = sortedGames({ ...settings, all_bookmarks: settings.all_bookmarks })
    return list.map((g) => ({ ...g, bookmarked: bookmarks.has(g.id) }))
  }, [settings, bookmarks])

  /*
   * Auto-hide. The pill comes back on any press and fades again after the configured idle time;
   * `0` means never hide. Restarted by the counter rather than by the press itself, so a burst of
   * presses does not queue a timer each.
   */
  const [activity, setActivity] = useState(0)
  useEffect(() => {
    if (!animate) return
    const secs = settings.nav_autohide
    if (secs <= 0) return
    const id = setTimeout(() => setNavHidden(true), secs * 1000)
    return () => clearTimeout(id)
  }, [activity, settings.nav_autohide, animate])

  const move = useCallback(
    (dx: number, dy: number) => {
      if (screen === 'recent') {
        if (!dx) return
        setRecentIndex((i) => {
          const last = recent.length - 1
          const next = i + dx
          if (next < 0) return settings.infinite ? last : 0
          if (next > last) return settings.infinite ? 0 : last
          return next
        })
      } else if (screen === 'all') {
        setAllIndex((i) => gridMove(i, dx, dy, all.length, settings))
      } else {
        if (dy) {
          setSettingsIndex((i) => {
            const next = Math.max(0, Math.min(i + dy, SETTINGS.length - 1))
            setSettingsTop((top) => scrollTop(next, top, SETTINGS.length))
            return next
          })
        } else if (dx) {
          setSettings((s) => changeSetting(s, SETTINGS[settingsIndex]!, dx))
        }
      }
    },
    [screen, recent.length, all.length, settings, settingsIndex],
  )

  useButtonPress(
    useCallback(
      (b) => {
        if (!animate) return
        // Any press wakes the nav pill; the effect below re-arms the fade.
        setNavHidden(false)
        setActivity((n) => n + 1)
        switch (b) {
          case 'up':
            return move(0, -1)
          case 'down':
            return move(0, 1)
          case 'left':
            return move(-1, 0)
          case 'right':
            return move(1, 0)
          case 'l':
            return setScreen((s) => SCREEN_ORDER[Math.max(0, SCREEN_ORDER.indexOf(s) - 1)]!)
          case 'r':
            return setScreen(
              (s) => SCREEN_ORDER[Math.min(SCREEN_ORDER.length - 1, SCREEN_ORDER.indexOf(s) + 1)]!,
            )
          case 'select':
            return setScreen((s) => (s === 'settings' ? settings.default_screen : 'settings'))
          case 'b':
            return setScreen((s) => (s === 'settings' ? settings.default_screen : s))
          case 'x':
            if (screen === 'all') setAllIndex((i) => skipPage(i, all.length, settings))
            return
          case 'y':
            if (screen === 'all') {
              const game = all[allIndex]
              if (game) {
                setBookmarks((set) => {
                  const next = new Set(set)
                  if (next.has(game.id)) next.delete(game.id)
                  else next.add(game.id)
                  return next
                })
              }
            }
            return
          case 'a':
            if (screen === 'settings') {
              if (SETTINGS[settingsIndex]?.type === 'action') {
                setSettings(defaults())
                setBookmarks(new Set(GAMES.filter((g) => g.bookmarked).map((g) => g.id)))
              }
            } else {
              transitions.launch()
            }
            return
          /*
           * Menu and Start are the two the original's `press()` had no case for - both were
           * handled out of band, Menu by a keydown branch above the dispatch and Start only as
           * part of the exit chord. Both are hold gestures, so `useTransitions` owns them; they
           * are named here so this switch is the whole input map rather than most of it.
           */
          case 'menu':
          case 'start':
            return
          default:
            return
        }
      },
      [animate, move, screen, all, allIndex, settings, settingsIndex, transitions],
    ),
  )

  const style = { ...vars, ['--fg' as string]: t.fg } as CSSProperties

  return (
    <div
      className={[
        'vitro',
        t.uiLight ? 'theme-light' : '',
        settings.transparency ? '' : 'no-transparency',
        settings.tooltips ? '' : 'no-tooltips',
        settings.show_titles ? 'show-titles' : '',
        transitions.boot !== 'none' ? 'booting' : '',
        transitions.boot === 'bg' || transitions.boot === 'ui' ? 'boot-bg' : '',
        transitions.boot === 'ui' ? 'boot-ui' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      data-theme="vitrolauncher"
      data-screen={screen}
    >
      <Background theme={settings.theme} accent={t.accent} bg={t.bg} light={t.bgLight} />
      <div className="vitro-wash" />

      <div className="vitro-ui">
        <div className="vitro-screens">
          <div className={`screen-layer${screen === 'recent' ? ' active' : ''}`}>
            <LastPlayed
              games={recent}
              selected={recentIndex}
              settings={settings}
              screenWidth={w}
              animate={animate}
            />
          </div>
          <div className={`screen-layer${screen === 'all' ? ' active' : ''}`}>
            <AllTitles games={all} selected={allIndex} settings={settings} />
          </div>
          <div className={`screen-layer${screen === 'settings' ? ' active' : ''}`}>
            <Settings
              settings={settings}
              selected={settingsIndex}
              tokens={t}
              top={settingsTop}
            />
          </div>
        </div>

        <StatusPill
          time={CLOCK}
          percent={battery}
          charging={charging}
          tokens={t}
          transparent={settings.transparency}
        />
        <NavPill
          screen={screen}
          settings={settings}
          tokens={t}
          hidden={navHidden}
          {...(animate
            ? {
                onSelect: (next: VitroScreen) => {
                  setNavHidden(false)
                  setActivity((n) => n + 1)
                  setScreen(next)
                },
              }
            : {})}
        />
      </div>

      <div className="startup-black" />

      {/* Posed on a static screen, driven by input on the live one. */}
      <Overlays
        powerOff={animate ? transitions.powerOff : powerOff}
        exit={animate ? transitions.exit : exitProgress}
        loading={animate ? transitions.loading : loading}
      />
    </div>
  )
}
