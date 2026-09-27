/**
 * PORTING NOTES
 * CFW: TortOS            Devices: trimui-brick
 * Source: ericreinsmidt/TortOS - src/ui.c (text, marquee, glow, rails, panel, generated card),
 *         src/main.c menu_draw_ex (3397-4164), draw_heart (2227)
 * Mode: reproduce
 *
 * Layout:        The shared drawing primitives every screen is made of. Positions are the
 *                source's own: a text box `size` px tall at `top: y` is where SDL_ttf draws a
 *                surface at y, because Josefin's line is exactly its point size.
 * Focus & selection: The panel's highlight is a white plate at alpha 34 under the rows; each
 *                row's colour is weighed by how much of the plate covers it, so two rows
 *                crossfade as the plate passes rather than switching.
 * Buttons:       None - these draw.
 * Transitions:   The plate chases its row. The source runs two chained exponential decays with
 *                a 22ms time constant; here it is a 110ms ease-out transition on the plate and
 *                the row colours, snapped on a wrap or a jump past a selectable row as the
 *                source snaps it. Marquees ping-pong at 70px/s after a 1.4s hold.
 * Notes:         Additive glow is a radial gradient drawn with `mix-blend-mode: plus-lighter`,
 *                with a normal-blend fallback. Kerning is not applied to measured widths.
 */
import { useState, type CSSProperties, type ReactNode } from 'react'
import { useScreen } from '../../../device/ScreenContext'
import { useWebEffects } from '../../../render/RenderModeProvider'
import { transitionsToCss } from '../../../anim/waapi'
import { usePhase } from '../clock'
import { isLive, type PanelModel, type Row } from '../machine'
import { RGB, SURFACE, UI, hex, mixRgb } from '../palette'
import { CARD, FONT, MENU, RAIL, SCREEN, descent } from '../spec'
import { MARQUEE, fitText, pingpong, scrollthrough, textWidth, wrapText } from '../text'

export const FAMILY = "'TortOS Josefin Sans', sans-serif"

/* ---- text ----------------------------------------------------------------- */

export interface TextProps {
  readonly text: string
  readonly x: number
  readonly y: number
  readonly size: number
  readonly color: string
  /** -1 left, 0 centred, 1 right - `ui_text`'s anchor. */
  readonly anchor?: -1 | 0 | 1 | undefined
  readonly opacity?: number | undefined
  readonly style?: CSSProperties | undefined
}

/** `ui_text`: one line at (x, y), its top at y, anchored left, centre or right on x. */
export function Text({ text, x, y, size, color, anchor = -1, opacity, style }: TextProps) {
  if (!text) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        fontFamily: FAMILY,
        fontSize: `${size}px`,
        lineHeight: `${size}px`,
        height: `${size}px`,
        whiteSpace: 'pre',
        color,
        ...(anchor === 0 ? { transform: 'translateX(-50%)' } : anchor === 1 ? { transform: 'translateX(-100%)' } : {}),
        ...(opacity !== undefined && opacity < 1 ? { opacity } : {}),
        ...style,
      }}
    >
      {text}
    </div>
  )
}

/**
 * `ui_text_marquee`: text wider than its box slides, with its edges dissolving only on a side
 * where something is hidden. Text that fits is drawn plainly, left-aligned at x.
 */
