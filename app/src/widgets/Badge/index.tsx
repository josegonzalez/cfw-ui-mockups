import type { CSSProperties } from 'react'

/**
 * What a badge is telling you.
 *
 * A closed set rather than an open string, because a badge is a status vocabulary: a renderer
 * has to know every value to draw it, and an unrecognised one would silently render nothing.
 */
export type BadgeKind =
  | 'favorite'
  | 'cheevos'
  | 'multidisc'
  | 'manual'
  | 'savegame'
  | 'kidGame'
  | 'gunGame'
  | 'finished'
  | 'inProgress'
  | 'buggy'

export interface BadgeProps {
  readonly kind: BadgeKind
  /** Height in device pixels. The glyph and any chip are proportioned from it. */
  readonly size: number
  readonly color: string
  /** Filled chip behind the glyph. Some badges are a plain glyph, some a chip. */
  readonly background?: string | undefined
  /** The glyph itself. Passed in so the widget carries no icon set of its own. */
  readonly glyph: string
  readonly label?: string | undefined
  readonly title?: string | undefined
}

/**
 * One status marker: a glyph, optionally on a filled chip.
 *
 * Badges are the densest information on these screens - a game row can carry six - so they are
 * a widget rather than ad-hoc spans, and the set of things one can mean is enumerated.
 *
 * The glyph is a prop rather than a lookup inside the widget. Each theme draws these from its
 * own icon font at its own codepoints, and a table here would either be one theme's table
 * pretending to be general, or a union of all of them that no single theme uses.
 */
export function Badge({ kind, size, color, background, glyph, label, title }: BadgeProps) {
  const chip = background !== undefined

  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${size * 0.25}px`,
    height: `${size}px`,
    flex: '0 0 auto',
    color,
    fontSize: `${size * 0.72}px`,
    lineHeight: 1,
    ...(chip
      ? {
          background,
          borderRadius: `${size * 0.25}px`,
          padding: `0 ${size * 0.3}px`,
        }
      : {}),
  }

  return (
    <span style={style} data-widget="Badge" data-badge={kind} title={title ?? label ?? kind}>
      <span aria-hidden="true">{glyph}</span>
      {label ? <span>{label}</span> : null}
    </span>
  )
}
