/**
 * PORTING NOTES
 * CFW: Elementerial, an EmulationStation theme by mluizvitor
 * Devices: rg35xx, rg-cubexx, rg351m, rg552
 * Source: settings/display/view-grid/grid.xml, view-boxes.xml, view-elementflix/flix.xml
 * Mode: reproduce
 *
 * Three views over the same tile machinery, differing entirely in presentation:
 *   - grid         caption under the art, which shrinks the art box
 *   - boxes        art dims when unselected, a centred wordmark grows on selection,
 *                  caption is a white-on-black chip that never takes the scheme colour
 *   - elementflix  square corners, no dimming, a hero above the row and edge fades either side
 *
 * Focus & selection:
 *   - The selected tile draws an accent plate behind its art. Boxes and Elementflix also zoom it.
 * Transitions:
 *   - Plate fades over 250ms linear; zoom and dim over 250ms easeOut; the strip slides 300ms.
 */
import { AnchoredImage } from '../../../widgets/AnchoredImage'
import { Scrim } from '../../../widgets/Scrim'
import { TileGrid, type TileGridMetrics, type TileState } from '../../../widgets/TileGrid'
import { place } from '../../../layout/box'
import { fadeMask, favouriteIcon, folderTile, placeholderTile, scrimMask } from '../assets'
import { marquee, screenshot } from '../art'
import { describe, type ElementerialGame, type ElementerialSystem } from '../library'
import { Backdrop } from './ListViews'
import type { ElementerialLayout } from '../layout'

export interface GridViewProps {
  readonly layout: ElementerialLayout
  readonly system: ElementerialSystem
  readonly games: readonly ElementerialGame[]
  readonly selectedIndex: number
  readonly art: { accent: string; sect: string }
  /** The scheme's placeholder-art alias, and the icon set it draws from. */
  readonly placeholder: { grid: string; iconStyle: 'grid' | 'grid-steam' }
  readonly animate: boolean
}

function metricsOf(source: ElementerialLayout['grid']): TileGridMetrics {
  return {
    box: source.box,
    cols: source.cols,
    rows: source.rows,
    tileW: source.tileW,
    tileH: source.tileH,
    padding: source.padding,
    margin: source.margin,
  }
}

/** The art for one tile: generated, or the scheme's placeholder where there is none. */
function tileArt(
  game: ElementerialGame,
  system: string,
  art: { accent: string; sect: string },
  placeholder: { grid: string; iconStyle: 'grid' | 'grid-steam' },
): string {
  if (game.folder) return folderTile(placeholder.iconStyle)
  if (game.noArt) return placeholderTile(placeholder.grid, placeholder.iconStyle)
  return screenshot({ ...game, system }, art.accent, art.sect)
}

/** The heart, pinned to the same inset as the art rather than to the tile's corner. */
function Favourite({
  tile,
  size,
  inset,
}: {
  tile: TileState
  size: number
  inset: readonly [number, number]
}) {
  return (
    <img
      className="el-tile-fav"
      src={favouriteIcon()}
      alt="favourite"
      style={{ left: `${inset[0]}px`, top: `${inset[1]}px`, width: `${size}px`, height: 'auto' }}
      data-tile={tile.index}
    />
  )
}

