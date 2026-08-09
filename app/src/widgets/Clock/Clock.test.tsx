import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Clock, STATIC_TIME, formatTime } from '.'
import { ScreenProvider } from '../../device/ScreenContext'

const box = { left: 0, top: 0, width: 120, height: 20 }

describe('formatTime', () => {
  it('formats a 12-hour clock without a leading zero on the hour', () => {
    expect(formatTime({ hours: 9, minutes: 5 }, '12h')).toBe('9:05 AM')
    expect(formatTime({ hours: 13, minutes: 30 }, '12h')).toBe('1:30 PM')
  })

  it('renders midnight and noon as 12, not 0', () => {
    expect(formatTime({ hours: 0, minutes: 0 }, '12h')).toBe('12:00 AM')
    expect(formatTime({ hours: 12, minutes: 0 }, '12h')).toBe('12:00 PM')
  })

  it('zero-pads a 24-hour clock', () => {
    expect(formatTime({ hours: 9, minutes: 5 }, '24h')).toBe('09:05')
    expect(formatTime({ hours: 0, minutes: 0 }, '24h')).toBe('00:00')
  })
})

describe('Clock', () => {
  it('shows a fixed time on a static screen, so screenshots are reproducible', () => {
    // The original themes rendered the real wall clock even on static snapshots, which meant no
    // two captures of the same screen ever matched.
    render(
      <ScreenProvider device="rg35xx" animate={false}>
        <Clock box={box} font={14} color="#fff" />
      </ScreenProvider>,
    )

    expect(screen.getByText(formatTime(STATIC_TIME, '12h'))).toBeInTheDocument()
  })

  it('honours an explicit time over everything else', () => {
    render(
      <ScreenProvider device="rg35xx" animate>
        <Clock box={box} font={14} color="#fff" time={{ hours: 12, minutes: 34 }} format="24h" />
      </ScreenProvider>,
    )

    expect(screen.getByText('12:34')).toBeInTheDocument()
  })

  it('reads the real time when live', () => {
    render(
      <ScreenProvider device="rg35xx" animate>
        <Clock box={box} font={14} color="#fff" format="24h" />
      </ScreenProvider>,
    )

    const now = new Date()
    expect(
      screen.getByText(formatTime({ hours: now.getHours(), minutes: now.getMinutes() }, '24h')),
    ).toBeInTheDocument()
  })

  it('renders outside a screen provider', () => {
    // Storybook renders widgets in isolation, where there is no device.
    render(<Clock box={box} font={14} color="#fff" />)
    expect(screen.getByText(formatTime(STATIC_TIME, '12h'))).toBeInTheDocument()
  })
})
