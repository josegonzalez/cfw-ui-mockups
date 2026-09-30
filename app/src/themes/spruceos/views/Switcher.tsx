/**
 * PORTING NOTES
 * CFW: spruceOS (PyUI)   Devices: miyoo-a30 miyoo-flip miyoo-mini miyoo-mini-v4 trimui-brick trimui-smart-pro rg35xx rg40xx rg34xx rg28xx rg-cubexx miniloong-pocket1
 * Source: spruceUI/spruceOS `App/PyUI/main-ui/views/full_screen_grid_view.py`, `menus/games/recents_menu_gs.py`
 * Mode: reproduce
 *
 * Layout:        FULLSCREEN_GRID: the focused game's save-state screenshot fitted into the full
 *                width and three quarters of the height, centred, top on the top bar's foot. The top
 *                bar carries the game's name with its clock and icons hidden; the bottom bar carries a
 *                strip of every game's first ten characters, 20px apart, from x = 20, bottomed at
 *                `h - 10m`, the focused one in the selected colour.
 * Focus & selection: one game at a time; the strip starts far enough along that the focus fits.
 * Buttons:       LEFT and DOWN previous, RIGHT and UP next, wrapping; L1/R1 five at a time; A plays;
 *                X the game's configuration; MENU its popup; B closes. Holding MENU for 300ms opens
 *                it from any screen (`controller/controller.py:320-332`).
 * Transitions:   the old picture slides out and the new one in, a screen's width (LEFT/RIGHT) or
 *                height (UP/DOWN), linearly over `0.30 / speed` seconds (`full_screen_grid_view.py:329-389`).
 * Notes:         PyUI shortens a held run by 40ms a step; the port does not.
 */
import { useMemo } from 'react'
import { Animated } from '../../../anim/Animated'
import type { StoryboardMap } from '../../../anim/types'

/** No motion: the picture where it rests. */
const STILL: StoryboardMap = {}
import { boxArt, hasSwitcherShot, switcherShot } from '../assets'
import { anchor, fit } from '../layout'
import type { Game } from '../library'
import { listName } from '../library'
import { switcherGames, type Screen } from '../machine'
import { baselineShift, lineHeight, textWidth } from '../text'
import { Page, boxStyle, useSpruce } from './parts'

const picture = (g: Game, shots: boolean) =>
  shots && hasSwitcherShot(g.name)
    ? { src: switcherShot(g.name), natural: [640, 480] as const }
    : { src: boxArt(g.system, g.name), natural: [250, 250] as const }

/** `calculate_start_index`: the first game in the strip, far enough on that the focus fits. */
function stripStart(labels: readonly string[], sel: number, size: number, w: number, pad: number): number {
  const widths = labels.map((l) => textWidth(l, size))
  let start = sel !== labels.length - 1 ? sel + 1 : sel
  let current = widths[start]! + pad
  for (let i = start - 1; i >= 0; i--) {
    const added = widths[i]! + pad
    if (current + added > w) break
    current += added
    start = i
  }
  return start
}

export function Switcher({ screen }: { screen: Extract<Screen, { kind: 'switcher' }> }) {
  const { state, geo, palette, animate } = useSpruce()
  const games = switcherGames(state)
  const game = games[screen.sel]
  const size = geo.font.gridOne
  const sw = geo.switcher
  const labels = games.map((g) => listName(g).slice(0, 10))
  const start = games.length ? stripStart(labels, screen.sel, size, geo.w, sw.stripPad) : 0
  const duration = animate && state.animations ? Math.round(300 / state.animationSpeed) : 0
  const moved = duration > 0 && screen.from !== screen.sel
  // Which way the pictures travel (`full_screen_grid_view.py:342-360`): a step back slides right.
  const n = games.length
  const back = (((screen.sel - screen.from) % (n + 1)) + (n + 1)) % (n + 1) > Math.floor((n + 1) / 2)
  const place = (g: Game) => {
    const pic = picture(g, state.hw.stateShots)
    return {
      ...pic,
      box: anchor(Math.floor(geo.w / 2), geo.topH, fit(pic.natural, sw.img[0], sw.img[1]), 'TOP_CENTER'),
    }
  }
  // Memoised: a new storyboard object restarts its animation, and the clock re-renders every minute.
  const [outBoard, inBoard] = useMemo(() => {
    if (!moved) return [undefined, undefined]
    const property = screen.axis === 'y' ? ('offsetY' as const) : ('offsetX' as const)
    const slide = (from: number, to: number): StoryboardMap => ({
      open: { animations: [{ property, from, to, duration, mode: 'linear' }] },
    })
    return [slide(0, back ? 1 : -1), slide(back ? -1 : 1, 0)]
  }, [moved, back, screen.axis, duration])
  const line = lineHeight(size)
  return (
    <Page title={game ? listName(game) : ''} hideIcons>
      {moved && games[screen.from] ? (
        <Animated
          key={`out:${screen.from}:${screen.sel}`}
          storyboard={outBoard ?? STILL}
          event="open"
          style={boxStyle(place(games[screen.from]!).box)}
        >
          <img
            alt=""
            src={place(games[screen.from]!).src}
            draggable={false}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </Animated>
      ) : null}
      {game ? (
        <Animated
          key={`in:${screen.from}:${screen.sel}`}
          storyboard={inBoard ?? STILL}
          event="open"
          style={boxStyle(place(game).box)}
        >
          <img
            alt=""
            src={place(game).src}
            draggable={false}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </Animated>
      ) : null}
      {/* Each label bottom-left at the running x, which steps by its width and the pad (`:231-265`). */}
      <div
        style={{
          position: 'absolute',
          left: sw.stripPad,
          top: sw.stripY - line,
          height: line,
          display: 'flex',
          gap: sw.stripPad,
        }}
      >
        {labels.slice(start).map((label, v) => (
          <span
            key={start + v}
            className="spruce-text"
            style={{
              position: 'relative',
              flex: 'none',
              top: baselineShift(size),
              fontSize: size,
              lineHeight: `${line}px`,
              height: line,
              color: start + v === screen.sel ? palette.gridSelected : palette.grid,
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </Page>
  )
}
