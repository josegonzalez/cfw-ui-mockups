/**
 * PORTING NOTES
 * CFW: SimpleOS            Devices: rg-ds
 * Source: boorngos/SimpleOS - the `simpleos` binary's strings; the release trailer's home frames
 * Mode: reproduce
 *
 * Layout:        Top panel: the `SIMPLE OS` title bar with time and battery, then a white card
 *                with the highlighted title's icon on its colour, its name clipped hard at 33
 *                characters, the three-line legend in grey, and the date in blue at 3x.
 *                Bottom panel: a 3x2 grid of 180x165 tiles at a 192x189 pitch, a page at a time,
 *                with page dots beneath. Each tile is a white card with a solid offset shadow,
 *                the icon on its colour, and the name at 1x clipped at 20 characters.
 * Focus & selection: The cursor tile turns pale yellow with a yellow border. Row-major across
 *                pages: right off a page's last tile lands on the next page's first. No wrap.
 * Buttons:       A play, X archive, START options, SELECT clock, HOME (MENU) game config - the
 *                legend, verbatim. X opens the archive screen (`Ui_archive`); titles are archived
 *                from the in-game menu.
 * Transitions:   None. At 30fps the trailer moves the cursor and flips pages on a single frame.
 * Notes:         Icons are generated stand-ins; the real ones are the games' banner art, which
 *                SimpleOS reads from `covers.dat`. The letter on each is not invented: SimpleOS
 *                draws a title's initial where it has no icon (`draw_icon_or_letter`). The
 *                trailer shows three page dots; only two pages of titles are ever on screen, so
 *                the library here is those twelve and the dots follow it.
 */
import { Panels } from '../../../device/Panels'
import { TileGrid } from '../../../widgets/TileGrid'
import { place } from '../../../layout/box'
import { GAMES, HOME_LEGEND, PER_PAGE, formatDate, formatTime } from '../library'
import { DOTS, FONT, GRID_METRICS, TILE, TOP } from '../layout'
import { PALETTE } from '../palette'
import type { Clock } from '../machine'
import { Card, Fill, GameIcon, PixelText, TitleBar, Wash, iconColors } from './parts'

export interface HomeProps {
  readonly games: readonly number[]
  readonly selected: number
  readonly clock: Clock
}

function Detail({ game, clock }: { game: number | null; clock: Clock }) {
  const b = TOP.iconBacking
  return (
    <>
      <Wash from={PALETTE.topBgFrom} to={PALETTE.topBgTo} />
      <TitleBar time={formatTime(clock)} />
      <Card />
      {game === null ? (
        <>
          <PixelText text="No games" x={320} top={TOP.titleTop} font={FONT.body} color={PALETTE.text} align="center" />
          <PixelText
            text="Put .nds files in games/"
            x={320}
            top={TOP.legendTops[0]}
            font={FONT.body}
            color={PALETTE.legend}
            align="center"
          />
        </>
      ) : (
        <>
          <Fill box={b} color={iconColors(game)[0]} />
          <GameIcon
            game={game}
            title={GAMES[game]!}
            box={{
              left: b.left + (b.width - TOP.iconSize) / 2,
              top: b.top + (b.height - TOP.iconSize) / 2,
              width: TOP.iconSize,
              height: TOP.iconSize,
            }}
          />
          <PixelText
            text={GAMES[game]!}
            x={320}
            top={TOP.titleTop}
            font={FONT.body}
            color={PALETTE.text}
            align="center"
            maxChars={TOP.titleChars}
          />
          {HOME_LEGEND.map((line, i) => (
            <PixelText
              key={line}
              text={line}
              x={320}
              top={TOP.legendTops[i]!}
              font={FONT.body}
              color={PALETTE.legend}
              align="center"
            />
          ))}
        </>
      )}
      <PixelText
        text={formatDate(clock)}
        x={320}
        top={TOP.dateTop}
        font={FONT.large}
        color={PALETTE.accent}
        align="center"
      />
    </>
  )
}

function Tile({ game, selected }: { game: number; selected: boolean }) {
  const [sx, sy] = TILE.shadow
  const w = GRID_METRICS.tileW
  const h = GRID_METRICS.tileH
  const backing = TILE.backing
  return (
    <>
      <div
        style={{
          ...place({ left: 0, top: 0, width: w, height: h, radius: TILE.radius }),
          background: selected ? PALETTE.tileSelected : PALETTE.tile,
          border: selected ? `${TILE.border}px solid ${PALETTE.tileSelectedBorder}` : undefined,
          boxShadow: `${sx}px ${sy}px 0 ${PALETTE.tileShadow}`,
          boxSizing: 'border-box',
        }}
      />
      <Fill box={backing} color={iconColors(game)[0]} />
      <GameIcon
        game={game}
        title={GAMES[game]!}
        box={{
          left: backing.left + (backing.width - TILE.iconSize) / 2,
          top: backing.top + (backing.height - TILE.iconSize) / 2,
          width: TILE.iconSize,
          height: TILE.iconSize,
        }}
      />
      <PixelText
        text={GAMES[game]!}
        x={w / 2}
        top={TILE.captionTop}
        font={FONT.small}
        color={PALETTE.caption}
        align="center"
        maxChars={TILE.captionChars}
      />
    </>
  )
}

function Grid({ games, selected }: { games: readonly number[]; selected: number }) {
  const pages = Math.max(1, Math.ceil(games.length / PER_PAGE))
  const page = Math.floor(selected / PER_PAGE)
  const firstDot = 320 - ((pages - 1) * DOTS.pitch) / 2

  return (
    <>
      <Wash from={PALETTE.gridBgFrom} to={PALETTE.gridBgTo} />
      {games.length > 0 ? (
        <TileGrid
          metrics={GRID_METRICS}
          items={games}
          selectedIndex={selected}
          keyOf={(game) => String(game)}
          scroll="page"
          renderTile={(game, state) => <Tile game={game} selected={state.selected} />}
        />
      ) : null}
      {Array.from({ length: pages }, (_, i) => (
        <div
          key={i}
          style={{
            ...place({
              left: firstDot + i * DOTS.pitch - DOTS.size / 2,
              top: DOTS.centerY - DOTS.size / 2,
              width: DOTS.size,
              height: DOTS.size,
              radius: DOTS.size,
            }),
            background: i === page ? PALETTE.dotOn : PALETTE.dotOff,
          }}
          data-page-dot={i === page ? 'current' : undefined}
        />
      ))}
    </>
  )
}

export function Home({ games, selected, clock }: HomeProps) {
  const at = Math.min(selected, Math.max(0, games.length - 1))
  return (
    <Panels
      top={<Detail game={games[at] ?? null} clock={clock} />}
      bottom={<Grid games={games} selected={at} />}
    />
  )
}
