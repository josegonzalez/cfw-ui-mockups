/**
 * PORTING NOTES
 * CFW: NeoStation            Devices: odin2-mini, rg40xx
 * Source: lib/screens/systems_screen/my_systems_section/my_systems_grid.dart, grid_geometry.dart,
 *         system_card.dart, my_systems_grid/gamepad_grid_nav.dart, lib/widgets/systems_grid_footer.dart,
 *         footer_label_pill.dart, core_footer.dart
 * Mode: reproduce
 *
 * Layout:        the grid is 46.r below the top and 6.r in from each side, above a 42.r footer. Card
 *                size S/M/L/XL is 7/6/5/4 columns at every width, 6.r apart, each card 1.25 times
 *                its width tall. The Recent card takes the top-left 3x2 block and the systems flow
 *                around it, first fit. The scroll view does not clip: cards run on under the footer
 *                and under the header, which has no fill, as `site-03.webp` shows.
 * Focus & selection: no card changes when focused. One box slides over the grid (256ms
 *                fastOutSlowIn): the card's slot inset 1.r, a 2.r `primary` 0.55 border, and a
 *                `primary` wash rising from the bottom third. The scroll centres the focused row,
 *                360ms easeOutQuart, 180ms while a direction repeats. Every direction wraps.
 * Buttons:       A enters the system (the Recent card launches its game); X opens the view
 *                dropdown; Y the card's context menu; Start the System Settings dialog; LB/RB change
 *                tab. B does nothing on a root tab.
 * Transitions:   the focus box and the scroll above.
 * Notes:         a card with no art pack is `surface` under the system's first colour at 0.4, with
 *                the system's logo tinted `onSurface` in the strip below. The website frames show
 *                NeoAssets art packs, which are downloaded and not reproduced. The Recent card's
 *                fanart and wheel are generated stand-ins; the source draws nothing for a missing
 *                wheel, and the stand-in is the game's title so the card still reads as a game.
 */
import { logo } from '../assets'
import { fanart } from '../art'
import { gridGeometry } from '../grid'
import { playTimeWords, type Entry, type Game } from '../library'
import { entries, type State } from '../machine'
import { alpha } from '../palette'
import { textWidth } from '../text'
import {
  GamepadControl,
  LINE,
  Tinted,
  Txt,
  abs,
  controlWidth,
  controlHeight,
  motion,
  shadow,
  useNeo,
  type Box,
} from './parts'

export function SystemsGrid({ state }: { state: State }) {
  const neo = useNeo()
  const { u, p } = neo
  const list = entries(state)
  const geo = gridGeometry(u, list, state.size, { compact: state.settings.recentCompact, square: state.settings.hideLogos })
  const offset = geo.offsetFor(state.sel)
  const sel = geo.cards.find((c) => c.index === state.sel) ?? geo.cards[0]!
  const inset = u.r(1)

  return (
    <div
      data-part="systems-grid"
      style={{
        position: 'absolute',
        left: geo.left,
        top: geo.top,
        width: geo.width,
        height: geo.viewport,
      }}
    >
      <div
        data-part="grid-scroll"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: geo.width,
          height: geo.total,
          transform: `translateY(${-offset}px)`,
          transition: motion(neo, [
            {
              property: 'transform',
              duration: state.repeat ? 180 : 360,
              easing: 'easeOutQuart',
            },
          ]),
        }}
      >
        {geo.cards.map((c) => (
          <Card key={c.index} entry={list[c.index]!} box={c} plain={state.settings.hideLogos} />
        ))}
        <div
          data-part="focus-box"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: sel.width - inset * 2,
            height: sel.height - inset * 2,
            transform: `translate(${sel.left + inset}px, ${sel.top + inset}px)`,
            boxSizing: 'border-box',
            border: `${u.r(2)}px solid ${alpha(p.primary, 0.55)}`,
            borderRadius: neo.radius.external,
            background: `linear-gradient(to top, ${alpha(p.primary, 0.28)} 0%, ${alpha(p.primary, 0.08)} 35%, ${alpha(p.primary, 0)} 100%)`,
            transition: motion(neo, [
              { property: 'transform', duration: 256, easing: 'fastOutSlowIn' },
              { property: 'width', duration: 256, easing: 'fastOutSlowIn' },
              { property: 'height', duration: 256, easing: 'fastOutSlowIn' },
            ]),
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}

