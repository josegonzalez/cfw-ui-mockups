/**
 * The pieces every gamelist view is assembled from.
 *
 * Eight of the eleven views are the same handful of elements at different coordinates: a tile, a
 * title, two metadata rows, a badge row and a side-media pair. They live here rather than being
 * written out per view, so a change to how a metadata row reads happens once.
 */
import { useStoryboard } from '../../../anim/useStoryboard'
import { Badge, type BadgeKind } from '../../../widgets/Badge'
import { IconRow } from '../../../widgets/IconRow'
import { place } from '../../../layout/box'
import { boxOf } from './Chrome'
import { fanart, marquee as marqueeArt, boxart } from '../art'
import { badge as badgeAsset, flag, image } from '../assets'
import { P, starPips, type PsxGame, type PsxSystem } from '../library'
import { STORYBOARDS } from '../storyboards'
import type { StoryboardEventKey } from '../../../anim/types'
import type { PsxLayout } from '../layout'

/** One tile: the art, plus the two markers that sit inside it. */
export function Tile({
  game,
  system,
  width,
  height,
}: {
  game: PsxGame
  system: PsxSystem
  width: number
  height: number
}) {
  const favorite = image('favorite.png')
  const trophy = image('trophy-picto.svg')

  return (
    <>
      <img className="art" src={fanart(game, Math.round(width), Math.round(height))} alt={game.name} />
      {/* The heart is hidden entirely inside a Collection - grid.xml:116 */}
      {game.favorite && !P.hidesFavorite(system) && favorite ? (
        <img className="psx-tile-fav" src={favorite} alt="" />
      ) : null}
      {game.cheevos && trophy ? <img className="psx-tile-cheevos" src={trophy} alt="" /> : null}
    </>
  )
}

/** The big game title, with the italic chip a Collection adds. */
export function Title({
  layout,
  view,
  game,
  system,
  event,
  family = "'SST Light', 'SST', sans-serif",
  weight = 300,
}: {
  layout: PsxLayout
  view: PsxLayout
  game: PsxGame
  system: PsxSystem
  event: StoryboardEventKey
  family?: string
  weight?: number
}) {
  const { attach, style, className } = useStoryboard(STORYBOARDS.gamename, event)
  const font = view.gameName ? view.gameName.font : view.gamename.font

  return (
    <div
      ref={attach}
      className={`psx-gamename ${className}`}
      style={{ ...place(boxOf(view.gamename)), ...style, zIndex: view.gamename.z }}
    >
      <span className="name psx-glow" style={{ fontFamily: family, fontWeight: weight, fontSize: `${font}px` }}>
        {game.name}
      </span>
      {/* The chip only appears inside a Collection - ps4-style.xml:216 */}
      {P.showsSystemChip(system) ? (
        <span
          className="chip"
          style={{
            fontSize: `${view.systemNameChip ? view.systemNameChip.font : layout.h * 0.023}px`,
            marginLeft: '0.6em',
          }}
        >
          {system.fullName}
        </span>
      ) : null}
    </div>
  )
}

/**
 * The two metadata rows.
 *
 * The publisher and developer line has four mutually exclusive shapes because
 * EmulationStation has no else: the source writes each case as its own row, including the
 * placeholder dashes when a game has neither.
 */
