import type { CSSProperties, ReactNode } from 'react'
import { Animated } from '../../../anim/Animated'
import { bios } from '../assets'
import { BACK_SIZE, BAR, CELL, CLOCK, DIALOG, H, LOGO, REAL_MODE_VIEW, W, type Box } from '../layout'
import type { VmuFile } from '../library'
import { BLINK, DIALOG_IN } from '../motion'
import { PALETTE } from '../palette'
import { runs } from '../strings'

/**
 * The drawing primitives every BIOS view is built from. Coordinates are pixels of the 640x480
 * frame (`layout.ts`).
 */

export const abs = ({ x, y, w, h }: Box): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h })

export function Img({ src, box, style }: { src: string; box: Box; style?: CSSProperties }) {
  return <img alt="" src={src} draggable={false} style={{ ...abs(box), ...style }} />
}

/**
 * How far one narrow glyph moves the pen, in device pixels, per kind of text. The font is
 * monospaced on a 12-pixel cell, but the menu draws its glyphs as quads it squeezes to a width
 * that differs by where the text is. Each is a whole string's span over its glyph count, measured
 * in the reference frames: the first-boot box's date spans 188 pixels over 16 glyphs
 * (`boot-clock.png`) and a save's date 187 (`file-list.png`); the top bar's date 173 (`main.png`)
 * and Settings' "Language" 88 over 8; its "Auto start 'OFF'" 162 over 16 (`settings.png`); and
 * the Language box's title 255 over 26 (`settings-language.png`).
 */
export const ADVANCE = { dialogDate: 12, label: 11, value: 10.25, title: 10 } as const

export interface TextProps {
  readonly box: Box
  /** A string from `strings.ts`, escapes and all. */
  readonly children: string
  readonly align?: 'left' | 'center' | 'right'
  /** How far one narrow glyph moves the pen; `ADVANCE`. The glyph is squeezed to match. */
  readonly advance?: number
  /** Font pixels per device pixel vertically: 1 for the menu's text, 2 for Music's readouts, a half for a save's block count. */
  readonly scale?: 0.5 | 1 | 2
  readonly fill?: string
  /** The halo's colour, or `null` to draw the bold face alone. */
  readonly edge?: string | null
  readonly hot?: string
}

/**
 * Text in the BIOS system font, as the menu draws it: the halo face in `edge`, and the bold face in
 * `fill` over it. The two faces share every metric, so the halo lands exactly round its glyph. The
 * glyphs are laid out on their own 12-pixel cell and the line squeezed to `advance`, from the side
 * it is aligned to.
 */
export function Text({
  box,
  children,
  align = 'left',
  advance = ADVANCE.label,
  scale = 1,
  fill = PALETTE.text,
  edge = PALETTE.textEdge,
  hot = PALETTE.textHot,
}: TextProps) {
  const parts = runs(children)
  const squeeze = advance / (CELL.w * scale)
  const origin = align === 'center' ? 'center' : align
  const face = (cls: string, color: (hotRun: boolean) => string) => (
    <div
      className={`dc-text ${cls}`}
      style={{
        position: 'absolute',
        top: 0,
        left: align === 'right' ? box.w - box.w / squeeze : align === 'center' ? (box.w - box.w / squeeze) / 2 : 0,
        width: box.w / squeeze,
        height: box.h,
        fontSize: CELL.h * scale,
        lineHeight: `${box.h}px`,
        textAlign: align,
        transform: `scaleX(${squeeze})`,
        transformOrigin: `${origin} center`,
      }}
    >
      {parts.map((r, i) => (
        <span key={i} style={{ color: color(r.hot) }}>
          {r.text}
        </span>
      ))}
    </div>
  )
  return (
    <div style={abs(box)}>
      {edge ? face('dc-edge', () => edge) : null}
      {face('dc-fill', (h) => (h ? hot : fill))}
    </div>
  )
}

/** Several lines of text centred on `cy`s, `pitch` apart - a dialog's message, by default. */
export function Lines({
  x,
  cy,
  w,
  pitch,
  lines,
  align = 'center',
  advance = ADVANCE.title,
}: {
  x: number
  cy: number
  w: number
  pitch: number
  lines: readonly string[]
  align?: 'left' | 'center'
  advance?: number
}) {
  return (
    <>
      {lines.map((line, i) => (
        <Text key={i} box={{ x, y: cy + i * pitch - CELL.h / 2, w, h: CELL.h }} align={align} advance={advance}>
          {line}
        </Text>
      ))}
    </>
  )
}

