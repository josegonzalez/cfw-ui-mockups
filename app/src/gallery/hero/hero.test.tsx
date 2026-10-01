import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DeviceFrame } from '../../device/DeviceFrame'
import { Landing } from '../Landing'
import { BOOT_MS, DeviceShowcase, HANDOFF_MS } from './DeviceShowcase'
import { HERO } from './content'
import { catalogueTotals } from '../../themes/catalogue'

function mountShowcase() {
  return render(
    <DeviceFrame device="rg40xx" animate={false} interactive={false}>
      <DeviceShowcase />
    </DeviceFrame>,
  )
}

describe('hero', () => {
  it('is the page heading, once', () => {
    render(<Landing />)

    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]!.textContent?.toLowerCase()).toContain(HERO.headline.accent)
  })

  it('renders a real device frame rather than a picture of one', () => {
    const { container } = render(<Landing />)
    expect(container.querySelector('.hero__stage .screen')).not.toBeNull()
  })

  it('draws a horizontal handheld, with grips either side of the panel', () => {
    const { container } = render(<Landing />)
    expect(container.querySelector('.hero__stage [data-device="rg40xx"]')).not.toBeNull()
    expect(container.querySelector('.hero__stage .device')).toHaveAttribute('data-layout', 'flanking')
  })

  it('does not let the frame capture the keyboard', () => {
    // An interactive frame attaches a global key listener that swallows the arrow keys, which
    // would stop the page scrolling.
    render(<Landing />)

    const before = globalThis.location.href
    act(() => {
      globalThis.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(globalThis.location.href).toBe(before)
  })

  it('builds the boot log from the catalogue rather than writing the numbers in', () => {
    // The counts in the log and in the stat row come from the same source, so a log that
    // contradicts the page below it is not possible.
    const { container } = render(<Landing />)

    expect(container.querySelector('.hero__stage .bootscreen')).not.toBeNull()
    const totals = catalogueTotals()
    expect(screen.getByText(`${totals.themes} found`)).toBeInTheDocument()
    expect(screen.getByText(`${totals.views} views`)).toBeInTheDocument()
  })
})

describe('boot sequence', () => {
  it('hands off from the boot log to the launcher', async () => {
    vi.useFakeTimers()
    try {
      const { container } = mountShowcase()

      // The launcher is mounted from the start, so the handoff is a fade between two live
      // things rather than a swap that waits for the second to appear.
      expect(container.querySelector('[data-theme="example-cfw"]')).not.toBeNull()
      expect(container.querySelector('.bootscreen')).not.toBeNull()
      expect(container.querySelector('.showcase')).toHaveAttribute('data-phase', 'boot')

      await act(async () => {
        vi.advanceTimersByTime(BOOT_MS + 1)
      })
      expect(container.querySelector('.showcase')).toHaveAttribute('data-phase', 'handoff')

      await act(async () => {
        vi.advanceTimersByTime(HANDOFF_MS + 1)
      })
      expect(container.querySelector('.showcase')).toHaveAttribute('data-phase', 'ready')
      expect(container.querySelector('.bootscreen')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('skips straight to the launcher when motion is reduced', () => {
    // The log is decorative and its whole effect is timing, so there is nothing to show
    // someone who has asked for less motion. jsdom implements no `matchMedia` at all, which is
    // also why the implementation guards for its absence rather than assuming it.
    Object.defineProperty(window, 'matchMedia', {
      value: () => ({ matches: true }) as MediaQueryList,
      configurable: true,
      writable: true,
    })

    const { container } = mountShowcase()

    expect(container.querySelector('.showcase')).toHaveAttribute('data-phase', 'ready')
    expect(container.querySelector('.bootscreen')).toBeNull()
    expect(container.querySelector('[data-theme="example-cfw"]')).not.toBeNull()

    Reflect.deleteProperty(window, 'matchMedia')
  })
})
