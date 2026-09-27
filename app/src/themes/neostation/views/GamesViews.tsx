/**
 * PORTING NOTES
 * CFW: NeoStation            Devices: odin2-mini, rg40xx
 * Source: lib/screens/game_screen/my_games_grid.dart, my_games_carousel.dart,
 *         lib/widgets/native_carousel.dart, game_view_footer.dart, lib/utils/letter_bar.dart,
 *         lib/screens/game_screen/android_apps/android_apps_grid.dart, android_app_card.dart,
 *         lib/widgets/android_apps_footer.dart
 * Mode: reproduce
 *
 * Layout:        the grid and carousel sit on the plain scaffold, above `GameViewFooter` - the
 *                game's name, then its pills and a 32.r PLAY. The grid is 7/6/5/4 columns by card
 *                size, 16px in from each side and 6.r apart; fanart cards are square, box cards take
 *                the art's shape. The carousel is square pages 60.r in from either side over a 30.r
 *                letter bar. The Android apps grid is six square cells a row on both devices, a
 *                40.r icon in each.
 * Focus & selection: the grid draws a 4.r `secondary` border inside the selected cell, jumping
 *                with it, and keeps the selected row centred (500ms easeOutQuart). The carousel shows
 *                focus by depth alone: neighbours at 0.84 scale and 0.2 opacity, the rest at their
 *                floors. The apps grid's `secondary` box slides 300ms easeOutQuart.
 * Buttons:       grid - rows wrap to the same column, left/right wrap within the row. Carousel -
 *                left/right, wrapping. Both - A plays, B back, X view dropdown, Y menu, Start
 *                settings. Apps - the D-pad stops at the ends; B back.
 * Transitions:   a carousel step is 260ms easeOutQuart; the letter bar's highlight 120ms easeInOut.
 * Notes:         a carousel wrap is a jump in the source and slides here across the list. The footer's
 *                cloud-sync mark is not drawn. Launching an Android app leaves NeoStation for the app;
 *                the mockup has nowhere to go and stays on the grid.
 */
import { gamepad } from '../assets'
import { boxart, fanart } from '../art'
import { ANDROID_APPS } from '../games'
import { COLUMNS, isFavorite, playedOf, type Game } from '../library'
import { cheevoCount, routeGames, type AppsRoute, type GamesRoute, type State } from '../machine'
import { alpha, lerpColor } from '../palette'
import { textWidth } from '../text'
import { hashString } from '../../../widgets/GeneratedArt'
import {
  GamepadControl,
  LINE,
  Sym,
  Tinted,
  Txt,
  abs,
  controlHeight,
  controlWidth,
  motion,
  shadow,
  useNeo,
  type Box,
} from './parts'

/* ---- the footer shared by the grid and carousel ------------------------------------------ */

export function footerHeight(u: ReturnType<typeof useNeo>['u']): number {
  return u.r(8) * 2 + Math.max(u.r(32), u.t(18) * LINE + u.t(12) * LINE)
}

