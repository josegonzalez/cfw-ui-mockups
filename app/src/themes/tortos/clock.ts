import { useEffect, useState } from 'react'
import { useScreen } from '../../device/ScreenContext'

/**
 * Milliseconds since `key` last changed, for the things that move with nobody touching them: a
 * title too long for its box, a synopsis scrolling itself.
 *
 * The launcher keeps one such clock per *subject* (`mq_phase`, `src/main.c:2848`), restarting it
 * when the subject changes so a newly chosen name is read from its beginning. The key is the
 * subject here. Motion off, or nothing that needs it, pins the phase at zero - which is the
 * marquee's resting value, the text at its start, so a still is drawn without a clock.
 */
export function usePhase(key: string, active: boolean): number {
  const { animate } = useScreen()
  const [phase, setPhase] = useState<{ key: string; ms: number }>({ key, ms: 0 })

  useEffect(() => {
    if (!animate || !active) return
    const t0 = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      setPhase({ key, ms: now - t0 })
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [animate, active, key])

  return animate && active && phase.key === key ? phase.ms : 0
}
