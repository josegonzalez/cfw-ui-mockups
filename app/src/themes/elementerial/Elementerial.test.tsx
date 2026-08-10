import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DeviceFrame } from '../../device/DeviceFrame'
import { Elementerial, type ElementerialProps } from '.'
import { ElementerialInteractive, applyChromeAction, DEFAULT_SUBSETS } from './Interactive'
import { ELEMENTERIAL_SCREENS } from './manifest'
import { MENU_ENTRIES } from './views/MenuView'
import { INFO_TIMING } from './views/SystemView'
import { gamesFor, SYSTEMS } from './library'
import type { DeviceSlug } from '../../device/devices'

function mount(props: ElementerialProps = {}, interactive = false, device: DeviceSlug = 'rg35xx') {
  return render(
    <DeviceFrame device={device} animate={interactive} interactive={interactive}>
      <Elementerial {...props} />
    </DeviceFrame>,
  )
}

const root = (container: HTMLElement) => container.querySelector('.el-root') as HTMLElement
const rows = (container: HTMLElement) =>
  [...container.querySelectorAll('.el-row')].map((row) => row.textContent)

describe('Elementerial views', () => {
  it('renders the system carousel with every system and the selected one named', () => {
    const { container } = mount({ view: 'system', system: 'gba' })

    // Cased by the stylesheet, so the text in the DOM is the library's own.
    expect(screen.getByText('Game Boy Advance')).toBeInTheDocument()
    expect(screen.getByText('126 GAMES')).toBeInTheDocument()
    expect(container.querySelectorAll('.el-logo')).toHaveLength(SYSTEMS.length)
  })

  it('renders each game list view with the system title and the first game selected', () => {
    for (const view of ['basic', 'detailed', 'video'] as const) {
      const { container, unmount } = mount({ view, system: 'gba' })
      const games = gamesFor('gba')

      expect(rows(container)[0]).toBe(games[0]!.name)
      expect(container.querySelector('.el-row[data-selected]')).toHaveTextContent(games[0]!.name)
      unmount()
    }
  })

  it('only shows a description on the 1:1 panel, which is where the source turns it on', () => {
    const wide = mount({ view: 'detailed', system: 'gba' }, false, 'rg35xx')
    expect(wide.container.querySelector('.el-md-description')).toBeNull()
    wide.unmount()

    const square = mount({ view: 'detailed', system: 'gba' }, false, 'rg-cubexx')
    expect(square.container.querySelector('.el-md-description')).not.toBeNull()
  })

  it('draws the row that straddles the bottom edge rather than dropping it', () => {
    // The list box is not a whole number of rows, and the engine paints the partial one.
    const { container } = mount({ view: 'video', system: 'snes' })
    const drawn = container.querySelectorAll('.el-row').length
    const list = container.querySelector('.el-list') as HTMLElement

    const height = Number.parseFloat(list.style.height)
    const pitch = Number.parseFloat((container.querySelector('.el-row') as HTMLElement).style.height)

    expect(height % pitch).not.toBe(0)
    expect(drawn).toBe(Math.ceil(height / pitch))
  })

  it('fills the grids column by column, because they scroll sideways', () => {
    const { container } = mount({ view: 'grid', system: 'snes' })
    const tiles = [...container.querySelectorAll('[data-part="strip"] > div')] as HTMLElement[]

    // Item 1 is below item 0, not beside it.
    expect(tiles[1]!.style.left).toBe(tiles[0]!.style.left)
    expect(Number.parseFloat(tiles[1]!.style.top)).toBeGreaterThan(
      Number.parseFloat(tiles[0]!.style.top),
    )
    expect(tiles[2]!.style.top).toBe(tiles[0]!.style.top)
  })

  it('lays out every tile so the column clipped at the edge is still drawn', () => {
    const { container } = mount({ view: 'grid', system: 'snes' })
    expect(container.querySelectorAll('[data-part="strip"] > div')).toHaveLength(
      gamesFor('snes').length,
    )
  })

  it('draws the menu over the view behind it, with the engine hint bar hidden', () => {
    const { container } = mount({ view: 'menu', behind: 'system', system: 'gb' })

    expect(screen.getByRole('menu', { name: 'MAIN MENU' })).toBeInTheDocument()
    // The carousel is still there underneath.
    expect(container.querySelectorAll('.el-logo').length).toBeGreaterThan(0)
    expect(container.querySelector('[data-widget="HelpBar"]')).toBeNull()
  })

  it('sizes the menu to whole entries rather than slicing one in half', () => {
    const { container } = mount({ view: 'menu', system: 'gb' })
    const panel = container.querySelector('[data-widget="MenuPanel"]') as HTMLElement
    const shown = panel.querySelectorAll('[role="menuitem"]').length

    expect(shown).toBeGreaterThan(0)
    expect(shown).toBeLessThan(MENU_ENTRIES.filter((e) => e.kind === 'row').length)
  })
})

