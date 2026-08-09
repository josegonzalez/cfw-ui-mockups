import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextList, firstVisibleIndex, nextFirstVisible } from '.'

const items = Array.from({ length: 20 }, (_, i) => ({ key: `k${i}`, label: `Item ${i}` }))
const colors = { fg: '#fff', selectedFg: '#000', selectedBg: '#4cc9f0' }

describe('nextFirstVisible', () => {
  it('shows the top of the list when everything fits', () => {
    expect(nextFirstVisible(0, 3, 10, 5)).toBe(0)
  })

  it('does not move while the selection is already inside the window', () => {
    expect(nextFirstVisible(0, 0, 5, 20)).toBe(0)
    expect(nextFirstVisible(0, 4, 5, 20)).toBe(0)
    expect(nextFirstVisible(3, 5, 5, 20)).toBe(3)
  })

  it('scrolls by the minimum needed once the selection passes the bottom', () => {
    // Stepping from row 4 to row 5 in a 5-row window scrolls exactly one row, not a page.
    expect(nextFirstVisible(0, 5, 5, 20)).toBe(1)
    expect(nextFirstVisible(1, 6, 5, 20)).toBe(2)
  })

  it('follows the selection back up, which is why the previous position is an input', () => {
    // From a window at rows 10-14, selecting row 8 scrolls up to put it at the top.
    expect(nextFirstVisible(10, 8, 5, 20)).toBe(8)
  })

  it('stops scrolling at the end of the list', () => {
    // Otherwise the last page would show blank rows below the final item.
    expect(nextFirstVisible(0, 19, 5, 20)).toBe(15)
    expect(nextFirstVisible(18, 19, 5, 20)).toBe(15)
  })

  it('clamps a nonsensical previous position', () => {
    expect(nextFirstVisible(-5, 0, 5, 20)).toBe(0)
    expect(nextFirstVisible(999, 19, 5, 20)).toBe(15)
  })

  it('handles an empty list', () => {
    expect(nextFirstVisible(0, 0, 5, 0)).toBe(0)
  })
})

describe('firstVisibleIndex', () => {
  it('behaves as a window that has never scrolled', () => {
    expect(firstVisibleIndex(4, 5, 20)).toBe(0)
    expect(firstVisibleIndex(5, 5, 20)).toBe(1)
    expect(firstVisibleIndex(19, 5, 20)).toBe(15)
  })
})

describe('TextList', () => {
  it('renders only the rows that fit', () => {
    // 300px tall, 60px rows -> exactly 5.
    render(
      <TextList
        box={{ left: 0, top: 0, width: 300, height: 300 }}
        items={items}
        selectedIndex={0}
        rowHeight={60}
        colors={colors}
        labelFont={16}
      />,
    )

    expect(screen.getAllByText(/^Item /)).toHaveLength(5)
    expect(screen.getByText('Item 0')).toBeInTheDocument()
    expect(screen.queryByText('Item 5')).not.toBeInTheDocument()
  })

  it('accounts for the gap when deciding how many rows fit', () => {
    // 4 rows of 60 plus 3 gaps of 20 is 300; a 5th would not fit.
    render(
      <TextList
        box={{ left: 0, top: 0, width: 300, height: 300 }}
        items={items}
        selectedIndex={0}
        rowHeight={60}
        gap={20}
        colors={colors}
        labelFont={16}
      />,
    )

    expect(screen.getAllByText(/^Item /)).toHaveLength(4)
  })

  it('scrolls to keep the selection visible', () => {
    render(
      <TextList
        box={{ left: 0, top: 0, width: 300, height: 300 }}
        items={items}
        selectedIndex={7}
        rowHeight={60}
        colors={colors}
        labelFont={16}
      />,
    )

    expect(screen.getByText('Item 7')).toBeInTheDocument()
    expect(screen.queryByText('Item 0')).not.toBeInTheDocument()
  })

  it('marks exactly one row selected', () => {
    const { container } = render(
      <TextList
        box={{ left: 0, top: 0, width: 300, height: 300 }}
        items={items}
        selectedIndex={2}
        rowHeight={60}
        colors={colors}
        labelFont={16}
      />,
    )

    const selected = container.querySelectorAll('[data-selected]')
    expect(selected).toHaveLength(1)
    expect(selected[0]).toHaveTextContent('Item 2')
  })

  it('positions rows by pitch, not by document flow', () => {
    const { container } = render(
      <TextList
        box={{ left: 0, top: 0, width: 300, height: 300 }}
        items={items}
        selectedIndex={0}
        rowHeight={60}
        gap={4}
        colors={colors}
        labelFont={16}
      />,
    )

    const list = container.querySelector('[data-widget="TextList"]')!
    const tops = [...list.children].map((el) => (el as HTMLElement).style.top)

    expect(tops.slice(0, 3)).toEqual(['0px', '64px', '128px'])
  })

  it('keeps the window where it was told to, when the screen tracks scroll itself', () => {
    render(
      <TextList
        box={{ left: 0, top: 0, width: 300, height: 300 }}
        items={items}
        selectedIndex={12}
        firstVisible={10}
        rowHeight={60}
        colors={colors}
        labelFont={16}
      />,
    )

    // Row 12 is inside the window at 10-14, so the window does not move.
    expect(screen.getByText('Item 10')).toBeInTheDocument()
    expect(screen.getByText('Item 14')).toBeInTheDocument()
  })

  it('renders nothing for an empty list', () => {
    render(
      <TextList
        box={{ left: 0, top: 0, width: 300, height: 300 }}
        items={[]}
        selectedIndex={0}
        rowHeight={60}
        colors={colors}
        labelFont={16}
      />,
    )

    expect(screen.queryByText(/^Item /)).not.toBeInTheDocument()
  })

  it('renders subtitles and icons when supplied', () => {
    render(
      <TextList
        box={{ left: 0, top: 0, width: 300, height: 300 }}
        items={[{ key: 'a', label: 'Games', sublabel: 'Browse by system', icon: 'G' }]}
        selectedIndex={0}
        rowHeight={68}
        colors={colors}
        labelFont={20}
      />,
    )

    expect(screen.getByText('Games')).toBeInTheDocument()
    expect(screen.getByText('Browse by system')).toBeInTheDocument()
    expect(screen.getByText('G')).toBeInTheDocument()
  })
})