export function Marquee({
  text,
  x,
  y,
  w,
  size,
  color,
  phase,
}: {
  text: string
  x: number
  y: number
  w: number
  size: number
  color: string
  phase: number
}) {
  const web = useWebEffects()
  const tw = textWidth(text, size)
  if (tw <= w) return <Text text={text} x={x} y={y} size={size} color={color} />
  const over = tw - w
  const off = pingpong(over, phase)
  const lf = Math.min(off, MARQUEE.fadePx)
  const rf = Math.min(over - off, MARQUEE.fadePx)
  const mask = `linear-gradient(to right, transparent 0, #000 ${lf}px, #000 ${w - rf}px, transparent ${w}px)`
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${w}px`,
        height: `${size}px`,
        overflow: 'hidden',
        ...(web ? { maskImage: mask } : {}),
      }}
      data-part="marquee"
    >
      <Text text={text} x={-off} y={0} size={size} color={color} />
    </div>
  )
}

/* ---- glow ----------------------------------------------------------------- */

/**
 * `ui_glow`: a radial falloff of `(1 - d)^3`, stretched over the rect times `spread`, tinted and
 * added to what is under it.
 */
export function Glow({ box, rgb, alpha, spread }: { box: { left: number; top: number; width: number; height: number }; rgb: number; alpha: number; spread: number }) {
  const web = useWebEffects()
  const gw = Math.trunc(box.width * spread)
  const gh = Math.trunc(box.height * spread)
  const a = alpha / 255
  // The cube falloff, sampled at eight stops - enough that the gradient shows no bands.
  const stops = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]
    .map((d) => `${hex(rgb, a * (1 - d) ** 3)} ${d * 100}%`)
    .join(', ')
  return (
    <div
      style={{
        position: 'absolute',
        left: `${box.left + Math.trunc(box.width / 2) - Math.trunc(gw / 2)}px`,
        top: `${box.top + Math.trunc(box.height / 2) - Math.trunc(gh / 2)}px`,
        width: `${gw}px`,
        height: `${gh}px`,
        background: `radial-gradient(closest-side, ${stops})`,
        ...(web ? { mixBlendMode: 'plus-lighter' } : {}),
        pointerEvents: 'none',
      }}
      data-part="glow"
    />
  )
}

/** A full-screen dim: black at `alpha`/255. */
export function Dim({ alpha }: { alpha: number }) {
  return <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${+(alpha / 255).toFixed(4)})` }} data-part="dim" />
}

/* ---- rails ---------------------------------------------------------------- */

const railBlend = (index: number) => RAIL.blend * (1 - Math.abs(2 * (index - Math.floor(index)) - 1))

/**
 * The colour of the strip `x` items along it (`rail_hue_at`, `src/ui.c:450`). The strip is fixed
 * to the track and the marker is a window onto it, so a wrap comes out right without being told.
 */
function hueAt(x: number, count: number, blend: number, hue: (i: number) => number): number {
  let i = Math.floor(x)
  const f = x - i
  i = ((i % count) + count) % count
  const mix = (a: number, b: number, t: number) => {
    const ca = [(a >> 16) & 255, (a >> 8) & 255, a & 255]
    const cb = [(b >> 16) & 255, (b >> 8) & 255, b & 255]
    const c = ca.map((v, k) => Math.trunc(v + (cb[k]! - v) * t + 0.5))
    return (c[0]! << 16) | (c[1]! << 8) | c[2]!
  }
  if (f < blend * 0.5) return mix(hue(i), hue((i - 1 + count) % count), 0.5 - f / blend)
  if (f > 1 - blend * 0.5) return mix(hue(i), hue((i + 1) % count), 0.5 - (1 - f) / blend)
  return hue(i)
}

/**
 * One rail (`ui_rail` / `ui_rail_v`): a faint track and a marker one item long, placed from the
 * shelf's drawn position rather than its cursor so it travels with the cards. On a ring the
 * marker leaves by one end while its copy a lap behind arrives at the other.
 *
 * `hue` gives the systems rail its strip of every system's colour; a games rail is one colour.
 */
