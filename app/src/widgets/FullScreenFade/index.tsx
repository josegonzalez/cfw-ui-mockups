import { transitionsToCss } from '../../anim/waapi'
import type { EasingName } from '../../anim/types'

export interface FullScreenFadeProps {
  /** Whether the fade is currently covering the screen. */
  readonly on: boolean
  readonly color?: string | undefined
  readonly durationMs: number
  readonly easing?: EasingName | undefined
  readonly z?: number | undefined
  readonly label?: string | undefined
}

/**
 * A full-screen fade, used for launching a game and for powering off.
 *
 * Always mounted and driven by opacity rather than mounted on demand, because the fade *is* the
 * effect - a element that appears at the moment it should already be fading has nothing to
 * animate from.
 */
export function FullScreenFade({
  on,
  color = '#000000',
  durationMs,
  easing = 'linear',
  z = 200,
  label,
}: FullScreenFadeProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: color,
        opacity: on ? 1 : 0,
        transition: transitionsToCss([{ property: 'opacity', duration: durationMs, easing }]),
        pointerEvents: 'none',
        zIndex: z,
      }}
      data-widget="FullScreenFade"
      data-on={on || undefined}
      aria-hidden="true"
    >
      {label}
    </div>
  )
}
