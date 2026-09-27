/**
 * PORTING NOTES
 * CFW: NeoStation            Devices: odin2-mini, rg40xx
 * Source: lib/screens/game_screen/game_details_card/game_details_card_list.dart,
 *         widgets/game_details_tabs_header.dart, widgets/game_details_footer.dart,
 *         widgets/scraping_progress_panel.dart, tabs/game_details_{general,box2d,screenshot_video,
 *         game_info,achievements}_tab.dart, lib/widgets/dpad_glyph.dart, monospaced_clock.dart
 * Mode: reproduce
 *
 * Layout:        the card fills what the sidebar leaves, inset by a Card's default 4px. Its tab
 *                strip hangs at the top right - D-pad glyphs either side of a glass pill of 36.r
 *                slots. Every panel but the wheel sits 12.r in, 55.r from the top and 96.r from the
 *                bottom; the wheel has its own 10/44/10/88. At the bottom, a 26.r line with the ROM
 *                file (scraped games) and the play clock, then a 40.r row: the rating, the
 *                achievements pill, round random / favourite / settings buttons, and PLAY.
 * Focus & selection: a `primary` cursor slides between tab slots in 160ms easeInOut. The info
 *                and achievements panels light a `secondary` edge when they have something to
 *                drive, and glow when A has entered them.
 * Buttons:       left/right change tab and wrap (the bumpers do nothing here). In the info panel
 *                up/down scroll 56.r a step; in achievements they move a row of six badges and
 *                left/right one badge, wrapping. B leaves a panel.
 * Transitions:   panels move as one strip, 240ms easeInOutCubic. The source slides only the two
 *                panels involved, so a wrap from the last tab to the first crosses the others here.
 * Notes:         the wheel, box art, screenshot and badges are generated stand-ins. The website's
 *                older build drew the game's title large over the fanart; the current source does not
 *                repeat it, and the ROM file name shares the play clock's line instead. Video is not
 *                reproduced: the media tab shows the screenshot, as the source does before its
 *                three-second delay. The RA hash is a stand-in derived from the file name.
 */
import { gamepad } from '../assets'
import { boxart, screenshot } from '../art'
import { isFavorite, playedOf, type Game } from '../library'
import { cheevoCount, detailTabs, infoDrivable, tabOf, type DetailTab, type GamesRoute, type State } from '../machine'
import { alpha, lerpColor } from '../palette'
import type { SymbolName } from '../symbols'
import { textWidth } from '../text'
import { hashString } from '../../../widgets/GeneratedArt'
import { LINE, NeoGlass, Sym, Tinted, Txt, abs, motion, shadow, useNeo, type Box, type Neo } from './parts'

const TAB_ICON: Readonly<Record<DetailTab, SymbolName>> = {
  wheel: 'branding_watermark_rounded',
  box2d: 'filter_frames_rounded',
  screenshotVideo: 'image_rounded',
  gameInfo: 'info_rounded',
  achievements: 'emoji_events_rounded',
}

/** The card's box on screen, device px. */
export function cardBox(neo: Neo): Box {
  const { u } = neo
  const left = u.r(12) + u.r(200) + u.px(4)
  return { left, top: u.px(4), width: u.W - left - u.px(4), height: u.H - u.px(8) }
}

