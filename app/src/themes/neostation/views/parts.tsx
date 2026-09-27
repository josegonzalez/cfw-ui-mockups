import { createContext, use, type CSSProperties, type ReactNode } from 'react'
import { transitionsToCss } from '../../../anim/waapi'
import type { TransitionSpec } from '../../../anim/types'
import { gamepad } from '../assets'
import type { NeoUnits } from '../layout'
import { RADII, alpha, type NeoPalette } from '../palette'
import { SYMBOLS, UNFILLED, type SymbolName } from '../symbols'
import { textWidth as textWidthOf } from '../text'

/**
 * NeoStation's drawing primitives: its glass, its icons and glyphs, and the one pill every hint and
 * button is drawn as. Each is the source widget of the same name, sized in the source's units.
 */

export interface Neo {
  readonly u: NeoUnits
  readonly p: NeoPalette
  /** `CornerRadii`, already scaled to device px. */
  readonly radius: { readonly external: number; readonly internal: number }
  readonly animate: boolean
  /** False in fallback render mode: no blur, no masks, no blend modes. */
  readonly web: boolean
  /** Settings > Themes' NeoGlass: blur sigma, transparency 0-30, rim width in logical px. */
  readonly glass: { readonly blur: number; readonly transparency: number; readonly border: number }
}

export const NeoContext = createContext<Neo | null>(null)

export function useNeo(): Neo {
  const neo = use(NeoContext)
  if (!neo) throw new Error('NeoStation part outside its theme root')
  return neo
}

export function makeNeo(u: NeoUnits, p: NeoPalette, animate: boolean, web: boolean, glass: Neo['glass']): Neo {
  const r = RADII[p.radius]
  return { u, p, radius: { external: u.r(r.external), internal: u.r(r.internal) }, animate, web, glass }
}

/** A transition that only exists while motion is on, so a still is drawn at rest. */
export function motion(neo: Neo, specs: readonly TransitionSpec[]): string {
  return transitionsToCss(neo.animate ? specs : [])
}

/** Anta's line box: ascent 1966 plus descent 534, at 2048 units per em. */
export const LINE = 2500 / 2048

export const FONT = "'NeoStation Anta'"

export interface Box {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

export const abs = (b: Box): CSSProperties => ({
  position: 'absolute',
  left: b.left,
  top: b.top,
  width: b.width,
  height: b.height,
})

/**
 * `NeoGlass` (`lib/widgets/neo_glass.dart`): the scaffold colour at `(60 - transparency) / 60` over
 * whatever is behind, frosted by the Glass Blur setting when it is on, and a white rim painted
 * outside the box in overlay blend - brightest at the top left. The three settings default to no
 * blur, transparency 10 and a 2px rim, and Settings > Themes changes them.
 *
 * Blur and the rim are web-only effects. Without them the glass is its flat tint, which is also what
 * the source draws with Glass Blur and Glass Border set to Off.
 */
export function NeoGlass({ box, radius, children }: { box: Box; radius: number; children?: ReactNode }) {
  const neo = useNeo()
  const { blur, transparency, border } = neo.glass
  const stroke = neo.u.px(border)
  const tint = alpha(neo.p.background, (60 - transparency) / 60)
  const frost = neo.web && blur > 0 ? { backdropFilter: `blur(${neo.u.px(blur)}px)`, WebkitBackdropFilter: `blur(${neo.u.px(blur)}px)` } : {}
  return (
    <div style={{ ...abs(box) }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, background: tint, overflow: 'hidden', ...frost }} />
      {neo.web && stroke > 0 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: -stroke,
            borderRadius: radius + stroke,
            padding: stroke,
            background:
              'linear-gradient(to bottom right, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.64) 60%, rgba(255,255,255,0.16) 100%)',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
      )}
      {children}
    </div>
  )
}

/**
 * A Material Symbol, `size` device px square - Flutter's `Icon`. Filled, as the app's icon theme
 * draws every one, unless `fill={false}` for the few the source draws open.
 */
export function Sym({
  name,
  size,
  color,
  fill = true,
  style,
}: {
  name: SymbolName
  size: number
  color: string
  fill?: boolean
  style?: CSSProperties
}) {
  const s = SYMBOLS[name]
  if (!fill && !UNFILLED.includes(name)) throw new Error(`No unfilled face for ${name}`)
  const family = !fill
    ? "'NeoStation Symbols Unfilled'"
    : s.family === 'rounded'
      ? "'NeoStation Symbols Rounded'"
      : "'NeoStation Symbols Outlined'"
  return (
    <span
      aria-hidden
      style={{
        display: 'block',
        width: size,
        height: size,
        fontFamily: family,
        fontSize: size,
        lineHeight: `${size}px`,
        textAlign: 'center',
        color,
        overflow: 'hidden',
        ...style,
      }}
    >
      {String.fromCodePoint(s.cp)}
    </span>
  )
}

/**
 * A monochrome image drawn in one colour - `Image.asset(color: c)`, whose default blend is `srcIn`.
 * That is a tint rather than an arbitrary mask: a simple renderer draws it as a white glyph under a
 * colour mod. The web gets there by masking a fill with the image, so it is the same in both modes.
 * Falling back to the image as it is drew every button glyph black on a dark pill.
 */