export function MetaRows({
  layout,
  view,
  game,
  event,
}: {
  layout: PsxLayout
  view: PsxLayout
  game: PsxGame
  event: StoryboardEventKey
}) {
  // Destructured at the call site: the lint rule reads a property access on a hook result that
  // carries a ref setter as a ref access during render.
  const {
    attach: firstRef,
    style: firstStyle,
    className: firstClass,
  } = useStoryboard(STORYBOARDS['grid-meta'], event)
  const {
    attach: secondRef,
    style: secondStyle,
    className: secondClass,
  } = useStoryboard(STORYBOARDS['grid-meta'], event)
  const {
    attach: chipRef,
    style: chipStyle,
    className: chipClass,
  } = useStoryboard(STORYBOARDS.badge, '_')

  const gap = (view.gamedata.separator ?? 0.015) * layout.w

  return (
    <>
      <div
        ref={firstRef}
        className={`psx-row ${firstClass}`}
        style={{
          ...place({ ...boxOf(view.gamedata), font: view.gamedata.font }),
          ...firstStyle,
          gap: `${gap}px`,
          zIndex: view.gamedata.z,
        }}
      >
        <span className="release">{game.releaseyear || '------'}</span>
        <span className="sep">•</span>
        {P.neither(game) ? (
          <span className="dim">-------------</span>
        ) : P.pubEqDev(game) || P.devOnly(game) ? (
          <span>{game.developer}</span>
        ) : P.pubOnly(game) ? (
          <span>{game.publisher}</span>
        ) : (
          <span>
            {game.publisher} – {game.developer}
          </span>
        )}
      </div>

      <div
        ref={secondRef}
        className={`psx-row ${secondClass}`}
        style={{
          ...place({ ...boxOf(view.gamedata2), font: view.gamedata2.font }),
          ...secondStyle,
          gap: `${gap}px`,
          zIndex: view.gamedata2.z,
        }}
      >
        {P.hasStars(game) ? (
          <span className="psx-stars">
            {starPips(game.stars).map((filled, i) => (
              <span
                key={i}
                style={{ color: filled ? 'var(--psx-gamelist-starFill)' : 'var(--psx-starUnfill)' }}
              >
                ★
              </span>
            ))}
          </span>
        ) : null}
        <span className="genre">•</span>
        <span className="genre">{game.genre}</span>
        {P.multidisc(game) ? (
          <span ref={chipRef} className={`multidisc ${chipClass}`} style={chipStyle}>
            multi-disc
          </span>
        ) : null}
      </div>
    </>
  )
}

/** Which badges a game earns, in the source's own order. */
export function badgesFor(game: PsxGame): Array<{ kind: BadgeKind; src: string | null }> {
  const out: Array<{ kind: BadgeKind; src: string | null }> = []
  if (game.cheevos) out.push({ kind: 'cheevos', src: image('trophy-picto.svg') })
  if (game.hasSaveState) out.push({ kind: 'savegame', src: image('SaveState.png') })
  if (game.hasManual) out.push({ kind: 'manual', src: image('manual.png') })
  if (game.kidGame) out.push({ kind: 'kidGame', src: image('kidgame.png') })
  if (game.gunGame) out.push({ kind: 'gunGame', src: image('lightgun.png') })
  if (game.hasKeyboardMapping) out.push({ kind: 'manual', src: image('keyboardmap.png') })
  return out
}

const TAG_BADGE: Record<string, { kind: BadgeKind; file: string }> = {
  finished: { kind: 'finished', file: 'F11E' },
  'in progress': { kind: 'inProgress', file: 'F144' },
  buggy: { kind: 'buggy', file: 'F070' },
}

/**
 * One pulsing play-state badge.
 *
 * A component per badge rather than one hook reused across a map: a callback ref points at a
 * single element, so sharing one across several would leave only the last of them animating -
 * and the others would sit still in a row where every sibling pulses.
 */
function TagBadge({
  tag,
  kind,
  file,
  size,
}: {
  tag: string
  kind: BadgeKind
  file: string
  size: number
}) {
  const { attach, style, className } = useStoryboard(STORYBOARDS.badge, '_')
  const src = badgeAsset(file)

  return src ? (
    <img
      ref={attach}
      className={className}
      style={{ ...style, height: `${size}px`, width: 'auto' }}
      src={src}
      alt={tag}
    />
  ) : (
    <Badge kind={kind} size={size} color="var(--psx-releaseColor)" glyph="●" />
  )
}

/**
 * The badge row: flags, player count, capability pictos and the pulsing play-state tags.
 *
 * Which badges apply is decided here rather than inside `IconRow`, because each rule is one of
 * the theme's own `<visible>` expressions and belongs where its citation is.
 */