export function DetailsCard({ state, route, game }: { state: State; route: GamesRoute; game: Game }) {
  const neo = useNeo()
  const card = cardBox(neo)
  const tabs = detailTabs(game)
  const tab = tabOf(state, game)
  const at = tabs.indexOf(tab)
  const slide = motion(neo, [{ property: 'transform', duration: 240, easing: 'easeInOutCubic' }])

  return (
    <div data-part="details-card" style={abs(card)}>
      <TabStrip tabs={tabs} at={at} width={card.width} />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {tabs.map((t, i) => (
          <div
            key={t}
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translateX(${(i - at) * card.width}px)`,
              transition: slide,
            }}
          >
            <Panel tab={t} state={state} route={route} game={game} card={card} active={i === at} />
          </div>
        ))}
      </div>
      <Footer state={state} game={game} card={card} />
      {state.scraping === game.id && <ScrapingPanel card={card} />}
    </div>
  )
}

/* ---- the tab strip -------------------------------------------------------------- */

function DpadGlyph({ left, box }: { left: boolean; box: Box }) {
  const neo = useNeo()
  const src = gamepad(left ? 'Xbox_D-pad_L' : 'Xbox_D-pad_R')
  const inner = { left: 0, top: 0, width: box.width, height: box.height }
  return (
    <div style={abs(box)}>
      {neo.web && (
        <div style={{ position: 'absolute', inset: 0, filter: `blur(${neo.u.r(1.5)}px)` }}>
          <Tinted src={src} box={inner} color={alpha(neo.p.surface, 0.5)} />
        </div>
      )}
      <Tinted src={src} box={inner} color={neo.p.onSurface} />
    </div>
  )
}

function TabStrip({ tabs, at, width }: { tabs: readonly DetailTab[]; at: number; width: number }) {
  const neo = useNeo()
  const { u, p } = neo
  const slot = u.r(36)
  const pillW = tabs.length * slot + u.r(8) * 2
  const mid = u.r(4) + (u.r(46) - u.r(4)) / 2
  const right = width - u.r(8)
  const rGlyph = right - u.r(22)
  const pillLeft = rGlyph - u.r(6) - pillW
  const lGlyph = pillLeft - u.r(6) - u.r(22)
  return (
    <div data-part="detail-tabs">
      <DpadGlyph left box={{ left: lGlyph, top: mid - u.r(11), width: u.r(22), height: u.r(22) }} />
      <NeoGlass box={{ left: pillLeft, top: mid - slot / 2, width: pillW, height: slot }} radius={neo.radius.external}>
        <div
          style={{
            ...abs({ left: u.r(8), top: u.r(4), width: slot, height: slot - u.r(8) }),
            transform: `translateX(${at * slot}px)`,
            background: p.primary,
            borderRadius: neo.radius.internal,
            transition: motion(neo, [{ property: 'transform', duration: 160, easing: 'easeInOut' }]),
          }}
        />
        {tabs.map((t, i) => (
          <div
            key={t}
            style={{ position: 'absolute', left: u.r(8) + i * slot + (slot - u.r(18)) / 2, top: (slot - u.r(18)) / 2 }}
          >
            <Sym name={TAB_ICON[t]} size={u.r(18)} color={i === at ? p.onPrimary : p.onSurface} />
          </div>
        ))}
      </NeoGlass>
      <DpadGlyph left={false} box={{ left: rGlyph, top: mid - u.r(11), width: u.r(22), height: u.r(22) }} />
    </div>
  )
}

/* ---- panels ----------------------------------------------------------------------- */

function panelBox(neo: Neo, card: Box): Box {
  const { u } = neo
  return { left: u.r(12), top: u.r(55), width: card.width - u.r(24), height: card.height - u.r(55) - u.r(96) }
}

function Panel(props: { tab: DetailTab; state: State; route: GamesRoute; game: Game; card: Box; active: boolean }) {
  switch (props.tab) {
    case 'wheel':
      return <WheelPanel game={props.game} card={props.card} />
    case 'box2d':
      return <ArtPanel src={boxart(props.game)} aspect={3 / 4} card={props.card} fit="contain" />
    case 'screenshotVideo':
      return <ArtPanel src={screenshot(props.game)} aspect={3 / 2} card={props.card} fit="cover" />
    case 'gameInfo':
      return <InfoPanel {...props} />
    case 'achievements':
      return <CheevoPanel {...props} />
  }
}

/** The wheel: the game's logo art over a copy of itself in `shadow` 0.5, 6.r down and right. */
function WheelPanel({ game, card }: { game: Game; card: Box }) {
  const neo = useNeo()
  const { u, p } = neo
  const box = { left: u.r(10), top: u.r(44), width: card.width - u.r(20), height: card.height - u.r(44) - u.r(88) }
  const w = Math.min(u.r(280), box.width)
  const h = Math.min(u.r(140), box.height)
  const text = (color: string, dx: number) => (
    <div
      style={{
        ...abs({
          left: box.left + (box.width - w) / 2 + dx,
          top: box.top + (box.height - h) / 2 + dx,
          width: w,
          height: h,
        }),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: "'NeoStation Anta'",
        fontWeight: 900,
        fontSynthesis: 'weight',
        fontSize: u.t(34),
        lineHeight: 1.05,
        color,
      }}
    >
      {game.title}
    </div>
  )
  return (
    <>
      {text(alpha(p.shadow, 0.5), u.r(6))}
      {text('#ffffff', 0)}
    </>
  )
}

function ArtPanel({ src, aspect, card, fit }: { src: string; aspect: number; card: Box; fit: 'contain' | 'cover' }) {
  const neo = useNeo()
  const { u, p } = neo
  const box = panelBox(neo, card)
  const w = Math.min(box.width, box.height * aspect)
  const h = w / aspect
  return (
    <div
      style={{
        ...abs({ left: box.left + (box.width - w) / 2, top: box.top + (box.height - h) / 2, width: w, height: h }),
        borderRadius: neo.radius.internal,
        overflow: 'hidden',
        boxShadow: shadow(neo, alpha(p.shadow, 0.3), u.r(3), u.r(3), u.r(3)),
      }}
    >
      <img alt="" src={src} style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }} />
    </div>
  )
}

/** `PanelGateHighlight`: resting, drivable or entered. */
function gate(neo: Neo, drivable: boolean, active: boolean, resting: string) {
  const { u, p } = neo
  const color = active ? p.secondary : drivable ? alpha(p.secondary, 0.5) : resting
  const glow = active ? `, 0 0 ${2 * (0.57735 * u.r(8) + u.px(0.5))}px ${alpha(p.secondary, 0.35)}` : ''
  return {
    border: `${u.r(2)}px solid ${color}`,
    boxShadow: shadow(neo, alpha(p.shadow, 0.25), u.r(2), u.r(2), u.r(2)) + glow,
    transition: motion(neo, [{ property: 'borderColor', duration: 160, easing: 'easeOut' }]),
  }
}

function Divider({ top, left, width }: { top: number; left: number; width: number }) {
  const neo = useNeo()
  return (
    <div
      style={{
        ...abs({ left, top: top + (neo.u.r(10) - neo.u.px(1)) / 2, width, height: neo.u.px(1) }),
        background: alpha(neo.p.onSurface, 0.1),
      }}
    />
  )
}

function InfoPanel({
  route,
  game,
  card,
  active,
}: {
  state: State
  route: GamesRoute
  game: Game
  card: Box
  active: boolean
}) {
  const neo = useNeo()
  const { u, p } = neo
  const box = panelBox(neo, card)
  const s = game.scraped
  const drivable = infoDrivable(game)
  const entered = active && route.panel
  const inner = box.width - u.r(2) * 2
  const facts: { icon: SymbolName; text: string }[] = s?.description
    ? [
        ...(s.developer ? [{ icon: 'business_rounded' as const, text: s.developer }] : []),
        ...(s.publisher ? [{ icon: 'storefront_rounded' as const, text: s.publisher }] : []),
        ...(s.players ? [{ icon: 'people_rounded' as const, text: s.players }] : []),
        ...(s.year ? [{ icon: 'calendar_today_rounded' as const, text: s.year }] : []),
        ...(s.genre ? [{ icon: 'category_rounded' as const, text: s.genre }] : []),
      ]
    : []
  const headerH = u.r(8) + u.r(16)
  const footH = u.r(10) + u.r(15) * 2 + u.r(2) + u.r(8)
  const bodyTop = headerH + u.r(10)
  const bodyH = box.height - u.r(4) - bodyTop - footH
  const factLefts = facts.map((_, i) =>
    facts.slice(0, i).reduce((n, f) => n + u.r(4) * 2 + u.r(10) + u.r(4) + textWidth(f.text, u.t(9)), 0),
  )

  return (
    <div
      data-part="info-panel"
      style={{
        ...abs(box),
        boxSizing: 'border-box',
        background: alpha(p.surface, 0.75),
        borderRadius: neo.radius.external,
        ...gate(neo, drivable, entered, p.outline),
      }}
    >
      <div style={{ position: 'absolute', left: u.r(8), top: u.r(8) + (u.r(16) - u.r(13)) / 2 }}>
        <Sym name="info_rounded" size={u.r(13)} color={p.onSurface} />
      </div>
      {facts.map((f, i) => (
        <div
          key={f.icon}
          style={{
            position: 'absolute',
            left: u.r(8) + u.r(13) + u.r(8) + factLefts[i]! + u.r(4),
            top: u.r(8),
            height: u.r(16),
            display: 'flex',
            alignItems: 'center',
            gap: u.r(4),
          }}
        >
          <Sym name={f.icon} size={u.r(10)} color={alpha(p.onSurface, 0.6)} />
          <Txt size={u.t(9)} color={alpha(p.onSurface, 0.6)}>
            {f.text}
          </Txt>
        </div>
      ))}
      <Divider top={headerH} left={u.r(8)} width={inner - u.r(16)} />
      <div
        style={{
          position: 'absolute',
          left: u.r(8),
          top: bodyTop,
          width: inner - u.r(16),
          height: bodyH,
          overflow: 'hidden',
        }}
      >
        {s?.description ? (
          <div
            style={{
              position: 'absolute',
              left: u.r(12),
              right: u.r(12),
              top: u.r(12),
              transform: `translateY(${-route.scroll * u.r(56)}px)`,
              transition: motion(neo, [{ property: 'transform', duration: 140, easing: 'easeOut' }]),
              fontFamily: "'NeoStation Anta'",
              fontSize: u.t(11),
              lineHeight: 1.6,
              color: alpha(p.onSurface, 0.8),
            }}
          >
            {s.description}
          </div>
        ) : (
          <IncompleteMetadata width={inner - u.r(16)} height={bodyH} />
        )}
      </div>
      <div style={{ position: 'absolute', left: u.r(8), top: box.height - u.r(4) - footH, width: inner - u.r(16) }}>
        <Divider top={0} left={0} width={inner - u.r(16)} />
        {[
          { icon: 'label_rounded' as const, text: game.title, a: 0.85 },
          { icon: 'description_rounded' as const, text: game.file, a: 0.6 },
        ].map((l, i) => (
          <div
            key={l.icon}
            style={{
              position: 'absolute',
              left: 0,
              top: u.r(10) + i * (u.r(15) + u.r(2)),
              height: u.r(15),
              display: 'flex',
              alignItems: 'center',
              gap: u.r(4),
            }}
          >
            <Sym name={l.icon} size={u.r(10)} color={alpha(p.onSurface, l.a)} />
            <Txt size={u.t(10)} color={alpha(p.onSurface, l.a)}>
              {l.text}
            </Txt>
          </div>
        ))}
      </div>
    </div>
  )
}

/** The info tab with no description (`game_details_game_info_tab.dart:430-490`), signed in to ScreenScraper. */
function IncompleteMetadata({ width, height }: { width: number; height: number }) {
  const neo = useNeo()
  const { u, p } = neo
  const title = u.t(20) * LINE
  const body = u.t(12) * 1.5 * 3
  const total = title + u.r(12) + body
  const scale = Math.min(1, height / total, width / u.r(300))
  return (
    <div
      style={{
        position: 'absolute',
        left: (width - u.r(300) * scale) / 2,
        top: (height - total * scale) / 2,
        width: u.r(300),
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        textAlign: 'center',
      }}
    >
      <Txt size={u.t(20)} color={p.onSurface} weight={700}>
        Incomplete Metadata
      </Txt>
      <div
        style={{
          marginTop: u.r(12),
          fontFamily: "'NeoStation Anta'",
          fontSize: u.t(12),
          lineHeight: 1.5,
          color: alpha(p.onSurface, 0.7),
        }}
      >
        This game doesn't have metadata yet. Scrape it to download its description, genre, boxart, and videos.
      </div>
    </div>
  )
}

/** A named achievement where a frame names it; the rest are numbered, locked, and worth five. */
function cheevoAt(game: Game, i: number) {
  const named = game.cheevos?.named?.[i]
  return named ?? { title: `Achievement ${i + 1}`, description: '', points: 5 }
}

function CheevoPanel({
  route,
  game,
  card,
  active,
}: {
  state: State
  route: GamesRoute
  game: Game
  card: Box
  active: boolean
}) {
  const neo = useNeo()
  const { u, p } = neo
  const box = panelBox(neo, card)
  const total = cheevoCount(game)
  const entered = active && route.panel
  const inner = box.width - u.r(2) * 2
  const inset = u.r(12)
  const headH = u.r(8) + u.t(11) * LINE + u.r(6)
  const hashH = u.r(4) + u.t(11) * LINE + u.r(8)
  const bodyTop = headH + u.r(10)
  const bodyH = box.height - u.r(4) - bodyTop - hashH
  const leftW = ((inner - inset * 2 - u.r(12)) * 4) / 10
  const gridW = ((inner - inset * 2 - u.r(12)) * 6) / 10
  const badge = (gridW - u.r(4) * 5) / 6
  const sel = cheevoAt(game, route.cheevo)
  const header = `0 / ${total}  ·  0%`
  const chips = ['REFRESH', 'FIX MATCH']
  const chipW = chips.map((c) => textWidth(c, u.t(8)) + u.r(6) * 2 + u.r(2) * 2)
  const hash =
    (hashString(game.file) >>> 0).toString(16).padStart(8, '0') +
    (hashString(game.title) >>> 0).toString(16).padStart(8, '0')
  // The grid scrolls the focused badge into the middle once it runs past the pane.
  const rowPitch = badge + u.r(4)
  const rows = Math.ceil(total / 6)
  const gridMax = Math.max(0, rows * rowPitch - u.r(4) - bodyH)
  const gridOffset = Math.min(gridMax, Math.max(0, Math.floor(route.cheevo / 6) * rowPitch + badge / 2 - bodyH / 2))

  return (
    <div
      data-part="cheevo-panel"
      style={{
        ...abs(box),
        boxSizing: 'border-box',
        background: alpha(p.surface, 0.75),
        borderRadius: neo.radius.external,
        ...gate(neo, total > 0, entered, 'transparent'),
      }}
    >
      <div style={{ position: 'absolute', left: inset, top: u.r(8) + (u.t(11) * LINE - u.r(13)) / 2 }}>
        <Sym name="emoji_events_rounded" size={u.r(13)} color="#ff9800" />
      </div>
      <Txt
        size={u.t(11)}
        color={alpha(p.onSurface, 0.75)}
        weight={600}
        style={{ position: 'absolute', left: inset + u.r(13) + u.r(8), top: u.r(8) }}
      >
        {header}
      </Txt>
      {chips.map((c, i) => {
        const right = inner - inset - chipW.slice(i + 1).reduce((n, w) => n + w + u.r(6), 0)
        return (
          <div
            key={c}
            style={{
              ...abs({
                left: right - chipW[i]!,
                top: u.r(8) + (u.t(11) * LINE - (u.t(8) * LINE + u.r(3) * 2 + u.r(4))) / 2,
                width: chipW[i]!,
                height: u.t(8) * LINE + u.r(3) * 2 + u.r(4),
              }),
              boxSizing: 'border-box',
              background: p.surface,
              border: `${u.r(2)}px solid transparent`,
              borderRadius: neo.radius.internal,
            }}
          >
            <Txt
              size={u.t(8)}
              color={p.onSurface}
              weight={700}
              style={{ position: 'absolute', left: u.r(6), top: u.r(3) - u.r(2) + u.r(2) }}
            >
              {c}
            </Txt>
          </div>
        )
      })}
      <Divider top={headH} left={inset} width={inner - inset * 2} />

      <div style={{ position: 'absolute', left: inset, top: bodyTop, width: leftW, textAlign: 'center' }}>
        <Txt size={u.t(10)} color={p.onSurface} weight={700} style={{ whiteSpace: 'normal', height: 'auto' }}>
          {sel.title}
        </Txt>
        {sel.description && (
          <div
            style={{
              marginTop: u.r(6),
              fontFamily: "'NeoStation Anta'",
              fontSize: u.t(9),
              lineHeight: 1.4,
              color: alpha(p.onSurface, 0.8),
            }}
          >
            {sel.description}
          </div>
        )}
        <div
          style={{
            display: 'inline-block',
            marginTop: u.r(8),
            padding: `${u.r(2)}px ${u.r(6)}px`,
            background: p.secondary,
            borderRadius: neo.radius.internal,
            fontFamily: "'NeoStation Anta'",
            fontSize: u.t(9),
            lineHeight: `${u.t(9) * LINE}px`,
            color: '#ffffff',
          }}
        >
          {sel.points} pts
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: inset + leftW + u.r(12),
          top: bodyTop,
          width: gridW,
          height: bodyH,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: gridW,
            transform: `translateY(${-gridOffset}px)`,
            transition: motion(neo, [{ property: 'transform', duration: 200, easing: 'easeOut' }]),
          }}
        >
          {Array.from({ length: total }, (_, i) => {
            const on = i === route.cheevo
            const b = on ? u.r(2) : u.r(1)
            return (
              <div
                key={i}
                style={{
                  ...abs({
                    left: (i % 6) * (badge + u.r(4)),
                    top: Math.floor(i / 6) * rowPitch,
                    width: badge,
                    height: badge,
                  }),
                  boxSizing: 'border-box',
                  borderRadius: neo.radius.internal,
                  border: `${b}px solid ${on ? alpha(p.secondary, entered ? 1 : 0.35) : 'transparent'}`,
                  background: `linear-gradient(135deg, ${lerpColor('#5a5a5a', '#9a9a9a', (hashString(`${game.id}${i}`) % 100) / 100)}, #3c3c3c)`,
                  overflow: 'hidden',
                }}
              />
            )
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: inset,
          top: box.height - u.r(4) - hashH + u.r(4),
          display: 'flex',
          alignItems: 'center',
          gap: u.r(4),
        }}
      >
        <Sym name="tag_rounded" size={u.r(12)} color={alpha(p.onSurface, 0.5)} />
        <Txt size={u.t(11)} color={alpha(p.onSurface, 0.5)}>
          RA hash:
        </Txt>
        <span
          style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: u.t(11), color: alpha(p.onSurface, 0.5) }}
        >
          {hash}
        </span>
      </div>
    </div>
  )
}

