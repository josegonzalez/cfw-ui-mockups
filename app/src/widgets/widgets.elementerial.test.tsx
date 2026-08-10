import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnchoredImage } from './AnchoredImage'
import { Carousel } from './Carousel'
import { FullScreenFade } from './FullScreenFade'
import { MenuPanel, type MenuEntry } from './MenuPanel'
import { Scrim } from './Scrim'
import { StarRating, isStarFilled } from './StarRating'
import { TileGrid, tileBox, type TileGridMetrics } from './TileGrid'
import { RenderModeProvider } from '../render/RenderModeProvider'

/** The widgets Elementerial brought into the kit. */

describe('AnchoredImage', () => {
  const box = { posX: 200, posY: 100, originX: 0.5, originY: 0.5, maxWidth: 260, maxHeight: 150 }

  it('sizes by maximum rather than fixing a box', () => {
    // The distinction from object-fit: the element shrinks to the fitted image, so the anchor
    // and the radius act on the artwork rather than on a letterbox.
    render(<AnchoredImage box={box} src="/a.png" alt="art" />)
    const img = screen.getByAltText('art')

    expect(img).toHaveStyle({ maxWidth: '260px', maxHeight: '150px', width: 'auto', height: 'auto' })
  })

  it('shifts by the origin fraction of its own size', () => {
    render(<AnchoredImage box={box} src="/a.png" alt="art" />)
    expect(screen.getByAltText('art')).toHaveStyle({ transform: 'translate(-50%, -50%)' })
  })

  it('anchors by the top-left when the origin is zero', () => {
    render(
      <AnchoredImage box={{ ...box, originX: 0, originY: 0 }} src="/a.png" alt="art" />,
    )
    expect(screen.getByAltText('art')).toHaveStyle({ transform: 'translate(0%, 0%)' })
  })
})

describe('Scrim', () => {
  const box = { left: 0, top: 0, width: 640, height: 480 }

  it('masks a flat colour when web effects are available', () => {
    const { container } = render(
      <RenderModeProvider mode="web">
        <Scrim box={box} mode="mask" color="#16191D" src="/mask.png" />
      </RenderModeProvider>,
    )
    const scrim = container.querySelector('[data-widget="Scrim"]') as HTMLElement

    expect(scrim.style.background).toContain('rgb(22, 25, 29)')
    expect(scrim.style.maskImage || scrim.style.getPropertyValue('-webkit-mask-image')).toContain('mask.png')
  })

  it('falls back to a gradient rather than a solid sheet', () => {
    // The failure this avoids is real: an unmasked tint once painted solid over every view while
    // every numeric check passed.
    const { container } = render(
      <RenderModeProvider mode="fallback">
        <Scrim box={box} mode="mask" color="#16191D" src="/mask.png" />
      </RenderModeProvider>,
    )
    const scrim = container.querySelector('[data-widget="Scrim"]') as HTMLElement

    expect(scrim.style.background).toContain('linear-gradient')
    expect(scrim.style.background).toContain('transparent')
    expect(scrim.style.maskImage).toBe('')
  })

  it('draws an overlay image as-is', () => {
    const { container } = render(<Scrim box={box} mode="image" src="/overlay.png" />)
    const scrim = container.querySelector('[data-widget="Scrim"]') as HTMLElement

    expect(scrim.style.backgroundImage).toContain('overlay.png')
    expect(scrim.style.backgroundSize).toBe('100% 100%')
  })

  it('never intercepts input', () => {
    const { container } = render(<Scrim box={box} mode="wash" color="#000" />)
    expect(container.querySelector('[data-widget="Scrim"]')).toHaveStyle({ pointerEvents: 'none' })
  })
})

