/**
 * PORTING NOTES
 * CFW: PlayStation X, a Batocera EmulationStation theme by pajarorrojo
 * Devices: trimui-smart-pro, rg35xx, rg34xx, rg552
 * Source: _theme_views/detailed.xml, test-media.xml
 * Mode: reproduce
 *
 * The two views built around a text list rather than a grid.
 *
 *   - detailed     a list down the left, the game's panel down the right
 *   - mediaTester  a diagnostic screen showing every scraped asset slot, each captioned with an
 *                  XML-style closing tag. Empty slots stay visible, because the point of the
 *                  screen is to show which media are missing.
 *
 * Focus & selection:
 *   - Up/Down move the list. The detailed panel slides as one unit rather than per element.
 * Transitions:
 *   - The outgoing panel leaves by 78% of screen height and the incoming one arrives from the
 *     opposite 78%, which is what makes the view read as a stack of cards.
 */
import { useStoryboard } from '../../../anim/useStoryboard'
import { place } from '../../../layout/box'
import { boxOf } from './Chrome'
import { MetaRows, SideMedia } from './parts'
import { boxart, fanart, marquee } from '../art'
import { image } from '../assets'
import type { StoryboardEventKey } from '../../../anim/types'
import { STORYBOARDS } from '../storyboards'
import type { PsxGame, PsxSystem } from '../library'
import type { PsxLayout } from '../layout'

export interface ListViewProps {
  readonly layout: PsxLayout
  readonly system: PsxSystem
  readonly games: readonly PsxGame[]
  readonly selectedIndex: number
  readonly event: StoryboardEventKey
}

/** The shared text list. */
function GameList({
  node,
  games,
  selectedIndex,
  lineHeight,
}: {
  node: PsxLayout
  games: readonly PsxGame[]
  selectedIndex: number
  lineHeight: number
}) {
  const rowHeight = node.font * lineHeight
  const visible = Math.max(1, Math.floor(node.h / rowHeight))
  // Follow the selection by the minimum needed, and stop at the end of the list.
  const first = Math.min(Math.max(0, selectedIndex - visible + 1), Math.max(0, games.length - visible))

  return (
    <div
      className="psx-el"
      style={{
        ...place({ ...boxOf(node), font: node.font }),
        zIndex: node.z,
        overflow: 'hidden',
      }}
    >
      {games.slice(first, first + visible + 1).map((game, offset) => (
        <div
          key={game.name}
          className="psx-list-row"
          data-selected={first + offset === selectedIndex || undefined}
          style={{ height: `${rowHeight}px`, lineHeight: `${rowHeight}px` }}
        >
          {game.name}
        </div>
      ))}
    </div>
  )
}

export function DetailedView({ layout, games, selectedIndex, event }: ListViewProps) {
  const L = layout.detailed
  const game = games[Math.min(selectedIndex, games.length - 1)]!
  const {
    attach: panelRef,
    style: panelStyle,
    className: panelClass,
  } = useStoryboard(STORYBOARDS['detailed-panel'], event)

  return (
    <>
      <GameList node={L.gamelist} games={games} selectedIndex={selectedIndex} lineHeight={1.45} />

      {/*
        The panel is the whole right-hand column and moves as one. The source names every child
        individually; one bound wrapper is equivalent and far cheaper than twelve animations.
      */}
      <div
        ref={panelRef}
        className={panelClass}
        style={{ ...panelStyle, position: 'absolute', inset: 0, zIndex: 91 }}
      >
        {/*
          `detailed` declares gamelist, image, gamedata, gamedata2, lineaInfos and gamedesc -
          and no `iconos`. Drawing a badge row here anyway is what put the flags where the star
          rating belongs, so both rows now come from `MetaRows`, which draws exactly the nodes
          the view declares.
        */}
        <MetaRows layout={layout} view={L} game={game} event={event} />
        <SideMedia view={L} game={game} event={event} />

        <div
          className="psx-el"
          style={{
            ...place(boxOf(L.lineaInfos)),
            zIndex: L.lineaInfos.z,
            background: 'rgba(255,255,255,0.35)',
          }}
        />
      </div>
    </>
  )
}

