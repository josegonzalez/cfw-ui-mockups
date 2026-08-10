import type { CSSProperties, ReactNode } from 'react'
import { place, type Box } from '../../layout/box'

export interface TickerItem {
  readonly key: string
  readonly content: ReactNode
}

export interface TickerProps {
  readonly box: Box
  /**
   * The stacked blocks that take turns. Two is the common case, and the widget shows exactly
   * one at a time regardless of how many there are.
   */
  readonly items: readonly TickerItem[]
  /** Which block is showing. The screen owns the cycling, not the widget. */
  readonly activeIndex: number
  readonly color?: string | undefined
  readonly align?: 'left' | 'center' | 'right' | undefined
  readonly className?: string | undefined
}

/**
 * A stack of blocks where one is visible at a time.
 *
 * Every block is rendered and positioned identically; only opacity distinguishes them. That is
 * how the sources build it, and it matters for two reasons: the blocks can cross-fade rather
 * than replacing each other, and the box does not resize as the content changes - a ticker that
 * reflowed on every swap would jitter the chrome around it.
 *
 * **The widget does not own the clock.** Which block is showing is a prop, so a static screen
 * renders a chosen one and the live build drives it. A widget with its own timer could not be
 * screenshotted reproducibly, and could not be settled for a static snapshot.
 */
export function Ticker({ box, items, activeIndex, color, align = 'left', className }: TickerProps) {
  return (
    <div className={className} style={{ ...place(box), color }} data-widget="Ticker">
      {items.map((item, index) => {
        const style: CSSProperties = {
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
          whiteSpace: 'nowrap',
          opacity: index === activeIndex ? 1 : 0,
        }

        return (
          <div key={item.key} style={style} data-active={index === activeIndex || undefined}>
            {item.content}
          </div>
        )
      })}
    </div>
  )
}
