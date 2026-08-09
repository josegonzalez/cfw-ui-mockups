import type { ReactNode } from 'react'
import { place, type Box } from '../../layout/box'

export interface HeaderBarProps {
  readonly box: Box
  readonly title: string
  /**
   * A second half of the title drawn in the accent colour, as in "Example" + "OS". Kept as its
   * own prop rather than accepting markup, so the shape stays translatable.
   */
  readonly titleAccent?: string | undefined
  /** A glyph before the title, typically a back chevron. */
  readonly leading?: string | undefined
  readonly titleFont: number
  readonly color: string
  readonly accentColor?: string | undefined
  readonly bold?: boolean | undefined
  readonly paddingX?: number | undefined
  /** Height of the rule under the header. Omit for no rule. */
  readonly ruleHeight?: number | undefined
  readonly ruleColor?: string | undefined
  /** Inset of the rule from each edge. */
  readonly ruleInsetX?: number | undefined
  /**
   * Right-hand content: a clock, a count, a status cluster. A named slot rather than a prop
   * spread, so a template system can model it as a child node list.
   */
  readonly right?: ReactNode
}

/**
 * A screen header: title on the left, something on the right, an optional rule beneath.
 *
 * Present in some form on nearly every screen in the repo, which is why it is a widget rather
 * than something each theme re-lays-out.
 */
export function HeaderBar({
  box,
  title,
  titleAccent,
  leading,
  titleFont,
  color,
  accentColor,
  bold = true,
  paddingX = 0,
  ruleHeight,
  ruleColor,
  ruleInsetX = 0,
  right,
}: HeaderBarProps) {
  return (
    <>
      <div
        style={{
          ...place({ ...box, font: titleFont }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: `${paddingX}px`,
          paddingRight: `${paddingX}px`,
          boxSizing: 'border-box',
          color,
        }}
        data-widget="HeaderBar"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${titleFont * 0.4}px`,
            fontWeight: bold ? 700 : 400,
            minWidth: 0,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {leading ? <span style={{ color: accentColor ?? color }}>{leading}</span> : null}
          <span>
            {title}
            {titleAccent ? <span style={{ color: accentColor ?? color }}>{titleAccent}</span> : null}
          </span>
        </div>
        {right ? <div style={{ flex: '0 0 auto' }}>{right}</div> : null}
      </div>

      {ruleHeight ? (
        <div
          style={{
            ...place({
              left: box.left + ruleInsetX,
              top: box.top + box.height,
              width: box.width - ruleInsetX * 2,
              height: ruleHeight,
            }),
            background: ruleColor ?? accentColor ?? color,
          }}
        />
      ) : null}
    </>
  )
}