export function GridView(props: GridViewProps) {
  const { layout, system, games, selectedIndex, art, placeholder, animate } = props
  const g = layout.grid
  const selected = games[Math.min(selectedIndex, games.length - 1)]!
  const captionH = g.tileH * g.caption.height

  return (
    <>
      <Backdrop layout={layout} system={system} kind="basic" />

      <div
        className="el-logo-text"
        style={{ ...place({ ...g.logoText, top: g.logoText.top - g.logoText.font * 0.6, height: g.logoText.font * 1.2 }), zIndex: 5 }}
      >
        {system.fullName}
      </div>
      <div
        className="el-md-name"
        style={{ ...place({ ...g.md_name, top: g.md_name.top - g.md_name.font * 0.6, height: g.md_name.font * 1.2 }), zIndex: 5 }}
      >
        {selected.name}
      </div>

      <TileGrid
        metrics={metricsOf(g)}
        items={games}
        selectedIndex={selectedIndex}
        keyOf={(game) => game.name}
        // Column-major, scrolling sideways: the engine advances along the axis the grid scrolls.
        order="column-major"
        scroll="strip"
        transitionMs={animate ? 300 : 0}
        z={5}
        renderTile={(game, tile) => (
          <div className="el-tile" data-on={tile.selected || undefined} style={{ position: 'absolute', inset: 0 }}>
            <div className="el-tile-bg" style={{ borderRadius: `${g.selectorRadius}px` }} />
            <img
              className="el-tile-art"
              src={tileArt(game, system.theme, art, placeholder)}
              alt={game.name}
              style={{
                left: g.tilePadding[0],
                top: g.tilePadding[1],
                width: tile.box.width - g.tilePadding[0] * 2,
                // The caption sits under the art here, so it shrinks the art box.
                height: tile.box.height - captionH - g.tilePadding[1] * 2,
                borderRadius: `${(tile.selected ? g.roundSelected : g.round) * tile.box.width}px`,
              }}
            />
            {game.favorite ? <Favourite tile={tile} size={tile.box.width * 0.25} inset={g.tilePadding} /> : null}
            <div
              className="el-tile-caption"
              style={{
                top: tile.box.height * (1 - g.caption.height),
                height: captionH,
                width: `${g.caption.width * 100}%`,
                left: `${((1 - g.caption.width) / 2) * 100}%`,
                paddingLeft: `${g.caption.padding * tile.box.width}px`,
                paddingRight: `${g.caption.padding * tile.box.width}px`,
                fontSize: `${g.caption.font}px`,
                lineHeight: g.caption.lineSpacing,
              }}
            >
              {game.name}
            </div>
          </div>
        )}
      />
    </>
  )
}