/**
 * The asset slots the media tester draws, from `test-media.xml`.
 *
 * The top row sits at y 0.29 with its captions at 0.45; the bottom row at 0.72 with captions at
 * 0.89. `kind: 'none'` slots have no stand-in art and stay deliberately empty - that is the
 * screen's whole purpose.
 */
const SLOTS: ReadonlyArray<{
  tag: string
  x: number
  y: number
  ty: number
  kind: 'none' | 'fanart' | 'box' | 'marquee'
  ms?: readonly [number, number]
}> = [
  { tag: 'VIDEO', x: 0.32, y: 0.29, ty: 0.45, kind: 'none' },
  { tag: 'IMAGE', x: 0.53, y: 0.29, ty: 0.45, kind: 'fanart' },
  { tag: 'THUMBNAIL', x: 0.73, y: 0.29, ty: 0.45, kind: 'box', ms: [0.17, 0.25] },
  { tag: 'MARQUEE', x: 0.91, y: 0.29, ty: 0.45, kind: 'marquee', ms: [0.13, 0.13] },
  { tag: 'FANART', x: 0.12, y: 0.72, ty: 0.89, kind: 'fanart', ms: [0.22, 0.25] },
  { tag: 'TITLESHOT', x: 0.36, y: 0.72, ty: 0.89, kind: 'fanart' },
  { tag: 'BOXART', x: 0.56, y: 0.72, ty: 0.89, kind: 'box', ms: [0.17, 0.25] },
  { tag: 'BOXBACK', x: 0.75, y: 0.72, ty: 0.89, kind: 'none', ms: [0.17, 0.25] },
  { tag: 'CARTRIDGE', x: 0.92, y: 0.72, ty: 0.89, kind: 'none', ms: [0.14, 0.18] },
]

export function MediaTester({ layout, games, selectedIndex }: ListViewProps) {
  const L = layout.mediaTester
  const game = games[Math.min(selectedIndex, games.length - 1)]!
  const W = layout.w
  const H = layout.h

  return (
    <>
      <GameList node={L.gamelist} games={games} selectedIndex={selectedIndex} lineHeight={1.2} />

      <div
        className="psx-gamename"
        style={{ ...place(boxOf(L.gamename)), zIndex: L.gamename.z }}
      >
        <span
          className="name"
          style={{
            fontFamily: "'SST Light', 'SST', sans-serif",
            fontWeight: 300,
            fontSize: `${L.gamename.font}px`,
          }}
        >
          {game.name}
        </span>
      </div>

      {SLOTS.map((slot) => {
        const mw = (slot.ms ? slot.ms[0] : 0.19) * W
        const mh = (slot.ms ? slot.ms[1] : 0.25) * H
        /* An unscraped slot draws the frontend's own placeholder, not an empty frame. */
        const src =
          slot.kind === 'fanart'
            ? fanart(game, 320, 180)
            : slot.kind === 'box'
              ? boxart(game, 200, 280)
              : slot.kind === 'marquee'
                ? marquee(game, 260, 90)
                : image('no-image-default.png')

        return (
          <div key={slot.tag}>
            <div
              className="psx-media-slot"
              style={{
                left: `${slot.x * W - mw / 2}px`,
                top: `${slot.y * H - mh / 2}px`,
                width: `${mw}px`,
                height: `${mh}px`,
                zIndex: L.slot.z,
              }}
            >
              {src ? <img src={src} alt="" /> : null}
            </div>
            <div
              className="psx-media-tag"
              style={{
                left: `${slot.x * W}px`,
                top: `${slot.ty * H}px`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${L.tag.font}px`,
                zIndex: L.tag.z,
              }}
            >
              &lt;/{slot.tag}&gt;
            </div>
          </div>
        )
      })}
    </>
  )
}