/** `GameViewFooter`: name and file on the left; rating, achievements, play time and PLAY on the right. */
function ViewFooter({ state, game }: { state: State; game: Game }) {
  const neo = useNeo()
  const { u, p } = neo
  const H = footerHeight(u)
  const top = u.H - H
  const pillH = u.r(32)
  const pillTop = top + (H - pillH) / 2
  const rating = game.scraped?.rating ? Math.round(Math.min(10, Math.max(0, game.scraped.rating / 2))) : 0
  const total = cheevoCount(game)
  const played = playedOf(state.lib, game)
  const pad = (n: number) => String(n).padStart(2, '0')
  const clock = `${pad(Math.floor(played / 3600))}:${pad(Math.floor((played % 3600) / 60))}:${pad(played % 60)}`
  const pill = {
    background: alpha(p.surface, 0.75),
    borderRadius: neo.radius.external,
    border: `${u.r(1)}px solid ${p.outline}`,
    boxShadow: shadow(neo, alpha(p.shadow, 0.1), u.r(4), u.r(2), u.r(2)),
    boxSizing: 'border-box' as const,
  }

  // Right to left: PLAY, play time, achievements, rating - each followed by 6.r.
  const playW = u.r(8) + u.r(20) + u.r(5) + textWidth('PLAY', u.t(11), 1.5 * u.dpr) + u.r(10) + u.r(2)
  const timeW = played ? u.r(8) * 2 + u.r(15) + u.r(4) + textWidth(clock, u.t(12)) + u.r(2) : 0
  const raW = total ? u.r(101) : 0
  const ratingW = rating ? u.r(8) * 2 + u.r(15) + u.r(4) + textWidth('10', u.t(13)) + u.r(2) : 0
  const right = u.W - u.r(12)
  const playLeft = right - playW
  const timeLeft = playLeft - (timeW ? u.r(6) + timeW : 0)
  const raLeft = timeLeft - (raW ? u.r(6) + raW : 0)
  const ratingLeft = raLeft - (ratingW ? u.r(6) + ratingW : 0)
  const textRoom = ratingLeft - u.r(12) - u.r(12)

  return (
    <div data-part="game-view-footer">
      <Txt
        size={u.t(18)}
        color={p.onSurface}
        weight={700}
        style={{ position: 'absolute', left: u.r(12), top: top + u.r(8), width: textRoom }}
      >
        {game.title}
      </Txt>
      {game.scraped && (
        <Txt
          size={u.t(12)}
          color={alpha(p.onSurface, 0.72)}
          style={{ position: 'absolute', left: u.r(12), top: top + u.r(8) + u.t(18) * LINE, width: textRoom }}
        >
          {game.file}
        </Txt>
      )}
      {rating > 0 && (
        <div
          style={{
            ...abs({ left: ratingLeft, top: pillTop, width: ratingW, height: pillH }),
            ...pill,
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${u.r(8)}px`,
            gap: u.r(4),
          }}
        >
          <Sym name="star_rounded" size={u.r(15)} color={lerpColor(p.error, p.success, (rating - 1) / 9)} />
          <Txt size={u.t(13)} color={p.onSurface} weight={900}>
            {String(rating)}
          </Txt>
        </div>
      )}
      {total > 0 && (
        <div style={{ ...abs({ left: raLeft, top: pillTop, width: raW, height: pillH }), ...pill }}>
          <div
            style={{
              ...abs({ left: u.r(8), top: (pillH - u.r(22)) / 2 - u.r(1), width: u.r(22), height: u.r(22) }),
              borderRadius: neo.radius.internal,
              overflow: 'hidden',
            }}
          >
            <img
              alt=""
              src={boxart(game)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <Txt
            size={u.t(8)}
            color={p.onSurface}
            weight={700}
            style={{ position: 'absolute', left: u.r(8) + u.r(22) + u.r(6), top: u.r(6), width: u.r(56) }}
          >
            {`0/${total}`}
          </Txt>
          <div
            style={{
              ...abs({
                left: u.r(8) + u.r(22) + u.r(6),
                top: u.r(6) + u.t(8) * LINE + u.r(3),
                width: u.r(46),
                height: u.r(3.5),
              }),
              borderRadius: u.r(2),
              background: alpha(p.onSurface, 0.1),
            }}
          />
        </div>
      )}
      {played > 0 && (
        <div
          style={{
            ...abs({ left: timeLeft, top: pillTop, width: timeW, height: pillH }),
            ...pill,
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${u.r(8)}px`,
            gap: u.r(4),
          }}
        >
          <Sym name="schedule_rounded" size={u.r(15)} color={p.onSurface} />
          <Txt size={u.t(12)} color={p.onSurface} weight={800}>
            {clock}
          </Txt>
        </div>
      )}
      <div
        style={{
          ...abs({ left: playLeft, top: pillTop, width: playW, height: pillH }),
          boxSizing: 'border-box',
          background: '#2ecc71',
          border: `${u.r(1)}px solid #36f184`,
          borderRadius: neo.radius.external,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: u.r(8),
          gap: u.r(5),
        }}
      >
        <div style={{ position: 'relative', width: u.r(20), height: u.r(20) }}>
          <Tinted
            src={gamepad('Xbox_A_button')}
            box={{ left: 0, top: 0, width: u.r(20), height: u.r(20) }}
            color={p.onPrimary}
          />
        </div>
        <Txt size={u.t(11)} color={p.onPrimary} weight={900} letterSpacing={1.5 * u.dpr}>
          PLAY
        </Txt>
      </div>
    </div>
  )
}

/** A fanart card's wheel: the game's title, as the stand-in for its logo art. */
function Wheel({ game, box, size }: { game: Game; box: Box; size: number }) {
  return (
    <div
      style={{
        ...abs(box),
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: "'NeoStation Anta'",
        fontWeight: 900,
        fontSynthesis: 'weight',
        fontSize: size,
        lineHeight: 1.05,
        color: '#ffffff',
      }}
    >
      {game.title}
    </div>
  )
}

