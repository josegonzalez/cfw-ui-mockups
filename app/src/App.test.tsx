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
      expect(within(card).getByRole('img', { name: `${theme.name} palette` })).toBeInTheDocument()
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

  it('points an unported theme at its archived original', () => {
    render(<App />)
    const card = screen.getByRole('article', { name: 'Elementerial' })

    expect(within(card).getByRole('link', { name: /open the original/i })).toHaveAttribute(
      'href',
      '/legacy/elementerial/rg35xx/theme.html',
    )
  })

  it('points a ported theme at its live build', () => {
    render(<App />)
    const card = screen.getByRole('article', { name: 'Example OS' })

    expect(within(card).getByRole('link', { name: /open the live build/i })).toHaveAttribute(
      'href',
      '#example-cfw/rg35xx/interactive',
    )
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
