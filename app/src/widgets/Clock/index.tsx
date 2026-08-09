import { useEffect, useState } from 'react'
import { place, type Box } from '../../layout/box'
import { useOptionalScreen } from '../../device/ScreenContext'

export type ClockFormat = '12h' | '24h'

/**
 * The time a screen shows when it is not running live.
 *
 * Static screens used to render the real wall clock, which meant no two screenshots of the same
 * screen ever matched. Pinning it makes visual baselines possible at all, and 10:24 is a
 * deliberately unremarkable time that exercises both a two-digit hour and a two-digit minute.
 */
export const STATIC_TIME = { hours: 10, minutes: 24 } as const

/** How often the clock re-reads the time when live. The source themes used the same interval. */
const TICK_MS = 20_000

export interface ClockProps {
  readonly box: Box
  readonly font: number
  readonly color: string
  readonly format?: ClockFormat | undefined
  readonly align?: 'left' | 'center' | 'right' | undefined
  readonly bold?: boolean | undefined
  /**
   * Force a specific time. Overrides both the live clock and the static default, which is what
   * a story or a test uses to pin a value.
   */
  readonly time?: { hours: number; minutes: number } | undefined
}

export function formatTime(
  { hours, minutes }: { hours: number; minutes: number },
  format: ClockFormat,
): string {
  const mm = String(minutes).padStart(2, '0')
  if (format === '24h') return `${String(hours).padStart(2, '0')}:${mm}`
  const suffix = hours < 12 ? 'AM' : 'PM'
  // 0 and 12 both display as 12 on a 12-hour clock.
  const h = hours % 12 === 0 ? 12 : hours % 12
  return `${h}:${mm} ${suffix}`
}

/**
 * The status-bar clock.
 *
 * Ticks only when the screen is animating. A static screen is not a live screen with the clock
 * stopped - it renders a fixed time, so the same screen always produces the same image.
 */
export function Clock({
  box,
  font,
  color,
  format = '12h',
  align = 'right',
  bold = false,
  time,
}: ClockProps) {
  const screen = useOptionalScreen()
  const live = (screen?.animate ?? false) && time === undefined

  const [now, setNow] = useState(() => {
    if (time) return time
    if (!live) return STATIC_TIME
    const d = new Date()
    return { hours: d.getHours(), minutes: d.getMinutes() }
  })

  useEffect(() => {
    if (!live) return
    const tick = () => {
      const d = new Date()
      setNow({ hours: d.getHours(), minutes: d.getMinutes() })
    }
    tick()
    const id = setInterval(tick, TICK_MS)
    return () => clearInterval(id)
  }, [live])

  const value = time ?? (live ? now : STATIC_TIME)

  return (
    <div
      style={{
        ...place({ ...box, font }),
        color,
        textAlign: align,
        fontWeight: bold ? 700 : 400,
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
      }}
      data-widget="Clock"
    >
      {formatTime(value, format)}
    </div>
  )
}
