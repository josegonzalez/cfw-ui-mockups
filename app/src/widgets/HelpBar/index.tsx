import type { CSSProperties } from 'react'
import { place, type Box } from '../../layout/box'
import type { Button } from '../../input/keymap'

/** Buttons a help hint can refer to. */
export type HelpGlyph = Extract<
  Button,
  'a' | 'b' | 'x' | 'y' | 'l' | 'r' | 'start' | 'select' | 'menu'
>

export interface HelpItem {
  readonly glyph: HelpGlyph
  readonly label: string
}

/**
 * How the glyph is drawn.
 *
 * - `circle` - a filled disc with the letter knocked out, and a pill pictogram for Start and
 *   Select, which have no letter on real hardware.
 * - `plain`  - the letter alone, in the accent colour.
 */
export type HelpBadgeStyle = 'circle' | 'plain'

export interface HelpBarColors {
  readonly fg: string
  readonly badgeBg?: string | undefined
  readonly badgeFg?: string | undefined
}

export interface HelpBarProps {
  readonly box: Box
  readonly items: readonly HelpItem[]
  readonly colors: HelpBarColors
  readonly font: number
  readonly badge?: HelpBadgeStyle | undefined
  /** Gap between hints, in device pixels. Defaults to a proportion of the font size. */
  readonly gap?: number | undefined
  readonly uppercase?: boolean | undefined
  readonly bold?: boolean | undefined
}

const GLYPH_TEXT: Record<HelpGlyph, string> = {
  a: 'A',
  b: 'B',
  x: 'X',
  y: 'Y',
  l: 'L',
  r: 'R',
  start: 'START',
  select: 'SELECT',
  menu: 'MENU',
}

/** Start and Select are drawn as a pictogram, because neither carries a letter on the hardware. */
const PILL_GLYPHS = new Set<HelpGlyph>(['start', 'select'])

function PillGlyph({ size, bg, fg }: { size: number; bg: string; fg: string }) {
  // Three bars inside a rounded capsule, matching the moulded pill these buttons have.
  const bar = `linear-gradient(${fg}, ${fg})`
  return (
    <span
      style={{
        display: 'inline-block',
        width: `${size * 1.15}px`,
        height: `${size * 0.62}px`,
        borderRadius: '999px',
        background: `${bar} 22% / 1px 55% no-repeat, ${bar} 50% / 1px 55% no-repeat, ${bar} 78% / 1px 55% no-repeat, ${bg}`,
        flex: '0 0 auto',
      }}
    />
  )
}

function GlyphBadge({
  glyph,
  style,
  colors,
  font,
}: {
  glyph: HelpGlyph
  style: HelpBadgeStyle
  colors: HelpBarColors
  font: number
}) {
  if (style === 'plain') {
    return <b style={{ color: colors.badgeBg ?? colors.fg, flex: '0 0 auto' }}>{GLYPH_TEXT[glyph]}</b>
  }

  const bg = colors.badgeBg ?? colors.fg
  const fg = colors.badgeFg ?? '#000000'

  if (PILL_GLYPHS.has(glyph)) {
    return <PillGlyph size={font} bg={bg} fg={fg} />
  }

  return (
    <span
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: `${font * 1.05}px`,
        height: `${font * 1.05}px`,
        borderRadius: '999px',
        background: bg,
        color: fg,
        fontSize: `${font * 0.72}px`,
        fontWeight: 700,
        flex: '0 0 auto',
      }}
    >
      {GLYPH_TEXT[glyph]}
    </span>
  )
}

/**
 * The button-hint strip.
 *
 * Every handheld UI has one, and they differ only in how the glyph is drawn and how the labels
 * are cased - so the hints themselves are data and the presentation is props.
 */
export function HelpBar({
  box,
  items,
  colors,
  font,
  badge = 'circle',
  gap,
  uppercase = false,
  bold = false,
}: HelpBarProps) {
  const style: CSSProperties = {
    ...place({ ...box, font }),
    display: 'flex',
    alignItems: 'center',
    gap: `${gap ?? font * 0.85}px`,
    color: colors.fg,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  }

  return (
    <div style={style} data-widget="HelpBar">
      {items.map((item) => (
        <span
          key={item.glyph + item.label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            // A word space, matching how these read when the glyph is inline text.
            gap: `${font * 0.28}px`,
            fontWeight: bold ? 700 : 400,
          }}
        >
          <GlyphBadge glyph={item.glyph} style={badge} colors={colors} font={font} />
          <span style={{ textTransform: uppercase ? 'uppercase' : 'none' }}>{item.label}</span>
        </span>
      ))}
    </div>
  )
}
