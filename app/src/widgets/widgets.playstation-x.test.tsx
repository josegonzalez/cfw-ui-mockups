import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'
import { IconRow } from './IconRow'
import { ProgressBar } from './ProgressBar'
import { Ticker } from './Ticker'
import { TileGrid } from './TileGrid'

const box = { left: 10, top: 20, width: 300, height: 40 }

describe('Ticker', () => {
  const items = [
    { key: 'a', content: <span>first</span> },
    { key: 'b', content: <span>second</span> },
  ]

  it('renders every block, and shows one', () => {
    // All of them exist so they can cross-fade; only opacity distinguishes them.
    const { container } = render(<Ticker box={box} items={items} activeIndex={0} />)

    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('second')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-active]')).toHaveLength(1)
  })

  it('keeps every block in the same box, so the widget never reflows', () => {
    // The point of the widget. A ticker that resized on each swap would jitter the chrome
    // beside it, which in the one place this is used is the whole top bar.
    const { container } = render(<Ticker box={box} items={items} activeIndex={1} />)
    const blocks = [...container.querySelectorAll('[data-widget="Ticker"] > div')] as HTMLElement[]

    expect(blocks).toHaveLength(2)
    for (const b of blocks) {
      expect(b.style.position).toBe('absolute')
      expect(b.style.inset).toBe('0px')
    }
  })

  it('takes the active block as a prop rather than owning a timer', () => {
    // A widget with its own clock could not be screenshotted reproducibly, and could not be
    // settled for a static snapshot.
    const { container, rerender } = render(<Ticker box={box} items={items} activeIndex={0} />)
    expect(container.querySelector('[data-active]')).toHaveTextContent('first')

    rerender(<Ticker box={box} items={items} activeIndex={1} />)
    expect(container.querySelector('[data-active]')).toHaveTextContent('second')
  })
})

describe('Badge', () => {
  it('draws a plain glyph when it has no background', () => {
    const { container } = render(<Badge kind="favorite" size={20} color="#fff" glyph="★" />)
    const badge = container.querySelector('[data-widget="Badge"]') as HTMLElement

    expect(badge).toHaveAttribute('data-badge', 'favorite')
    expect(badge.style.background).toBe('')
  })

  it('becomes a chip when it has one', () => {
    const { container } = render(
      <Badge kind="multidisc" size={20} color="#000" background="#F3C300" glyph="⌾" />,
    )
    const badge = container.querySelector('[data-widget="Badge"]') as HTMLElement

    expect(badge.style.background).toBe('rgb(243, 195, 0)')
    expect(badge.style.padding).not.toBe('')
  })

  it('proportions itself from one size', () => {
    const { container } = render(<Badge kind="cheevos" size={40} color="#fff" glyph="🏆" />)
    const badge = container.querySelector('[data-widget="Badge"]') as HTMLElement

    expect(badge.style.height).toBe('40px')
    // Float arithmetic, so compare the number rather than its formatting.
    expect(Number.parseFloat(badge.style.fontSize)).toBeCloseTo(28.8, 5)
  })

  it('takes the glyph as a prop, so it carries no icon set of its own', () => {
    // Each theme draws these from its own font at its own codepoints. A table here would be
    // one theme's table pretending to be general.
    render(<Badge kind="finished" size={20} color="#fff" glyph="✓" label="Finished" />)
    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(screen.getByText('Finished')).toBeInTheDocument()
  })
})

describe('IconRow', () => {
  it('keeps its left edge whether it is full or empty', () => {
    // The whole reason this is a widget: a game with six badges and one with none must not
    // shift anything around them.
    const full = render(
      <IconRow box={box} gap={8}>
        <Badge kind="favorite" size={20} color="#fff" glyph="★" />
        <Badge kind="cheevos" size={20} color="#fff" glyph="🏆" />
      </IconRow>,
    )
    const empty = render(<IconRow box={box} gap={8} />)

    const left = (r: typeof full) =>
      (r.container.querySelector('[data-widget="IconRow"]') as HTMLElement).style.left

    expect(left(full)).toBe(left(empty))
  })

  it('draws exactly what it is given, in order', () => {
    // Filtering belongs to the screen, which owns the theme's own visibility predicates.
    const { container } = render(
      <IconRow box={box} gap={8}>
        <Badge kind="favorite" size={20} color="#fff" glyph="★" />
        <Badge kind="buggy" size={20} color="#fff" glyph="⚠" />
      </IconRow>,
    )
    const row = within(container.querySelector('[data-widget="IconRow"]') as HTMLElement)
    const kinds = row
      .getAllByTitle(/favorite|buggy/)
      .map((el) => el.getAttribute('data-badge'))

    expect(kinds).toEqual(['favorite', 'buggy'])
  })
})

