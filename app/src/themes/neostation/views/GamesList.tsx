/**
 * PORTING NOTES
 * CFW: NeoStation            Devices: odin2-mini, rg40xx
 * Source: lib/screens/game_screen/my_games_list.dart (`_buildGamesList`), game_list_view.dart,
 *         lib/utils/centered_scroll_controller.dart, lib/widgets/marquee_text.dart
 * Mode: reproduce
 *
 * Layout:        a system's games are a route over the whole app - no header. The selected game's
 *                fanart fills the screen under one flat `shadow` 0.2 scrim; over it, a 200.r glass
 *                sidebar 12.r in from the left, top and bottom, and the details card in the rest.
 *                The sidebar is the system's logo (38.r) over 26.r rows, favourites first.
 * Focus & selection: a `primary` bar under the selected row, whose title turns bold `onPrimary`.
 *                The list keeps the selection at its middle except near the ends; bar and rows
 *                move together on one 360ms easeOutQuart clock (180ms while a direction repeats),
 *                so mid-list the bar holds still and the list slides under it. Up/down wrap.
 * Buttons:       up/down move; left/right change the card's tab; A launches, or enters the info or
 *                achievements panel when it has something to drive; B leaves a panel, else goes
 *                back; X opens the view dropdown; Y the game's menu; Start its settings.
 * Transitions:   the fanart cross-fades in 512ms, the new one scaling 1.0 to 1.1 as it comes in -
 *                so it rests at 1.1, which is drawn here.
 * Notes:         the website frames show a rail of round action buttons left of the sidebar; the
 *                current source removed it and moved its actions to the card's footer and the Y menu.
 *                A title that overflows the selected row scrolls in the source; it rests at its start
 *                here. Holding up or down past 1200ms jumps by letter in the source; the harness's
 *                held keys only repeat, so the letter jump is not reached.
 */
import { logo } from '../assets'
import { fanart } from '../art'
import { isFavorite, systemDef, type Game } from '../library'
import { routeGames, type GamesRoute, type State } from '../machine'
import { alpha } from '../palette'
import { ellipsize } from '../text'
import { DetailsCard } from './DetailsCard'
import { LINE, NeoGlass, Sym, Tinted, Txt, abs, motion, shadow, useNeo, type Box, type Neo } from './parts'

/** The sidebar's geometry, device px. */
export function sidebarGeometry(neo: Neo, count: number, sel: number) {
  const { u } = neo
  const box: Box = { left: u.r(12), top: u.r(12), width: u.r(200), height: u.H - u.r(12) * 2 }
  const header = u.r(8) + u.r(38) + u.r(4) + u.r(4)
  const viewport = box.height - header - u.r(11)
  const row = u.r(26)
  const content = u.r(2) * 2 + count * row
  const max = Math.max(0, content - viewport)
  // `CenteredScrollController`: the row's centre at the viewport's middle, clamped to the list.
  const offset = Math.min(max, Math.max(0, u.r(2) + sel * row + row / 2 - viewport / 2))
  return { box, header, viewport, row, offset }
}

export function GamesList({ state, route }: { state: State; route: GamesRoute }) {
  const neo = useNeo()
  const { u, p } = neo
  const games = routeGames(state, route)
  const game = games[route.sel] ?? null
  const g = sidebarGeometry(neo, games.length, route.sel)
  const pace = state.repeat ? 180 : 360
  const clock = motion(neo, [{ property: 'transform', duration: pace, easing: 'easeOutQuart' }])
  // In All and Favorites the header is the selected game's own system (`game_list_view.dart:695-707`).
  const headerSystem =
    route.system === 'all' || route.system === 'favorites' ? (game?.system ?? route.system) : route.system
  const logoUrl = logo(headerSystem)

  return (
    <div data-part="games-list" style={{ position: 'absolute', inset: 0 }}>
      {game && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <img
            key={game.id}
            alt=""
            src={fanart(game)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scale(1.1)',
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: alpha(p.shadow, 0.2) }} />
        </div>
      )}

      <NeoGlass box={g.box} radius={neo.radius.external}>
        <div style={{ position: 'absolute', left: u.r(8), top: u.r(8), width: g.box.width - u.r(16), height: u.r(38) }}>
          {logoUrl ? (
            <Tinted
              src={logoUrl}
              box={{ left: 0, top: 0, width: g.box.width - u.r(16), height: u.r(38) }}
              color={p.onSurface}
            />
          ) : (
            <Txt
              size={u.t(16)}
              color={p.onSurface}
              weight={900}
              style={{ textAlign: 'center', lineHeight: `${u.r(38)}px`, height: u.r(38) }}
            >
              {systemDef(headerSystem).short.toUpperCase()}
            </Txt>
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: g.header,
            width: g.box.width,
            height: g.viewport,
            overflow: 'hidden',
          }}
        >
          <div
            data-part="list-highlight"
            style={{
              ...abs({ left: u.r(8), top: 0, width: g.box.width - u.r(16), height: g.row }),
              transform: `translateY(${u.r(2) + route.sel * g.row - g.offset}px)`,
              background: p.primary,
              borderRadius: neo.radius.internal,
              boxShadow: shadow(neo, alpha(p.shadow, 0.1), u.r(4), u.r(2), u.r(2)),
              transition: clock,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: g.box.width,
              transform: `translateY(${-g.offset}px)`,
              transition: clock,
            }}
          >
            {games.map((x, i) => (
              <Row
                key={x.id}
                game={x}
                fav={isFavorite(state.lib, x)}
                selected={i === route.sel}
                top={u.r(2) + i * g.row}
                width={g.box.width}
              />
            ))}
          </div>
        </div>
      </NeoGlass>

      {game && <DetailsCard state={state} route={route} game={game} />}
    </div>
  )
}

function Row({
  game,
  fav,
  selected,
  top,
  width,
}: {
  game: Game
  fav: boolean
  selected: boolean
  top: number
  width: number
}) {
  const neo = useNeo()
  const { u, p } = neo
  const size = u.t(11)
  const inner = width - u.r(8) * 2 - u.r(8) * 2
  const heart = fav ? u.r(11) + u.r(4) : 0
  const room = inner - heart
  // The selected row scrolls an overflowing title, and rests at its start; the others cut it short.
  const title = selected ? game.title : ellipsize(game.title, size, room)
  const fg = selected ? p.onPrimary : p.onSurface
  return (
    <div style={{ ...abs({ left: u.r(8), top, width: width - u.r(16), height: u.r(26) }) }}>
      {fav && (
        <div style={{ position: 'absolute', left: u.r(8), top: (u.r(26) - u.r(11)) / 2 }}>
          <Sym name="favorite_rounded" size={u.r(11)} color={selected ? p.onPrimary : '#ff5252'} />
        </div>
      )}
      <Txt
        size={size}
        color={fg}
        weight={selected ? 700 : 400}
        style={{
          position: 'absolute',
          left: u.r(8) + heart,
          top: (u.r(26) - size * LINE) / 2,
          width: room,
          textOverflow: 'clip',
        }}
      >
        {title}
      </Txt>
    </div>
  )
}