export function Rail({
  index,
  count,
  rgb,
  hue,
  vertical = false,
}: {
  index: number
  count: number
  rgb: number
  hue?: ((i: number) => number) | undefined
  vertical?: boolean | undefined
}) {
  if (count <= 1) return null
  const len = vertical ? SCREEN.h - RAIL.vy * 2 : SCREEN.w - RAIL.x * 2
  const seg = Math.max(RAIL.minSegment, Math.trunc(len / count))
  const step = (len - seg) / (count - 1)
  const lapF = step * count
  let o = (index * step) % lapF
  if (o < 0) o += lapF
  const off = Math.trunc(o + 0.5)
  const lap = Math.trunc(lapF + 0.5)
  const blend = railBlend(index)
  const bandStep = lapF / count

  // A marker segment [start, start+seg) along the track, clipped to it and split into runs of
  // one colour - one run, unless a boundary between two systems is under it.
  const segments = (start: number) => {
    const a = Math.max(0, start)
    const b = Math.min(len, start + seg)
    if (b <= a) return []
    if (!hue) return [{ a, b, rgb }]
    const runs: { a: number; b: number; rgb: number }[] = []
    for (let k = a; k < b; k++) {
      // The pixel's centre, measured from the track's origin - the bottom, when vertical.
      const t = vertical ? len - 1 - k : k
      const c = hueAt((t + 0.5) / bandStep, count, blend, hue)
      const last = runs.at(-1)
      if (last && last.rgb === c && last.b === k) last.b = k + 1
      else runs.push({ a: k, b: k + 1, rgb: c })
    }
    return runs
  }

  // Vertical rails run bottom-up: the first item sits at the bottom.
  const starts = vertical ? [len - seg - off, off > len - seg ? len - seg - off + lap : null] : [off, off > len - seg ? off - lap : null]
  const runs = starts.flatMap((s) => (s === null ? [] : segments(s)))
  const track = vertical
    ? { left: RAIL.vx, top: RAIL.vy, width: RAIL.thickness, height: len }
    : { left: RAIL.x, top: RAIL.y, width: len, height: RAIL.thickness }

  return (
    <div style={{ position: 'absolute', ...px(track), background: `rgba(255,255,255,${+(RAIL.trackAlpha / 255).toFixed(4)})` }} data-part="rail">
      {runs.map((r, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...(vertical
              ? { left: 0, top: `${r.a}px`, width: `${RAIL.thickness}px`, height: `${r.b - r.a}px` }
              : { left: `${r.a}px`, top: 0, width: `${r.b - r.a}px`, height: `${RAIL.thickness}px` }),
            background: hex(r.rgb, RAIL.markerAlpha / 255),
          }}
        />
      ))}
    </div>
  )
}

export const px = (b: { left: number; top: number; width: number; height: number }) => ({
  left: `${b.left}px`,
  top: `${b.top}px`,
  width: `${b.width}px`,
  height: `${b.height}px`,
})

/* ---- the generated card --------------------------------------------------- */

/**
 * The card TortOS draws for a game or album with no art (`make_card`, `src/ui.c:815`): a dark
 * vertical gradient, the title's first letter enormous and faint in the system's colour bleeding
 * off the bottom-right corner, a band of that colour along the top, the title at the left and a
 * short rule under it. A game's has rounded corners; an album's does not, because it stands among
 * square sleeves.
 *
 * Drawn at its own 512-wide size and scaled to fit, as the launcher draws it into a texture.
 */
