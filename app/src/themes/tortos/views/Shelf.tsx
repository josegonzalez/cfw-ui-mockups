/**
 * PORTING NOTES
 * CFW: TortOS            Devices: trimui-brick
 * Source: ericreinsmidt/TortOS - src/main.c draw_shelf (3106), draw_background (2404),
 *         draw_systems (2690), draw_games (3048), draw_game_text (2887), draw_both (2531),
 *         draw_no_games (3094); src/coverflow.c (layouts, cf_draw, cf_draw_cube)
 * Mode: reproduce
 *
 * Layout:        The shelf is a coverflow over a near-black background with a wash of the focused
 *                system's colour along the bottom. The systems row is three flat cards - a big
 *                centre and two small neighbours - with the system's name at y=618 when the art
 *                does not name itself (Fancy Pants), "N games" at 690 and a rail at the foot. The
 *                games row is seven cards yawed 0.82 rad, the title at y=40 with the heart in a
 *                fixed seat at the far left, "i / n" at 690. Vertical stands both rows on end,
 *                one card at a time, with the rail down the left and the count bottom left.
 *                Cubic is one game filling the screen, turned like a cube face.
 * Focus & selection: The centre card is the selection; there is no frame around it, only a glow in
 *                the system's colour behind it. Rows wrap in both directions.
 * Buttons:       Systems: Left/Right (Up/Down stood on end) move, A enters (Muse's card opens
 *                Muse), MENU the TortOS menu, SELECT Muse. Games: Left/Right move, Up/Down jump
 *                a letter (axes swap stood on end), L1/R1 a screenful, A plays, B back, X game
 *                details, Y favourite, MENU the system's menu. Cubic: Up/Down system,
 *                Left/Right and L1/R1 game, A plays, B the system's menu, MENU the TortOS menu.
 * Transitions:   Horizontal moves take 240ms ease-out cubic; Vertical 360ms smoothstep; Cubic
 *                450ms smoothstep, turning a cube that backs away by 18% mid-turn. Every move
 *                restarts from where the cards are drawn. The background wash chases the new
 *                system's colour exponentially. Vertical crossfades the system's name, gone in the
 *                first 30% of the move and back in the last 30%.
 * Notes:         Every game is drawn with TortOS's own generated card: the reference frames show
 *                real box art, which this repo does not ship.
 */
import { Coverflow } from '../../../widgets/Coverflow'
import { useWebEffects } from '../../../render/RenderModeProvider'
import { cardArt } from '../cards'
import { CARD_SETS, type System } from '../library'
import {
  cursorOf,
  gamesOf,
  isFavorite,
  shelfScreen,
  shelfSystem,
  systemsOf,
  type ShelfGame,
  type State,
} from '../machine'
import { UI } from '../palette'
import { CARD, CF, CF_HALF_WINDOW, CF_WIDE_ART, FONT, GLOW, SCREEN, SHELF_TEXT, descent, focusRect, type CfLayout } from '../spec'
import { fitText, textWidth } from '../text'
import { GeneratedCard, Glow, Heart, Marquee, Rail, Text } from './parts'

export interface ShelfMotion {
  /** The systems row's drawn position. */
  readonly sysPos: number
  /** A games row's drawn position, by system tag. */
  readonly gamePos: (tag: string) => number
  /** The vertical systems row's name: which system, and how visible. */
  readonly label: { readonly at: number; readonly alpha: number }
  /** The last move's direction, for a ring of two. */
  readonly lastDir: (key: string) => -1 | 0 | 1
  /** The title's marquee phase. */
  readonly titlePhase: number
}

const SCREEN_BOX = { left: 0, top: 0, width: SCREEN.w, height: SCREEN.h }
const wrap = (i: number, n: number) => ((Math.floor(i + 0.5) % n) + n) % n

/**
 * The background: near black, and the focused system's colour washed along the foot.
 *
 * The near black is the theme root's own fill rather than a layer here. A full-bleed opaque layer
 * under the content is the exact shape of the compositing fault `e2e/compositing.spec.ts` hunts,
 * so the only thing drawn is the wash.
 */
export function Background({ tint }: { tint: number }) {
  return <Glow box={GLOW.wash.box} rgb={tint} alpha={GLOW.wash.alpha} spread={GLOW.wash.spread} />
}

/* ---- art ------------------------------------------------------------------ */

interface GameItem {
  readonly key: string
  readonly width: number
  readonly height: number
  readonly game: ShelfGame
}

const gameItems = (games: readonly ShelfGame[], album: boolean): GameItem[] =>
  games.map((g, i) => ({ key: `${i}:${g.name}`, width: CARD.w, height: album ? CARD.w : CARD.h, game: g }))

