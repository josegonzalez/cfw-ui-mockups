/**
 * PORTING NOTES
 * CFW: NeoStation            Devices: odin2-mini, rg40xx
 * Source: lib/screens/systems_screen/my_systems_section/my_systems_carousel.dart,
 *         lib/widgets/native_carousel.dart, system_card.dart
 * Mode: reproduce
 *
 * Layout:        the carousel sits 42.r below the top, over a 40.r chip bar and the 42.r footer.
 *                Each page is the carousel's height less 60.r wide - square art over a 60.r logo
 *                strip - and pages sit edge to edge with the first one centred. Each card is the
 *                same `SystemCard` the grid draws.
 * Focus & selection: depth only. A card `d` pages out is scaled by `1 - (d - 0.6) * 0.4` down to
 *                0.7, faded to `0.75 - (d - 0.6) * 0.55` down to 0.3, and from two pages out pulled
 *                0.15 of a page back toward the centre. The chip bar's `primary` cursor sits under
 *                the focused chip, which is bold in `onPrimary`; the bar scrolls to keep it in view.
 * Buttons:       left/right move one page and stop at the ends; up/down do nothing. A, X, Y, Start,
 *                LB/RB as the grid.
 * Transitions:   a page turn is 260ms easeOutQuart; the cursor tracks it. The bar's own scroll is
 *                200ms easeOutCubic on a jump.
 * Notes:         the carousel sets a background image through a provider nothing on this tab draws,
 *                from an asset directory the repo does not have, so there is no backdrop here either.
 */
import { entries, type State } from '../machine'
import type { Entry } from '../library'
import { textWidth } from '../text'
import { Card } from './SystemsGrid'
import { LINE, Txt, abs, motion, useNeo, type Neo } from './parts'

/** The carousel's geometry, device px. */
export function carouselGeometry(neo: Neo, plain = false) {
  const { u } = neo
  const top = u.r(42)
  const height = u.H - top - u.r(42) - u.r(40)
  // The page leaves 60.r for the logo strip, and none with Hide system logos on (`:1008`).
  const page = height - (plain ? 0 : u.r(60))
  return { top, height, page, bar: top + height }
}

/** `NativeCarousel`'s depth envelope for the systems carousel (`native_carousel.dart:430-458`). */
export function depth(d: number, page: number) {
  const dist = Math.abs(d) - 0.6
  const scale = Math.min(1, Math.max(0.7, 1 - dist * 0.4))
  const opacity = Math.min(1, Math.max(0.3, 0.75 - dist * 0.55))
  const pull = Math.min(1, Math.max(0, dist - 0.4)) * 0.15 * page * -Math.sign(d)
  return { scale, opacity, pull }
}

const chipLabel = (e: Entry) => (e.kind === 'recent' ? e.game.title : e.def.short).toUpperCase()

export function SystemsCarousel({ state }: { state: State }) {
  const neo = useNeo()
  const { u } = neo
  const list = entries(state)
  const g = carouselGeometry(neo, state.settings.hideLogos)
  const turn = [{ property: 'transform' as const, duration: 260, easing: 'easeOutQuart' as const }]

  return (
    <>
      <div
        data-part="systems-carousel"
        style={{ position: 'absolute', left: 0, top: g.top, width: u.W, height: g.height }}
      >
        {list.map((e, i) => {
          const d = i - state.sel
          // Far pages are neither visible nor reachable in one turn; the source builds them lazily.
          if (Math.abs(d) > 4) return null
          const { scale, opacity, pull } = depth(d, g.page)
          const left = u.W / 2 - g.page / 2 + d * g.page
          return (
            <div
              key={i}
              style={{
                ...abs({ left: 0, top: 0, width: g.page, height: g.height }),
                transform: `translateX(${left + pull}px) scale(${scale})`,
                opacity,
                transition: motion(neo, [...turn, { property: 'opacity', duration: 260, easing: 'easeOutQuart' }]),
              }}
            >
              <Card entry={e} box={{ left: 0, top: 0, width: g.page, height: g.height }} plain={state.settings.hideLogos} />
            </div>
          )
        })}
      </div>
      <ChipBar state={state} list={list} top={g.bar} />
    </>
  )
}

function ChipBar({ state, list, top }: { state: State; list: readonly Entry[]; top: number }) {
  const neo = useNeo()
  const { u, p } = neo
  const size = u.t(10)
  const h = u.r(28)
  const widths = list.map((e) => textWidth(chipLabel(e), size) + u.r(24))
  const offsets = widths.map((_, i) => widths.slice(0, i).reduce((n, w) => n + w + u.r(4), 0))
  const content = offsets.at(-1)! + widths.at(-1)! + u.r(4) + u.r(4) * 2
  const max = Math.max(0, content - u.W)
  const scroll = Math.min(max, Math.max(0, offsets[state.sel]! - u.W / 2 + widths[state.sel]! / 2 + u.r(10)))
  const cursor = motion(neo, [
    { property: 'transform', duration: 260, easing: 'easeOutQuart' },
    { property: 'width', duration: 260, easing: 'easeOutQuart' },
  ])

  return (
    <div data-part="chip-bar" style={{ ...abs({ left: 0, top, width: u.W, height: u.r(40) }), overflow: 'hidden' }}>
      <div
        style={{
          ...abs({ left: 0, top: u.r(6), width: content, height: h }),
          transform: `translateX(${u.r(4) - scroll}px)`,
          transition: motion(neo, [{ property: 'transform', duration: 200, easing: 'flutterEaseOutCubic' }]),
        }}
      >
        {list.map((_, i) => (
          <div
            key={`track${i}`}
            style={{
              ...abs({ left: offsets[i]!, top: 0, width: widths[i]!, height: h }),
              background: p.surface,
              borderRadius: neo.radius.external,
            }}
          />
        ))}
        <div
          data-part="chip-cursor"
          style={{
            ...abs({ left: 0, top: 0, width: widths[state.sel]!, height: h }),
            transform: `translateX(${offsets[state.sel]}px)`,
            background: p.primary,
            borderRadius: neo.radius.external,
            transition: cursor,
          }}
        />
        {list.map((e, i) => {
          const on = i === state.sel
          return (
            <Txt
              key={`label${i}`}
              size={size}
              color={on ? p.onPrimary : p.onSurface}
              weight={on ? 700 : 400}
              style={{
                position: 'absolute',
                left: offsets[i]!,
                width: widths[i]!,
                top: (h - size * LINE) / 2,
                textAlign: 'center',
              }}
            >
              {chipLabel(e)}
            </Txt>
          )
        })}
      </div>
    </div>
  )
}
