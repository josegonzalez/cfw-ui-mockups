/**
 * PORTING NOTES
 * CFW: NextUI theme for N64FlashcartMenu
 * Devices: n64 (640x480, drawn to a television)
 * Source: src/menu/ui_components/nextui.c, ui_components/constants.h, ui_components/file_list.c
 * Mode: reproduce
 *
 * The pieces every one of the twenty-three views is assembled from.
 *
 * Layout:
 *   - Visible area 576x432 inset at 32,24 - the menu never draws into the overscan margin.
 *   - Rows at a 40px pitch, nine to a screen. Hint bar on the last 40px.
 *   - Text sits 24px in from the list edge; a selection pill starts at the list edge itself.
 * Colors:
 *   - Every colour is a palette slot. Nothing here is a literal except the two neutral frames
 *     the source hardcodes (#606060) and the muted tint (#A0A0A0).
 * Typography:
 *   - BPreplay Bold at 32 (titles), 24, 20 (nearly everything) and 16 (dense body text).
 * Focus & selection:
 *   - One pill in the main colour, sized to the label rather than to the row. Settings-style rows
 *     draw a full-width accent pill underneath it, which is what makes those two lists look
 *     different despite sharing a row height.
 * Buttons:
 *   - Hint pills name the buttons per view; they are on a controller, not on the frame.
 * Transitions:
 *   - The marquee, and nothing else. A label wider than its slot holds 45 frames, scrolls left
 *     2px per frame, holds 45, then snaps back.
 */
import { useId, type CSSProperties, type ReactNode } from 'react'
import { useScreen } from '../../../device/ScreenContext'
import {
  BUTTON_MARGIN,
  BUTTON_PADDING,
  BUTTON_SIZE,
  FONT,
  HINT_GAP,
  HINT_Y,
  LIST_X,
  PILL_HEIGHT,
  VISIBLE,
} from '../layout'
import { marqueeKeyframes, marqueeTiming } from '../marquee'
import { textWidth } from '../text'
import type { Hint } from '../library'

/** A stadium. The source blits a rounded cap at each end and stretches the middle between them. */
export function Pill({
  x,
  y,
  w,
  h,
  color,
}: {
  x: number
  y: number
  w: number
  h: number
  color: string
}) {
  return (
    <div
      className="nx-pill"
      style={{ left: x, top: y, width: Math.max(w, h), height: h, background: color }}
    />
  )
}

/** A 16px-radius rounded rectangle: `ui_components_nextui_panel_draw`, used for swatches. */
export function Panel({
  x0,
  y0,
  x1,
  y1,
  color,
}: {
  x0: number
  y0: number
  x1: number
  y1: number
  color: string
}) {
  return (
    <div
      className="nx-panel"
      style={{ left: x0, top: y0, width: x1 - x0, height: y1 - y0, background: color }}
    />
  )
}

export interface TextBoxProps {
  readonly x: number
  readonly y: number
  /** 0 means unbounded: the caller has already sized the box to the text, so nothing truncates. */
  readonly w?: number | undefined
  readonly h: number
  readonly size: number
  readonly color: string
  readonly align?: 'left' | 'center' | 'right' | undefined
  readonly children: ReactNode
}

/**
 * `ui_components_nextui_pill_text_draw`: a text box, vertically centred, ellipsised when bounded.
 *
 * The width-of-zero convention is the source's and is load-bearing. A bounded box wraps with
 * ellipses; an unbounded one is drawn by a caller that measured the text first and does not want
 * the wrap machinery involved at all.
 */
export function TextBox({ x, y, w, h, size, color, align = 'left', children }: TextBoxProps) {
  const bounded = w !== undefined && w > 0

  const style: CSSProperties = {
    left: x,
    top: y,
    height: h,
    fontSize: size,
    color,
    justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
  }
  if (bounded) style.width = w

  return (
    <div className="nx-text" style={style}>
      {/* `WRAP_ELLIPSES`. The clip lives on the child, since a flex box cannot ellipsise itself. */}
      {bounded ? <span className="nx-text__clip">{children}</span> : children}
    </div>
  )
}

/**
 * A label that scrolls when it does not fit.
 *
 * The timing is computed from the overflow rather than fixed, because the source scrolls a
 * constant 2px per frame - so a label twice as long takes twice as long to cross, and two
 * marquees on one screen are genuinely out of step. Motion off renders it at rest, which is
 * where the source starts it too: `marquee_offset` is zeroed whenever the text changes, and the
 * text changes whenever the cursor moves.
 */
