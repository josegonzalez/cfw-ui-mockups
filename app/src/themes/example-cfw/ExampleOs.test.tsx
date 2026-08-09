import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DeviceFrame } from '../../device/DeviceFrame'
import { ExampleOs } from '.'
import { GAMES, MENU } from './data'

function mount(props: Parameters<typeof ExampleOs>[0] = {}, interactive = true) {
  return render(
    <DeviceFrame device="rg35xx" animate={interactive} interactive={interactive}>
      <ExampleOs {...props} />
    </DeviceFrame>,
  )
}

const selectedRow = (container: HTMLElement) =>
  container.querySelector('[data-theme] [data-selected]')?.textContent ?? ''

describe('ExampleOs main menu', () => {
  it('renders every menu entry', () => {
    mount()
    for (const entry of MENU) {
      expect(screen.getByText(entry.label)).toBeInTheDocument()
    }
  })

  it('selects the first row by default', () => {
    const { container } = mount()
    expect(selectedRow(container)).toContain('Recents')
  })

  it('moves the selection with the d-pad', async () => {
    const { container } = mount()

    await userEvent.keyboard('{ArrowDown}')
    expect(selectedRow(container)).toContain('Favorites')

    await userEvent.keyboard('{ArrowUp}')
    expect(selectedRow(container)).toContain('Recents')
  })

  it('wraps past the ends', async () => {
    const { container } = mount()

    await userEvent.keyboard('{ArrowUp}')
    expect(selectedRow(container)).toContain('Settings')
  })

  it('shows the header, clock, battery and hints', () => {
    mount({}, false)

    expect(screen.getByText('Example')).toBeInTheDocument()
    expect(screen.getByText('OS')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Menu')).toBeInTheDocument()
  })
})

describe('ExampleOs navigation', () => {
  it('opens the game list from the Games row', async () => {
    const { container } = mount()

    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(selectedRow(container)).toContain('Games')

    await userEvent.keyboard('z')
    expect(container.querySelector('[data-view]')).toHaveAttribute('data-view', 'game-list')
    expect(screen.getByText('Super Nintendo')).toBeInTheDocument()
  })

  it('does nothing on a row that leads nowhere', async () => {
    const { container } = mount()

    await userEvent.keyboard('z')
    expect(container.querySelector('[data-view]')).toHaveAttribute('data-view', 'main-menu')
  })

  it('returns to the main menu on B', async () => {
    const { container } = mount()

    await userEvent.keyboard('{ArrowDown}{ArrowDown}z')
    expect(container.querySelector('[data-view]')).toHaveAttribute('data-view', 'game-list')

    await userEvent.keyboard('x')
    expect(container.querySelector('[data-view]')).toHaveAttribute('data-view', 'main-menu')
  })

  it('does not leave the root menu on B', async () => {
    const { container } = mount()

    await userEvent.keyboard('x')
    expect(container.querySelector('[data-view]')).toHaveAttribute('data-view', 'main-menu')
  })

  it('holding B does not walk the whole stack at once', async () => {
    const { container } = mount()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}z')

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', repeat: true }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', repeat: true }))
    })

    expect(container.querySelector('[data-view]')).toHaveAttribute('data-view', 'main-menu')
  })
})

describe('ExampleOs game list', () => {
  it('renders every game and follows the selection in the detail column', async () => {
    const { container } = mount({ view: 'game-list' })
    const list = within(container.querySelector('[data-widget="TextList"]') as HTMLElement)

    // Scoped to the list, because the selected title also appears in the detail column.
    for (const game of GAMES.slice(0, 5)) {
      expect(list.getByText(game.title)).toBeInTheDocument()
    }

    expect(screen.getByAltText(`${GAMES[0]!.title} cover`)).toBeInTheDocument()

    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByAltText(`${GAMES[1]!.title} cover`)).toBeInTheDocument()
  })

  it('shows the selected title in the detail column as well as the list', () => {
    mount({ view: 'game-list' }, false)
    expect(screen.getAllByText(GAMES[0]!.title)).toHaveLength(2)
  })

  it('shows the game count and the launch hint', () => {
    mount({ view: 'game-list' }, false)

    expect(screen.getByText(`${GAMES.length} games`)).toBeInTheDocument()
    expect(screen.getByText('Launch')).toBeInTheDocument()
  })
})

describe('ExampleOs as a static screen', () => {
  it('renders the view it was asked for and ignores input', async () => {
    const { container } = mount({ view: 'game-list', selected: 2 }, false)

    expect(container.querySelector('[data-view]')).toHaveAttribute('data-view', 'game-list')
    expect(selectedRow(container)).toContain(GAMES[2]!.title)

    await userEvent.keyboard('{ArrowDown}')
    expect(selectedRow(container)).toContain(GAMES[2]!.title)
  })

  it('pins the clock so the screen is reproducible', () => {
    const first = mount({}, false)
    const clockText = first.container.querySelector('[data-widget="Clock"]')?.textContent
    first.unmount()

    const second = mount({}, false)
    expect(second.container.querySelector('[data-widget="Clock"]')?.textContent).toBe(clockText)
  })
})