const renderGame = (item: GameItem, size: { width: number; height: number }) => (
  <GeneratedCard title={item.game.title} rgb={item.game.owner.accent} width={size.width} height={size.height} album={item.game.owner.tag === 'MUSE'} />
)

interface SystemItem {
  readonly key: string
  readonly width: number
  readonly height: number
  readonly contentBottom: number
  readonly src: string
  readonly name: string
}

const renderSystem = (item: SystemItem, size: { width: number; height: number }) => (
  <img src={item.src} alt={item.name} width={size.width} height={size.height} style={{ position: 'absolute', left: 0, top: 0, display: 'block' }} draggable={false} />
)

/* ---- the systems row ------------------------------------------------------ */

function Systems({ state, motion }: { state: State; motion: ShelfMotion }) {
  const systems = systemsOf(state)
  const set = CARD_SETS.find((c) => c.id === state.cards)!
  const vertical = state.dir === 'vertical'
  const lay: CfLayout = { ...(vertical ? CF.systemsV : CF.systems), reflectGap: set.reflectGap }
  const focused = systems[state.sys]!
  const items: SystemItem[] = systems.map((s) => {
    const art = cardArt(state.cards, s.card)
    return { key: s.tag, ...art, name: s.name }
  })

  // The words below the card follow the name's own clock when stood on end, so a move never shows
  // one system's name over another's count.
  const label = vertical ? systems[wrap(motion.label.at, systems.length)]! : focused
  const alpha = vertical ? motion.label.alpha : 1
  const count =
    label.tag === 'MUSE'
      ? `${gamesOf(state, label).length} album${gamesOf(state, label).length === 1 ? '' : 's'}`
      : gamesOf(state, label).length
        ? `${gamesOf(state, label).length} game${gamesOf(state, label).length === 1 ? '' : 's'}`
        : `no games in Roms/${label.folder}`

  return (
    <>
      <Glow box={focusRect(lay)} rgb={focused.accent} alpha={GLOW.system.alpha} spread={GLOW.system.spread} />
      <Coverflow
        box={SCREEN_BOX}
        layout={lay}
        items={items}
        position={motion.sysPos}
        halfWindow={CF_HALF_WINDOW}
        wideArt={CF_WIDE_ART}
        lastDir={motion.lastDir('sys')}
        renderArt={renderSystem}
      />
      {!set.labeled && (
        <Text
          text={fitText(label.name, FONT.title, SCREEN.w - 48)}
          x={SCREEN.w / 2}
          y={SHELF_TEXT.systemNameY}
          size={FONT.title}
          color={UI.text}
          anchor={0}
          opacity={alpha}
        />
      )}
      <Text text={count} x={SCREEN.w / 2} y={SHELF_TEXT.countY} size={FONT.meta} color={UI.dim} anchor={0} opacity={alpha} />
      <Rail index={motion.sysPos} count={systems.length} rgb={focused.accent} hue={(i) => systems[i]?.accent ?? 0} vertical={vertical} />
    </>
  )
}

/* ---- what a shelf says about a game --------------------------------------- */

/**
 * `draw_game_text`: the title at y=40, centred, sliding when it does not fit a box that reserves
 * the heart's width on *both* sides so a short title stays centred; the heart in its fixed seat
 * at the far left; Muse's artist under the album; and the count where the rail is.
 */
function GameText({ state, sys, idx, phase, count }: { state: State; sys: System; idx: number; phase: number; count: boolean }) {
  const games = gamesOf(state, sys)
  const g = games[idx]
  if (!g) {
    return <Text text={fitText(sys.name, FONT.title, SCREEN.w - 48)} x={SCREEN.w / 2} y={SHELF_TEXT.titleY} size={FONT.title} color={UI.text} anchor={0} />
  }
  const line = FONT.title
  const margin = Math.trunc(line / 2)
  const hrad = Math.trunc((line * 2) / 5)
  const lead = margin + hrad * 2 + hrad
  const boxW = SCREEN.w - lead * 2
  const slides = textWidth(g.title, FONT.title) > boxW
  // Centred on the title's ink rather than its em box: half the descent lifts it.
  const heartY = SHELF_TEXT.titleY + Math.trunc(line / 2) - Math.trunc(descent(FONT.title) / 2)
  const vertical = state.dir === 'vertical'

  return (
    <>
      {isFavorite(state, g) && <Heart cx={margin + hrad} cy={heartY} r={hrad} rgb={g.owner.accent} />}
      {slides ? (
        <Marquee text={g.title} x={lead} y={SHELF_TEXT.titleY} w={boxW} size={FONT.title} color={UI.text} phase={phase} />
      ) : (
        <Text text={g.title} x={SCREEN.w / 2} y={SHELF_TEXT.titleY} size={FONT.title} color={UI.text} anchor={0} />
      )}
      {sys.tag === 'MUSE' && (
        <Text text={fitText(g.name, FONT.menu, boxW)} x={SCREEN.w / 2} y={SHELF_TEXT.titleY + line + 4} size={FONT.menu} color={UI.dim} anchor={0} />
      )}
      {count &&
        (vertical ? (
          <Text text={`${idx + 1} / ${games.length}`} x={SHELF_TEXT.cornerX} y={SHELF_TEXT.cornerY} size={FONT.meta} color={UI.dim} />
        ) : (
          <Text text={`${idx + 1} / ${games.length}`} x={SCREEN.w / 2} y={SHELF_TEXT.countY} size={FONT.meta} color={UI.dim} anchor={0} />
        ))}
    </>
  )
}

