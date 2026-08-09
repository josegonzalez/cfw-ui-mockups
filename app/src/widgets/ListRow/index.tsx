import type { CSSProperties } from 'react'
import { place, type Box } from '../../layout/box'
import { transitionsToCss } from '../../anim/waapi'
import type { TransitionSpec } from '../../anim/types'

/*
 * Optional props are written `?: T | undefined` throughout the widget kit. With
 * `exactOptionalPropertyTypes` on, a plain `?: T` cannot receive an explicit `undefined`, which
 * would force every caller to build props by conditional spread. This keeps required props
 * genuinely required while letting an optional one be passed through as undefined.
 */
export interface ListRowColors {
  readonly fg: string
  readonly sublabelFg?: string | undefined
  readonly bg?: string | undefined
  readonly iconBg?: string | undefined
  readonly iconFg?: string | undefined
  readonly selectedFg?: string | undefined
  readonly selectedSublabelFg?: string | undefined
  readonly selectedBg?: string | undefined
  readonly selectedIconBg?: string | undefined
  readonly selectedIconFg?: string | undefined
}

/**
 * How overlong text behaves.
 *
 * `clip` is a hard cut with no marker. It is not a lesser `ellipsis` - one source theme clips
 * deliberately, matching its reference art, so the choice is authored rather than defaulted.
 */
export type TextOverflow = 'clip' | 'ellipsis'

export interface ListRowProps {
  readonly box: Box
  readonly label: string
  readonly sublabel?: string | undefined
  /** A short badge, typically one letter or glyph, drawn in a square tile before the label. */
  readonly icon?: string | undefined
  readonly selected?: boolean | undefined
  readonly colors: ListRowColors
  readonly labelFont: number
  readonly sublabelFont?: number | undefined
  readonly iconSize?: number | undefined
  readonly paddingX?: number | undefined
  readonly radius?: number | undefined
  /** Horizontal nudge applied when selected. One theme shifts the selected row right. */
  readonly selectedShiftX?: number | undefined
  readonly overflow?: TextOverflow | undefined
  readonly transition?: readonly TransitionSpec[] | undefined
  readonly bold?: boolean | undefined
}

/**
 * One row of a selectable list.
 *
 * The row owns its appearance; `TextList` owns which rows exist and where they sit. Splitting
 * it that way is what lets the same list machinery carry a bare single-line row and a row with
 * an icon tile and a subtitle, without either theme knowing about the other.
 */
export function ListRow({
  box,
  label,
  sublabel,
  icon,
  selected = false,
  colors,
  labelFont,
  sublabelFont,
  iconSize,
  paddingX = 0,
  radius,
  selectedShiftX = 0,
  overflow = 'ellipsis',
  transition,
  bold = false,
}: ListRowProps) {
  const fg = selected ? (colors.selectedFg ?? colors.fg) : colors.fg
  const bg = selected ? colors.selectedBg : colors.bg
  const subFg = selected
    ? (colors.selectedSublabelFg ?? colors.sublabelFg ?? fg)
    : (colors.sublabelFg ?? fg)

  const style: CSSProperties = {
    ...place({ ...box, ...(radius !== undefined ? { radius } : {}) }),
    display: 'flex',
    alignItems: 'center',
    gap: icon ? `${(iconSize ?? labelFont) * 0.35}px` : undefined,
    paddingLeft: `${paddingX}px`,
    paddingRight: `${paddingX}px`,
    color: fg,
    background: bg,
    boxSizing: 'border-box',
    overflow: 'hidden',
  }

  if (selected && selectedShiftX !== 0) {
    style.transform = `translateX(${selectedShiftX}px)`
  }
  if (transition) {
    style.transition = transitionsToCss(transition)
  }

  const textStyle: CSSProperties = {
    minWidth: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: overflow === 'ellipsis' ? 'ellipsis' : 'clip',
  }

  return (
    <div style={style} data-selected={selected || undefined}>
      {icon ? (
        <div
          style={{
            flex: '0 0 auto',
            display: 'grid',
            placeItems: 'center',
            width: `${iconSize ?? labelFont * 2.2}px`,
            height: `${iconSize ?? labelFont * 2.2}px`,
            borderRadius: `${(iconSize ?? labelFont * 2.2) * 0.18}px`,
            background: selected ? (colors.selectedIconBg ?? colors.iconBg) : colors.iconBg,
            color: selected ? (colors.selectedIconFg ?? colors.iconFg) : colors.iconFg,
            fontSize: `${labelFont}px`,
          }}
        >
          {icon}
        </div>
      ) : null}

      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        <div
          style={{
            ...textStyle,
            fontSize: `${labelFont}px`,
            fontWeight: bold || selected ? 700 : 400,
          }}
        >
          {label}
        </div>
        {sublabel ? (
          <div style={{ ...textStyle, fontSize: `${sublabelFont ?? labelFont * 0.65}px`, color: subFg }}>
            {sublabel}
          </div>
        ) : null}
      </div>
    </div>
  )
}
