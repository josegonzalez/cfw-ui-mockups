import type { CSSProperties, ReactNode } from 'react'
import { Animated } from '../../../anim/Animated'
import type { StoryboardMap, TransitionSpec } from '../../../anim/types'
import { transitionsToCss } from '../../../anim/waapi'
import { menuImg } from '../assets'
import { ARROW, BORDER_X } from '../layout'
import { MOTION } from '../motion'
import { PALETTE } from '../palette'

/**
 * The drawing primitives every Wii Menu view is built from. Coordinates are pixels of the Wii's
 * 608x456 frame, which the root places 1:1 inside the panel (`layout.ts`).
 */

export interface Box {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

export const abs = ({ x, y, w, h }: Box): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h })

/** A transition that exists only while motion is on, so a still is drawn at rest. */
export const motion = (animate: boolean, specs: readonly TransitionSpec[]) => transitionsToCss(animate ? specs : [])

/** A texture at a size. WM4K's textures are smooth art, so they are filtered, not pixelated. */
export function Img({ src, box, style }: { src: string; box: Box; style?: CSSProperties }) {
  return <img alt="" src={src} draggable={false} style={{ ...abs(box), ...style }} />
}

export type Weight = 400 | 500 | 700

export interface TextProps {
  readonly box: Box
  readonly size: number
  readonly weight?: Weight
  readonly color?: string
  readonly align?: 'left' | 'center' | 'right'
  /** One line, cut with an ellipsis; or wrapped onto as many lines as the box holds. */
  readonly wrap?: boolean
  readonly lineHeight?: number
  readonly children: ReactNode
}

/** Text in M PLUS 1p, the stand-in for the Wii's Rodin NTLG. */
export function Text({ box, size, weight = 500, color = PALETTE.ink, align = 'center', wrap = false, lineHeight, children }: TextProps) {
  return (
    <div
      className="wii-text"
      style={{
        ...abs(box),
        fontSize: size,
        fontWeight: weight,
        color,
        textAlign: align,
        lineHeight: `${lineHeight ?? (wrap ? Math.round(size * 1.35) : box.h)}px`,
        whiteSpace: wrap ? 'normal' : 'nowrap',
        overflow: 'hidden',
        textOverflow: wrap ? undefined : 'ellipsis',
      }}
    >
      {children}
    </div>
  )
}

export type PillTone = 'light' | 'dark'

/**
 * The System Menu's button: a white pill with a glossy top half and a cyan rim. Focus thickens the
 * rim and lifts the fill, which is how the reference frames show the pointer resting on one; a
 * disabled button keeps its shape with a grey label.
 */
export function Pill({
  box,
  label,
  focused = false,
  disabled = false,
  size = 26,
  tone = 'light',
}: {
  box: Box
  label: string
  focused?: boolean
  disabled?: boolean
  size?: number
  tone?: PillTone
}) {
  const rim = disabled ? PALETTE.tileEdge : focused ? PALETTE.cyan : PALETTE.cyanSoft
  return (
    <div
      className="wii-pill"
      data-focused={focused || undefined}
      style={{
        ...abs(box),
        borderRadius: box.h / 2,
        border: `${focused ? 3 : 2}px solid ${rim}`,
        background:
          tone === 'dark'
            ? 'linear-gradient(#f4f6f7 0%, #e3e6e8 50%, #cfd3d6 51%, #dfe2e4 100%)'
            : focused
              ? 'linear-gradient(#ffffff 0%, #f6fbfe 50%, #e4f1f8 51%, #f3f8fb 100%)'
              : 'linear-gradient(#ffffff 0%, #f5f6f7 50%, #e6e8ea 51%, #f1f2f3 100%)',
        boxShadow: focused ? `0 0 8px ${PALETTE.cyanSoft}` : '0 1px 2px rgba(0,0,0,0.18)',
        boxSizing: 'border-box',
      }}
    >
      <Text
        box={{ x: 0, y: 0, w: box.w - (focused ? 6 : 4), h: box.h - (focused ? 6 : 4) }}
        size={size}
        weight={500}
        color={disabled ? PALETTE.disabled : PALETTE.ink}
      >
        {label}
      </Text>
    </div>
  )
}