/* ---- the games row -------------------------------------------------------- */

function Games({ state, sys, motion }: { state: State; sys: System; motion: ShelfMotion }) {
  const games = gamesOf(state, sys)
  const albums = sys.tag === 'MUSE'
  const vertical = state.dir === 'vertical'
  const row = albums ? CF.albums : CF.games
  const lay = !vertical ? row : albums ? CF.albumsV : CF.gamesV
  const pos = motion.gamePos(sys.tag)

  return (
    <>
      <Glow box={focusRect(row)} rgb={sys.accent} alpha={GLOW.game.alpha} spread={GLOW.game.spread} />
      <Coverflow
        box={SCREEN_BOX}
        layout={lay}
        items={gameItems(games, albums)}
        position={pos}
        halfWindow={CF_HALF_WINDOW}
        wideArt={CF_WIDE_ART}
        lastDir={motion.lastDir(sys.tag)}
        renderArt={renderGame}
      />
      <GameText state={state} sys={sys} idx={cursorOf(state, sys)} phase={motion.titlePhase} count />
      <Rail index={pos} count={games.length} rgb={sys.accent} vertical={vertical} />
    </>
  )
}

/* ---- Cubic ---------------------------------------------------------------- */

/**
 * One game filling the screen, as a cube face draws it (`draw_games_face`). A face mid-turn is a
 * whole screen and carries its own fill; at rest it is the screen, and the root's fill is its own.
 */
function Face({ state, sys, idx, tint, phase, turning = false }: { state: State; sys: System; idx: number; tint: number; phase: number; turning?: boolean }) {
  const games = gamesOf(state, sys)
  const albums = sys.tag === 'MUSE'
  const lay = albums ? CF.albumFace : CF.gameFace
  return (
    <div style={{ position: 'absolute', inset: 0, ...(turning ? { background: UI.bg } : {}) }}>
      <Background tint={tint} />
      <Glow box={focusRect(lay)} rgb={sys.accent} alpha={GLOW.game.alpha} spread={GLOW.game.spread} />
      {games.length > 0 && (
        <Coverflow box={SCREEN_BOX} layout={lay} items={gameItems(games, albums)} position={idx} halfWindow={CF_HALF_WINDOW} wideArt={CF_WIDE_ART} renderArt={renderGame} />
      )}
      <GameText state={state} sys={sys} idx={idx} phase={phase} count={false} />
    </div>
  )
}

/**
 * `cf_draw_cube`: two faces a quarter turn apart on an axis half a screen behind the glass, seen
 * from 0.85 screens away, the whole of it backing off by up to 18% mid-turn and each face lit by
 * how squarely it faces you. At rest it is one face, drawn flat.
 *
 * A face's transform is `translateZ(-R) rotate(phi) translateZ(R)` under a perspective of F, which
 * is the source's projection exactly: a point `a` along the face lands at `a cos phi + R sin phi`
 * at depth `F + R + a sin phi - R cos phi`. A pitch turns about x by `-phi`, because screen y runs
 * down where the source's y runs up.
 */
function Cube({
  frac,
  yaw,
  near,
  far,
}: {
  frac: number
  yaw: boolean
  near: React.ReactNode
  far: React.ReactNode
}) {
  const web = useWebEffects()
  const q = Math.PI / 2
  const phi = (yaw ? frac : -frac) * q
  const farPhi = yaw ? phi - q : phi + q
  const span = yaw ? SCREEN.w : SCREEN.h
  const R = span / 2
  const F = span * 0.85
  const k = 1 - 0.18 * Math.sin(frac * Math.PI)

  // Without a perspective transform the turn is a cut at its midpoint.
  if (!web) return <>{frac < 0.5 ? near : far}</>

  const face = (p: number, content: React.ReactNode, key: string) => {
    if (Math.cos(p) <= 0) return null
    const lit = Math.max(0, 0.45 + 0.55 * Math.cos(p))
    const rot = yaw ? `rotateY(${p}rad)` : `rotateX(${-p}rad)`
    return (
      <div key={key} style={{ position: 'absolute', inset: 0, transform: `translateZ(${-R}px) ${rot} translateZ(${R}px)` }}>
        {content}
        <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${+(1 - lit).toFixed(4)})` }} />
      </div>
    )
  }
  const nearer = 1 - Math.cos(phi) >= 1 - Math.cos(farPhi)
  const faces = nearer ? [face(phi, near, 'near'), face(farPhi, far, 'far')] : [face(farPhi, far, 'far'), face(phi, near, 'near')]

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${k})` }}>
        <div style={{ position: 'absolute', inset: 0, perspective: `${F}px` }}>{faces}</div>
      </div>
    </div>
  )
}