describe('Elementerial chrome', () => {
  it('shows the system hints on the carousel and the gamelist hints elsewhere', () => {
    const system = mount({ view: 'system' })
    expect(within(system.container).getByText('NAVIGATION BAR')).toBeInTheDocument()
    system.unmount()

    const list = mount({ view: 'basic' })
    expect(within(list.container).getByText('OPTIONS')).toBeInTheDocument()
  })

  it('draws the panel overlays wherever the artwork exists, including the 5:3 set', () => {
    // The original's stylesheet had no 5:3 rule, so neither overlay ever drew on the RG552.
    for (const device of ['rg35xx', 'rg552'] as DeviceSlug[]) {
      const { container, unmount } = mount({ view: 'system' }, false, device)
      const overlays = [...container.querySelectorAll('[data-widget="Scrim"]')].filter(
        (el) => (el as HTMLElement).style.zIndex === '100',
      )
      expect(overlays).toHaveLength(2)
      unmount()
    }
  })

  it('keeps the status bar above the on-screen-display scrim', () => {
    const { container } = mount({ view: 'system' })
    const clock = container.querySelector('[data-widget="Clock"]') as HTMLElement
    const status = container.querySelector('[data-widget="StatusIndicators"]') as HTMLElement

    expect(Number(clock.style.zIndex)).toBeGreaterThan(100)
    expect(Number(status.style.zIndex)).toBeGreaterThan(100)
  })

  it('makes the theme root a stacking context so its negative layers are not lost', () => {
    // Every backdrop and scrim sits below zero and this root paints an opaque fill. Without the
    // context they escape it and paint underneath, which hides the artwork on every view while
    // leaving all the geometry correct. Read from the stylesheet, because the test environment
    // does not apply it - the rendered check is the screenshot suite's job.
    // From disk rather than an import: the test environment resolves a CSS import to an empty
    // module, so importing it would assert against nothing and always pass.
    const css = readFileSync(
      resolve(process.cwd(), 'src/themes/elementerial/elementerial.css'),
      'utf8',
    )
    const rule = css.slice(css.indexOf('.el-root {'), css.indexOf('.el-root *'))
    expect(rule).not.toHaveLength(0)

    expect(rule).toContain('isolation: isolate')
    expect(rule).toContain('background: var(--bgColor)')
  })

  it('keeps the info fade durations in step with the stylesheet', () => {
    // The two transitions are CSS and the wait between them is a timer, so the pair can drift.
    const css = readFileSync(
      resolve(process.cwd(), 'src/themes/elementerial/elementerial.css'),
      'utf8',
    )

    expect(css).toContain(`--el-info-out: ${INFO_TIMING.out}ms`)
    expect(css).toContain(`--el-info-in: ${INFO_TIMING.in}ms`)
  })
})

describe('Elementerial as a static screen', () => {
  it('ignores input', async () => {
    const { container } = mount({ view: 'basic', system: 'nes', selected: 1 })
    const before = container.querySelector('.el-row[data-selected]')?.textContent

    await userEvent.keyboard('{ArrowDown}')
    expect(container.querySelector('.el-row[data-selected]')?.textContent).toBe(before)
  })

  it('renders every screen in the manifest without throwing', () => {
    for (const entry of ELEMENTERIAL_SCREENS) {
      const { container, unmount } = mount({
        view: entry.view,
        scheme: entry.scheme,
        style: entry.style,
        system: entry.system,
      })
      expect(root(container)).toHaveAttribute('data-view', entry.view)
      unmount()
    }
  })

  it('applies the scheme as custom properties on its own root', () => {
    const { container } = mount({ scheme: 'lime', style: 'dark' })
    expect(root(container).style.getPropertyValue('--mainColor')).toBeTruthy()
    expect(root(container)).toHaveAttribute('data-scheme', 'lime')
  })
})

describe('Elementerial interactive', () => {
  it('moves the carousel with left and right', async () => {
    const { container } = render(<ElementerialInteractive device="rg35xx" />)
    // Not just `.el-system-name`: once a change is in flight the outgoing name is a sibling
    // that comes first in the document, and it is the one fading out.
    const name = () =>
      container.querySelector('.el-system-name:not(.el-system-name--out)')?.textContent
    const first = name()

    await userEvent.keyboard('{ArrowRight}')
    expect(name()).not.toBe(first)

    await userEvent.keyboard('{ArrowLeft}')
    expect(name()).toBe(first)
  })

  it('cycles views, schemes and style on the mockup-only keys', async () => {
    const { container } = render(<ElementerialInteractive device="rg35xx" />)
    const el = () => container.querySelector('.el-root') as HTMLElement

    await userEvent.keyboard(']')
    expect(el()).toHaveAttribute('data-view', 'basic')

    await userEvent.keyboard('.')
    expect(el().getAttribute('data-scheme')).not.toBe('strawberry')

    await userEvent.keyboard('\\')
    expect(el()).toHaveAttribute('data-style', 'light')
  })

  it('fades the game count out, swaps it, then fades it back in', async () => {
    // Three parts, not a cross-fade: the engine gives this line its own animation, and the
    // count must never be seen changing.
    vi.useFakeTimers()
    try {
      const { container } = render(<ElementerialInteractive device="rg35xx" />)
      const info = () => container.querySelector('[class^="el-system-info"]') as HTMLElement
      const before = info().textContent

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      })
      expect(info().className).toContain('is-leaving')
      expect(info().textContent).toBe(before)

      act(() => vi.advanceTimersByTime(INFO_TIMING.out))
      expect(info().className).toContain('is-pending')
      expect(info().textContent).not.toBe(before)

      act(() => vi.advanceTimersByTime(INFO_TIMING.delay))
      expect(info().className).toBe('el-system-info')
    } finally {
      vi.useRealTimers()
    }
  })

  it('remembers what the menu should be drawn over', () => {
    let subsets = applyChromeAction(DEFAULT_SUBSETS, 'nextView')
    expect(subsets.behind).toBe('basic')

    // Seven steps on from basic is the menu, which must not become its own backdrop.
    for (let i = 0; i < 6; i++) subsets = applyChromeAction(subsets, 'nextView')
    expect(subsets.view).toBe('menu')
    expect(subsets.behind).toBe('elementflix')
  })

  it('offers every subset on the panel below the device', () => {
    render(<ElementerialInteractive device="rg35xx" />)

    for (const group of ['View', 'Colour scheme', 'Style', 'Font size', 'Grid direction', 'System']) {
      expect(screen.getByRole('group', { name: group })).toBeInTheDocument()
    }
  })
})