/** The hidden 3D mode's view of what is under the top bar, or nothing out of it. */
export function RealModeView({ on, origin = REAL_MODE_VIEW.origin, children }: { on: boolean; origin?: readonly [number, number]; children: ReactNode }) {
  if (!on) return <>{children}</>
  const [ox, oy] = origin
  return (
    <div style={{ ...abs({ x: 0, y: 0, w: W, h: H }), transform: `scale(${REAL_MODE_VIEW.scale})`, transformOrigin: `${ox}px ${oy}px` }}>
      {children}
    </div>
  )
}

/** The top bar: the ROM's own logo, and the console's clock in the bar's dark grey. */
export function TopBar({ clock }: { clock: string }) {
  return (
    <>
      <div style={{ ...abs({ x: 0, y: 0, w: W, h: BAR.h }), background: PALETTE.bar }} />
      <Img src={bios('logo')} box={LOGO} />
      <Text box={{ x: CLOCK.right - 300, y: CLOCK.y, w: 300, h: CELL.h }} align="right" fill={PALETTE.barInk} edge={null}>
        {clock}
      </Text>
    </>
  )
}

/**
 * BACK: the ROM's texture in a thin frame. Idle, the menu shows through its swirl; focused, the
 * swirl is red and the frame yellow (`frames/cards-back.png`).
 */
export function BackButton({ x, y, focused }: { x: number; y: number; focused: boolean }) {
  return (
    <div
      data-focused={focused || undefined}
      style={{
        ...abs({ x, y, w: BACK_SIZE, h: BACK_SIZE }),
        background: PALETTE.backFill,
        border: `3px solid ${focused ? PALETTE.backRimFocus : PALETTE.backRim}`,
        borderRadius: 4,
        boxSizing: 'border-box',
      }}
    >
      <Img src={bios(focused ? 'back-focus' : 'back')} box={{ x: 0, y: 0, w: BACK_SIZE - 6, h: BACK_SIZE - 6 }} />
    </div>
  )
}

/** A dialog's box: near-black and a little see-through, in a rim of the screen's colour. */
export function DialogBox({ box, rim, children }: { box: Box; rim: string; children?: ReactNode }) {
  return (
    <Animated storyboard={DIALOG_IN} event="open" style={abs(box)}>
      <div
        style={{
          ...abs({ x: 0, y: 0, w: box.w, h: box.h }),
          background: PALETTE.dialog,
          border: `${DIALOG.rim}px solid ${rim}`,
          borderRadius: DIALOG.radius,
          boxSizing: 'border-box',
        }}
      />
      {children}
    </Animated>
  )
}

/** An option's blob, green; focused, a yellow one over it blinks. */
export function Blob({ cx, cy, focused }: { cx: number; cy: number; focused: boolean }) {
  const { w, h } = DIALOG.blob
  const box = { x: cx - w / 2, y: cy - h / 2, w, h }
  return (
    <>
      <div style={{ ...abs(box), borderRadius: '50%', background: PALETTE.blob }} />
      {focused ? (
        <Animated storyboard={BLINK} event="_" style={{ ...abs(box), borderRadius: '50%', background: PALETTE.blobFocus }} />
      ) : null}
    </>
  )
}

/** An option: its blob, and its label starting over the blob's middle. */
export function Option({ x, cy, label, focused }: { x: number; cy: number; label: string; focused: boolean }) {
  return (
    <div data-focused={focused || undefined}>
      <Blob cx={x} cy={cy} focused={focused} />
      <Text box={{ x: x + 2, y: cy - CELL.h / 2, w: 300, h: CELL.h }}>{label}</Text>
    </div>
  )
}

/**
 * A save's icon. The icon is the game's own art, which this port does not carry, so each is a
 * placeholder drawn from the save's two colours - fixed per save, so a capture never changes.
 */
export function VmuIcon({ file, box, blocks = true }: { file: VmuFile; box: Box; blocks?: boolean }) {
  const [a, b] = file.icon
  return (
    <div style={{ ...abs(box), background: '#101010' }}>
      <svg viewBox="0 0 32 32" width={box.w} height={Math.min(box.w, box.h)} style={{ position: 'absolute', left: 0, top: 0 }}>
        <rect width="32" height="32" fill={b} />
        <circle cx="16" cy="13" r="9" fill={a} />
        <rect x="6" y="22" width="20" height="6" fill={a} opacity="0.7" />
      </svg>
      {blocks ? (
        <Text box={{ x: 0, y: box.h - CELL.h / 2 - 1, w: box.w - 2, h: CELL.h / 2 }} align="right" scale={0.5} advance={6} fill="#f4f4f4" edge={null}>
          {String(file.blocks)}
        </Text>
      ) : null}
    </div>
  )
}
