import type { CSSProperties, ReactNode } from 'react'
import { GeneratedArt, gradientArt } from '../../../widgets/GeneratedArt'
import { place, type Box } from '../../../layout/box'
import { PALETTE, ICON_COLORS } from '../palette'
import { FONT, TOP } from '../layout'

/**
 * SimpleOS's drawing parts.
 *
 * SimpleOS draws its own primitives - an 8x8 bitmap font blitted at integer scales, filled
 * rectangles, a few rounded panels - rather than composing a toolkit's widgets, so most of what
 * is here is its own. The widget kit supplies the grid geometry and the placeholder art; the rest
 * would not say anything more for being a widget.
 */

export const FONT_FAMILY = "'SimpleOS 8x8', monospace"

export type Align = 'left' | 'center' | 'right'

export interface PixelTextProps {
  readonly text: string
  /** The anchor: the left edge, the centre or the right edge, per `align`. */
  readonly x: number
  readonly top: number
  readonly font: number
  readonly color: string
  readonly align?: Align | undefined
  /** Hard clip at this many characters, with no ellipsis - which is what SimpleOS does. */
  readonly maxChars?: number | undefined
  /** An outline this many device pixels wide, in `outlineColor`. */
  readonly outline?: number | undefined
  readonly outlineColor?: string | undefined
}

/** Cut a string to a character count. Fixed-width, so characters are the whole measure. */
export function clipChars(text: string, max: number | undefined): string {
  return max === undefined ? text : text.slice(0, max)
}

/**
 * One run of text in the 8x8 font.
 *
 * The font is fixed-width with a one-em advance, so a string's width is its length times the font
 * size - and alignment is arithmetic done here rather than CSS centring. That is what a renderer
 * blitting glyphs has to do, and it is exact: every glyph lands on a whole device pixel.
 *
 * `white-space: pre` is load-bearing. SimpleOS lines its legends up into columns with runs of
 * spaces, and collapsing them would pull the second column in.
 */
export function PixelText({
  text,
  x,
  top,
  font,
  color,
  align = 'left',
  maxChars,
  outline,
  outlineColor = '#000000',
}: PixelTextProps) {
  const shown = clipChars(text, maxChars)
  const width = shown.length * font
  const left = align === 'center' ? Math.round(x - width / 2) : align === 'right' ? x - width : x

  const style: CSSProperties = {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${font}px`,
    fontFamily: FONT_FAMILY,
    fontSize: `${font}px`,
    lineHeight: `${font}px`,
    color,
    whiteSpace: 'pre',
    overflow: 'visible',
  }
  if (outline) {
    const o = outline
    style.textShadow = [
      [-o, -o],
      [0, -o],
      [o, -o],
      [-o, 0],
      [o, 0],
      [-o, o],
      [0, o],
      [o, o],
    ]
      .map(([dx, dy]) => `${dx}px ${dy}px 0 ${outlineColor}`)
      .join(', ')
  }

  return (
    <div style={style} data-text={shown}>
      {shown}
    </div>
  )
}

/** A filled, optionally rounded rectangle. SimpleOS's other primitive. */
export function Fill({
  box,
  color,
  shadow,
  border,
  children,
}: {
  box: Box
  color: string
  shadow?: string | undefined
  border?: string | undefined
  children?: ReactNode
}) {
  return (
    <div
      style={{
        ...place(box),
        background: color,
        boxShadow: shadow,
        border,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}

/** A panel-sized vertical wash, which every SimpleOS surface sits on. */
export function Wash({ from, to }: { from: string; to: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)`,
      }}
      data-part="wash"
    />
  )
}

