/**
 * PORTING NOTES
 * CFW: PlayStation X, a Batocera EmulationStation theme by pajarorrojo
 * Devices: trimui-smart-pro, rg35xx, rg34xx, rg552
 * Source: _theme_views/ps4-style.xml, ps5-style.xml, grid.xml, carousel.xml, full-grid.xml,
 *         single.xml
 * Mode: reproduce
 *
 * Six ways to browse one library. They share the title, metadata rows, badge row and side media
 * from `parts.tsx`, and differ in how the tiles are laid out and how the cursor moves through
 * them:
 *   - ps4Style   a strip wider than the screen with the selection pinned to the centre column
 *   - ps5Style   a paged 5x2 grid, metadata top-left, title right-aligned
 *   - grid       the base class the others inherit: a paged 5x2 under an upper text block
 *   - carousel   a single reflective row, selection centred in the screen and zoomed
 *   - fullGrid   a 5x5 grid with an information column down the left
 *   - single     one game to a screen, no grid at all
 *
 * Focus & selection:
 *   - The strip views pin the cursor and translate the content; the paged grids turn a whole
 *     page at once with no animation, which is what the source does.
 * Buttons:
 *   - Left/Right and Up/Down move. A launches, B goes back to the system view.
 */
import { useStoryboard } from '../../../anim/useStoryboard'
import { TileGrid, type TileGridMetrics } from '../../../widgets/TileGrid'
import { place } from '../../../layout/box'
import { boxOf } from './Chrome'
import {
  Description,
  Icons,
  MarcoActivo,
  MetaRows,
  SideMedia,
  StartPill,
  Tile,
  Title,
} from './parts'
import { boxart, fanart } from '../art'
import { consoleArt, image } from '../assets'
import { STORYBOARDS } from '../storyboards'
import type { StoryboardEventKey } from '../../../anim/types'
import type { PsxGame, PsxSystem } from '../library'
import type { PsxLayout } from '../layout'

export interface GamelistProps {
  readonly layout: PsxLayout
  readonly system: PsxSystem
  readonly games: readonly PsxGame[]
  readonly selectedIndex: number
  readonly event: StoryboardEventKey
}

/**
 * A grid's metrics in the shape `TileGrid` wants.
 *
 * `margin` is zeroed deliberately. This theme's `cellW` is `size / cols` and already includes
 * the gap, where the widget's pitch is `tileW + margin` - passing the margin through would
 * count it twice and drift the whole row. The gap is applied inside the cell instead, which is
 * also what the source does.
 */
function metricsOf(gg: PsxLayout, inset: 'padding' | 'margin'): TileGridMetrics {
  const insetX = inset === 'padding' ? gg.padX : gg.marginX
  const insetY = inset === 'padding' ? gg.padY : gg.marginY

  return {
    box: { left: gg.left, top: gg.top, width: gg.w, height: gg.h },
    cols: gg.cols,
    rows: gg.rows,
    tileW: gg.cellW,
    tileH: gg.cellH,
    padding: [insetX, insetY],
    margin: [0, 0],
  }
}

/** The strip grid that both centre-selected views draw. */
function CenteredStrip({
  gg,
  games,
  system,
  selectedIndex,
  anchor,
  inset,
  zoom,
  event,
}: {
  gg: PsxLayout
  games: readonly PsxGame[]
  system: PsxSystem
  selectedIndex: number
  anchor: number
  inset: 'padding' | 'margin'
  zoom?: number
  event: StoryboardEventKey
}) {
  const { attach, style, className } = useStoryboard(STORYBOARDS['gamegrid-enter'], event)
  const metrics = metricsOf(gg, inset)

  /*
   * `autoLayoutSelectedZoom` is the *selected* tile's size relative to its neighbours, and the
   * cell is sized for the zoomed tile. So the base tile is cell/zoom and the selected one grows
   * to fill the cell. Scaling the base tile up instead makes it overflow: at 640x480 with zoom
   * 1.5 that pushes tiles clean off the screen.
   */
  const base = zoom
    ? {
        width: (gg.cellW - gg.padX * 2) / zoom,
        height: (gg.cellH - gg.padY * 2) / zoom,
      }
    : null

  return (
    <div ref={attach} className={className} style={{ ...style, position: 'absolute', inset: 0 }}>
      <TileGrid
        metrics={metrics}
        items={games}
        selectedIndex={selectedIndex}
        keyOf={(g) => g.name}
        order="column-major"
        scroll="centered"
        centerAnchor={anchor}
        transitionMs={300}
        easing="easeOutCubic"
        z={gg.z}
        renderTile={(game, tile) => (
          <div
            className="psx-tile"
            data-selected={tile.selected || undefined}
            style={
              base
                ? {
                    left: `${(tile.box.width - base.width) / 2}px`,
                    top: `${(tile.box.height - base.height) / 2}px`,
                    width: `${base.width}px`,
                    height: `${base.height}px`,
                    transform: `scale(${tile.selected ? zoom : 1})`,
                    transformOrigin: 'center center',
                    zIndex: tile.selected ? 3 : 1,
                  }
                : { position: 'absolute', inset: 0 }
            }
          >
            <Tile
              game={game}
              system={system}
              width={base ? base.width : tile.box.width}
              height={base ? base.height : tile.box.height}
            />
          </div>
        )}
      />
    </div>
  )
}

