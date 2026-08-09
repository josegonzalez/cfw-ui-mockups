import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { useOptionalScreen } from '../device/ScreenContext'
import { compileStoryboard, isAmbient, restingValues, storyboardForEvent } from './compile'
import { restingStyle, tracksToWaapi } from './waapi'
import type { DeviceContext, StoryboardEventKey, StoryboardMap } from './types'

const INERT: DeviceContext = { w: 0, h: 0 }

export interface UseStoryboardResult {
  /**
   * Callback ref for the element the storyboard drives. Named `attach` rather than `ref` so it
   * does not read as a ref object to tooling - it is a setter, and there is no `.current` here
   * to be misread during render.
   */
  readonly attach: (node: HTMLElement | null) => void
  /** Merge into the element's `style`. Carries resting values when motion is off. */
  readonly style: CSSProperties
  /** Merge into the element's `className`. Enables the transform recomposition. */
  readonly className: string
}

/**
 * Drive one element from a storyboard.
 *
 * This is the React replacement for the original `bind` / `drive` / `play` / `settle` pair of
 * calls, and it preserves the two behaviours that were easy to lose in translation.
 *
 * **Ambient storyboards do not restart.** An element whose only storyboard is the no-event `_`
 * block runs on its own clock - a 5350ms ticker, a 30s background drift. Replaying it whenever
 * the cursor moves would restart that clock on every keypress, so it plays once and is then
 * left alone even as `event` changes around it.
 *
 * **Motion off means settled, not absent.** With `animate: false` no Animation objects are
 * created at all; the resting values are written as plain style instead. Same descriptors,
 * same resolution path, so a static screen and a paused live one are the same picture.
 */
export function useStoryboard(
  defs: StoryboardMap | undefined,
  event: StoryboardEventKey | undefined,
): UseStoryboardResult {
  const screen = useOptionalScreen()
  const animate = screen?.animate ?? false
  const ctx = useMemo<DeviceContext>(
    () => (screen ? { w: screen.w, h: screen.h } : INERT),
    [screen],
  )

  const nodeRef = useRef<HTMLElement | null>(null)
  const runningRef = useRef<Animation[]>([])
  // Whether an ambient storyboard has already been started on this element.
  const startedRef = useRef(false)

  const cancel = useCallback(() => {
    for (const anim of runningRef.current) {
      try {
        anim.cancel()
      } catch {
        // Already finished or detached; nothing to cancel.
      }
    }
    runningRef.current = []
  }, [])

  const attach = useCallback(
    (node: HTMLElement | null) => {
      if (node !== nodeRef.current) {
        cancel()
        startedRef.current = false
      }
      nodeRef.current = node
    },
    [cancel],
  )

  const sb = storyboardForEvent(defs, event)
  const ambient = isAmbient(defs, event)

  useEffect(() => {
    const node = nodeRef.current
    if (!node || !animate || !sb) return

    // An ambient track owns its own clock. Restarting it on every cursor move is the bug this
    // guard exists to prevent.
    if (ambient && startedRef.current) return

    cancel()
    const effects = tracksToWaapi(compileStoryboard(sb, ctx))
    runningRef.current = effects.map((fx) => node.animate(fx.keyframes, fx.timing))
    startedRef.current = true

    return cancel
  }, [animate, sb, ambient, ctx, cancel])

  // When motion is off, the element is positioned by its resting values instead. Falling back
  // through `open` mirrors the original: an element with only event-specific storyboards still
  // has to land somewhere sensible.
  const style = useMemo<CSSProperties>(() => {
    if (animate) return {}
    const settled = sb ?? storyboardForEvent(defs, 'open') ?? storyboardForEvent(defs, undefined)
    if (!settled) return {}
    return restingStyle(restingValues(settled, ctx)) as CSSProperties
  }, [animate, sb, defs, ctx])

  return { attach, style, className: 'px-anim' }
}