function FavDot({ right, top, d, heart }: { right: number; top: number; d: number; heart: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        right,
        top,
        width: d,
        height: d,
        borderRadius: d / 2,
        background: 'rgba(0,0,0,0.45)',
      }}
    >
      <div style={{ position: 'absolute', left: (d - heart) / 2, top: (d - heart) / 2 }}>
        <Sym name="favorite_rounded" size={heart} color="#ff5252" />
      </div>
    </div>
  )
}

/* ---- the grid ------------------------------------------------------------------------------ */

export function GamesGrid({ state, route }: { state: State; route: GamesRoute }) {
  const neo = useNeo()
  const { u, p } = neo
  const games = routeGames(state, route)
  const game = games[route.sel]
  const cols = COLUMNS[state.gameSize]
  const sp = u.r(6)
  const colW = (u.W - u.px(32) - (cols - 1) * sp) / cols
  const box = state.gameStyle === 'box'
  const cardH = box ? (colW * 4) / 3 : colW
  const rows = Math.ceil(games.length / cols)
  const viewport = u.H - footerHeight(u)
  const content = u.px(12) + rows * (cardH + sp) - sp + u.px(80)
  const row = Math.floor(route.sel / cols)
  const offset = Math.min(
    Math.max(0, content - viewport),
    Math.max(0, u.px(12) + row * (cardH + sp) + cardH / 2 - viewport / 2),
  )

  return (
    <>
      <div
        data-part="games-grid"
        style={{ position: 'absolute', left: 0, top: 0, width: u.W, height: viewport, overflow: 'hidden' }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: u.W,
            transform: `translateY(${-offset}px)`,
            transition: motion(neo, [{ property: 'transform', duration: 500, easing: 'easeOutQuart' }]),
          }}
        >
          {games.map((g, i) => {
            const left = u.px(16) + (i % cols) * (colW + sp)
            const top = u.px(12) + Math.floor(i / cols) * (cardH + sp)
            const r = u.r(12)
            return (
              <div
                key={g.id}
                style={{
                  ...abs({ left, top, width: colW, height: cardH }),
                  borderRadius: r,
                  overflow: 'hidden',
                  boxShadow: shadow(neo, 'rgba(0,0,0,0.25)', u.r(2), u.r(2), u.r(2)),
                }}
              >
                <img
                  alt=""
                  src={box ? boxart(g) : fanart(g)}
                  style={{ width: '100%', height: '100%', objectFit: box ? 'contain' : 'cover', display: 'block' }}
                />
                {!box && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.85) 100%)',
                      }}
                    />
                    <Wheel
                      game={g}
                      box={{
                        left: u.r(10) + u.r(6),
                        top: colW * 0.4,
                        width: colW - u.r(32),
                        height: colW * 0.6 - u.r(5) - u.r(4),
                      }}
                      size={Math.max(u.r(8), colW / 9)}
                    />
                  </>
                )}
                {isFavorite(state.lib, g) && <FavDot right={u.r(6)} top={u.r(6)} d={u.r(22)} heart={u.r(12)} />}
                {i === route.sel && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      border: `${u.r(4)}px solid ${p.secondary}`,
                      borderRadius: r,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
      {game && <ViewFooter state={state} game={game} />}
    </>
  )
}

/* ---- the carousel ---------------------------------------------------------------------------- */

/** `letter_bar.dart:39-66`: a star for the leading run of favourites, then each first letter. */
function letterGroups(state: State, games: readonly Game[]): { label: string; first: number }[] {
  const out: { label: string; first: number }[] = []
  games.forEach((g, i) => {
    const label =
      isFavorite(state.lib, g) && out.every((x) => x.label === '★') ? '★' : (g.title[0] ?? '#').toUpperCase()
    if (out.at(-1)?.label !== label) out.push({ label, first: i })
  })
  return out
}