/** Cubic: one surface, two axes. Up and down turn to another system, left and right to a game. */
function Cubic({ state, motion, tint }: { state: State; motion: ShelfMotion; tint: number }) {
  const systems = systemsOf(state)
  const muse = shelfSystem(state)!
  const museLayer = muse.tag === 'MUSE' && state.stack.includes('muse')
  const ns = systems.length
  const sys = museLayer ? muse : systems[state.sys]!
  const games = gamesOf(state, sys)
  const ng = games.length
  const sysPos = museLayer ? state.sys : motion.sysPos
  const s0 = ((Math.floor(sysPos) % ns) + ns) % ns
  const sfrac = sysPos - Math.floor(sysPos)
  const face = (s: System, idx: number, turning = true) => <Face state={state} sys={s} idx={idx} tint={tint} phase={motion.titlePhase} turning={turning} />

  let body: React.ReactNode
  if (!museLayer && ns > 1 && sfrac > 1e-4) {
    const s1 = (s0 + 1) % ns
    const a = systems[s0]!
    const b = systems[s1]!
    body = <Cube frac={sfrac} yaw={false} near={face(a, cursorOf(state, a))} far={face(b, cursorOf(state, b))} />
  } else if (ng > 1) {
    const gpos = motion.gamePos(sys.tag)
    const g0 = ((Math.floor(gpos) % ng) + ng) % ng
    const gfrac = gpos - Math.floor(gpos)
    body = gfrac > 1e-4 ? <Cube frac={gfrac} yaw near={face(sys, g0)} far={face(sys, (g0 + 1) % ng)} /> : face(sys, g0, false)
  } else {
    body = face(sys, 0, false)
  }

  const idx = cursorOf(state, sys)
  const cnt = `${ng > 0 ? idx + 1 : 0} / ${ng}`
  const room = SCREEN.w - 24 - (24 + textWidth(cnt, FONT.meta) + SHELF_TEXT.cornerGap)

  return (
    <>
      {body}
      <Rail index={sysPos} count={ns} rgb={sys.accent} hue={(i) => systems[i]?.accent ?? 0} vertical />
      {ng > 1 && <Rail index={motion.gamePos(sys.tag)} count={ng} rgb={sys.accent} />}
      <Text text={cnt} x={SHELF_TEXT.cornerX} y={SHELF_TEXT.cornerY} size={FONT.meta} color={UI.dim} />
      <Text text={fitText(sys.name, FONT.meta, room)} x={SCREEN.w - 24} y={SHELF_TEXT.cornerY} size={FONT.meta} color={UI.dim} anchor={1} />
    </>
  )
}

/* ---- nothing on the card -------------------------------------------------- */

/** `draw_no_games`: said plainly, with where the games go, because a blank shelf reads as broken. */
function NoGames() {
  const cy = SCREEN.h / 2
  return (
    <>
      <Text text="No games found" x={SCREEN.w / 2} y={cy - 60} size={FONT.title} color={UI.soft} anchor={0} />
      <Text text="Put ROMs in Roms/<System>/ on the card" x={SCREEN.w / 2} y={cy + 6} size={FONT.menu} color={UI.dim} anchor={0} />
      <Text text="one folder per system, named as in systems.cfg" x={SCREEN.w / 2} y={cy + 56} size={FONT.meta} color={UI.dim} anchor={0} />
    </>
  )
}

/** `draw_shelf`: whichever shelf is up, over the background. */
export function Shelf({ state, motion, tint }: { state: State; motion: ShelfMotion; tint: number }) {
  const sys = shelfSystem(state)
  return (
    <div style={{ position: 'absolute', inset: 0 }} data-part="shelf">
      <Background tint={tint} />
      {!sys ? (
        <NoGames />
      ) : state.dir === 'cubic' ? (
        <Cubic state={state} motion={motion} tint={tint} />
      ) : shelfScreen(state) === 'systems' ? (
        <Systems state={state} motion={motion} />
      ) : (
        <Games state={state} sys={sys} motion={motion} />
      )}
    </div>
  )
}

