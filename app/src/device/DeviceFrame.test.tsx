import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DeviceFrame } from './DeviceFrame'
import { chinHeight, clusterHeight, DEVICE_SLUGS, getDevice, type DeviceSlug } from './devices'
import { useScreen } from './ScreenContext'
import { useButtonPress, useInput } from '../input/InputProvider'
import { useRenderMode } from '../render/RenderModeProvider'

function Probe() {
  const { device, w, h, animate } = useScreen()
  const mode = useRenderMode()
  return (
    <div
      data-testid="probe"
      data-device={device.slug}
      data-size={`${w}x${h}`}
      data-animate={String(animate)}
      data-mode={mode}
    />
  )
}

function PressLog({ onPress }: { onPress: (button: string) => void }) {
  useButtonPress((button) => onPress(button))
  return null
}

describe('DeviceFrame', () => {
  it('renders at the device resolution and exposes it to the screen', () => {
    render(
      <DeviceFrame device="rg552">
        <Probe />
      </DeviceFrame>,
    )

    expect(screen.getByTestId('probe')).toHaveAttribute('data-size', '1920x1152')
  })

  it('reserves the scaled footprint while drawing the shell unscaled', () => {
    // Two elements, because transform: scale() does not affect layout. Without the outer box
    // the shell would overlap whatever follows it on the page.
    const { container } = render(
      <DeviceFrame device="rg35xx">
        <Probe />
      </DeviceFrame>,
    )

    const viewport = container.querySelector('.device-viewport') as HTMLElement
    expect(viewport.style.getPropertyValue('--screen-w')).toBe('640')
    expect(viewport.style.getPropertyValue('--screen-h')).toBe('480')
    expect(viewport.style.getPropertyValue('--scale')).toBe('1.3')
  })

  it('lets an explicit scale override the device default', () => {
    const { container } = render(
      <DeviceFrame device="rg35xx" scale={2}>
        <Probe />
      </DeviceFrame>,
    )

    expect(
      (container.querySelector('.device-viewport') as HTMLElement).style.getPropertyValue('--scale'),
    ).toBe('2')
  })

  it('defaults to animating, and passes the flag down', () => {
    const { rerender } = render(
      <DeviceFrame device="rg35xx">
        <Probe />
      </DeviceFrame>,
    )
    expect(screen.getByTestId('probe')).toHaveAttribute('data-animate', 'true')

    rerender(
      <DeviceFrame device="rg35xx" animate={false}>
        <Probe />
      </DeviceFrame>,
    )
    expect(screen.getByTestId('probe')).toHaveAttribute('data-animate', 'false')
  })

  it('passes the render mode down', () => {
    render(
      <DeviceFrame device="rg35xx" renderMode="fallback">
        <Probe />
      </DeviceFrame>,
    )
    expect(screen.getByTestId('probe')).toHaveAttribute('data-mode', 'fallback')
  })

  it('drops the bezel and controls when bare', () => {
    const { container } = render(
      <DeviceFrame device="rg35xx" bare>
        <Probe />
      </DeviceFrame>,
    )

    expect(container.querySelector('.device-viewport')).toBeNull()
    expect(container.querySelector('.device__controls')).toBeNull()
    expect(container.querySelector('.screen')).not.toBeNull()
  })

  it('renders the full button cluster', () => {
    const { container } = render(
      <DeviceFrame device="rg35xx">
        <Probe />
      </DeviceFrame>,
    )

    const buttons = [...container.querySelectorAll('[data-btn]')].map((el) =>
      el.getAttribute('data-btn'),
    )

    // Twelve physical buttons. `menu` is in the key map but has no button on the shell - the
    // devices reach it through a chord or a dedicated hardware key that is not modelled here.
    expect(buttons.sort()).toEqual([
      'a',
      'b',
      'down',
      'l',
      'left',
      'r',
      'right',
      'select',
      'start',
      'up',
      'x',
      'y',
    ])
  })
})

