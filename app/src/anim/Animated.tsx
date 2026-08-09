import type { CSSProperties, ReactNode } from 'react'
import { useStoryboard } from './useStoryboard'
import type { StoryboardEventKey, StoryboardMap } from './types'

export interface AnimatedProps {
  readonly storyboard?: StoryboardMap
  /** Which storyboard to run. Omit for elements that only carry an ambient `_` block. */
  readonly event?: StoryboardEventKey
  readonly className?: string
  readonly style?: CSSProperties
  readonly children?: ReactNode
  /** Forwarded for Playwright selectors and debugging. */
  readonly 'data-el'?: string
}

/**
 * A `<div>` driven by a storyboard.
 *
 * Convenience for the common case. Widgets that render something other than a div - an image, a
 * span - call `useStoryboard` directly and attach its `ref`, `style` and `className` to whatever
 * they render, rather than being forced to wrap and change their own box.
 */
export function Animated({
  storyboard,
  event,
  className,
  style,
  children,
  'data-el': dataEl,
}: AnimatedProps) {
  const { attach, className: motionClass, style: motionStyle } = useStoryboard(storyboard, event)

  return (
    <div
      ref={attach}
      className={className ? `${className} ${motionClass}` : motionClass}
      style={{ ...style, ...motionStyle }}
      data-el={dataEl}
    >
      {children}
    </div>
  )
}