export function BoxesView(props: GridViewProps) {
  const { layout, system, games, selectedIndex, art, placeholder, animate } = props
  const b = layout.boxes
  const selected = games[Math.min(selectedIndex, games.length - 1)]!

  return (
    <div className="el-view--boxes" style={{ position: 'absolute', inset: 0 }}>
      <Backdrop layout={layout} system={system} kind="basic" />

      <div
        className="el-logo-text"
        style={{ ...place({ ...layout.grid.logoText, top: layout.grid.logoText.top - layout.grid.logoText.font * 0.6, height: layout.grid.logoText.font * 1.2 }), zIndex: 5 }}
      >
        {system.fullName}
      </div>
      <div
        className="el-md-name"
        style={{ ...place({ ...layout.grid.md_name, top: layout.grid.md_name.top - layout.grid.md_name.font * 0.6, height: layout.grid.md_name.font * 1.2 }), zIndex: 5 }}
      >
        {selected.name}
      </div>

      <TileGrid
        metrics={metricsOf(b)}
        items={games}
        selectedIndex={selectedIndex}
        keyOf={(game) => game.name}
        order="column-major"
        scroll="strip"
        transitionMs={animate ? 300 : 0}
        z={5}
        renderTile={(game, tile) => {
          // Only this view zooms the selection, and it zooms the whole tile about its centre.
          const scale = tile.selected ? b.selectedZoom : 1
          const marqueeSize = tile.selected ? b.marquee.maxSizeSelected : b.marquee.maxSize

          return (
            <div
              className="el-tile"
              data-on={tile.selected || undefined}
              style={{ position: 'absolute', inset: 0, transform: `scale(${scale})`, transformOrigin: 'center center' }}
            >
              <div className="el-tile-bg" style={{ borderRadius: `${(tile.selected ? b.roundSelected : b.round) * tile.box.width}px` }} />
              <img
                className="el-tile-art"
                src={tileArt(game, system.theme, art, placeholder)}
                alt={game.name}
                style={{
                  left: b.tilePadding[0],
                  top: b.tilePadding[1],
                  width: tile.box.width - b.tilePadding[0] * 2,
                  height: tile.box.height - b.tilePadding[1] * 2,
                  borderRadius: `${(tile.selected ? b.roundSelected : b.round) * tile.box.width}px`,
                }}
              />
              <img
                className="el-tile-marquee"
                src={marquee({ ...game, system: system.theme })}
                alt=""
                style={{
                  width: `${marqueeSize[0] * tile.box.width}px`,
                  height: `${marqueeSize[1] * tile.box.height}px`,
                }}
              />
              {game.favorite ? (
                <Favourite tile={tile} size={tile.box.width * 0.25} inset={b.tilePadding} />
              ) : null}
              <div
                className="el-tile-caption"
                style={{
                  top: tile.box.height * b.caption.top,
                  height: tile.box.height * b.caption.height,
                  fontSize: `${b.caption.font}px`,
                  lineHeight: b.caption.lineSpacing,
                }}
              >
                {game.name}
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}

export function ElementflixView(props: GridViewProps) {
  const { layout, system, games, selectedIndex, art, placeholder, animate } = props
  const f = layout.elementflix
  const game = games[Math.min(selectedIndex, games.length - 1)]!
  const withSystem = { ...game, system: system.theme }
  const mask = scrimMask(layout.ratio, 'video')

  return (
    <div className="el-view--elementflix" style={{ position: 'absolute', inset: 0 }}>
      {/* Unscrimmed, like the video view: the diagonal scrim above the art does that job. */}
      <Backdrop layout={layout} system={system} kind={null} />

      <img
        className="el-md-image"
        src={screenshot(withSystem, art.accent, art.sect)}
        alt=""
        style={{ ...place(f.md_image), objectFit: 'cover', zIndex: -1 }}
      />
      <Scrim
        box={{ left: 0, top: 0, width: layout.w, height: layout.h }}
        mode={mask ? 'mask' : 'wash'}
        color="var(--bgColor)"
        src={mask ?? undefined}
        z={4}
      />

      <AnchoredImage
        className="el-md-marquee"
        box={{
          posX: f.md_marquee.posX,
          posY: f.md_marquee.posY,
          originX: f.md_marquee.originX,
          originY: f.md_marquee.originY,
          maxWidth: f.md_marquee.width,
          maxHeight: f.md_marquee.height,
          z: 6,
        }}
        src={marquee(withSystem)}
        alt={game.name}
      />

      <div
        className="el-md-description"
        style={{ ...place({ ...f.md_description, font: f.md_description.font }), lineHeight: f.md_description.lineSpacing, zIndex: 5 }}
      >
        {describe(game)}
      </div>

      <div
        className="el-logo-text"
        style={{ ...place({ ...f.logoText, top: f.logoText.top - f.logoText.font * 0.6, height: f.logoText.font * 1.2 }), zIndex: 5 }}
      >
        {system.fullName}
      </div>

      <TileGrid
        metrics={metricsOf(f)}
        items={games}
        selectedIndex={selectedIndex}
        keyOf={(g) => g.name}
        // The one grid whose axis is a subset: vertical fills row-major and scrolls down.
        order={f.direction === 'vertical' ? 'row-major' : 'column-major'}
        scroll={f.direction === 'vertical' ? 'rows' : 'strip'}
        transitionMs={animate ? 300 : 0}
        z={5}
        renderTile={(entry, tile) => (
          <div
            className="el-tile"
            data-on={tile.selected || undefined}
            style={{
              position: 'absolute',
              inset: 0,
              transform: `scale(${tile.selected ? f.selectedZoom : 1})`,
              transformOrigin: 'center center',
            }}
          >
            <div className="el-tile-bg" style={{ borderRadius: `${f.selectorRadius}px` }} />
            <img
              className="el-tile-art"
              src={tileArt(entry, system.theme, art, placeholder)}
              alt={entry.name}
              style={{
                left: f.tilePadding[0],
                top: f.tilePadding[1],
                // The art fills the tile. Only the plain grid gives its caption a band of its
                // own; here and in boxes the caption is drawn over the art.
                width: tile.box.width - f.tilePadding[0] * 2,
                height: tile.box.height - f.tilePadding[1] * 2,
              }}
            />
            {entry.favorite ? (
              <Favourite tile={tile} size={tile.box.width * 0.25} inset={f.tilePadding} />
            ) : null}
            <div
              className="el-tile-caption"
              style={{
                top: tile.box.height * f.caption.top,
                height: tile.box.height * f.caption.height,
                fontSize: `${f.caption.font}px`,
                lineHeight: f.caption.lineSpacing,
              }}
            >
              {entry.name}
            </div>
          </div>
        )}
      />

      {/*
        The two edge fades. Each is the background colour masked by the fade artwork; the second
        is mirrored, which is why the mask carries a flip rather than shipping twice.
      */}
      <Scrim
        box={{ left: f.fade.a[0], top: f.fade.a[1], width: f.fade.width, height: f.fade.height }}
        mode="mask"
        color="var(--bgColor)"
        src={fadeMask(f.fade.asset)}
        z={5}
      />
      <Scrim
        box={{ left: f.fade.b[0], top: f.fade.b[1], width: f.fade.width, height: f.fade.height }}
        mode="mask"
        color="var(--bgColor)"
        src={fadeMask(f.fade.asset)}
        flipX
        z={5}
      />
    </div>
  )
}