/* ---- the footer ---------------------------------------------------------------------- */

/** `MonospacedClock`: HH:MM:SS, zero-padded. */
function clock(seconds: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`
}

function Footer({ state, game, card }: { state: State; game: Game; card: Box }) {
  const neo = useNeo()
  const { u, p } = neo
  const padX = u.r(12)
  const rowH = u.r(40)
  const bottom = card.height + u.r(0.5) - u.r(11)
  const rowTop = bottom - rowH
  const lineTop = rowTop - u.r(6) - u.r(26)
  const width = card.width - padX * 2 + u.r(1)
  const played = playedOf(state.lib, game)
  const scraped = !!game.scraped
  const rating = game.scraped?.rating ? Math.ceil(Math.min(10, Math.max(0, game.scraped.rating / 2))) : 0
  const total = cheevoCount(game)
  const textShadow = `2px 2px ${u.r(1)}px #000`
  const gap = u.r(5)
  const fav = isFavorite(state.lib, game)

  // Right to left: PLAY, settings, favourite, random; the rating on the left, and the pill between.
  const playLeft = width - u.r(88)
  const settingsLeft = playLeft - gap - rowH
  const favLeft = settingsLeft - gap - rowH
  const randomLeft = favLeft - gap - rowH
  const ratingW = rating ? u.r(64) : 0
  const pillLeft = ratingW ? ratingW + gap : 0
  const pillRoom = randomLeft - gap - pillLeft
  const pillW = Math.min(pillRoom, u.r(132))

  const clockText = clock(played)
  const clockW = textWidth(clockText, u.t(15))

  return (
    <div
      data-part="details-footer"
      style={{ position: 'absolute', left: padX - u.r(0.5), top: 0, width, height: card.height }}
    >
      {scraped && (
        <Txt
          size={u.t(15)}
          color="#ffffff"
          weight={600}
          style={{
            position: 'absolute',
            left: 0,
            top: lineTop + (u.r(26) - u.t(15) * 1.15) / 2,
            width: played ? width - clockW - u.r(17) - u.r(5) - u.r(10) : width,
            lineHeight: 1.15,
            height: u.t(15) * 1.15,
            textShadow,
          }}
        >
          {game.file}
        </Txt>
      )}
      {played > 0 && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: lineTop,
            height: u.r(26),
            display: 'flex',
            alignItems: 'center',
            gap: u.r(5),
          }}
        >
          <Sym name="schedule_rounded" size={u.r(17)} color="#ffffff" fill={false} style={{ textShadow }} />
          <Txt
            size={u.t(15)}
            color="#ffffff"
            weight={700}
            style={{ textShadow, lineHeight: 1.15, height: u.t(15) * 1.15, fontVariantNumeric: 'tabular-nums' }}
          >
            {clockText}
          </Txt>
        </div>
      )}

      {rating > 0 && (
        <NeoGlass box={{ left: 0, top: rowTop, width: ratingW, height: rowH }} radius={u.r(40)}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              paddingLeft: u.r(4),
              paddingRight: u.r(6),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: u.r(3),
            }}
          >
            <Sym name="star_rounded" size={u.r(16)} color={lerpColor(p.error, p.success, (rating - 1) / 9)} />
            <Txt size={u.t(16)} color={p.onSurface} weight={800} style={{ lineHeight: 1.15, height: u.t(16) * 1.15 }}>
              {String(rating)}
            </Txt>
          </div>
        </NeoGlass>
      )}
      {total > 0 && pillRoom >= u.r(64) && (
        <NeoGlass box={{ left: pillLeft, top: rowTop, width: pillW, height: rowH }} radius={u.r(40)}>
          <div
            style={{
              ...abs({ left: u.r(6), top: u.r(5), width: u.r(30), height: u.r(30) }),
              borderRadius: neo.radius.internal,
              background: p.surface,
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
            size={u.t(11)}
            color={p.onSurface}
            weight={700}
            letterSpacing={u.r(0.5)}
            style={{ position: 'absolute', left: u.r(6) + u.r(30) + u.r(6), top: u.r(5) }}
          >
            {`0/${total}`}
          </Txt>
          <div
            style={{
              ...abs({
                left: u.r(6) + u.r(30) + u.r(6),
                top: u.r(5) + u.t(11) * LINE + u.r(4),
                width: pillW - u.r(6) * 2 - u.r(30) - u.r(6) - u.r(6),
                height: u.r(6),
              }),
              borderRadius: u.r(4),
              background: alpha(p.onSurface, 0.1),
            }}
          />
        </NeoGlass>
      )}
      <RoundButton left={randomLeft} top={rowTop} icon="casino_rounded" on={false} />
      <RoundButton left={favLeft} top={rowTop} icon="favorite_rounded" on={fav} />
      <RoundButton left={settingsLeft} top={rowTop} icon="settings_rounded" on={false} />
      <div
        style={{
          ...abs({ left: playLeft, top: rowTop, width: u.r(88), height: rowH }),
          boxSizing: 'border-box',
          background: '#2ecc71',
          border: `${u.r(1)}px solid #36f184`,
          borderRadius: neo.radius.external,
          boxShadow: shadow(neo, alpha(p.shadow, 0.1), u.r(4), u.r(2), u.r(2)),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingRight: u.r(8),
          gap: u.r(6),
        }}
      >
        <div style={{ position: 'relative', width: u.r(28), height: u.r(28) }}>
          <Tinted
            src={gamepad('Xbox_A_button')}
            box={{ left: 0, top: 0, width: u.r(28), height: u.r(28) }}
            color={p.onPrimary}
          />
        </div>
        <span
          style={{
            fontFamily: "'NeoStation Anta'",
            fontWeight: 900,
            fontSynthesis: 'weight',
            fontSize: u.t(13),
            letterSpacing: 1 * neo.u.dpr,
            lineHeight: 1,
            color: p.onPrimary,
          }}
        >
          PLAY
        </span>
      </div>
    </div>
  )
}

