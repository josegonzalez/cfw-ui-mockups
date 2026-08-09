import { useCallback, useMemo, useState } from 'react'
import { useButtonPress } from '../input/InputProvider'
import type { Button } from '../input/keymap'

export interface ScreenNavOptions<T extends string> {
  readonly initial: T
  /**
   * Button that goes back. Defaults to B, which is the convention on every device in the
   * registry. Pass `null` to wire it yourself.
   */
  readonly backButton?: Button | null | undefined
}

export interface ScreenNav<T extends string> {
  readonly screen: T
  readonly navigate: (to: T) => void
  readonly goBack: () => boolean
  readonly canGoBack: boolean
  /** Oldest first, current screen excluded. */
  readonly stack: readonly T[]
}

/**
 * Movement *between* screens, as distinct from movement *within* one.
 *
 * Only one mockup set in the repo navigates this way - the others swap views inside a single
 * mounted root and never leave it. The original expressed it declaratively, with a `data-href`
 * on the item that navigates and a `data-back` on the group that returns, handled by a shared
 * helper that no other theme ended up adopting.
 *
 * A back *stack* rather than the original's fixed per-screen back target: "B goes back" means
 * where you came from, and once a screen is reachable from two places a fixed target is wrong
 * from one of them. With only two screens the two models coincide, so nothing about the
 * reproduction changes.
 */
export function useScreenNav<T extends string>({
  initial,
  backButton = 'b',
}: ScreenNavOptions<T>): ScreenNav<T> {
  const [stack, setStack] = useState<readonly T[]>([initial])

  const navigate = useCallback((to: T) => {
    setStack((prev) => (prev.at(-1) === to ? prev : [...prev, to]))
  }, [])

  const goBack = useCallback(() => {
    let moved = false
    setStack((prev) => {
      if (prev.length <= 1) return prev
      moved = true
      return prev.slice(0, -1)
    })
    return moved
  }, [])

  useButtonPress(
    useCallback(
      (button, meta) => {
        // Auto-repeat should not walk the whole stack from one held press.
        if (backButton && button === backButton && !meta.repeat) goBack()
      },
      [backButton, goBack],
    ),
  )

  return useMemo(
    () => ({
      screen: stack.at(-1) ?? initial,
      navigate,
      goBack,
      canGoBack: stack.length > 1,
      stack: stack.slice(0, -1),
    }),
    [stack, initial, navigate, goBack],
  )
}
