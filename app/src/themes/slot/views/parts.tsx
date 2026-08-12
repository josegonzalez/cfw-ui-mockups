/**
 * PORTING NOTES
 * CFW: slot (a GBA-only frontend for the Anbernic RG SP)
 * Devices: rg-sp (720x480)
 * Source: crates/slot-ui/src/{slot_chrome,plate,hud,icon}.rs
 * Mode: reproduce
 *
 * The pieces every screen is assembled from.
 *
 * Layout:
 *   - 720x480, literal pixels. slot has no scale factor: one device, one output size.
 *   - The slot band occupies the bottom 58px on every screen, so the bottom of the display is
 *     the same object throughout rather than appearing only during the insert.
 * Colors:
 *   - Four case colours from `System/theme.txt` (housing, recess, opening, edge); everything
 *     else is a literal at its use site. There is no palette.
 * Focus & selection:
 *   - The shelf has the only cursor. Selection is the centre position, not a highlight.
 * Buttons:
 *   - Key caps are rounded squares with the letter in them, drawn beside their label.
 * Transitions:
 *   - See `motion.ts`. Neither of slot's two motions is a timeline.
 */
import type { CSSProperties, ReactNode } from 'react'
import {
  BAY,
  BAY_X,
  BAND_Y,
  CENTER,
  HINT,
  LIP_H,
  MOUTH,
  MOUTH_X,
  OUT,
  RECESS_H,
  RIM_W,
  SCOOP,
  SCOOP_D,
  SLIT,
  PLATE_PX,
} from '../layout'

/** The four case colours, at their defaults. A card may override them in `System/theme.txt`. */
export const CASE = {
  housing: '#242429',
  recess: '#1a1a1d',
  opening: '#050508',
  edge: '#4d4d57',
} as const

export function Band({
  x,
  y,
  w,
  h,
  fill,
  alpha = 1,
}: {
  x: number
  y: number
  w: number
  h: number
  fill: string
  alpha?: number
}) {
  const style: CSSProperties = { left: x, top: y, width: w, height: h, background: fill }
  if (alpha !== 1) style.opacity = alpha
  return <div className="slot-band" style={style} />
}

/**
 * The thumb scoop: one broad arc across the middle of the bay's near wall.
 *
 * `depth(x) = SCOOP_D * (1 - |x/hw|^SCOOP_FLAT)`, flattened to power 4 because "an ellipse bottoms
 * out in a curve where the real scoop runs almost level and then turns up hard at the ends". The
 * source walks it by column and merges equal-depth spans; here it is one path, which is the same
 * curve without the quantisation.
 */
export function scoopPath(y: number): string {
  const hw = SCOOP.w / 2
  const steps = 48
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = -hw + (i / steps) * SCOOP.w
    const d = SCOOP_D * Math.max(0, 1 - Math.pow(Math.abs(x) / hw, SCOOP.flat))
    pts.push(`${(CENTER.x + x).toFixed(2)} ${(y + d).toFixed(2)}`)
  }
  return `M${CENTER.x - hw} ${y} L${pts.join(' L')} L${CENTER.x + hw} ${y} Z`
}

/**
 * The slot, in two halves.
 *
 * The back is the hole and what is inside it; the front is the plastic around that hole, never
 * over it. Drawing only the front leaves "a hole onto the backdrop rather than an opening in a
 * device", which is why both exist - and why the cart is drawn between them.
 */
export function SlotBack({ alpha = 1 }: { alpha?: number }) {
  return (
    <>
      <Band x={BAY_X} y={BAND_Y} w={BAY.w} h={LIP_H} fill={CASE.housing} alpha={alpha} />
      <Band x={MOUTH_X} y={BAND_Y} w={MOUTH.w} h={LIP_H} fill={CASE.edge} alpha={alpha} />
      <Band x={BAY_X} y={BAY.y} w={BAY.w} h={RECESS_H} fill={CASE.recess} alpha={alpha} />
      <Band x={MOUTH_X} y={SLIT.y} w={MOUTH.w} h={SLIT.h} fill={CASE.opening} alpha={alpha} />
      <svg
        className="slot-piece"
        style={{ left: 0, top: 0, width: OUT.w, height: OUT.h, opacity: alpha }}
        width={OUT.w}
        height={OUT.h}
        aria-hidden
      >
        <path d={scoopPath(SCOOP.y)} fill={CASE.opening} />
      </svg>
    </>
  )
}

