import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeaderBar } from '.'

const box = { left: 0, top: 0, width: 640, height: 44 }

describe('HeaderBar', () => {
  it('renders the title', () => {
    render(<HeaderBar box={box} title="Super Nintendo" titleFont={18} color="#e7e9f0" />)
    expect(screen.getByText('Super Nintendo')).toBeInTheDocument()
  })

  it('renders an accented title suffix as a separate span', () => {
    const { container } = render(
      <HeaderBar
        box={box}
        title="Example"
        titleAccent="OS"
        titleFont={18}
        color="#e7e9f0"
        accentColor="#4cc9f0"
      />,
    )

    const accent = [...container.querySelectorAll('span')].find((el) => el.textContent === 'OS')
    expect(accent).toHaveStyle({ color: '#4cc9f0' })
  })

  it('renders a leading glyph in the accent colour', () => {
    const { container } = render(
      <HeaderBar
        box={box}
        title="Super Nintendo"
        leading="‹"
        titleFont={18}
        color="#e7e9f0"
        accentColor="#4cc9f0"
      />,
    )

    const glyph = [...container.querySelectorAll('span')].find((el) => el.textContent === '‹')
    expect(glyph).toHaveStyle({ color: '#4cc9f0' })
  })

  it('renders the right-hand slot', () => {
    render(
      <HeaderBar
        box={box}
        title="Super Nintendo"
        titleFont={18}
        color="#e7e9f0"
        right={<span>7 games</span>}
      />,
    )

    expect(screen.getByText('7 games')).toBeInTheDocument()
  })

  it('draws the rule directly beneath, inset from both edges', () => {
    const { container } = render(
      <HeaderBar
        box={box}
        title="T"
        titleFont={18}
        color="#fff"
        ruleHeight={1}
        ruleColor="#4cc9f0"
        ruleInsetX={20}
      />,
    )

    const rule = [...container.querySelectorAll('div')].find(
      (el) => el.style.height === '1px' && el.style.background === 'rgb(76, 201, 240)',
    )
    expect(rule).toHaveStyle({ top: '44px', left: '20px', width: '600px' })
  })

  it('omits the rule when no height is given', () => {
    const { container } = render(<HeaderBar box={box} title="T" titleFont={18} color="#fff" />)
    expect(container.querySelectorAll('div')).toHaveLength(2) // header + title group
  })
})