/** `SystemCard`: the slot inset 2.r, a `surface` card with a 1.r `outline` border and a soft shadow. */
export function Card({ entry, box, plain = false }: { entry: Entry; box: Box; plain?: boolean }) {
  const neo = useNeo()
  const { u, p } = neo
  const pad = u.r(2)
  const b = u.r(1)
  const inner = {
    width: box.width - pad * 2 - b * 2,
    height: box.height - pad * 2 - b * 2,
  }
  return (
    <div
      data-card={entry.kind === 'recent' ? 'recent' : entry.def.id}
      style={{
        ...abs({
          left: box.left + pad,
          top: box.top + pad,
          width: box.width - pad * 2,
          height: box.height - pad * 2,
        }),
        boxSizing: 'border-box',
        background: p.surface,
        border: `${b}px solid ${p.outline}`,
        borderRadius: neo.radius.external,
        boxShadow: shadow(neo, alpha(p.shadow, 0.1), u.r(4), u.r(2), u.r(2)),
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: neo.radius.internal,
          overflow: 'hidden',
        }}
      >
        {entry.kind === 'recent' ? (
          <RecentFace game={entry.game} size={inner} />
        ) : (
          <SystemFace entry={entry} size={inner} plain={plain} />
        )}
      </div>
    </div>
  )
}

/** A system card: square art over the logo strip, or with Hide system logos on, art alone (`system_card.dart:332-361`). */
function SystemFace({
  entry,
  size,
  plain,
}: {
  entry: Entry & { kind: 'system' }
  size: { width: number; height: number }
  plain: boolean
}) {
  const neo = useNeo()
  const { u, p } = neo
  const pad = u.r(4)
  const art = size.width - pad * 2
  const artH = plain ? size.height - pad : art
  const url = logo(entry.def.id)
  const strip: Box = {
    left: pad + u.r(2),
    top: pad + art + u.r(1),
    width: art - u.r(4),
    height: size.height - pad - art - u.r(2),
  }
  return (
    <>
      <div
        style={{
          ...abs({ left: pad, top: pad, width: art, height: artH }),
          borderRadius: neo.radius.internal,
          overflow: 'hidden',
          background: p.surface,
        }}
      >
        {entry.def.color1 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: alpha(entry.def.color1, 0.4),
            }}
          />
        )}
      </div>
      {plain ? null : url ? (
        <Tinted src={url} box={strip} color={p.onSurface} />
      ) : (
        <Txt
          size={Math.min(strip.height, u.r(42))}
          color={p.onSurface}
          weight={900}
          letterSpacing={1}
          style={{ ...abs(strip), textAlign: 'center' }}
        >
          {entry.def.short.toUpperCase()}
        </Txt>
      )}
    </>
  )
}