export function GamesCarousel({ state, route }: { state: State; route: GamesRoute }) {
  const neo = useNeo()
  const { u, p } = neo
  const games = routeGames(state, route)
  const game = games[route.sel]
  const footH = footerHeight(u)
  const barH = u.r(30)
  const height = u.H - footH - barH
  const page = height
  const turn = motion(neo, [
    { property: 'transform', duration: 260, easing: 'easeOutQuart' },
    { property: 'opacity', duration: 260, easing: 'easeOutQuart' },
  ])
  const n = games.length
  const groups = letterGroups(state, games)
  const current = groups.reduce((at, gr, i) => (gr.first <= route.sel ? i : at), 0)
  const chipW = groups.map((gr) => textWidth(gr.label, u.t(11)) + u.r(20))
  const chipLeft = groups.map((_, i) => u.r(4) + chipW.slice(0, i).reduce((s, w) => s + w + u.r(6), 0))
  const barContent = chipLeft.at(-1)! + chipW.at(-1)! + u.r(4)
  const barScroll = Math.min(
    Math.max(0, barContent - u.W),
    Math.max(0, chipLeft[current]! + chipW[current]! / 2 - u.W / 2),
  )

  return (
    <>
      <div
        data-part="games-carousel"
        style={{ position: 'absolute', left: u.r(60), top: 0, width: u.W - u.r(120), height }}
      >
        {games
          .map((g, i) => {
            // Nearest way round the ring, since the carousel wraps.
            let d = i - route.sel
            if (d > n / 2) d -= n
            if (d < -n / 2) d += n
            return { g, d }
          })
          .filter(({ d }) => Math.abs(d) <= 3)
          // Depth is draw order: far cards first, the centred one last, so it wins.
          .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
          .map(({ g, d }) => {
            const dist = Math.abs(d) - 0.6
            const scale = Math.min(1, Math.max(0.25, 1 - dist * 0.4))
            const opacity = Math.min(1, Math.max(0.1, 0.6 - dist))
            const left = (u.W - u.r(120)) / 2 - page / 2 + d * page
            return (
              <div
                key={g.id}
                style={{
                  ...abs({ left: 0, top: 0, width: page, height: page }),
                  transform: `translateX(${left}px) scale(${scale})`,
                  opacity,
                  transition: turn,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: u.r(5),
                    borderRadius: u.r(24),
                    overflow: 'hidden',
                    boxShadow: shadow(neo, 'rgba(0,0,0,0.5)', u.r(8), u.r(2), u.r(2)),
                  }}
                >
                  <img
                    alt=""
                    src={fanart(g)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.9) 100%)',
                    }}
                  />
                  <Wheel
                    game={g}
                    box={{
                      left: u.r(48),
                      top: page * 0.45,
                      width: page - u.r(10) - u.r(96),
                      height: page * 0.55 - u.r(5) - u.r(8) - u.r(4),
                    }}
                    size={u.r(26)}
                  />
                  {isFavorite(state.lib, g) && <FavDot right={u.r(8)} top={u.r(8)} d={u.r(32)} heart={u.r(18)} />}
                </div>
              </div>
            )
          })}
      </div>
      <div
        data-part="letter-bar"
        style={{ ...abs({ left: 0, top: height, width: u.W, height: barH }), overflow: 'hidden' }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: barH,
            width: barContent,
            transform: `translateX(${-barScroll}px)`,
            transition: motion(neo, [{ property: 'transform', duration: 200, easing: 'flutterEaseOutCubic' }]),
          }}
        >
          <div
            style={{
              ...abs({ left: 0, top: 0, width: chipW[current]!, height: barH }),
              transform: `translateX(${chipLeft[current]}px)`,
              background: p.secondary,
              borderRadius: u.r(12),
              transition: motion(neo, [
                { property: 'transform', duration: 120, easing: 'easeInOut' },
                { property: 'width', duration: 120, easing: 'easeInOut' },
              ]),
            }}
          />
          {groups.map((gr, i) => (
            <div
              key={gr.label}
              style={{
                ...abs({ left: chipLeft[i]!, top: 0, width: chipW[i]!, height: barH }),
                background: alpha(p.primary, 0.1),
                borderRadius: u.r(12),
              }}
            >
              <Txt
                size={u.t(11)}
                color={i === current ? p.onPrimary : p.onSurface}
                weight={i === current ? 800 : 400}
                style={{
                  position: 'absolute',
                  left: 0,
                  width: chipW[i]!,
                  top: (barH - u.t(11) * LINE) / 2,
                  textAlign: 'center',
                }}
              >
                {gr.label}
              </Txt>
            </div>
          ))}
        </div>
      </div>
      {game && <ViewFooter state={state} game={game} />}
    </>
  )
}

/* ---- the Android apps grid ---------------------------------------------------------------------- */