export function GeneratedCard({ title, rgb, width, height, album = false }: { title: string; rgb: number; width: number; height: number; album?: boolean }) {
  const cw = CARD.w
  const ch = album ? CARD.w : CARD.h
  const letter = (title.trim()[0] ?? '').toUpperCase()
  const lines = wrapText(title, FONT.card, cw - 96, CARD.maxLines)
  const top = Math.trunc(ch * CARD.titleTop)
  const lineH = FONT.card + CARD.lineGap
  const ruleY = top + lines.length * lineH + CARD.rule.gap
  const markW = textWidth(letter, CARD.watermark.size)
  // The gradient's two ends, at v = 38 and v = 20: (0.86v, 0.92v, 1.2v), truncated.
  const shade = (v: number) => `rgb(${Math.trunc(v * 0.86)},${Math.trunc(v * 0.92)},${Math.trunc(v * 1.2)})`

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: `${width}px`, height: `${height}px`, overflow: 'hidden', borderRadius: album ? 0 : `${(CARD.radius * width) / cw}px` }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${cw}px`,
          height: `${ch}px`,
          transform: `scale(${width / cw}, ${height / ch})`,
          transformOrigin: '0 0',
          background: `linear-gradient(to bottom, ${shade(38)}, ${shade(20)})`,
          overflow: 'hidden',
        }}
      >
        <Text
          text={letter}
          x={cw - Math.trunc(markW * CARD.watermark.x)}
          y={ch - Math.trunc(CARD.watermark.size * CARD.watermark.y)}
          size={CARD.watermark.size}
          color={hex(rgb, CARD.watermark.alpha / 255)}
        />
        <div style={{ position: 'absolute', left: 0, top: 0, width: `${cw}px`, height: `${CARD.band}px`, background: hex(rgb) }} />
        {lines.map((l, i) => (
          <Text key={i} text={l} x={CARD.titleX} y={top + i * lineH} size={FONT.card} color={UI.text} />
        ))}
        <div style={{ position: 'absolute', left: `${CARD.titleX}px`, top: `${ruleY}px`, width: `${CARD.rule.w}px`, height: `${CARD.rule.h}px`, background: hex(rgb, CARD.rule.alpha / 255) }} />
      </div>
    </div>
  )
}

/* ---- the heart ------------------------------------------------------------ */

/** The heart curve, `x = 16 sin^3 t, y = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t` (`draw_heart`). */
const HEART = (() => {
  const pts: string[] = []
  for (let i = 0; i < 48; i++) {
    const t = (i / 48) * Math.PI * 2
    const x = 16 * Math.sin(t) ** 3
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    pts.push(`${(x / 16).toFixed(4)},${(-y / 16).toFixed(4)}`)
  }
  return pts.join(' ')
})()

/** The favourite mark, centred on (cx, cy) with half-width r. */
export function Heart({ cx, cy, r, rgb }: { cx: number; cy: number; r: number; rgb: number }) {
  return (
    <svg style={{ position: 'absolute', left: `${cx - r}px`, top: `${cy - r}px`, overflow: 'visible' }} width={r * 2} height={r * 2} viewBox="-1 -1 2 2">
      <polygon points={HEART} fill={hex(rgb)} />
    </svg>
  )
}

/* ---- the panel ------------------------------------------------------------ */

const rowH = (r: Row) => (r.kind === 'rule' || r.kind === 'hr' ? MENU.ruleH : r.kind === 'note' || r.kind === 'body' ? MENU.noteH : MENU.rowH)

/** `menu_window_first` (`src/menu.c`): the window moves only when the cursor would leave it. */
function windowFirst(rows: readonly Row[], sel: number, vis: number, first: number): number {
  const n = rows.length
  if (n <= 0 || vis <= 0 || vis >= n) return 0
  if (sel < 0) return first
  let top = sel
  while (top > 0 && !isLive(rows[top - 1]!)) top--
  let f = first
  if (top < f) f = top
  if (sel < f) f = sel
  if (sel > f + vis - 1) f = sel - vis + 1
  if (f > n - vis) f = n - vis
  return Math.max(0, f)
}

/** A step moves to the next *selectable* row; anything else is a jump, and the plate snaps. */
function isJump(rows: readonly Row[], from: number, to: number): boolean {
  const lo = Math.min(from, to)
  const hi = Math.max(from, to)
  for (let q = lo + 1; q < hi; q++) if (isLive(rows[q]!)) return true
  return false
}

/** 'H''s height above the baseline at the label size - the cap the heading is centred by. */
const CAP_LABEL = Math.round(FONT.label * 0.702)

/**
 * `menu_draw_ex`: every list in TortOS is this one panel.
 *
 * Its width is the widest row, or a width fixed across every state the panel can be in; its height
 * is the rows', capped at the screen less a margin, beyond which the rows window around the cursor
 * or - with no cursor - the body scrolls itself. It is centred on the screen.
 */
export function Panel({ model, accent }: { model: PanelModel; accent: number }) {
  const { animate } = useScreen()
  const { heading, rows, sel, fixedW, visitsAll, loopAt } = model
  const n = rows.length

  // The window's first row, carried between renders the way the source keeps it static.
  const [win, setWin] = useState({ n, first: 0 })
  const [plate, setPlate] = useState({ n, sel, snap: true })

  const pad = MENU.pad
  const heads = heading ? heading.split('\n') : []
  const headH = heading ? FONT.label * heads.length + pad : 0
  const contentOff = heading ? headH + Math.trunc(pad / 2) : pad
  const twoCol = rows.some((r) => r.kind === 'row' && r.value !== undefined)

  let contentW = 0
  for (const r of rows) {
    if (r.kind === 'rule' || r.kind === 'hr') continue
    let w = textWidth(r.label, FONT.menu)
    if (twoCol && r.kind === 'row' && r.value !== undefined) w += MENU.gap + textWidth(r.value, FONT.menu)
    contentW = Math.max(contentW, w)
  }
  for (const h of heads) contentW = Math.max(contentW, textWidth(h, FONT.label))
  if (fixedW > 0) contentW = fixedW
  contentW = Math.min(contentW, SCREEN.w - MENU.margin * 2 - pad * 2)

  const rowsH = rows.reduce((s, r) => s + rowH(r), 0)
  const avail = SCREEN.h - MENU.margin * 2 - contentOff - pad
  let vis = n
  let first = 0
  let scrollH = 0
  let scrollSplit = n
  let scrollFoot = 0
  let scrollSpan = 0
  const overflows = contentOff + rowsH + pad > SCREEN.h - MENU.margin * 2

  if (overflows && sel >= 0) {
    vis = Math.max(1, Math.min(n, Math.trunc(avail / MENU.rowH)))
    first = windowFirst(rows, sel, vis, win.n === n ? win.first : 0)
  } else if (overflows) {
    const split = rows.findIndex((r) => r.kind === 'rule')
    scrollSplit = split < 0 ? n : split
    for (let j = scrollSplit; j < n; j++) scrollFoot += rowH(rows[j]!)
    let body = 0
    for (let j = 0; j < scrollSplit; j++) body += rowH(rows[j]!)
    scrollH = Math.max(MENU.rowH, avail - scrollFoot)
    scrollSpan = Math.max(0, body - scrollH)
  }
  if (win.n !== n || win.first !== first) setWin({ n, first })

  // The body's own scroll, on a clock that starts when the card opens.
  const lap = loopAt > 0 ? rows.slice(0, loopAt).reduce((s, r) => s + rowH(r), 0) : 0
  const vphase = usePhase(`v:${heading}:${n}`, scrollH > 0 && (loopAt > 0 || scrollSpan > 0))
  const scroll = scrollH ? (loopAt > 0 ? scrollthrough(lap, vphase) : pingpong(scrollSpan, vphase)) : 0

  let visibleH = 0
  for (let j = first; j < first + vis && j < n; j++) visibleH += rowH(rows[j]!)
  let panelH = contentOff + (scrollH ? scrollH + scrollFoot : visibleH) + pad
  const last = rows[first + vis - 1]
  if (!scrollH && last && last.kind === 'note') panelH -= Math.trunc((pad * 5) / 12)
  const panelW = contentW + pad * 2
  const panel = { left: Math.trunc((SCREEN.w - panelW) / 2), top: Math.trunc((SCREEN.h - panelH) / 2), width: panelW, height: panelH }
  const cx = panel.left + Math.trunc(panelW / 2)
  const contentX = panel.left + pad
  const contentY = panel.top + contentOff

  // Where each row sits.
  const yOf = (i: number) => {
    if (scrollH && i >= scrollSplit) {
      let y = contentY + scrollH
      for (let j = scrollSplit; j < i; j++) y += rowH(rows[j]!)
      return y
    }
    let y = contentY - scroll
    if (i >= first) for (let j = first; j < i; j++) y += rowH(rows[j]!)
    else for (let j = i; j < first; j++) y -= rowH(rows[j]!)
    return y
  }

  // The plate: snapped on another menu or a jump, eased on a step.
  const selRow = sel >= 0 ? rows[sel] : undefined
  const hasPlate = !!selRow && selRow.kind !== 'rule' && selRow.kind !== 'hr'
  if (plate.n !== n || plate.sel !== sel) setPlate({ n, sel, snap: plate.n !== n || isJump(rows, plate.sel, sel) })
  const ease = animate && !plate.snap ? transitionsToCss([{ property: 'transform', duration: 110, easing: 'easeOutCubic' }, { property: 'height', duration: 110, easing: 'easeOutCubic' }, { property: 'color', duration: 110, easing: 'easeOutCubic' }]) : undefined
  const plateY = hasPlate ? yOf(sel) : 0
  const plateH = hasPlate ? rowH(selRow) : 0

  // Marquee clocks: the selected row's restarts with the cursor, the rest run on the screen's.
  const anyLong = rows.some((r) => r.kind !== 'rule' && r.kind !== 'hr' && textWidth(r.label, FONT.menu) + (r.kind === 'row' && r.value ? MENU.gap + textWidth(r.value, FONT.menu) : 0) > contentW)
  const selPhase = usePhase(`sel:${heading}:${sel}`, anyLong)
  const fixedPhase = usePhase(`fixed:${heading}:${n}`, anyLong)
  const headLong = heads.some((h) => textWidth(h, FONT.label) > contentW)
  const headPhase = usePhase(`head:${heading}`, headLong)

  const headBlock = CAP_LABEL + (heads.length - 1) * FONT.label
  const asc = FONT.label - descent(FONT.label)
  const hy = panel.top + MENU.border + Math.trunc((headH - MENU.border - headBlock) / 2) - (asc - CAP_LABEL)

  const accentRgb: readonly [number, number, number] = [(accent >> 16) & 255, (accent >> 8) & 255, accent & 255]
  const drawn: ReactNode[] = []
  const from = first > 0 ? first - 1 : first

  for (let i = from; i < n && i <= first + vis; i++) {
    const r = rows[i]!
    const y = yOf(i)
    const h = rowH(r)
    const ty = y + Math.trunc((h - FONT.menu) / 2) + MENU.inkOff
    if (r.kind === 'rule' || r.kind === 'hr') {
      drawn.push(<div key={i} style={{ position: 'absolute', left: `${contentX}px`, top: `${y + h - 2}px`, width: `${contentW}px`, height: '2px', background: hex(accent, SURFACE.ruleAlpha) }} />)
      continue
    }
    const w = i === sel && hasPlate ? 1 : 0
    const live = isLive(r)
    const lc = live ? mixRgb(RGB.soft, RGB.text, w) : mixRgb(RGB.dim, RGB.soft, w)
    const t = ease ? { transition: ease } : undefined
    const moves = i === sel || (!live && !visitsAll)
    const phase = i === sel ? selPhase : fixedPhase

    if (r.kind === 'note' || r.kind === 'body') {
      const fits = textWidth(r.label, FONT.menu) <= contentW
      if (fits) drawn.push(<Text key={i} text={r.label} x={r.kind === 'body' ? contentX : cx} y={ty} size={FONT.menu} color={lc} anchor={r.kind === 'body' ? -1 : 0} style={t} />)
      else drawn.push(<Marquee key={i} text={r.label} x={contentX} y={ty} w={contentW} size={FONT.menu} color={lc} phase={fixedPhase} />)
      continue
    }

    const vc = r.color ? hex(r.color) : live ? mixRgb(RGB.dim, accentRgb, w) : UI.dim
    if (!twoCol) {
      if (textWidth(r.label, FONT.menu) > contentW && moves) drawn.push(<Marquee key={i} text={r.label} x={contentX} y={ty} w={contentW} size={FONT.menu} color={lc} phase={phase} />)
      else drawn.push(<Text key={i} text={fitText(r.label, FONT.menu, contentW)} x={cx} y={ty} size={FONT.menu} color={lc} anchor={0} style={t} />)
      continue
    }
    const lw = textWidth(r.label, FONT.menu)
    const vw = r.value ? textWidth(r.value, FONT.menu) : 0
    const cells: ReactNode[] = []
    if (lw + (vw ? MENU.gap + vw : 0) <= contentW) {
      cells.push(<Text key="l" text={r.label} x={contentX} y={ty} size={FONT.menu} color={lc} style={t} />)
      if (r.value) cells.push(<Text key="v" text={r.value} x={contentX + contentW} y={ty} size={FONT.menu} color={vc} anchor={1} style={t} />)
    } else if (vw > lw) {
      const room = contentW - lw - MENU.gap
      cells.push(<Text key="l" text={r.label} x={contentX} y={ty} size={FONT.menu} color={lc} style={t} />)
      if (room > 0 && moves) cells.push(<Marquee key="v" text={r.value!} x={contentX + contentW - room} y={ty} w={room} size={FONT.menu} color={vc} phase={phase} />)
      else if (room > 0) cells.push(<Text key="v" text={fitText(r.value!, FONT.menu, room)} x={contentX + contentW} y={ty} size={FONT.menu} color={vc} anchor={1} style={t} />)
    } else {
      const room = contentW - (vw ? vw + MENU.gap : 0)
      if (r.value) cells.push(<Text key="v" text={fitText(r.value, FONT.menu, contentW)} x={contentX + contentW} y={ty} size={FONT.menu} color={vc} anchor={1} style={t} />)
      if (room <= 0) cells.push(<Text key="l" text={fitText(r.label, FONT.menu, contentW)} x={contentX} y={ty} size={FONT.menu} color={lc} style={t} />)
      else if (moves) cells.push(<Marquee key="l" text={r.label} x={contentX} y={ty} w={room} size={FONT.menu} color={lc} phase={phase} />)
      else cells.push(<Text key="l" text={fitText(r.label, FONT.menu, room)} x={contentX} y={ty} size={FONT.menu} color={lc} style={t} />)
    }
    drawn.push(<div key={i}>{cells}</div>)
  }

  // Windowed rows are clipped to the panel's inside, one row past each end of the window.
  const clip = vis < n ? { left: panel.left + MENU.border, top: contentY, width: panelW - MENU.border * 2, height: panel.top + panelH - pad - contentY } : scrollH ? { left: panel.left, top: contentY, width: panelW, height: scrollH } : null
  const pinned = scrollH ? drawn.slice(scrollSplit - from) : []
  const body = scrollH ? drawn.slice(0, scrollSplit - from) : drawn

  const arrowW = MENU.arrowW
  const arrowH = Math.trunc(arrowW / 2)

  return (
    <div style={{ position: 'absolute', inset: 0 }} data-part="panel">
      <Glow box={panel} rgb={accent} alpha={60} spread={1.5} />
      <div style={{ position: 'absolute', ...px(panel), borderRadius: `${MENU.radius}px`, background: hex(accent) }} />
      <div
        style={{
          position: 'absolute',
          left: `${panel.left + MENU.border}px`,
          top: `${panel.top + MENU.border}px`,
          width: `${panelW - MENU.border * 2}px`,
          height: `${panelH - MENU.border * 2}px`,
          borderRadius: `${MENU.radius - MENU.border}px`,
          background: SURFACE.panel,
        }}
      />
      {heads.map((h, i) =>
        textWidth(h, FONT.label) <= contentW ? (
          <Text key={i} text={h} x={cx} y={hy + i * FONT.label} size={FONT.label} color={UI.soft} anchor={0} />
        ) : (
          <Marquee key={i} text={h} x={contentX} y={hy + i * FONT.label} w={contentW} size={FONT.label} color={UI.soft} phase={headPhase} />
        ),
      )}
      {heading && <div style={{ position: 'absolute', left: `${contentX}px`, top: `${panel.top + headH}px`, width: `${contentW}px`, height: '2px', background: hex(accent, SURFACE.ruleAlpha) }} />}
      {hasPlate && (
        <div
          style={{
            position: 'absolute',
            left: `${panel.left + Math.trunc(pad / 2)}px`,
            top: 0,
            // Moved by transform rather than `top`, so the chase is a transition of one channel.
            transform: `translateY(${plateY}px)`,
            width: `${panelW - pad}px`,
            height: `${plateH}px`,
            borderRadius: `${MENU.plateRadius}px`,
            background: SURFACE.plate,
            ...(ease ? { transition: ease } : {}),
          }}
          data-part="plate"
        />
      )}
      {clip ? (
        <div style={{ position: 'absolute', ...px(clip), overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: `${-clip.left}px`, top: `${-clip.top}px`, width: `${SCREEN.w}px`, height: `${SCREEN.h}px` }}>{body}</div>
        </div>
      ) : (
        body
      )}
      {pinned}
      {scrollH > 0 &&
        [
          scroll > 0 && { top: contentY, dir: 'to bottom' },
          scroll < scrollSpan && { top: contentY + scrollH - MENU.rowH, dir: 'to top' },
        ].map(
          (f, i) =>
            f && (
              <div
                key={`fade${i}`}
                style={{
                  position: 'absolute',
                  left: `${panel.left + MENU.border}px`,
                  top: `${f.top}px`,
                  width: `${panelW - MENU.border * 2}px`,
                  height: `${MENU.rowH}px`,
                  background: `linear-gradient(${f.dir}, ${SURFACE.panel}, rgba(22,24,32,0))`,
                }}
              />
            ),
        )}
      {vis < n && !scrollH && first > 0 && <Arrow cx={cx} y={contentY - MENU.arrowOff - arrowH} w={arrowW} h={arrowH} up />}
      {vis < n && !scrollH && first + vis < n && <Arrow cx={cx} y={contentY + vis * MENU.rowH + MENU.arrowOff} w={arrowW} h={arrowH} />}
    </div>
  )
}

/** The scroll arrow: a triangle pointing the way the list continues. */
function Arrow({ cx, y, w, h, up = false }: { cx: number; y: number; w: number; h: number; up?: boolean }) {
  return (
    <svg style={{ position: 'absolute', left: `${cx - w / 2}px`, top: `${y}px` }} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={up ? `${w / 2},0 ${w},${h} 0,${h}` : `0,0 ${w},0 ${w / 2},${h}`} fill={SURFACE.arrow} />
    </svg>
  )
}
