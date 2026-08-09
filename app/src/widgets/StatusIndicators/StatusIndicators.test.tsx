import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusIndicators } from '.'

const box = { left: 500, top: 8, width: 130, height: 24 }
const battery = { shell: '#e7e9f0', fill: '#4cc9f0', lowFill: '#ff6b6b', chargingFill: '#3ad29f' }

describe('StatusIndicators', () => {
  it('renders icon items as images', () => {
    render(
      <StatusIndicators
        box={box}
        size={24}
        gap={8}
        items={[{ kind: 'icon', key: 'wifi', src: '/wifi.svg', alt: 'wifi' }]}
      />,
    )

    expect(screen.getByAltText('wifi')).toHaveAttribute('src', '/wifi.svg')
  })

  it('renders text items', () => {
    render(
      <StatusIndicators
        box={box}
        size={24}
        gap={8}
        font={14}
        color="#8b90a3"
        items={[{ kind: 'text', key: 'pct', text: '85%', color: '#4cc9f0' }]}
      />,
    )

    expect(screen.getByText('85%')).toHaveStyle({ color: '#4cc9f0' })
  })

  it('draws a battery at the requested level', () => {
    render(
      <StatusIndicators
        box={box}
        size={20}
        gap={8}
        battery={battery}
        items={[{ kind: 'battery', key: 'batt', percent: 85 }]}
      />,
    )

    expect(screen.getByLabelText('battery 85%')).toBeInTheDocument()
  })

  it('clamps an out-of-range level rather than overflowing the shell', () => {
    render(
      <StatusIndicators
        box={box}
        size={20}
        gap={8}
        battery={battery}
        items={[
          { kind: 'battery', key: 'over', percent: 140 },
          { kind: 'battery', key: 'under', percent: -20 },
        ]}
      />,
    )

    expect(screen.getByLabelText('battery 100%')).toBeInTheDocument()
    expect(screen.getByLabelText('battery 0%')).toBeInTheDocument()
  })

  it('renders several items in order', () => {
    const { container } = render(
      <StatusIndicators
        box={box}
        size={20}
        gap={8}
        battery={battery}
        items={[
          { kind: 'icon', key: 'wifi', src: '/wifi.svg', alt: 'wifi' },
          { kind: 'battery', key: 'batt', percent: 50 },
        ]}
      />,
    )

    expect(container.querySelector('[data-widget="StatusIndicators"]')?.childElementCount).toBe(2)
  })
})