export function AppsGrid({ route }: { route: AppsRoute }) {
  const neo = useNeo()
  const { u, p } = neo
  const cols = 6
  const headTop = u.r(12)
  const headH = Math.max(u.r(16), u.t(12) * LINE)
  const gridTop = headTop + headH + u.r(4) + u.r(8)
  const sp = u.r(8)
  const cell = (u.W - sp * (cols - 1) - u.r(12)) / cols
  const at = (i: number) => ({
    left: u.r(6) + (i % cols) * (cell + sp),
    top: gridTop + Math.floor(i / cols) * (cell + sp),
  })
  const sel = at(route.sel)
  const name = ANDROID_APPS[route.sel] ?? ''
  const H = u.r(42)
  const ch = controlHeight(neo)
  const launchW = controlWidth(neo, 'Launch')
  const backW = controlWidth(neo, 'Back')
  return (
    <div data-part="apps-grid">
      <div
        style={{
          position: 'absolute',
          left: u.r(16),
          top: headTop,
          height: headH,
          display: 'flex',
          alignItems: 'center',
          gap: u.r(8),
        }}
      >
        <div style={{ opacity: 0.8 }}>
          <Sym name="grid_view_rounded" size={u.r(16)} color={alpha(p.onSurface, 0.6)} />
        </div>
        <Txt size={u.t(12)} color={alpha(p.onSurface, 0.8)} weight={900} letterSpacing={2 * u.dpr}>
          ANDROID APPS
        </Txt>
      </div>
      <Txt
        size={u.t(9)}
        color={alpha(p.onSurface, 0.4)}
        weight={800}
        letterSpacing={1 * u.dpr}
        style={{ position: 'absolute', right: u.r(16), top: headTop + (headH - u.t(9) * LINE) / 2 }}
      >
        {`${ANDROID_APPS.length} ITEMS`}
      </Txt>
      {ANDROID_APPS.map((app, i) => {
        const c = at(i)
        const hue = hashString(app) % 360
        return (
          <div key={app} style={{ ...abs({ left: c.left, top: c.top, width: cell, height: cell }) }}>
            {i === route.sel && (
              <div
                style={{
                  position: 'absolute',
                  left: (cell - u.r(50)) / 2,
                  top: (cell - u.r(50)) / 2,
                  width: u.r(50),
                  height: u.r(50),
                  borderRadius: u.r(25),
                  boxShadow: `0 0 ${2 * (0.57735 * u.r(15) + u.px(0.5))}px ${u.r(2)}px ${alpha(p.secondary, 0.3)}`,
                }}
              />
            )}
            <div
              style={{
                ...abs({ left: (cell - u.r(40)) / 2, top: (cell - u.r(40)) / 2, width: u.r(40), height: u.r(40) }),
                borderRadius: u.r(10),
                background: `hsl(${hue} 55% 45%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'NeoStation Anta'",
                fontWeight: 700,
                fontSize: u.r(18),
                color: '#ffffff',
              }}
            >
              {app[0]}
            </div>
          </div>
        )
      })}
      <div
        style={{
          ...abs({ left: 0, top: 0, width: cell + u.r(2), height: cell + u.r(2) }),
          transform: `translate(${sel.left - u.r(1)}px, ${sel.top - u.r(1)}px)`,
          boxSizing: 'border-box',
          border: `${u.r(4)}px solid ${p.secondary}`,
          borderRadius: u.r(16),
          transition: motion(neo, [{ property: 'transform', duration: 300, easing: 'easeOutQuart' }]),
        }}
      />
      <div style={{ position: 'absolute', left: 0, top: u.H - H, width: u.W, height: H }}>
        <Txt
          size={u.t(14)}
          color={p.onSurface}
          weight={700}
          letterSpacing={u.r(1.2)}
          style={{ position: 'absolute', left: u.r(12), top: (H - u.t(14) * LINE) / 2 }}
        >
          {name.toUpperCase()}
        </Txt>
        <GamepadControl
          glyph="Xbox_B_button"
          label="Back"
          bg={p.tertiary}
          fg={p.onTertiary}
          left={u.W - u.r(12) - launchW - u.r(8) - backW}
          top={(H - ch) / 2}
        />
        <GamepadControl
          glyph="Xbox_A_button"
          label="Launch"
          bg="#2ecc71"
          fg="#ffffff"
          left={u.W - u.r(12) - launchW}
          top={(H - ch) / 2}
        />
      </div>
    </div>
  )
}