describe('StarRating', () => {
  const props = { box: { left: 0, top: 0 }, size: 20, color: '#ff8c82', filledSvg: '<svg/>', emptySvg: '<svg/>' }

  it('keeps the fourth star at exactly 0.8', () => {
    // Without the epsilon this fails through floating-point error, on a very common rating.
    expect(isStarFilled(0.8, 3)).toBe(true)
  })

  it('renders one element per star and labels the rating', () => {
    render(<StarRating {...props} rating={0.6} />)
    const row = screen.getByRole('img', { name: '3 out of 5' })

    expect(row.childElementCount).toBe(5)
  })

  it('tints from the accent rather than the artwork', () => {
    render(<StarRating {...props} rating={1} />)
    expect(screen.getByRole('img', { name: '5 out of 5' })).toHaveStyle({ fill: '#ff8c82' })
  })
})

describe('FullScreenFade', () => {
  it('stays mounted so it has something to animate from', () => {
    const { container } = render(<FullScreenFade on={false} durationMs={350} />)
    const fade = container.querySelector('[data-widget="FullScreenFade"]') as HTMLElement

    expect(fade).not.toBeNull()
    expect(fade).toHaveStyle({ opacity: '0' })
    expect(fade.style.transition).toContain('350ms')
  })

  it('covers the screen when on', () => {
    const { container } = render(<FullScreenFade on durationMs={350} />)
    expect(container.querySelector('[data-widget="FullScreenFade"]')).toHaveStyle({ opacity: '1' })
  })
})

describe('Carousel', () => {
  const items = ['a', 'b', 'c', 'd'].map((k) => ({ key: k, src: `/${k}.png`, alt: k }))
  const props = {
    box: { left: -32, top: 0, width: 704, height: 480 },
    items,
    pitch: 176,
    itemWidth: 160,
    itemHeight: 120,
    selectedLeft: 105.6,
    selectedTop: 288,
    selectedScale: 1.4,
    restOpacity: 0.5,
  }

  it('slides the strip rather than moving the selection', () => {
    const { container } = render(<Carousel {...props} selectedIndex={2} />)
    const strip = container.querySelector('[data-part="strip"]') as HTMLElement

    expect(strip.style.transform).toBe('translateX(-352px)')
  })

  it('grows and brightens the selected item only', () => {
    render(<Carousel {...props} selectedIndex={1} />)

    expect(screen.getByAltText('b')).toHaveStyle({ transform: 'scale(1.4)', opacity: '1' })
    expect(screen.getByAltText('a')).toHaveStyle({ transform: 'scale(1)', opacity: '0.5' })
  })

  it('spaces items by the pitch', () => {
    render(<Carousel {...props} selectedIndex={0} />)

    expect(screen.getByAltText('a')).toHaveStyle({ left: '105.6px' })
    expect(screen.getByAltText('b')).toHaveStyle({ left: '281.6px' })
  })
})

describe('TileGrid', () => {
  const metrics: TileGridMetrics = {
    box: { left: 0, top: 0, width: 600, height: 300 },
    cols: 3,
    rows: 2,
    tileW: 180,
    tileH: 140,
    padding: [10, 5],
    margin: [20, 10],
  }
  const items = Array.from({ length: 14 }, (_, i) => `g${i}`)
  const renderTile = (item: string) => <span>{item}</span>

  it('places tiles by pitch, not by document flow', () => {
    expect(tileBox(metrics, 0)).toMatchObject({ left: 10, top: 5, col: 0, row: 0 })
    expect(tileBox(metrics, 1)).toMatchObject({ left: 210, col: 1 })
    expect(tileBox(metrics, 3)).toMatchObject({ left: 10, top: 155, row: 1 })
  })

  it('shows only the current page when paging', () => {
    const { container } = render(
      <TileGrid metrics={metrics} items={items} selectedIndex={1} renderTile={renderTile} keyOf={(g) => g} />,
    )
    const strip = container.querySelector('[data-part="strip"]')!

    expect(within(strip as HTMLElement).getAllByText(/^g\d+$/)).toHaveLength(6)
    expect(screen.getByText('g0')).toBeInTheDocument()
    expect(screen.queryByText('g6')).not.toBeInTheDocument()
  })

  it('turns a whole page rather than scrolling a row', () => {
    render(
      <TileGrid metrics={metrics} items={items} selectedIndex={7} renderTile={renderTile} keyOf={(g) => g} />,
    )

    expect(screen.getByText('g7')).toBeInTheDocument()
    expect(screen.queryByText('g0')).not.toBeInTheDocument()
  })

  it('slides by one when stripping, keeping the selection near the middle', () => {
    const strip: TileGridMetrics = { ...metrics, rows: 1 }
    const { container } = render(
      <TileGrid metrics={strip} items={items} selectedIndex={5} renderTile={renderTile} keyOf={(g) => g} scroll="strip" />,
    )

    // Selection 5, centre column 1, so the strip offsets by four pitches of 200.
    expect((container.querySelector('[data-part="strip"]') as HTMLElement).style.transform).toBe(
      'translate(-800px, 0px)',
    )
  })

  it('marks the selected tile', () => {
    const { container } = render(
      <TileGrid metrics={metrics} items={items} selectedIndex={2} renderTile={renderTile} keyOf={(g) => g} />,
    )
    const selected = container.querySelectorAll('[data-selected]')

    expect(selected).toHaveLength(1)
    expect(selected[0]).toHaveTextContent('g2')
  })
})

