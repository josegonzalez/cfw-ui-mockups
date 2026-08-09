import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { buttonForKeyEvent, type Button } from './keymap'
import { chromeActionForKey, type ChromeAction } from './chromeKeys'

/** How long a button stays visually lit after a press. */
export const FLASH_MS = 120

export interface ButtonEventMeta {
  /** True when the key is auto-repeating from being held. */
  readonly repeat: boolean
  /** True when it came from the on-screen button cluster rather than the keyboard. */
  readonly synthetic: boolean
}

export type ButtonHandler = (button: Button, meta: ButtonEventMeta) => void
export type ChromeHandler = (action: ChromeAction) => void

export interface InputApi {
  /** Buttons currently held down. Chords and hold gestures read this. */
  readonly pressed: ReadonlySet<Button>
  /** Buttons lit for the press flash. Purely visual. */
  readonly flashing: ReadonlySet<Button>
  /** Dispatch a press, as the on-screen button cluster does. */
  readonly press: (button: Button) => void
  readonly release: (button: Button) => void
  readonly subscribePress: (handler: ButtonHandler) => () => void
  readonly subscribeRelease: (handler: ButtonHandler) => () => void
  readonly subscribeChrome: (handler: ChromeHandler) => () => void
}

const InputContext = createContext<InputApi | null>(null)

export interface InputProviderProps {
  /** When false, no keyboard listeners are attached. Static screens use this. */
  readonly enabled?: boolean
  /** When false, the mockup-only subset keys are ignored. */
  readonly chromeKeys?: boolean
  readonly children: ReactNode
}

/**
 * Owns keyboard input for one screen and exposes it as state.
 *
 * The original themes each wired their own `keydown` listener and then imperatively toggled a
 * class on the matching on-screen button for 120ms. Here the press is state, and the button
 * cluster renders from it, so nothing reaches into the DOM to light a button up.
 *
 * Held buttons are tracked separately from the flash, because two behaviours depend on real
 * hold state rather than on a press event: hold-to-power-off, and the three-button exit chord.
 */
export function InputProvider({ enabled = true, chromeKeys = true, children }: InputProviderProps) {
  const [pressed, setPressed] = useState<ReadonlySet<Button>>(() => new Set())
  const [flashing, setFlashing] = useState<ReadonlySet<Button>>(() => new Set())

  const pressHandlers = useRef(new Set<ButtonHandler>())
  const releaseHandlers = useRef(new Set<ButtonHandler>())
  const chromeHandlers = useRef(new Set<ChromeHandler>())
  const flashTimers = useRef(new Map<Button, ReturnType<typeof setTimeout>>())

  const flash = useCallback((button: Button) => {
    setFlashing((prev) => (prev.has(button) ? prev : new Set(prev).add(button)))

    const timers = flashTimers.current
    const existing = timers.get(button)
    if (existing) clearTimeout(existing)

    timers.set(
      button,
      setTimeout(() => {
        timers.delete(button)
        setFlashing((prev) => {
          if (!prev.has(button)) return prev
          const next = new Set(prev)
          next.delete(button)
          return next
        })
      }, FLASH_MS),
    )
  }, [])

  const dispatchPress = useCallback(
    (button: Button, meta: ButtonEventMeta) => {
      if (!meta.repeat) {
        setPressed((prev) => (prev.has(button) ? prev : new Set(prev).add(button)))
        flash(button)
      }
      for (const handler of pressHandlers.current) handler(button, meta)
    },
    [flash],
  )

  const dispatchRelease = useCallback((button: Button, meta: ButtonEventMeta) => {
    setPressed((prev) => {
      if (!prev.has(button)) return prev
      const next = new Set(prev)
      next.delete(button)
      return next
    })
    for (const handler of releaseHandlers.current) handler(button, meta)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      const button = buttonForKeyEvent(event)
      if (button) {
        event.preventDefault()
        dispatchPress(button, { repeat: event.repeat, synthetic: false })
        return
      }
      if (!chromeKeys || event.repeat) return
      const action = chromeActionForKey(event.key)
      if (!action) return
      event.preventDefault()
      for (const handler of chromeHandlers.current) handler(action)
    }

    const onKeyUp = (event: KeyboardEvent) => {
      const button = buttonForKeyEvent(event)
      if (!button) return
      event.preventDefault()
      dispatchRelease(button, { repeat: false, synthetic: false })
    }

    // A window that loses focus mid-hold never delivers the keyup, which would strand a
    // hold gesture on forever.
    const onBlur = () => setPressed(new Set())

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [enabled, chromeKeys, dispatchPress, dispatchRelease])

  useEffect(() => {
    const timers = flashTimers.current
    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    }
  }, [])

  const api = useMemo<InputApi>(
    () => ({
      pressed,
      flashing,
      press: (button) => dispatchPress(button, { repeat: false, synthetic: true }),
      release: (button) => dispatchRelease(button, { repeat: false, synthetic: true }),
      subscribePress: (handler) => {
        pressHandlers.current.add(handler)
        return () => pressHandlers.current.delete(handler)
      },
      subscribeRelease: (handler) => {
        releaseHandlers.current.add(handler)
        return () => releaseHandlers.current.delete(handler)
      },
      subscribeChrome: (handler) => {
        chromeHandlers.current.add(handler)
        return () => chromeHandlers.current.delete(handler)
      },
    }),
    [pressed, flashing, dispatchPress, dispatchRelease],
  )

  return <InputContext value={api}>{children}</InputContext>
}

export function useInput(): InputApi {
  const value = use(InputContext)
  if (!value) throw new Error('useInput must be used inside an InputProvider')
  return value
}

export function useOptionalInput(): InputApi | null {
  return use(InputContext)
}

/**
 * Keep the newest handler reachable from a subscription that was registered once.
 *
 * The subscription must not be torn down and rebuilt on every render, or a handler defined
 * inline in a component would resubscribe constantly. Updating the ref in an effect rather than
 * during render keeps that safe under concurrent rendering, where a render can be discarded.
 */
function useLatest<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}

/** Run a handler on every button press. */
export function useButtonPress(handler: ButtonHandler): void {
  const input = useOptionalInput()
  const latest = useLatest(handler)

  useEffect(() => {
    if (!input) return
    return input.subscribePress((button, meta) => latest.current(button, meta))
  }, [input, latest])
}

/** Run a handler on every button release. Hold gestures need this. */
export function useButtonRelease(handler: ButtonHandler): void {
  const input = useOptionalInput()
  const latest = useLatest(handler)

  useEffect(() => {
    if (!input) return
    return input.subscribeRelease((button, meta) => latest.current(button, meta))
  }, [input, latest])
}

/** Run a handler on every mockup-only subset key. */
export function useChromeKeys(handler: ChromeHandler): void {
  const input = useOptionalInput()
  const latest = useLatest(handler)

  useEffect(() => {
    if (!input) return
    return input.subscribeChrome((action) => latest.current(action))
  }, [input, latest])
}
