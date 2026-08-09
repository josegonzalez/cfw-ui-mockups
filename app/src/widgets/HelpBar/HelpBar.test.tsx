import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HelpBar } from '.'

const box = { left: 0, top: 440, width: 640, height: 40 }
const colors = { fg: '#8b90a3', badgeBg: '#4cc9f0', badgeFg: '#0b0d13' }

describe('HelpBar', () => {
  it('renders a badge and a label per hint', () => {
    render(
      <HelpBar
        box={box}
        items={[
          { glyph: 'a', label: 'Open' },
          { glyph: 'b', label: 'Back' },
        ]}
        colors={colors}
        font={13}
      />,
    )

    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('draws Start and Select as a pictogram rather than a letter', () => {
    // Neither button carries a letter on the hardware, so spelling them out inside a disc would
    // be inventing a marking the device does not have.
    render(
      <HelpBar box={box} items={[{ glyph: 'start', label: 'Menu' }]} colors={colors} font={13} />,
    )

    expect(screen.getByText('Menu')).toBeInTheDocument()
    expect(screen.queryByText('START')).not.toBeInTheDocument()
  })

  it('spells Start out in the plain style, where there is no badge to draw', () => {
    render(
      <HelpBar
        box={box}
        items={[{ glyph: 'start', label: 'Menu' }]}
        colors={colors}
        font={13}
        badge="plain"
      />,
    )

    expect(screen.getByText('START')).toBeInTheDocument()
  })

  it('uppercases labels when asked', () => {
    const { container } = render(
      <HelpBar
        box={box}
        items={[{ glyph: 'a', label: 'Navigation bar' }]}
        colors={colors}
        font={13}
        uppercase
      />,
    )

    const label = [...container.querySelectorAll('span')].find(
      (el) => el.textContent === 'Navigation bar',
    )
    expect(label).toHaveStyle({ textTransform: 'uppercase' })
  })

  it('renders nothing for an empty hint list', () => {
    const { container } = render(<HelpBar box={box} items={[]} colors={colors} font={13} />)
    expect(container.querySelector('[data-widget="HelpBar"]')?.childElementCount).toBe(0)
  })
})