const BUBBLE_IN: StoryboardMap = {
  open: { animations: [{ property: 'opacity', from: 0, begin: MOTION.bubbleDelay, duration: 67, mode: 'linear' }] },
}

/**
 * The name bubble the menu shows under whatever the pointer rests on: a white pill with a grey
 * edge, its text grey (`frames/menu-hover.png`, "Disc Channel"). It appears once the pointer has
 * rested a moment, so callers key it by what it names and it waits again for each.
 */
export function Bubble({ x, y, label }: { x: number; y: number; label: string }) {
  // The bubble is as wide as its label; M PLUS 1p at 21px averages about 11px a glyph.
  const w = Math.round(label.length * 11 + 34)
  return (
    <Animated
      storyboard={BUBBLE_IN}
      event="open"
      className="wii-bubble"
      style={{
        ...abs({ x, y, w, h: 36 }),
        borderRadius: 18,
        background: '#ffffff',
        border: `2px solid ${PALETTE.tileEdge}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        boxSizing: 'border-box',
      }}
    >
      <Text box={{ x: 0, y: 0, w: w - 4, h: 32 }} size={21} weight={500} color={PALETTE.inkSoft}>
        {label}
      </Text>
    </Animated>
  )
}

/**
 * The page arrows bob inward and back out together, two of the Wii's pixels, on every screen that
 * has them. `offsetX` is a fraction of the panel's width, which is the Wii's frame plus its border.
 */
const BOB = 2 / (608 + 2 * BORDER_X)
const bob = (dir: 1 | -1): StoryboardMap => ({
  _: {
    animations: [
      { property: 'offsetX', from: 0, to: dir * BOB, duration: MOTION.arrowBob, mode: 'easeInOut', autoreverse: true, repeat: 'forever' },
    ],
  },
})
const BOB_LEFT = bob(1)
const BOB_RIGHT = bob(-1)

/** A page arrow at its place over the left or right edge of the screen. */
export function PageArrow({ side }: { side: 'left' | 'right' }) {
  const cx = side === 'left' ? ARROW.leftCx : ARROW.rightCx
  return (
    <Animated
      storyboard={side === 'left' ? BOB_LEFT : BOB_RIGHT}
      event="_"
      style={abs({ x: cx - ARROW.size / 2, y: ARROW.cy - ARROW.size / 2, w: ARROW.size, h: ARROW.size })}
    >
      <Img src={menuImg(side === 'left' ? 'arrow-left' : 'arrow-right')} box={{ x: 0, y: 0, w: ARROW.size, h: ARROW.size }} />
    </Animated>
  )
}

/** The seven-segment clock: WM4K's own digit, colon and AM/PM textures, already tinted grey. */
export function Clock({ cx, cy, hour, minute, pm, digit }: { cx: number; cy: number; hour: number; minute: number; pm: boolean; digit: number }) {
  const glyphs = [...String(hour), ':', ...String(minute).padStart(2, '0')]
  // Each digit texture is square with the digit inset; the reference advances about 0.6 of its size.
  const advance = Math.round(digit * 0.6)
  const colon = Math.round(digit * 0.4)
  const widths = glyphs.map((g) => (g === ':' ? colon : advance))
  const suffixW = Math.round(digit * 0.64)
  const total = widths.reduce((a, b) => a + b, 0) + 8 + suffixW
  let x = Math.round(cx - total / 2)
  const top = Math.round(cy - digit / 2)
  const parts = glyphs.map((g, i) => {
    const w = widths[i]!
    const src = g === ':' ? menuImg('colon') : menuImg(`digit-${g}`)
    // The texture is square with the glyph centred, so it is centred on its advance.
    const box = { x: x - Math.round((digit - w) / 2), y: top, w: digit, h: digit }
    x += w
    return <Img key={i} src={src} box={box} />
  })
  const suffixH = Math.round(suffixW * (32 / 48))
  return (
    <>
      {parts}
      <Img src={menuImg(pm ? 'pm' : 'am')} box={{ x: x + 8, y: top + digit - suffixH - 3, w: suffixW, h: suffixH }} />
    </>
  )
}