describe('MenuPanel', () => {
  const entries: MenuEntry[] = [
    { kind: 'group', key: 'g1', label: 'Settings' },
    { kind: 'row', key: 'display', label: 'Display', value: '640x480' },
    { kind: 'row', key: 'sound', label: 'Sound', toggle: true, on: true },
    { kind: 'group', key: 'g2', label: 'System' },
    { kind: 'row', key: 'restart', label: 'Restart' },
  ]

  const colors = {
    panel: '#1D1616',
    fg: '#ffffff',
    mutedFg: '#ffffffcc',
    selectedFg: '#FFEBEB',
    selectedBg: '#ED5353',
    groupFg: '#ff8c82',
    groupBg: '#ff8c821a',
    groupRule: '#ff8c8299',
    rowRule: '#ffffff0d',
    shade: 'rgba(0, 0, 0, 0.6)',
  }

  const props = {
    left: 120,
    width: 400,
    maxHeight: 380,
    screenWidth: 640,
    screenHeight: 480,
    title: 'MAIN MENU',
    footer: 'ELEMENTERIAL',
    entries,
    colors,
    padding: 16,
    radius: 15,
    titleHeight: 50,
    titleFont: 24,
    rowHeight: 34,
    rowFont: 17,
    groupHeight: 26,
    groupFont: 14,
    footerHeight: 27,
    footerFont: 14,
    iconSize: 19,
  }

  it('renders the title, groups, rows and footer', () => {
    render(<MenuPanel {...props} selectedIndex={0} />)

    expect(screen.getByText('MAIN MENU')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Display')).toBeInTheDocument()
    expect(screen.getByText('ELEMENTERIAL')).toBeInTheDocument()
  })

  it('counts only rows toward the cursor, skipping group headings', () => {
    // Index 2 is the third *row*, which is past a second heading. Stopping on a heading you
    // cannot activate reads as a broken cursor.
    render(<MenuPanel {...props} selectedIndex={2} />)

    const selected = screen.getAllByRole('menuitem').filter((el) => el.dataset.selected)
    expect(selected).toHaveLength(1)
    expect(selected[0]).toHaveTextContent('Restart')
  })

  it('inverts the selected row', () => {
    render(<MenuPanel {...props} selectedIndex={0} />)

    const selected = screen.getAllByRole('menuitem').find((el) => el.dataset.selected)!
    expect(selected).toHaveStyle({ background: '#ED5353', color: '#FFEBEB' })
  })

  it('dims the view underneath rather than replacing it', () => {
    const { container } = render(<MenuPanel {...props} selectedIndex={0} />)
    const shade = container.firstElementChild as HTMLElement

    expect(shade).toHaveStyle({ background: 'rgba(0, 0, 0, 0.6)' })
  })

  it('draws a toggle from the supplied artwork', () => {
    render(<MenuPanel {...props} selectedIndex={0} switchUrl={(on) => (on ? '/on.svg' : '/off.svg')} />)
    expect(screen.getByAltText('on')).toHaveAttribute('src', '/on.svg')
  })
})