/** A 40.r glass circle with one icon: filled and in the error colour when on (`game_details_footer.dart:730-777`). */
function RoundButton({ left, top, icon, on }: { left: number; top: number; icon: SymbolName; on: boolean }) {
  const neo = useNeo()
  const { u, p } = neo
  const d = u.r(40)
  return (
    <NeoGlass box={{ left, top, width: d, height: d }} radius={d}>
      <div style={{ position: 'absolute', left: (d - u.r(21)) / 2, top: (d - u.r(21)) / 2 }}>
        <Sym name={icon} size={u.r(21)} color={on ? p.error : p.onSurface} fill={on} />
      </div>
    </NeoGlass>
  )
}

/** `ScrapingProgressPanel`: over the tabs while a scrape runs. */
function ScrapingPanel({ card }: { card: Box }) {
  const neo = useNeo()
  const { u, p } = neo
  const box = { left: u.r(12), top: u.r(55), width: card.width - u.r(24), height: card.height - u.r(55) - u.r(110) }
  const ring = u.r(24) + u.r(16) * 2
  const title = u.t(18) * LINE
  const total = ring + u.r(24) + title + u.r(12) + u.r(4)
  const top = (box.height - total) / 2
  return (
    <div
      data-part="scraping-panel"
      style={{
        ...abs(box),
        boxSizing: 'border-box',
        background: alpha(p.surface, 0.9),
        border: `${u.r(1)}px solid ${p.outline}`,
        borderRadius: neo.radius.external,
        boxShadow: shadow(neo, alpha(p.shadow, 0.25), u.r(2), u.r(2), u.r(2)),
      }}
    >
      <div
        style={{
          ...abs({ left: (box.width - ring) / 2, top, width: ring, height: ring }),
          borderRadius: ring / 2,
          background: alpha(p.primary, 0.1),
        }}
      >
        <div
          style={{
            ...abs({ left: u.r(16), top: u.r(16), width: u.r(24), height: u.r(24) }),
            boxSizing: 'border-box',
            borderRadius: u.r(12),
            border: `${u.px(3)}px solid ${p.primary}`,
            borderRightColor: 'transparent',
          }}
        />
      </div>
      <Txt
        size={u.t(18)}
        color={p.onSurface}
        weight={700}
        style={{ position: 'absolute', left: 0, width: box.width, top: top + ring + u.r(24), textAlign: 'center' }}
      >
        Scraping Game Data...
      </Txt>
      <div
        style={{
          ...abs({
            left: (box.width - u.r(250)) / 2,
            top: top + ring + u.r(24) + title + u.r(12),
            width: u.r(250),
            height: u.r(4),
          }),
          background: 'rgba(255,255,255,0.1)',
          borderRadius: u.r(4),
          overflow: 'hidden',
        }}
      >
        <div style={{ width: '35%', height: '100%', background: p.primary, borderRadius: u.r(4) }} />
      </div>
    </div>
  )
}