export function Marquee({
  text,
  x,
  y,
  w,
  h,
  size,
  color,
}: {
  text: string
  x: number
  y: number
  w: number
  h: number
  size: number
  color: string
}) {
  const { animate } = useScreen()
  const name = `nx-mq-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const timing = marqueeTiming(textWidth(text, size), w)

  if (!timing) {
    return (
      <TextBox x={x} y={y} h={h} size={size} color={color}>
        {text}
      </TextBox>
    )
  }

  return (
    <div className="nx-marquee" style={{ left: x, top: y, width: w, height: h }}>
      {animate ? <style>{`@keyframes ${name} { ${marqueeKeyframes(timing)} }`}</style> : null}
      <span
        className="nx-marquee__text"
        style={{
          fontSize: size,
          color,
          ...(animate ? { animation: `${name} ${timing.durationMs}ms linear infinite` } : {}),
        }}
      >
        {text}
      </span>
    </div>
  )
}

/* ---- buttons and hints ------------------------------------------------- */

/** A single-letter button is a circle; a word is a mini pill. Both take the main colour. */
export function glyphWidth(button: string): number {
  return button.length > 1 ? textWidth(button, FONT.small) + BUTTON_PADDING * 2 : BUTTON_SIZE
}

export function ButtonGlyph({
  x,
  y,
  button,
  main,
  glyph,
}: {
  x: number
  y: number
  button: string
  main: string
  glyph: string
}) {
  const top = y + (PILL_HEIGHT - BUTTON_SIZE) / 2
  const width = glyphWidth(button)

  return (
    <>
      <Pill x={x} y={top} w={width} h={BUTTON_SIZE} color={main} />
      <TextBox
        x={x + (width - textWidth(button, FONT.small)) / 2}
        y={y}
        h={PILL_HEIGHT}
        size={FONT.small}
        color={glyph}
      >
        {button}
      </TextBox>
    </>
  )
}

/** `hint_pill_width`: margin, glyph, margin, label, padding. Asymmetric, and deliberately so. */
export function hintWidth(hint: Hint): number {
  let width = BUTTON_MARGIN + glyphWidth(hint.button)
  if (hint.label) width += BUTTON_MARGIN + textWidth(hint.label, FONT.small)
  return width + BUTTON_PADDING
}

export interface HintGroupProps {
  readonly hints: readonly Hint[]
  /** Right-aligned groups end at the visible edge; left-aligned ones start at the list edge. */
  readonly alignRight: boolean
  readonly y?: number | undefined
  readonly main: string
  readonly accent: string
  readonly glyph: string
  readonly hint: string
}

/**
 * A row of hint pills.
 *
 * The group is measured, then anchored as a whole - which is why the right-hand group's leftmost
 * pill moves when the action label changes from PLAY to OPEN. Each pill is its own stadium with a
 * small gap between, rather than one pill with dividers.
 */
export function HintGroup({
  hints,
  alignRight,
  y = HINT_Y,
  main,
  accent,
  glyph,
  hint,
}: HintGroupProps) {
  const widths = hints.map(hintWidth)
  const total = widths.reduce((sum, w) => sum + w, 0) + HINT_GAP * Math.max(0, hints.length - 1)

  /* Prefix sums rather than a running cursor, so nothing is written during render. */
  const start = alignRight ? VISIBLE.x1 - total : LIST_X
  const offsets = widths.map((_, i) =>
    widths.slice(0, i).reduce((sum, w) => sum + w + HINT_GAP, start),
  )

  return (
    <>
      {hints.map((h, i) => {
        const width = widths[i]!
        const pillX = offsets[i]!
        const glyphX = pillX + BUTTON_MARGIN
        const labelX = glyphX + glyphWidth(h.button) + BUTTON_MARGIN

        return (
          <span key={`${h.button}-${h.label}`}>
            <Pill x={pillX} y={y} w={width} h={PILL_HEIGHT} color={accent} />
            <ButtonGlyph x={glyphX} y={y} button={h.button} main={main} glyph={glyph} />
            {h.label ? (
              <TextBox x={labelX} y={y} h={PILL_HEIGHT} size={FONT.small} color={hint}>
                {h.label}
              </TextBox>
            ) : null}
          </span>
        )
      })}
    </>
  )
}

/* ---- titles ------------------------------------------------------------ */

export interface TitleProps {
  readonly text: string
  readonly pill: boolean
  readonly maxWidth?: number | undefined
  readonly accent: string
  readonly hint: string
}

/**
 * A screen title.
 *
 * Bare, it is 32px text in the hint colour drawn straight on the background - NextUI's colour for
 * exactly that, so it stays readable in every palette. The source gives the box 16px more height
 * than a hint pill and nudges it up 8, because a 32px face in a 40px box loses its last line to
 * the paragraph bound; that offset is reproduced rather than tidied away, since it is what puts
 * the title on the same optical line as the pills beside it.
 *
 * With Title Pills on it takes the Game Switcher treatment instead: an accent pill with 20px
 * hint-coloured text, matching the hint chrome rather than towering over it.
 */
export function Title({ text, pill, maxWidth, accent, hint }: TitleProps) {
  const cap = maxWidth && maxWidth > 0 ? maxWidth : VISIBLE.w

  if (pill) {
    const textMax = cap - BUTTON_PADDING * 2
    const measured = textWidth(text, FONT.small)
    const clamped = measured > textMax
    const width = clamped ? textMax : measured

    return (
      <>
        <Pill
          x={LIST_X}
          y={VISIBLE.y0}
          w={width + BUTTON_PADDING * 2}
          h={PILL_HEIGHT}
          color={accent}
        />
        <TextBox
          x={LIST_X + BUTTON_PADDING}
          y={VISIBLE.y0}
          w={clamped ? textMax : 0}
          h={PILL_HEIGHT}
          size={FONT.small}
          color={hint}
        >
          {text}
        </TextBox>
      </>
    )
  }

  return (
    <TextBox
      x={LIST_X}
      y={VISIBLE.y0 - 8}
      w={cap}
      h={PILL_HEIGHT + 16}
      size={FONT.large}
      color={hint}
    >
      {text}
    </TextBox>
  )
}
