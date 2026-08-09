import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ListRow } from '.'

const box = { left: 0, top: 0, width: 300, height: 48 }
const colors = {
  fg: '#e7e9f0',
  sublabelFg: '#8b90a3',
  selectedFg: '#0b0d13',
  selectedBg: '#4cc9f0',
  selectedSublabelFg: '#0b3b47',
  iconBg: '#2a2e40',
  iconFg: '#cfd3e0',
  selectedIconBg: '#0b0d13',
  selectedIconFg: '#4cc9f0',
}

describe('ListRow', () => {
  it('uses the unselected colours by default', () => {
    render(<ListRow box={box} label="Recents" colors={colors} labelFont={20} />)
    expect(screen.getByText('Recents').closest('[data-selected]')).toBeNull()
  })

  it('swaps every colour when selected', () => {
    const { container } = render(
      <ListRow box={box} label="Recents" sublabel="Jump back in" selected colors={colors} labelFont={20} />,
    )

    const row = container.querySelector('[data-selected]') as HTMLElement
    expect(row).toHaveStyle({ color: '#0b0d13', background: '#4cc9f0' })
    expect(screen.getByText('Jump back in')).toHaveStyle({ color: '#0b3b47' })
  })

  it('shifts the selected row when asked, and only when selected', () => {
    const { container, rerender } = render(
      <ListRow box={box} label="Games" colors={colors} labelFont={20} selectedShiftX={6} />,
    )
    expect((container.firstElementChild as HTMLElement).style.transform).toBe('')

    rerender(<ListRow box={box} label="Games" colors={colors} labelFont={20} selectedShiftX={6} selected />)
    expect((container.firstElementChild as HTMLElement).style.transform).toBe('translateX(6px)')
  })

  it('bolds the selected label', () => {
    render(<ListRow box={box} label="Games" colors={colors} labelFont={20} selected />)
    expect(screen.getByText('Games')).toHaveStyle({ fontWeight: '700' })
  })

  it('clips rather than ellipsising when the theme says so', () => {
    // One source theme hard-clips overlong rows to match its reference art. That is authored,
    // not a lesser default.
    render(<ListRow box={box} label="A very long title" colors={colors} labelFont={20} overflow="clip" />)
    expect(screen.getByText('A very long title')).toHaveStyle({ textOverflow: 'clip' })
  })

  it('ellipsises by default', () => {
    render(<ListRow box={box} label="A very long title" colors={colors} labelFont={20} />)
    expect(screen.getByText('A very long title')).toHaveStyle({ textOverflow: 'ellipsis' })
  })

  it('renders an icon tile with its own selected colours', () => {
    render(<ListRow box={box} label="Games" icon="G" colors={colors} labelFont={20} selected />)
    expect(screen.getByText('G')).toHaveStyle({ background: '#0b0d13', color: '#4cc9f0' })
  })

  it('compiles a transition from descriptors', () => {
    const { container } = render(
      <ListRow
        box={box}
        label="Games"
        colors={colors}
        labelFont={20}
        transition={[{ property: 'transform', duration: 50, easing: 'ease' }]}
      />,
    )

    expect((container.firstElementChild as HTMLElement).style.transition).toBe(
      'transform 50ms cubic-bezier(0.25,0.1,0.25,1)',
    )
  })

  it('positions from its resolved box', () => {
    const { container } = render(
      <ListRow box={{ left: 12, top: 96, width: 300, height: 48 }} label="X" colors={colors} labelFont={16} />,
    )

    expect(container.firstElementChild).toHaveStyle({
      position: 'absolute',
      left: '12px',
      top: '96px',
      width: '300px',
      height: '48px',
    })
  })
})
