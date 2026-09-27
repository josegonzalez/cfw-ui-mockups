/**
 * PORTING NOTES
 * CFW: SimpleOS            Devices: rg-ds
 * Source: boorngos/SimpleOS - the `simpleos` binary's strings and symbols (`Ui_options`,
 *         `Ui_archive`, `Ui_map`, `Ui_video`), README.txt, CHANGELOG.txt; the trailer's
 *         RetroAchievements frames
 * Mode: reproduce (the bottom-panel list) and design-new (the top panel)
 *
 * Layout:        Bottom panel: rows 592x46 at a 53px pitch from y 8, 24px in from each side, on a
 *                near-white wash. Label left and value right, both 2x, 21px in from the row's
 *                edges. Eight rows fit; a longer list scrolls to keep the cursor in view.
 *                Top panel: the home screen's title bar and card, with the screen's capitalised
 *                title at 3x in blue, the binary's own line describing the screen, what the
 *                highlighted row does, any status, and the legend at the foot.
 * Focus & selection: The cursor row fills pale yellow; the others are white on a faint rule. The
 *                cursor wraps. Each screen keeps its own cursor across visits.
 * Buttons:       Up/down move; A per the legend (select, toggle, cycle, bind); left/right cycle a
 *                shader row; X adds an input on Controls; B goes back - "home" off Options, which
 *                sits directly on home.
 * Transitions:   None seen.
 * Notes:         Only the RetroAchievements list is in the trailer, and it shows no title on the
 *                bottom panel - so the top panel is where each screen says what it is. That half
 *                is design-new, built from the home screen's parts and the binary's strings.
 *                Username and Password open an on-screen keyboard on the device; this port shows
 *                the binary's "Enter user and password" instead. Controls are per title on the
 *                device and global here.
 */
import { Panels } from '../../../device/Panels'
import { GAMES, SCREEN_COPY, formatTime, type View } from '../library'
import { FONT, LIST, TOP } from '../layout'
import { PALETTE } from '../palette'
import type { Clock, Row } from '../machine'
import { Card, PixelText, SettingRow, TitleBar, Wash } from './parts'

export interface SettingsProps {
  readonly view: View
  readonly rows: readonly Row[]
  readonly cursor: number
  readonly clock: Clock
  /** The title the screen is about, for This game and Controls. */
  readonly game?: number | null | undefined
  readonly status?: string | null | undefined
}

/** The first row drawn, so the cursor is always on screen. */
export function firstVisibleRow(cursor: number, count: number, visible: number = LIST.visible): number {
  if (count <= visible) return 0
  return Math.max(0, Math.min(cursor - visible + 1, count - visible))
}

function About({ view, row, clock, game, status }: {
  view: View
  row: Row | undefined
  clock: Clock
  game: number | null | undefined
  status: string | null | undefined
}) {
  const copy = SCREEN_COPY[view]
  const chars = Math.floor((TOP.card.width - 32) / FONT.body)
  return (
    <>
      <Wash from={PALETTE.topBgFrom} to={PALETTE.topBgTo} />
      <TitleBar time={formatTime(clock)} />
      <Card box={TOP.screenCard} />
      {copy ? (
        <>
          <PixelText text={copy.title} x={320} top={TOP.screenTitleTop} font={FONT.large} color={PALETTE.accent} align="center" />
          {copy.subtitle ? (
            <PixelText text={copy.subtitle} x={320} top={TOP.screenSubtitleTop} font={FONT.body} color={PALETTE.legend} align="center" maxChars={chars} />
          ) : null}
          <PixelText text={copy.legend} x={320} top={TOP.screenLegendTop} font={FONT.body} color={PALETTE.legend} align="center" />
        </>
      ) : null}
      {game != null && (view === 'this-game' || view === 'controls') ? (
        <PixelText text={GAMES[game]!} x={320} top={TOP.screenSubtitleTop + 40} font={FONT.body} color={PALETTE.text} align="center" maxChars={TOP.titleChars} />
      ) : null}
      {row?.note ? (
        <PixelText text={row.note} x={320} top={TOP.noteTop} font={FONT.body} color={PALETTE.text} align="center" maxChars={chars} />
      ) : null}
      {status ? (
        <PixelText text={status} x={320} top={TOP.statusTop} font={FONT.body} color={PALETTE.accent} align="center" maxChars={chars} />
      ) : null}
    </>
  )
}

function List({ rows, cursor }: { rows: readonly Row[]; cursor: number }) {
  const first = firstVisibleRow(cursor, rows.length)
  return (
    <>
      <Wash from={PALETTE.listBgFrom} to={PALETTE.listBgTo} />
      {rows.slice(first, first + LIST.visible).map((row, i) => (
        <SettingRow
          key={row.key}
          box={{ left: LIST.left, top: LIST.top + i * LIST.pitch, width: LIST.width, height: LIST.rowHeight, radius: LIST.radius }}
          label={row.label}
          value={row.value}
          selected={first + i === cursor}
          padX={LIST.padX}
        />
      ))}
    </>
  )
}

export function Settings({ view, rows, cursor, clock, game, status }: SettingsProps) {
  return (
    <Panels
      top={<About view={view} row={rows[cursor]} clock={clock} game={game} status={status} />}
      bottom={<List rows={rows} cursor={cursor} />}
    />
  )
}