/** The battery glyph in the title bar: an outline, a nub and a level. */
function Battery({ level }: { level: number }) {
  const b = TOP.battery
  const body = b.width - 4
  return (
    <div style={{ ...place(b) }} aria-label="battery">
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${body}px`,
          height: `${b.height}px`,
          border: `2px solid ${PALETTE.headerText}`,
          boxSizing: 'border-box',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `${body}px`,
          top: '4px',
          width: '3px',
          height: `${b.height - 8}px`,
          background: PALETTE.headerText,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '4px',
          top: '4px',
          width: `${Math.round((body - 8) * level)}px`,
          height: `${b.height - 8}px`,
          background: PALETTE.headerText,
        }}
      />
    </div>
  )
}

/** The title bar across the top panel: `SIMPLE OS`, the time, the battery. */
export function TitleBar({ time }: { time: string }) {
  return (
    <>
      <Fill box={TOP.header} color={PALETTE.header} />
      <PixelText
        text="SIMPLE OS"
        x={TOP.headerTitle.left}
        top={TOP.headerTitle.top}
        font={FONT.body}
        color={PALETTE.headerText}
      />
      <PixelText
        text={time}
        x={TOP.clockRight}
        top={TOP.headerTitle.top}
        font={FONT.body}
        color={PALETTE.headerText}
        align="right"
      />
      <Battery level={0.6} />
    </>
  )
}

/** The white card the top panel's content sits on. */
export function Card({ box = TOP.card }: { box?: Box }) {
  return <Fill box={box} color={PALETTE.card} shadow={`0 2px 8px ${PALETTE.cardShadow}`} />
}

/** A title's two colours: the backing panel, and the deeper tone its stand-in icon is drawn in. */
export function iconColors(game: number): readonly [string, string] {
  return ICON_COLORS[game % ICON_COLORS.length]!
}

/**
 * A stand-in for a game's banner icon.
 *
 * The real icon is the game's own 32x32 banner art, which the mockup does not ship. This is a
 * deterministic gradient in the title's colours with its initial set in SimpleOS's own font, so
 * the grid reads as a grid of distinct games and every capture is identical.
 */
export function GameIcon({ game, title, box }: { game: number; title: string; box: Box }) {
  const [backing, ink] = iconColors(game)
  const src = gradientArt({
    width: box.width,
    height: box.height,
    from: ink,
    to: backing,
    angle: 160,
  })
  const initial = title.replace(/[^A-Za-z0-9]/g, '').charAt(0).toUpperCase()
  const font = FONT.large * 2

  return (
    <>
      <GeneratedArt box={{ ...box, radius: 6 }} src={src} alt={title} pixelated />
      <PixelText
        text={initial}
        x={box.left + box.width / 2}
        top={box.top + (box.height - font) / 2}
        font={font}
        color="#ffffff"
        align="center"
        outline={3}
        outlineColor={ink}
      />
    </>
  )
}

/** A stand-in for one of a game's two screens: its colours, washed across the whole panel. */
export function GamePane({ game, title, which }: { game: number; title: string; which: 'top' | 'bottom' }) {
  const [backing, ink] = iconColors(game)
  const src = gradientArt({
    width: 640,
    height: 480,
    from: which === 'top' ? backing : ink,
    to: which === 'top' ? ink : backing,
    angle: which === 'top' ? 160 : 340,
  })
  return <GeneratedArt box={{ left: 0, top: 0, width: 640, height: 480 }} src={src} alt={`${title} (${which} screen)`} />
}

/** A settings row: label left, value right, the cursor row filled pale yellow. */
export function SettingRow({
  box,
  label,
  value,
  selected,
  padX,
}: {
  box: Box
  label: string
  value?: string | undefined
  selected: boolean
  padX: number
}) {
  const top = box.top + (box.height - FONT.body) / 2
  return (
    <div data-selected={selected || undefined}>
      <Fill
        box={box}
        color={selected ? PALETTE.rowSelected : PALETTE.row}
        shadow={selected ? undefined : `0 2px 0 ${PALETTE.rowShadow}`}
      />
      <PixelText
        text={label}
        x={box.left + padX}
        top={top}
        font={FONT.body}
        color={PALETTE.rowText}
        maxChars={Math.floor((box.width - padX * 2) / FONT.body) - (value ? value.length + 1 : 0)}
      />
      {value ? (
        <PixelText
          text={value}
          x={box.left + box.width - padX}
          top={top}
          font={FONT.body}
          color={PALETTE.rowValue}
          align="right"
        />
      ) : null}
    </div>
  )
}