/** A paged grid, which turns a whole page at once with no animation. */
function PagedGrid({
  gg,
  games,
  system,
  selectedIndex,
  event,
}: {
  gg: PsxLayout
  games: readonly PsxGame[]
  system: PsxSystem
  selectedIndex: number
  event: StoryboardEventKey
}) {
  const { attach, style, className } = useStoryboard(STORYBOARDS['gamegrid-enter'], event)

  return (
    <div ref={attach} className={className} style={{ ...style, position: 'absolute', inset: 0 }}>
      <TileGrid
        metrics={metricsOf(gg, 'margin')}
        items={games}
        selectedIndex={selectedIndex}
        keyOf={(g) => g.name}
        scroll="page"
        z={gg.z}
        renderTile={(game, tile) => (
          <div
            className="psx-tile"
            data-selected={tile.selected || undefined}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Tile game={game} system={system} width={tile.box.width} height={tile.box.height} />
          </div>
        )}
      />
    </div>
  )
}

export function Ps4Style({ layout, system, games, selectedIndex, event }: GamelistProps) {
  const L = layout.ps4Style
  const game = games[Math.min(selectedIndex, games.length - 1)]!

  return (
    <>
      <CenteredStrip
        gg={L.gamegrid}
        games={games}
        system={system}
        selectedIndex={selectedIndex}
        anchor={L.gamegrid.centerIndex * L.gamegrid.cellW}
        inset="padding"
        event={event}
      />
      <MarcoActivo node={L.marcoActivo} event={event} />
      <StartPill view={L} />
      <Title layout={layout} view={L} game={game} system={system} event={event} />
      <MetaRows layout={layout} view={L} game={game} event={event} />
      <Icons layout={layout} view={L} game={game} />
      <Description view={L} game={game} />
      <FeaturedArt view={L} game={game} />
      <SideMedia view={L} game={game} event={event} />
    </>
  )
}

export function Ps5Style({ layout, system, games, selectedIndex, event }: GamelistProps) {
  const L = layout.ps5Style
  const game = games[Math.min(selectedIndex, games.length - 1)]!
  const con = system.hasConsole ? consoleArt(system.theme) : null

  return (
    <>
      <PagedGrid
        gg={L.gamegrid}
        games={games}
        system={system}
        selectedIndex={selectedIndex}
        event={event}
      />
      <Title
        layout={layout}
        view={L}
        game={game}
        system={system}
        event={event}
        family="'SST', sans-serif"
        weight={400}
      />
      {con ? (
        <img
          className="psx-img"
          style={{ ...place(boxOf(L.console)), zIndex: L.console.z }}
          src={con}
          alt=""
        />
      ) : null}
      <MetaRows layout={layout} view={L} game={game} event={event} />
      <Icons layout={layout} view={L} game={game} />
      <SideMedia view={L} game={game} event={event} />
    </>
  )
}

export function GridView({ layout, system, games, selectedIndex, event }: GamelistProps) {
  const L = layout.grid
  const game = games[Math.min(selectedIndex, games.length - 1)]!

  return (
    <>
      <PagedGrid
        gg={L.gamegrid}
        games={games}
        system={system}
        selectedIndex={selectedIndex}
        event={event}
      />
      <Title
        layout={layout}
        view={L}
        game={game}
        system={system}
        event={event}
        family="'SST', sans-serif"
        weight={700}
      />
      <MetaRows layout={layout} view={L} game={game} event={event} />
      <Icons layout={layout} view={L} game={game} />
      <Description view={L} game={game} />
      <FeaturedArt view={L} game={game} />
    </>
  )
}