/** The Recent card (`system_card.dart:317-331, 601-688`): fanart, the RECENT badge, the wheel, play time. */
function RecentFace({ game, size }: { game: Game; size: { width: number; height: number } }) {
  const neo = useNeo()
  const { u, p } = neo
  const pad = u.r(4)
  const w = size.width - pad * 2
  const footer = u.r(32)
  const h = size.height - pad - footer
  const badge = 'RECENT'
  const badgeSize = u.t(8)
  const badgeW = textWidth(badge, badgeSize, u.r(1.2)) + u.r(8) * 2
  const badgeH = badgeSize * LINE + u.r(4) * 2
  const wheelInset = Math.min(u.r(48), Math.min(w, h) * 0.15)
  const time = `Time Played: ${playTimeWords(game.played ?? 0)}`.toUpperCase()
  const timeSize = u.t(10)
  return (
    <>
      <img
        alt=""
        src={fanart(game)}
        style={{
          ...abs({ left: pad, top: pad, width: w, height: h }),
          objectFit: 'cover',
        }}
      />
      <div
        style={{
          ...abs({
            left: pad + w - u.r(6) - badgeW,
            top: pad + u.r(6),
            width: badgeW,
            height: badgeH,
          }),
          background: p.secondary,
          borderRadius: neo.radius.internal,
        }}
      >
        <Txt
          size={badgeSize}
          color={p.onSecondary}
          weight={900}
          letterSpacing={u.r(1.2)}
          style={{ position: 'absolute', left: u.r(8), top: u.r(4) }}
        >
          {badge}
        </Txt>
      </div>
      <div
        style={{
          ...abs({
            left: pad + wheelInset,
            top: pad + wheelInset,
            width: w - wheelInset * 2,
            height: h - wheelInset * 2,
          }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: "'NeoStation Anta'",
            fontSize: Math.min(h - wheelInset * 2, u.r(64)) * 0.42,
            lineHeight: 1.05,
            fontWeight: 900,
            fontSynthesis: 'weight',
            color: '#ffffff',
            textAlign: 'center',
            textShadow: `${u.r(2)}px ${u.r(2)}px ${u.r(6)}px rgba(0,0,0,0.6)`,
          }}
        >
          {game.title}
        </span>
      </div>
      <Txt
        size={timeSize}
        color={p.onSurface}
        weight={800}
        letterSpacing={u.r(1)}
        style={{
          position: 'absolute',
          left: u.r(8),
          width: size.width - u.r(16),
          top: pad + h + (footer - timeSize * LINE) / 2,
          textAlign: 'center',
        }}
      >
        {time}
      </Txt>
    </>
  )
}

/**
 * `SystemsGridFooter` (`systems_grid_footer.dart`): the focused card's name and count on the left,
 * Options and Enter on the right, in a transparent 42.r strip.
 */
export function SystemsFooter({ state, onA, onY }: { state: State; onA: () => void; onY: () => void }) {
  const neo = useNeo()
  const { u, p } = neo
  const list = entries(state)
  const e = list[state.sel] ?? list[0]!
  const H = u.r(42)
  const top = u.H - H
  const padX = u.r(12)

  const label = e.kind === 'recent' ? `Last Played: ${e.game.title}` : e.def.name
  const count =
    e.kind === 'recent'
      ? null
      : `${e.roms} ${e.def.id === 'android' ? 'Apps' : e.def.id === 'music' ? 'Tracks' : 'Games'}`

  const enter = e.kind === 'recent' ? 'Play' : 'Enter'
  const ch = controlHeight(neo)
  const aW = controlWidth(neo, enter)
  const yW = controlWidth(neo, 'Options')
  const aLeft = u.W - padX - aW
  const yLeft = aLeft - u.r(8) - yW

  return (
    <div data-part="footer" style={{ position: 'absolute', left: 0, top, width: u.W, height: H }}>
      <LabelPill label={label} count={count} left={padX} mid={H / 2} maxWidth={yLeft - padX} />
      <GamepadControl
        glyph="Xbox_Y_button"
        label="Options"
        bg={p.tertiaryFixed}
        fg={p.onTertiaryFixed}
        left={yLeft}
        top={(H - ch) / 2}
        onTap={onY}
      />
      <GamepadControl
        glyph="Xbox_A_button"
        label={enter}
        bg={p.tertiary}
        fg={p.onTertiary}
        left={aLeft}
        top={(H - ch) / 2}
        onTap={onA}
      />
    </div>
  )
}

/** `FooterLabelPill` (`lib/widgets/footer_label_pill.dart`). */
export function LabelPill({
  label,
  count,
  left,
  mid,
  maxWidth,
}: {
  label: string
  count: string | null
  left: number
  mid: number
  maxWidth: number
}) {
  const neo = useNeo()
  const { u, p } = neo
  const labelSize = u.t(14)
  const chipSize = u.t(10)
  const chipW = count ? textWidth(count, chipSize, u.r(0.5)) + u.r(8) * 2 : 0
  const chipH = chipSize * LINE + u.r(2) * 2
  const innerH = Math.max(labelSize * LINE, count ? chipH : 0)
  const padR = count ? u.r(6) : u.r(12)
  const fixed = u.r(12) + padR + (count ? u.r(10) + chipW : 0)
  const labelW = Math.min(textWidth(label, labelSize), maxWidth - fixed)
  const w = fixed + labelW
  const h = innerH + u.r(4) * 2
  const sh = shadow(neo, alpha(p.shadow, 0.3), u.r(3), u.r(2), u.r(2))
  return (
    <div
      style={{
        ...abs({ left, top: mid - h / 2, width: w, height: h }),
        background: p.tertiaryFixed,
        borderRadius: neo.radius.external,
        boxShadow: sh,
      }}
    >
      <Txt
        size={labelSize}
        color={p.onTertiaryFixed}
        weight={700}
        style={{
          position: 'absolute',
          left: u.r(12),
          top: u.r(4) + (innerH - labelSize * LINE) / 2,
          width: labelW,
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </Txt>
      {count && (
        <div
          style={{
            ...abs({
              left: u.r(12) + labelW + u.r(10),
              top: u.r(4) + (innerH - chipH) / 2,
              width: chipW,
              height: chipH,
            }),
            background: p.surface,
            borderRadius: neo.radius.internal,
            boxShadow: sh,
          }}
        >
          <Txt
            size={chipSize}
            color={p.onSurface}
            weight={900}
            letterSpacing={u.r(0.5)}
            style={{ position: 'absolute', left: u.r(8), top: u.r(2) }}
          >
            {count}
          </Txt>
        </div>
      )}
    </div>
  )
}