export function Icons({
  layout,
  view,
  game,
}: {
  layout: PsxLayout
  view: PsxLayout
  game: PsxGame
}) {
  const size = Math.max(12, layout.h * 0.03)
  const gap = (view.iconos.separator ?? 0.015) * layout.w

  const regionFlag = P.worldFlag(game) ? flag('wor') : flag(game.region ?? 'eu')
  const langFlag = P.langLabel(game) ? null : flag(game.lang ?? 'en')

  return (
    <IconRow box={{ ...boxOf(view.iconos), font: size }} gap={gap} className="psx-el">
      {regionFlag ? (
        <img src={regionFlag} alt="" style={{ height: `${size}px`, width: 'auto' }} />
      ) : null}

      {/* More than one language shows a label rather than a flag - grid.xml:381 */}
      {P.langLabel(game) ? (
        <span style={{ color: 'var(--psx-releaseColor)', fontSize: `${size * 0.62}px` }}>
          {String(game.lang).toUpperCase()}
        </span>
      ) : langFlag ? (
        <img src={langFlag} alt="" style={{ height: `${size}px`, width: 'auto' }} />
      ) : null}

      {/* The player count renders through players.ttf, an icon font. */}
      <span
        style={{
          fontFamily: "'players', 'SST', sans-serif",
          fontSize: `${size * 1.2}px`,
          color: '#eeeeee',
        }}
      >
        {game.playerCount ?? 1}
      </span>

      {badgesFor(game).map(({ kind, src }, i) =>
        src ? (
          <img key={`${kind}${i}`} src={src} alt="" style={{ height: `${size}px`, width: 'auto' }} />
        ) : null,
      )}

      {(game.tags ?? []).map((tag) => {
        const def = TAG_BADGE[tag]
        return def ? <TagBadge key={tag} tag={tag} kind={def.kind} file={def.file} size={size} /> : null
      })}
    </IconRow>
  )
}

/**
 * The marquee and thumbnail pair down the right-hand side.
 *
 * One element each. The original built the marquee twice and let the second overwrite the
 * reference to the first, leaving an orphaned image with no `src` - see
 * `docs/porting/playstation-x.md`.
 */
export function SideMedia({
  view,
  game,
  event,
}: {
  view: PsxLayout
  game: PsxGame
  event: StoryboardEventKey
}) {
  const { attach, style, className } = useStoryboard(STORYBOARDS.marquee, event)

  return (
    <>
      {view.marquee ? (
        <img
          ref={attach}
          className={`psx-img ${className}`}
          style={{ ...place(boxOf(view.marquee)), ...style, zIndex: view.marquee.z }}
          src={marqueeArt(game, 260, 90)}
          alt={game.name}
        />
      ) : null}

      {view.thumbnail ? (
        <img
          className="psx-img"
          style={{ ...place(boxOf(view.thumbnail)), zIndex: view.thumbnail.z }}
          src={boxart(game, 200, 280)}
          alt=""
        />
      ) : null}
    </>
  )
}

/** The description block. */
export function Description({ view, game }: { view: PsxLayout; game: PsxGame }) {
  return (
    <div
      className="psx-desc psx-glow"
      style={{ ...place({ ...boxOf(view.gamedesc), font: view.gamedesc.font }), zIndex: view.gamedesc.z }}
    >
      {game.desc}
    </div>
  )
}

/** The "Start" pill. */
export function StartPill({ view }: { view: PsxLayout }) {
  const { attach, style, className } = useStoryboard(STORYBOARDS.start, '_')

  return (
    <div
      ref={attach}
      className={`psx-start ${className}`}
      style={{ ...place({ ...boxOf(view.start), font: view.start.font }), ...style, zIndex: view.start.z }}
    >
      Start
    </div>
  )
}

/** The selection frame. PS4 ships an isometric image; PS5 draws a rounded rectangle. */
export function MarcoActivo({
  node,
  ps5 = false,
  event,
}: {
  node: PsxLayout
  ps5?: boolean
  event: StoryboardEventKey
}) {
  const { attach, style, className } = useStoryboard(STORYBOARDS['marco-activo'], event)
  const box = { left: node.left, top: node.top, width: node.w, height: node.h }
  const frame = image('marco-activo-iso.png')

  if (ps5) {
    return (
      <div
        ref={attach}
        className={`psx-marco ${className}`}
        style={{
          ...place(box),
          ...style,
          zIndex: node.z,
          borderRadius: '15%',
          border: '2px solid #ffffff',
        }}
      />
    )
  }

  return frame ? (
    <img
      ref={attach}
      className={`psx-marco ${className}`}
      style={{ ...place(box), ...style, zIndex: node.z }}
      src={frame}
      alt=""
    />
  ) : null
}
