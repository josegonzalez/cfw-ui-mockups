import { useEffect, useState } from 'react'
import { ExampleOs } from '../../themes/example-cfw'
import { BootScreen } from './BootScreen'

/** How long the log runs before the launcher takes over. */
export const BOOT_MS = 1250
/** The fade from the log to the launcher. */
export const HANDOFF_MS = 340

export type BootPhase = 'boot' | 'handoff' | 'ready'

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * What the hero's device is doing: it boots, then shows its launcher.
 *
 * The sequence is the point. These handhelds print a console to the panel and then hand off to
 * the launcher, so playing that back in the hero says what the project is before a word of copy
 * is read - and the launcher underneath is the real theme, not a picture of one.
 *
 * The launcher is mounted from the start and the log sits over it, so the handoff is a fade
 * between two live things rather than a swap that has to wait for the second to mount.
 */
export function DeviceShowcase() {
  // Reduced motion goes straight to the launcher: the boot log is decorative, and its whole
  // effect is timing. Decided once, so the schedule below never re-runs.
  const [reduced] = useState(prefersReducedMotion)
  const [phase, setPhase] = useState<BootPhase>(() => (reduced ? 'ready' : 'boot'))

  useEffect(() => {
    if (reduced) return

    // Both timers are scheduled together and the effect depends only on `reduced`. Keying it on
    // `phase` instead would tear the effect down when the first timer fires, cancelling the
    // second - the log would fade out and then stay mounted, blinking, forever.
    const toHandoff = setTimeout(() => setPhase('handoff'), BOOT_MS)
    const toReady = setTimeout(() => setPhase('ready'), BOOT_MS + HANDOFF_MS)

    return () => {
      clearTimeout(toHandoff)
      clearTimeout(toReady)
    }
  }, [reduced])

  return (
    <div className="showcase" data-phase={phase}>
      <ExampleOs view="main-menu" />

      {phase === 'ready' ? null : (
        <div
          className={phase === 'handoff' ? 'showcase__boot showcase__boot--out' : 'showcase__boot'}
          style={{ '--handoff-ms': `${HANDOFF_MS}ms` } as React.CSSProperties}
        >
          <BootScreen durationMs={BOOT_MS} />
        </div>
      )}
    </div>
  )
}
