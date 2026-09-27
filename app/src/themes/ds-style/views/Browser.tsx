/**
 * PORTING NOTES
 * CFW: DS Style            Devices: rg-sp
 * Source: FrankieT19/rg-sp-ds-style 2847683 - source/ui.h (ui_browser, list_marquee, ui_art)
 * Mode: reproduce
 *
 * Layout:        List: ten 14px rows from y=20, a 16x14 icon at x=0, the name at x=17 (37 glyphs
 *                with Clean list on, 32 off, with "DIR" or a size then). List + Art: the same with
 *                a 90x60 picture right-aligned at the top, centre or bottom - but only for folders
 *                or scraped art, so with none it draws as List. Horizontal: the choice 120x80 in
 *                60,27 with 60x40 neighbours and a title box below. Vertical: the choice 84x56 in
 *                7,62 with 48x32 neighbours above and below and the title to its right.
 * Focus & selection: An accent bar behind the chosen row, its name white. Carousels move the
 *                pictures; nothing slides.
 * Buttons:       See machine.ts `browser`: Up/Down by one (by ten in Horizontal), Left/Right by
 *                ten (by one in Horizontal), A opens or launches, B back, Y favourite, SELECT the
 *                next view, START a system's launch mode, X search, L/R the tab cycle, MENU
 *                Settings, L2/R2 Recents/Favourites.
 * Transitions:   None but the chosen row's marquee: a 333ms hold, then 30 logical px/s, repeating
 *                every name-plus-three-glyphs (`ui.h:249-264`). It restarts on any page, choice or
 *                view change and rests at its start in a still.
 * Notes:         Under a popup, the keyboard or a help box the marquee is switched off and, as in
 *                the source, a name long enough to scroll is not drawn at all (`ui.h:323`).
 */
import type { StoryboardMap } from '../../../anim/types'
import { useStoryboard } from '../../../anim/useStoryboard'
import { background, type Background } from '../assets'
import { GLYPH, px } from '../layout'
import { effectiveView, isSystems, type State } from '../machine'
import { filename, systemTitle, type Entry } from '../library'
import { WHITE } from '../palette'
import { cleanTitle, drawable, glyphs, splitTitle } from '../text'
import { TitleBar } from './Chrome'
import { Art, Centered, Img, Rect, Text, entryIcon, useDs } from './parts'

/** `heart` (`ui.h:174-177`): an 8x6 bitmap, black, or white in dark mode. */
function Heart({ x, y }: { x: number; y: number }) {
  const { dark } = useDs()
  const rows = [0x6c, 0xfe, 0xfe, 0x7c, 0x38, 0x10]
  return (
    <>
      {rows.flatMap((bits, j) =>
        [0, 1, 2, 3, 4, 5, 6, 7]
          .filter((i) => bits & (128 >> i))
          .map((i) => <Rect key={`${j}-${i}`} x={x + i} y={y + j} w={1} h={1} color={dark ? WHITE : '#000000'} />),
      )}
    </>
  )
}

/** Whether a popup, the keyboard or a help box is up - which switches the marquee off (`ui.h:323`). */
export const overlaid = (s: State) =>
  s.settingHelp !== null ||
  s.capture !== null ||
  (s.search?.keyboard ?? false) ||
  s.notice !== null ||
  s.powerConfirm !== 0 ||
  s.launchMode !== null ||
  s.launching !== null ||
  s.hardware !== null

/**
 * `list_marquee` (`ui.h:249-264`). A name that fits is plain text. One that does not is drawn only
 * by the scroll layer, clipped to its column, repeating every `glyphs*6 + 18` pixels.
 */
function Marquee({ x, y, name, right, color }: { x: number; y: number; name: string; right: number; color: string }) {
  const ds = useDs()
  const r = Math.min(right, 240)
  const width = right - x
  if (glyphs(name) * GLYPH <= width) return <Text x={x} y={y} s={name} color={color} max={Math.trunc(width / GLYPH)} />
  if (overlaid(ds.state)) return null
  return <Scroller key={ds.state.marquee} x={x} y={y} name={name} right={r} color={color} />
}

function Scroller({ x, y, name, right, color }: { x: number; y: number; name: string; right: number; color: string }) {
  const period = Math.min(glyphs(name) * GLYPH + 18, 3200)
  // 0.030 logical px a millisecond after a 333ms hold; `offsetX` is a fraction of the 720px screen.
  const defs: StoryboardMap = {
    _: {
      animations: [
        {
          property: 'offsetX',
          from: 0,
          to: -px(period) / 720,
          begin: 333,
          duration: period / 0.03,
          mode: 'linear',
          repeat: 'forever',
        },
      ],
    },
  }
  const { attach, style, className } = useStoryboard(defs, '_')
  const shown = drawable(name)
  return (
    <div
      style={{
        position: 'absolute',
        left: px(x),
        top: px(y),
        width: px(right - x),
        height: px(12),
        overflow: 'hidden',
      }}
    >
      <div ref={attach} className={className} style={{ ...style, position: 'absolute', left: 0, top: 0 }}>
        {[0, period].map((at) => (
          <span key={at} className="ds-text" style={{ position: 'absolute', left: px(at), top: 0, color }}>
            {shown}
          </span>
        ))}
      </div>
    </div>
  )
}