export function Tinted({
  src,
  box,
  color,
  fit = 'contain',
}: {
  src: string
  box: Box
  color: string
  fit?: 'contain' | 'cover'
}) {
  return (
    <div
      aria-hidden
      style={{
        ...abs(box),
        background: color,
        maskImage: `url("${src}")`,
        WebkitMaskImage: `url("${src}")`,
        maskSize: fit,
        WebkitMaskSize: fit,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  )
}

/** One line of Anta, its box exactly one line tall. */
export function Txt({
  children,
  size,
  color,
  weight = 400,
  letterSpacing = 0,
  style,
}: {
  children: ReactNode
  size: number
  color: string
  weight?: number
  letterSpacing?: number
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        display: 'block',
        fontFamily: FONT,
        fontSize: size,
        lineHeight: `${size * LINE}px`,
        height: size * LINE,
        fontWeight: weight,
        // Anta has one upright face. Flutter emboldens it for w600 and up and slants it for italic, so the browser may too.
        fontSynthesis: 'weight style',
        letterSpacing,
        color,
        whiteSpace: 'pre',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/**
 * `BumperGlyph` (`lib/widgets/bumper_glyph.dart`): the LB/RB outline in `onSurface` over a filled
 * copy in `surface`, with a blurred half-alpha `surface` halo so it reads over any backdrop. The
 * halo is web-only.
 */
export function BumperGlyph({ left, box }: { left: boolean; box: Box }) {
  const neo = useNeo()
  const side = left ? 'LB' : 'RB'
  const inner = { left: 0, top: 0, width: box.width, height: box.height }
  return (
    <div style={abs(box)}>
      {neo.web && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            filter: `blur(${neo.u.r(1.5)}px)`,
          }}
        >
          <Tinted src={gamepad(`Xbox_${side}_bumper_filled`)} box={inner} color={alpha(neo.p.surface, 0.5)} />
        </div>
      )}
      <Tinted src={gamepad(`Xbox_${side}_bumper_filled`)} box={inner} color={neo.p.surface} />
      <Tinted src={gamepad(`Xbox_${side}_bumper`)} box={inner} color={neo.p.onSurface} />
    </div>
  )
}

/** `lightenColor` (`lib/utils/color.dart:3-7`): HSL lightness up by `amount`, clamped. */
export function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1, 7), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h /= 6
  }
  const l2 = Math.min(1, l + amount)
  const q = l2 < 0.5 ? l2 * (1 + s) : l2 + s - l2 * s
  const pp = 2 * l2 - q
  const hue = (t: number) => {
    const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t
    if (x < 1 / 6) return pp + (q - pp) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return pp + (q - pp) * (2 / 3 - x) * 6
    return pp
  }
  const c = (v: number) => Math.round(v * 255)
  return `rgb(${c(s ? hue(h + 1 / 3) : l2)},${c(s ? hue(h) : l2)},${c(s ? hue(h - 1 / 3) : l2)})`
}

/**
 * A `BoxShadow` as CSS. Flutter turns `blurRadius` into a Gaussian sigma of `0.57735 * r + 0.5`
 * logical px (`BoxShadow.convertRadiusToSigma`); a CSS blur length is twice its sigma.
 */
export function shadow(neo: Neo, color: string, blur: number, dx: number, dy: number): string {
  const sigma = 0.57735 * blur + neo.u.px(0.5)
  return `${dx}px ${dy}px ${2 * sigma}px ${color}`
}

/** `GamepadControl` (`lib/widgets/core_footer.dart:121-226`): a glyph and a label in a pill. */
export function controlWidth(neo: Neo, label: string): number {
  const { u } = neo
  return u.r(1) * 2 + u.r(6) * 2 + u.r(18) + u.r(4) + textWidthOf(label, u.r(12), u.r(0.2)) + u.r(4)
}

export const controlHeight = (neo: Neo) => neo.u.r(1) * 2 + neo.u.r(4) * 2 + neo.u.r(18)

export function GamepadControl({
  glyph,
  label,
  bg,
  fg,
  left,
  top,
  onTap,
}: {
  glyph: string
  label: string
  bg: string
  fg: string
  left: number
  top: number
  onTap?: (() => void) | undefined
}) {
  const neo = useNeo()
  const { u } = neo
  const w = controlWidth(neo, label)
  const h = controlHeight(neo)
  const b = u.r(1)
  return (
    <div
      onClick={onTap}
      style={{
        ...abs({ left, top, width: w, height: h }),
        boxSizing: 'border-box',
        background: bg,
        border: `${b}px solid ${lighten(bg, 0.05)}`,
        borderRadius: neo.radius.internal,
        boxShadow: shadow(neo, alpha(neo.p.shadow, 0.1), u.r(4), u.r(2), u.r(2)),
        cursor: onTap ? 'pointer' : undefined,
      }}
    >
      <Tinted src={gamepad(glyph)} box={{ left: u.r(6), top: u.r(4), width: u.r(18), height: u.r(18) }} color={fg} />
      <Txt
        size={u.t(12)}
        color={fg}
        weight={600}
        letterSpacing={u.r(0.2)}
        style={{
          position: 'absolute',
          left: u.r(6) + u.r(18) + u.r(4),
          top: u.r(4) + (u.r(18) - u.t(12) * LINE) / 2,
        }}
      >
        {label}
      </Txt>
    </div>
  )
}
