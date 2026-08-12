import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DeviceFrame } from './DeviceFrame'
import {
  chinHeight,
  clusterHeight,
  DEVICE_SLUGS,
  getDevice,
  gripWidth,
  radiusCss,
  type DeviceSlug,
} from './devices'
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

    // The twelve every device has. `menu` is extra and only where the hardware has one.
    expect(buttons.sort()).toEqual([
      'a',
      'b',
      'down',
      'l',
      'left',
      'menu',
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

  it('publishes the shell to CSS rather than styling per device', () => {
    const viewport = frameFor('rg35xx').querySelector('.device-viewport') as HTMLElement
    const shell = getDevice('rg35xx').shell

    expect(viewport.style.getPropertyValue('--bezel-side')).toBe(`${shell.bezel.side}px`)
    expect(viewport.style.getPropertyValue('--body-radius')).toBe(radiusCss(shell))
  })

  it('carries four corner radii through when a body sweeps one corner away', () => {
    // The RG35XX's swept bottom-right corner is most of what makes its outline recognisable.
    expect(radiusCss(getDevice('rg35xx').shell)).toBe('30px 30px 150px 30px')
    expect(radiusCss(getDevice('trimui-brick').shell)).toBe('26px')
  })

  it('reserves a chin that matches the cluster it holds', () => {
    // A chin that disagrees with its contents either crops the buttons or leaves a gap, and
    // neither is visible to any other assertion here.
    for (const slug of DEVICE_SLUGS) {
      const shell = getDevice(slug).shell
      if (shell.layout !== 'chin') continue
      const viewport = frameFor(slug).querySelector('.device-viewport') as HTMLElement

      expect(viewport.style.getPropertyValue('--controls-h'), slug).toBe(`${chinHeight(shell)}px`)
      expect(chinHeight(shell), slug).toBe(
        Math.round(clusterHeight(shell) * shell.controlScale) + (shell.chinExtra ?? 0),
      )
    }
  })

  it('gives every device a usable shell', () => {
    for (const slug of DEVICE_SLUGS) {
      const shell = getDevice(slug).shell
      // Zero is legitimate: one panel runs edge to edge across its body.
      expect(shell.bezel.side, slug).toBeGreaterThanOrEqual(0)
      expect(shell.body, slug).toHaveLength(2)

      if (shell.layout === 'chin') {
        expect(shell.controlScale, slug).toBeGreaterThan(0.5)
        expect(shell.controlScale, slug).toBeLessThan(3)
      } else if (shell.layout === 'flanking') {
        // A grip narrower than a fifth of the panel has nowhere to put a stick.
        expect(shell.gripWidth, slug).toBeGreaterThan(0.2)
        expect(shell.gripWidth, slug).toBeLessThan(1)
      }
      // A console has neither, which is the point of it.
    }
  })
})

describe('flanking bodies', () => {
  function frameFor(slug: DeviceSlug) {
    const { container } = render(
      <DeviceFrame device={slug} interactive={false}>
        <Probe />
      </DeviceFrame>,
    )
    return container
  }

  it('puts a grip either side of the panel instead of a chin below it', () => {
    // The CubeXX is a landscape controller with a square screen in the middle, not an upright
    // handheld. Drawn with a chin it reads as a tall rectangle with a square hole in it.
    const container = frameFor('rg-cubexx')

    expect(container.querySelector('.device')).toHaveAttribute('data-layout', 'flanking')
    expect(container.querySelectorAll('.grip')).toHaveLength(2)
    expect(container.querySelector('.device__chin')).toBeNull()
  })

  it('sizes the grips from the panel so the body stays in proportion', () => {
    const container = frameFor('rg-cubexx')
    const device = getDevice('rg-cubexx')
    const viewport = container.querySelector('.device-viewport') as HTMLElement

    expect(viewport.style.getPropertyValue('--grip-w')).toBe(
      `${gripWidth(device.shell, device.w)}px`,
    )
    expect(viewport.style.getPropertyValue('--controls-h')).toBe('0px')
  })

  it('splits the controls across the two grips', () => {
    const container = frameFor('rg-cubexx')
    const left = container.querySelector('.grip--left') as HTMLElement
    const right = container.querySelector('.grip--right') as HTMLElement

    expect(left.querySelector('.dpad')).not.toBeNull()
    expect(left.querySelector('[data-btn="l"]')).not.toBeNull()
    expect(right.querySelector('.faces')).not.toBeNull()
    expect(right.querySelector('[data-btn="r"]')).not.toBeNull()

    // One stick per grip, not two on one side.
    expect(left.querySelectorAll('.stick')).toHaveLength(1)
    expect(right.querySelectorAll('.stick')).toHaveLength(1)
  })

  it('reorders the whole grip when the small buttons sit at the top', () => {
    /*
     * Two arrangements, both taken from reference photographs. With Select and Start at the top
     * of each grip the pad drops to the middle and the sticks to the bottom; with them at the
     * bottom the pad sits high. Drawing one device with the other's order is not a small
     * difference - it is the wrong controller.
     */
    const top = frameFor('rg351m')
    expect(top.querySelector('.grip')).toHaveAttribute('data-aux', 'top')
    expect(top.querySelectorAll('.aux-button')).toHaveLength(2)

    const bottom = frameFor('rg-cubexx')
    expect(bottom.querySelector('.grip')).toHaveAttribute('data-aux', 'bottom')
    expect(bottom.querySelectorAll('.aux-button')).toHaveLength(0)
    expect(bottom.querySelectorAll('.pill--grip')).toHaveLength(2)
  })

  it('draws a system button only where the hardware has one', () => {
    expect(frameFor('rg-cubexx').querySelector('.fn-button')).not.toBeNull()
    // The slimmer bodies put Select and Start at the top instead and have no system button.
    expect(frameFor('rg351m').querySelector('.fn-button')).toBeNull()
  })
})

describe('shell details taken from references', () => {
  function frameFor(slug: DeviceSlug) {
    const { container } = render(
      <DeviceFrame device={slug} interactive={false}>
        <Probe />
      </DeviceFrame>,
    )
    return container
  }

  it('draws a Menu button and a speaker grille only where the profile has them', () => {
    const rg35xx = frameFor('rg35xx')
    expect(rg35xx.querySelector('[data-btn="menu"]')).not.toBeNull()
    expect(rg35xx.querySelector('.speaker')).not.toBeNull()

    const rg351m = frameFor('rg351m')
    expect(rg351m.querySelector('[data-btn="menu"]')).toBeNull()
    expect(rg351m.querySelector('.speaker')).toBeNull()
  })

  it('prints control names on the body rather than inside the buttons', () => {
    // Text set inside the pills is what pushed the RG35XX's face buttons off the plastic once
    // its controls were scaled to match the reference.
    const container = frameFor('rg35xx')
    const pill = container.querySelector('.device__meta .pill') as HTMLElement

    expect(pill.closest('.labelled')?.querySelector('.labelled__text')).toHaveTextContent('SELECT')
  })

  it('gives a stick collar only to the devices that make a feature of it', () => {
    expect(frameFor('rg-cubexx').querySelector('.stick--ring-rgb')).not.toBeNull()
    expect(frameFor('trimui-smart-pro').querySelector('.stick--ring-light')).not.toBeNull()
    expect(frameFor('rg552').querySelector('[class*="stick--ring"]')).toBeNull()
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