/** The title a list shows (`ui.h:268-270`). */
function listTitle(s: State, tr: (x: string) => string): string {
  if (s.search) return `${tr('Search')}: ${s.search.query}`
  if (s.section === 1) return tr('Favourites')
  if (s.section === 2) return tr('Recents')
  if (s.section === 3) return tr('Apps')
  if (isSystems(s)) return tr('Systems')
  return s.here ? filename(s.here) : 'Games'
}

function List({ mode }: { mode: number }) {
  const ds = useDs()
  const s = ds.state
  const p = s.prefs
  const chosen = s.entries[s.choice]!
  // List + Art shows a folder's picture, or scraped art - never a built-in system picture (`ui.h:274`).
  const withArt = mode === 1 && chosen.dir && !chosen.app
  const ay = p.artPosition === 0 ? 27 : p.artPosition === 1 ? 60 : 92
  const artTop = ay
  const artLeft = 232 - 90
  const rows = s.entries.slice(s.top, s.top + 10)
  return (
    <>
      {rows.map((e, n) => {
        const i = s.top + n
        const y = 20 + n * 14
        const columns = p.cleanList ? 37 : 32
        const overlaps = withArt && y + 12 > artTop && y < artTop + 60
        let name =
          !e.dir && !e.app && p.cleanList ? cleanTitle(e.name) : e.dir ? systemTitle(e.name, p.fullNames) : e.name
        if (!e.dir && !e.app && s.favourites.includes(e.path)) name += ' <3'
        const on = i === s.choice
        return (
          <div key={e.path + i}>
            {on ? <Rect x={17} y={y} w={223} h={13} color={ds.accent} /> : null}
            <Img src={entryIcon(ds, e)} x={0} y={y} w={16} h={14} />
            {on ? (
              <Marquee x={17} y={y} name={name} right={overlaps ? artLeft - 3 : 17 + columns * 6} color={WHITE} />
            ) : (
              <Text x={17} y={y} s={name} max={columns} />
            )}
            {e.dir && !p.cleanList && columns === 32 ? (
              <Text x={221} y={y} s="DIR" color={on ? WHITE : '#000000'} max={3} />
            ) : null}
            {!e.dir && !e.app && !p.cleanList && columns === 32 ? (
              <Text x={208} y={y} s="   0B" color={on ? WHITE : '#000000'} max={5} />
            ) : null}
          </div>
        )
      })}
      {withArt ? <Art entry={chosen} x={142} y={ay} w={90} h={60} role={3} /> : null}
    </>
  )
}

function Carousel({ mode }: { mode: number }) {
  const ds = useDs()
  const s = ds.state
  const p = s.prefs
  const prev = s.entries[s.choice - 1]
  const next = s.entries[s.choice + 1]
  const chosen = s.entries[s.choice]!
  let box: [number, number, number, number]
  let parts
  if (mode === 2) {
    const sideY = p.hSide === 1 ? 27 : p.hSide === 2 ? 67 : 47
    parts = (
      <>
        {prev ? <Art entry={prev} x={-5} y={sideY} w={60} h={40} role={2} /> : null}
        {next ? <Art entry={next} x={185} y={sideY} w={60} h={40} role={2} /> : null}
        <Art entry={chosen} x={60} y={27} w={120} h={80} role={0} />
      </>
    )
    box = [39, 115, 162, 39]
  } else {
    parts = (
      <>
        {prev ? <Art entry={prev} x={25} y={24} w={48} h={32} role={2} /> : null}
        {next ? <Art entry={next} x={25} y={124} w={48} h={32} role={2} /> : null}
        <Art entry={chosen} x={7} y={62} w={84} h={56} role={0} />
      </>
    )
    box = [93, 62, 141, 56]
  }
  // Folders and apps show their own name; games their cleaned title (`ui.h:304-305`).
  const title = chosen.dir || chosen.app ? chosen.name : cleanTitle(chosen.name)
  const lines = splitTitle(title)
  const [tx, ty, tw, th] = box
  const y = Math.max(ty + 2, ty + Math.trunc((th - lines.length * 12) / 2))
  return (
    <>
      {parts}
      {lines.map((line, i) => (
        <Text
          key={i}
          x={Math.max(tx + 4, tx + Math.trunc((tw - line.length * 6) / 2))}
          y={y + i * 12}
          s={line}
          max={31}
        />
      ))}
      {s.favourites.includes(chosen.path) ? <Heart x={mode === 2 ? 45 : 97} y={mode === 2 ? 118 : 64} /> : null}
    </>
  )
}

/** `ui_browser` (`ui.h:265-310`). */
export function Browser() {
  const ds = useDs()
  const s = ds.state
  const mode = effectiveView(s)
  const bg: Background = mode === 2 ? 'SD_HORIZONTAL' : mode === 3 ? 'SD_VERTICAL' : 'SD_LIST'
  const empty = s.section === 1 ? 'No favourites' : s.section === 2 ? 'No recent games' : 'No games found'
  return (
    <>
      <Img src={background(bg, ds.dark)} x={0} y={0} w={240} h={160} />
      <TitleBar title={listTitle(s, ds.tr)} />
      {!s.entries.length ? (
        mode === 2 ? (
          <Centered x={39} y={128} w={162} s={ds.tr(empty)} />
        ) : mode === 3 ? (
          <Centered x={97} y={84} w={133} s={ds.tr(empty)} />
        ) : (
          <Centered x={17} y={75} w={207} s={ds.tr(empty)} />
        )
      ) : mode < 2 ? (
        <List mode={mode} />
      ) : (
        <Carousel mode={mode} />
      )}
    </>
  )
}

export type { Entry }