describe('device shells', () => {
  function frameFor(slug: DeviceSlug) {
    const { container } = render(
      <DeviceFrame device={slug} interactive={false}>
        <Probe />
      </DeviceFrame>,
    )
    return container
  }

  it('draws sticks only where the profile has them', () => {
    // The single clearest silhouette difference between these devices.
    expect(frameFor('rg-cubexx').querySelectorAll('.stick')).toHaveLength(2)
    expect(frameFor('rg35xx').querySelectorAll('.stick')).toHaveLength(0)
  })

  it('draws a second shoulder row only where the profile has triggers', () => {
    expect(frameFor('rg552').querySelectorAll('.device__shoulders')).toHaveLength(2)
    expect(frameFor('rg35xx').querySelectorAll('.device__shoulders')).toHaveLength(1)
  })

  it('keeps L2 and R2 on the same buttons as L and R', () => {
    // The key map has no separate triggers, and inventing one for a decorative row would mean
    // two buttons that look different and do the same thing without saying so.
    const container = frameFor('rg552')
    expect(container.querySelectorAll('[data-btn="l"]')).toHaveLength(2)
    expect(container.querySelectorAll('[data-btn="r"]')).toHaveLength(2)
  })

  it('publishes the shell to CSS rather than styling per device', () => {
    const viewport = frameFor('rg-cubexx').querySelector('.device-viewport') as HTMLElement
    const shell = getDevice('rg-cubexx').shell

    expect(viewport.style.getPropertyValue('--bezel-side')).toBe(`${shell.bezel.side}px`)
    expect(viewport.style.getPropertyValue('--body-radius')).toBe(`${shell.radius}px`)
    expect(viewport.style.getPropertyValue('--control-scale')).toBe(String(shell.controlScale))
  })

  it('reserves a chin that matches the cluster it holds', () => {
    // A chin that disagrees with its contents either crops the buttons or leaves a gap, and
    // neither is visible to any other assertion here.
    for (const slug of DEVICE_SLUGS) {
      const shell = getDevice(slug).shell
      const viewport = frameFor(slug).querySelector('.device-viewport') as HTMLElement

      expect(viewport.style.getPropertyValue('--controls-h'), slug).toBe(`${chinHeight(shell)}px`)
      expect(chinHeight(shell), slug).toBe(
        Math.round(clusterHeight(shell) * shell.controlScale),
      )
    }
  })

  it('gives every device a usable shell', () => {
    for (const slug of DEVICE_SLUGS) {
      const shell = getDevice(slug).shell
      expect(shell.controlScale, slug).toBeGreaterThan(0.5)
      expect(shell.controlScale, slug).toBeLessThan(3)
      expect(shell.radius, slug).toBeGreaterThanOrEqual(0)
      expect(shell.bezel.side, slug).toBeGreaterThan(0)
      expect(shell.body, slug).toHaveLength(2)
    }
  })
})

describe('input', () => {
  it('dispatches from the keyboard', async () => {
    const onPress = vi.fn()
    render(
      <DeviceFrame device="rg35xx">
        <PressLog onPress={onPress} />
      </DeviceFrame>,
    )

    await userEvent.keyboard('{ArrowDown}')
    expect(onPress).toHaveBeenCalledWith('down')

    await userEvent.keyboard('z')
    expect(onPress).toHaveBeenCalledWith('a')
  })

  it('dispatches from the on-screen buttons through the same path', async () => {
    const onPress = vi.fn()
    const { container } = render(
      <DeviceFrame device="rg35xx">
        <PressLog onPress={onPress} />
      </DeviceFrame>,
    )

    await userEvent.click(container.querySelector('[data-btn="a"]')!)
    expect(onPress).toHaveBeenCalledWith('a')
  })

  it('lights the pressed button, then clears it', async () => {
    vi.useFakeTimers()
    try {
      const { container } = render(
        <DeviceFrame device="rg35xx">
          <Probe />
        </DeviceFrame>,
      )
      const key = container.querySelector('[data-btn="a"]')!

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }))
      })
      expect(key.className).toContain('is-pressed')

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'z' }))
        vi.advanceTimersByTime(200)
      })
      expect(key.className).not.toContain('is-pressed')
    } finally {
      vi.useRealTimers()
    }
  })

  it('attaches no keyboard listener when not interactive', () => {
    const onPress = vi.fn()
    render(
      <DeviceFrame device="rg35xx" interactive={false}>
        <PressLog onPress={onPress} />
      </DeviceFrame>,
    )

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(onPress).not.toHaveBeenCalled()
  })

  it('clears held buttons when the window loses focus', () => {
    // A window that blurs mid-hold never delivers the keyup, which would strand a hold
    // gesture on forever.
    function HeldProbe() {
      const { pressed } = useInput()
      return <div data-testid="held">{[...pressed].join(',')}</div>
    }

    render(
      <DeviceFrame device="rg35xx">
        <HeldProbe />
      </DeviceFrame>,
    )

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' }))
    })
    expect(screen.getByTestId('held')).toHaveTextContent('l')

    act(() => {
      window.dispatchEvent(new Event('blur'))
    })
    expect(screen.getByTestId('held')).toHaveTextContent('')
  })

  it('reports auto-repeat, so hold gestures can ignore it', async () => {
    const events: Array<{ button: string; repeat: boolean }> = []
    function RepeatLog() {
      useButtonPress((button, meta) => events.push({ button, repeat: meta.repeat }))
      return null
    }

    render(
      <DeviceFrame device="rg35xx">
        <RepeatLog />
      </DeviceFrame>,
    )

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', repeat: true }))
    })

    expect(events).toEqual([
      { button: 'down', repeat: false },
      { button: 'down', repeat: true },
    ])
  })
})