describe('ProgressBar', () => {
  const fill = (c: HTMLElement) => c.querySelector('[data-part="fill"]') as HTMLElement

  it('fills to its value', () => {
    const { container } = render(
      <ProgressBar box={box} value={0.4} trackColor="#333" fillColor="#0070d1" />,
    )
    expect(fill(container).style.width).toBe('40%')
  })

  it('clamps out-of-range values rather than overflowing its track', () => {
    // A boot progress that briefly reports 1.02 would otherwise draw a fill wider than the
    // track, and with a radius that is a visibly wrong shape rather than a slightly long bar.
    const over = render(
      <ProgressBar box={box} value={1.4} trackColor="#333" fillColor="#0070d1" />,
    )
    const under = render(
      <ProgressBar box={box} value={-0.5} trackColor="#333" fillColor="#0070d1" />,
    )

    expect(fill(over.container).style.width).toBe('100%')
    expect(fill(under.container).style.width).toBe('0%')
  })

  it('reports its value to assistive technology', () => {
    render(<ProgressBar box={box} value={0.25} trackColor="#333" fillColor="#0070d1" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  })

  it('makes the fill a gradient when given a second colour', () => {
    const { container } = render(
      <ProgressBar
        box={box}
        value={0.5}
        trackColor="#333"
        fillColor="#0070d1"
        fillColorEnd="#003791"
      />,
    )
    expect(fill(container).style.background).toContain('linear-gradient')
  })
})

describe('TileGrid centre-selection', () => {
  const metrics = {
    box: { left: -646.4, top: 61.2, width: 1921.28, height: 280.8 },
    cols: 9,
    rows: 1,
    tileW: 213.48,
    tileH: 280.8,
    padding: [10.24, 36] as const,
    margin: [0, 0] as const,
  }
  const items = Array.from({ length: 12 }, (_, i) => `g${i}`)
  const renderTile = (item: string) => <span>{item}</span>
  const strip = (c: HTMLElement) => c.querySelector('[data-part="strip"]') as HTMLElement
  /** The x of the strip's transform. Compared as a number: these are float pitches. */
  const shiftOf = (c: HTMLElement) =>
    Number.parseFloat(/translate\((-?[\d.]+)px/.exec(strip(c).style.transform)![1]!)

  it('pins the cursor and moves the content under it', () => {
    /*
     * The original writes `translateX(-(cursor - centerIndex) * cellW)`. Anchoring at
     * `centerIndex * cellW` reproduces it exactly, and expresses why: put the selected cell's
     * left edge where the centre column is.
     */
    const anchor = metrics.cols === 9 ? 4 * metrics.tileW : 0
    const { container } = render(
      <TileGrid
        metrics={metrics}
        items={items}
        selectedIndex={6}
        renderTile={renderTile}
        keyOf={(g) => g}
        order="column-major"
        scroll="centered"
        centerAnchor={anchor}
      />,
    )

    expect(shiftOf(container)).toBeCloseTo(-(6 - 4) * metrics.tileW, 6)
  })

  it('anchors to the screen centre just as readily as to a cell', () => {
    // The carousel view pins its selection to the middle of the panel rather than to a column.
    // Both are "put the selected cell's left edge at this x", which is why the anchor is a
    // number rather than a flag.
    const screenCentre = 1280 / 2 - metrics.tileW / 2
    const { container } = render(
      <TileGrid
        metrics={metrics}
        items={items}
        selectedIndex={3}
        renderTile={renderTile}
        keyOf={(g) => g}
        order="column-major"
        scroll="centered"
        centerAnchor={screenCentre}
      />,
    )

    expect(shiftOf(container)).toBeCloseTo(screenCentre - 3 * metrics.tileW, 6)
  })

  it('runs off both ends rather than clamping', () => {
    // Deliberate: the frame marking the selection is a separate element that never moves, so
    // the first and last items have to travel past it like any other.
    const at = (index: number) => {
      const { container } = render(
        <TileGrid
          metrics={metrics}
          items={items}
          selectedIndex={index}
          renderTile={renderTile}
          keyOf={(g) => g}
          order="column-major"
          scroll="centered"
          centerAnchor={4 * metrics.tileW}
        />,
      )
      return shiftOf(container)
    }

    expect(at(0)).toBeCloseTo(4 * metrics.tileW, 6)
    expect(at(11)).toBeCloseTo(-(11 - 4) * metrics.tileW, 6)
  })

  it('draws every tile, since there is no window to fall outside of', () => {
    const { container } = render(
      <TileGrid
        metrics={metrics}
        items={items}
        selectedIndex={0}
        renderTile={renderTile}
        keyOf={(g) => g}
        order="column-major"
        scroll="centered"
        centerAnchor={0}
      />,
    )
    expect(within(strip(container)).getAllByText(/^g\d+$/)).toHaveLength(12)
  })
})