export function CarouselView({ layout, system, games, selectedIndex, event }: GamelistProps) {
  const L = layout.carousel
  const G = layout.grid
  const game = games[Math.min(selectedIndex, games.length - 1)]!
  const zoom = L.gamegrid.scaleFactor ?? 1.5

  return (
    <>
      <CenteredStrip
        gg={L.gamegrid}
        games={games}
        system={system}
        selectedIndex={selectedIndex}
        /* Pinned to the middle of the panel rather than to a column. */
        anchor={layout.w / 2 - L.gamegrid.cellW / 2}
        inset="padding"
        zoom={zoom}
        event={event}
      />
      {/* The carousel borrows grid's upper text block rather than authoring its own. */}
      <Title
        layout={layout}
        view={G}
        game={game}
        system={system}
        event={event}
        family="'SST', sans-serif"
        weight={700}
      />
      <MetaRows layout={layout} view={G} game={game} event={event} />
      <Icons layout={layout} view={G} game={game} />
      <Description view={G} game={game} />
      <FeaturedArt view={L} game={game} />
    </>
  )
}

export function FullGrid({ layout, system, games, selectedIndex, event }: GamelistProps) {
  const L = layout.fullGrid
  const game = games[Math.min(selectedIndex, games.length - 1)]!

  return (
    <>
      <PagedGrid
        gg={L.gamegrid}
        games={games}
        system={system}
        selectedIndex={selectedIndex}
        event={event}
      />
      <Title
        layout={layout}
        view={L}
        game={game}
        system={system}
        event={event}
        family="'SST', sans-serif"
        weight={700}
      />
      <MetaRows layout={layout} view={L} game={game} event={event} />
      <Icons layout={layout} view={L} game={game} />
      <Description view={L} game={game} />
      <FeaturedArt view={L} game={game} />

      {/*
        The system name down the left column. Defined in the theme and never rendered by the
        original mockup - see docs/porting/playstation-x.md.
      */}
      <div
        className="psx-el psx-glow"
        style={{
          ...place({ ...boxOf(L.systemName), font: L.systemName.font }),
          zIndex: L.systemName.z,
        }}
      >
        {system.fullName}
      </div>
    </>
  )
}

export function SingleView({ layout, system, games, selectedIndex, event }: GamelistProps) {
  const L = layout.single
  const game = games[Math.min(selectedIndex, games.length - 1)]!
  const arrow = image('arrow-right.png')
  const {
    attach: arrowRef,
    style: arrowStyle,
    className: arrowClass,
  } = useStoryboard(STORYBOARDS['arrow-right'], '_')

  return (
    <>
      {/* The single view's pill is the accent colour and left-aligned, unlike every other. */}
      <div
        className="psx-start"
        style={{
          ...place({ ...boxOf(L.start), font: L.start.font }),
          zIndex: L.start.z,
          background: 'var(--psx-sistema-lineainferior)',
          justifyContent: 'flex-start',
          paddingLeft: `${0.013 * layout.w}px`,
        }}
      >
        Start
      </div>

      <Title
        layout={layout}
        view={L}
        game={game}
        system={system}
        event={event}
        family="'SST', sans-serif"
        weight={700}
      />
      <MetaRows layout={layout} view={L} game={game} event={event} />
      <Icons layout={layout} view={L} game={game} />
      <Description view={L} game={game} />
      <FeaturedArt view={L} game={game} />
      <SideMedia view={L} game={game} event={event} />

      {arrow ? (
        <img
          ref={arrowRef}
          className={`psx-img ${arrowClass}`}
          style={{ ...place(boxOf(L.arrow)), ...arrowStyle, zIndex: L.arrow.z }}
          src={arrow}
          alt=""
        />
      ) : null}
    </>
  )
}

/** The large featured image each gamelist view places differently. */
function FeaturedArt({ view, game }: { view: PsxLayout; game: PsxGame }) {
  const node = view.featured ?? view.image
  if (!node) return null

  return (
    <img
      className="psx-img"
      style={{ ...place(boxOf(node)), zIndex: node.z }}
      src={view.featured ? fanart(game, 320, 180) : boxart(game, 200, 280)}
      alt=""
    />
  )
}
