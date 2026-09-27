import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { SCREEN_MANIFEST, screenId } from './themes/manifest'
import { THEMES, catalogueTotals } from './themes/catalogue'

function atHash(hash: string) {
  globalThis.location.hash = hash
}

describe('landing page', () => {
  beforeEach(() => atHash(''))

  it('leads with a hero', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/handheld/i)
  })

  it('shows a card per theme, with its preview and palette', () => {
    render(<App />)

    for (const theme of THEMES) {
      const card = screen.getByRole('article', { name: theme.name })
      expect(within(card).getByAltText(theme.previewAlt)).toBeInTheDocument()
      const palette = within(card).queryByRole('img', { name: `${theme.name} palette` })
      // A set with no palette shows no strip, rather than an empty one.
      if (theme.swatches.length > 0) expect(palette).toBeInTheDocument()
      else expect(palette).not.toBeInTheDocument()
      expect(within(card).getByText(theme.summary)).toBeInTheDocument()
    }
  })

  it('credits the author of every reproduced theme', () => {
    // Each set reproduces someone else's work, so attribution is not decoration.
    render(<App />)

    for (const theme of THEMES) {
      if (!theme.author) continue
      const card = screen.getByRole('article', { name: theme.name })
      expect(within(card).getByText(`by ${theme.author}`)).toBeInTheDocument()
    }
  })

  it('marks which sets are rebuilt and which are still archived', () => {
    render(<App />)

    for (const theme of THEMES) {
      const card = screen.getByRole('article', { name: theme.name })
      expect(within(card).getByText(theme.ported ? 'Interactive' : 'Archived')).toBeInTheDocument()
    }
  })

  it('derives its totals from the catalogue rather than hardcoding them', () => {
    const totals = catalogueTotals()
    render(<App />)

    expect(screen.getByText(String(totals.views))).toBeInTheDocument()
    expect(screen.getByText(String(totals.devices))).toBeInTheDocument()
  })

  it('links every screen in the manifest', () => {
    render(<App />)

    for (const entry of SCREEN_MANIFEST) {
      expect(
        document.querySelectorAll(`a[href="#${CSS.escape(screenId(entry))}"]`).length,
      ).toBeGreaterThan(0)
    }
  })

  // Derived from the catalogue rather than naming a theme, so porting one does not turn a
  // passing assertion into a stale one that has to be rewritten.

  it('points a ported theme at its live build', () => {
    const ported = THEMES.filter((t) => t.ported)
    expect(ported.length).toBeGreaterThan(0)
    render(<App />)

    for (const theme of ported) {
      const card = screen.getByRole('article', { name: theme.name })
      const live = SCREEN_MANIFEST.find((s) => s.theme === theme.slug && s.interactive)
      expect(live).toBeDefined()
      expect(within(card).getByRole('link', { name: /open the live build/i })).toHaveAttribute(
        'href',
        `#${screenId(live!)}`,
      )
    }
  })
})

describe('screen viewer', () => {
  it('renders the routed screen with a way back', () => {
    atHash('#example-cfw/rg35xx/main-menu')
    render(<App />)

    expect(screen.getByRole('link', { name: 'All screens' })).toHaveAttribute('href', '#')
    expect(screen.getByText(/Example OS · Main menu/)).toBeInTheDocument()
    expect(document.querySelector('.screen')).not.toBeNull()
  })

  it('offers the other devices this screen runs on, and marks the current one', () => {
    // Comparing one layout across panels is the point of the repo, so it should not need a trip
    // back to the index.
    atHash('#example-cfw/rg35xx/main-menu')
    render(<App />)

    const group = screen.getByRole('group', { name: 'Device' })
    const options = within(group).getAllByRole('link')

    expect(options.length).toBeGreaterThan(1)
    expect(within(group).getByText('RG35XX').closest('a')).toHaveAttribute('aria-current', 'true')
  })

  it('keeps the same screen when switching device', () => {
    atHash('#example-cfw/rg35xx/game-list')
    render(<App />)

    const group = screen.getByRole('group', { name: 'Device' })
    expect(within(group).getByText('RG CubeXX').closest('a')).toHaveAttribute(
      'href',
      '#example-cfw/rg-cubexx/game-list',
    )
  })

  it('orders the devices by panel size', () => {
    atHash('#example-cfw/rg35xx/main-menu')
    render(<App />)

    const labels = within(screen.getByRole('group', { name: 'Device' }))
      .getAllByRole('link')
      .map((a) => a.textContent)

    // 640x480 before 720x720.
    expect(labels[0]).toContain('RG35XX')
    expect(labels[1]).toContain('RG CubeXX')
  })

  it('tells you the controls only on an interactive route', () => {
    atHash('#example-cfw/rg35xx/interactive')
    const live = render(<App />)
    expect(live.getByText(/arrows to move/i)).toBeInTheDocument()
    live.unmount()

    atHash('#example-cfw/rg35xx/main-menu')
    render(<App />)
    expect(screen.getByText(/static snapshot/i)).toBeInTheDocument()
  })

  it('falls back to the landing page for an unknown route', () => {
    atHash('#nope/nope/nope')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
