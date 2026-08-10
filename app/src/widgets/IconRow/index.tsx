import type { ReactNode } from 'react'
import { place, type Box } from '../../layout/box'

export interface IconRowProps {
  readonly box: Box
  /**
   * Already filtered by the screen: the row draws what it is given, in order.
   *
   * Optional, because an empty row is the case the widget exists for - a game with no badges
   * has to leave the same hole a game with six fills.
   */
  readonly children?: ReactNode
  /** Gap between items, in device pixels. */
  readonly gap: number
  readonly align?: 'left' | 'center' | 'right' | undefined
  readonly className?: string | undefined
}

/**
 * A horizontal run of status markers.
 *
 * Thin on purpose. The value is that the row owns its spacing and overflow in one place, so a
 * game with six badges and one with none produce the same left edge and neither pushes anything
 * around it.
 *
 * **Filtering is the screen's job, not the row's.** Which badges apply is decided by the
 * theme's own `<visible>` predicates, and a row that took a game and worked it out itself would
 * be a second copy of those rules living somewhere they cannot be checked against the source.
 */
export function IconRow({ box, children, gap, align = 'left', className }: IconRowProps) {
  return (
    <div
      className={className}
      style={{
        ...place(box),
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
        gap: `${gap}px`,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      data-widget="IconRow"
    >
      {children}
    </div>
  )
}