export function SlotFront({ alpha = 1 }: { alpha?: number }) {
  const right = BAY_X + BAY.w
  const floor = SCOOP.y + SCOOP_D + RIM_W

  return (
    <>
      <Band x={0} y={BAND_Y} w={BAY_X} h={MOUTH.h} fill={CASE.housing} alpha={alpha} />
      <Band x={right} y={BAND_Y} w={OUT.w - right} h={MOUTH.h} fill={CASE.housing} alpha={alpha} />
      <Band
        x={BAY_X}
        y={SCOOP.y}
        w={CENTER.x - SCOOP.w / 2 - BAY_X}
        h={floor - SCOOP.y}
        fill={CASE.housing}
        alpha={alpha}
      />
      <Band
        x={CENTER.x + SCOOP.w / 2}
        y={SCOOP.y}
        w={right - (CENTER.x + SCOOP.w / 2)}
        h={floor - SCOOP.y}
        fill={CASE.housing}
        alpha={alpha}
      />
      {/* The plastic under the cut, then its lit rim over the top so nothing paints over it. */}
      <svg
        className="slot-piece"
        style={{ left: 0, top: 0, width: OUT.w, height: OUT.h, opacity: alpha }}
        width={OUT.w}
        height={OUT.h}
        aria-hidden
      >
        <path
          d={`${scoopPath(SCOOP.y + RIM_W)} M${CENTER.x - SCOOP.w / 2} ${floor} H${CENTER.x + SCOOP.w / 2} V${SCOOP.y} H${CENTER.x - SCOOP.w / 2} Z`}
          fill={CASE.housing}
          fillRule="evenodd"
        />
        <path
          d={scoopPath(SCOOP.y)}
          fill="none"
          stroke={CASE.edge}
          strokeWidth={RIM_W}
          transform={`translate(0 ${RIM_W / 2})`}
        />
      </svg>
      <Band x={0} y={floor} w={OUT.w} h={OUT.h - floor} fill={CASE.housing} alpha={alpha} />
    </>
  )
}

/** The slot with nothing going into it, which the shelf and the clock both draw. */
export function EmptySlot() {
  return (
    <>
      <SlotBack />
      <SlotFront />
    </>
  )
}

/* ---- text and caps ------------------------------------------------------ */

export function Text({
  x,
  y,
  w,
  h,
  px,
  colour,
  align = 'left',
  halo = false,
  children,
}: {
  x: number
  y: number
  w?: number | undefined
  h: number
  px: number
  colour: string
  align?: 'left' | 'center' | 'right' | undefined
  halo?: boolean | undefined
  children: ReactNode
}) {
  const style: CSSProperties = {
    left: x,
    top: y,
    height: h,
    fontSize: px,
    color: colour,
    justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
  }
  if (w !== undefined) style.width = w

  return (
    <div className={halo ? 'slot-text slot-text--halo' : 'slot-text'} style={style}>
      {children}
    </div>
  )
}

/** A key cap and its label: the hint form used on the shelf, the switcher and the clock. */
export function Hint({
  x,
  y,
  keyName,
  label,
  halo = false,
}: {
  x: number
  y: number
  keyName: string
  label: string
  halo?: boolean | undefined
}) {
  return (
    <>
      <div
        className="slot-cap"
        style={{
          left: x,
          top: y + (HINT.h - HINT.cap) / 2,
          width: HINT.cap,
          height: HINT.cap,
          fontSize: PLATE_PX.key,
        }}
      >
        {keyName}
      </div>
      <Text
        x={x + HINT.cap + HINT.capGap}
        y={y}
        h={HINT.h}
        px={PLATE_PX.label}
        colour="#f6f4ef"
        halo={halo}
      >
        {label}
      </Text>
    </>
  )
}

/** Width of a hint, so a row of them can be centred or right-anchored before it is drawn. */
export function hintWidth(label: string): number {
  return HINT.cap + HINT.capGap + label.length * PLATE_PX.label * 0.54
}
