import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { SCREEN_MANIFEST, screenId } from './themes/manifest'
import { THEMES, THEME_GROUPS, catalogueTotals } from './themes/catalogue'
import { SCREEN_TYPES, UI_ELEMENTS } from './themes/taxonomy'
import { coverage } from './themes/views'

function atHash(hash: string) {
  globalThis.location.hash = hash
}

describe('landing page', () => {
  beforeEach(() => atHash(''))

  it('leads with a hero', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/handheld/i)
  })

  it('shows a tile per set, with its preview', () => {
    render(<App />)

    for (const theme of THEMES) {
      const tile = screen.getByRole('article', { name: theme.name })
      expect(within(tile).getByAltText(theme.previewAlt)).toBeInTheDocument()
      expect(within(tile).getByText(theme.kind)).toBeInTheDocument()
    }
  })

  it('credits the author of every reproduced theme', () => {
    // Each set reproduces someone else's work, so attribution is not decoration.
    render(<App />)

    for (const theme of THEMES) {
      if (!theme.author) continue
      const tile = screen.getByRole('article', { name: theme.name })
      expect(within(tile).getByText(`by ${theme.author}`)).toBeInTheDocument()
    }

    const footer = document.querySelector('footer')!
    for (const theme of THEMES) {
      if (theme.author) expect(footer).toHaveTextContent(`${theme.name} by ${theme.author}`)
    }
  })

  it('derives its totals from the catalogue rather than hardcoding them', () => {
    const totals = catalogueTotals()
    render(<App />)

    expect(screen.getByText(String(totals.views))).toBeInTheDocument()
    expect(screen.getByText(String(totals.devices))).toBeInTheDocument()
    expect(screen.getByText(`${THEMES.length} of ${THEMES.length} shown`)).toBeInTheDocument()
  })

  it('links a live build of every set', () => {
    // One per set: the device switcher in the viewer reaches the same build on its other panels.
    render(<App />)

    for (const theme of THEMES) {
      const live = SCREEN_MANIFEST.filter((s) => s.theme === theme.slug && s.interactive)
      const linked = live.some(
        (entry) => document.querySelectorAll(`a[href="#${CSS.escape(screenId(entry))}"]`).length > 0,
      )
      expect(linked, theme.slug).toBe(true)
    }
  })

  // Derived from the catalogue rather than naming a theme, so porting one does not turn a
  // passing assertion into a stale one that has to be rewritten.

  it("points each tile at its set's live build and notes", () => {
    render(<App />)

    for (const theme of THEMES) {
      const tile = screen.getByRole('article', { name: theme.name })
      const live = SCREEN_MANIFEST.find((s) => s.theme === theme.slug && s.interactive)
      expect(live).toBeDefined()
      expect(within(tile).getByRole('link', { name: 'Live build' })).toHaveAttribute(
        'href',
        `#${screenId(live!)}`,
      )
      expect(within(tile).getByRole('link', { name: 'Notes' })).toHaveAttribute(
        'href',
        `#notes/${theme.docPath}`,
      )
    }
  })

  it('filters the sets by group, and "All" brings them back', async () => {
    const user = userEvent.setup()
    render(<App />)
    const filters = screen.getByRole('group', { name: 'Filter sets' })

    for (const [group, label] of Object.entries(THEME_GROUPS)) {
      await user.click(within(filters).getByRole('button', { name: label }))
      expect(within(filters).getByRole('button', { name: label })).toHaveAttribute(
        'aria-pressed',
        'true',
      )

      const members = THEMES.filter((t) => t.group === group)
      expect(screen.getAllByRole('article')).toHaveLength(members.length)
      expect(screen.getByText(`${members.length} of ${THEMES.length} shown`)).toBeInTheDocument()
    }

    await user.click(within(filters).getByRole('button', { name: 'All' }))
    expect(screen.getAllByRole('article')).toHaveLength(THEMES.length)
  })

  it('switches between browsing sets and comparing views, by click and by arrow key', async () => {
    const user = userEvent.setup()
    render(<App />)

    const sets = screen.getByRole('tab', { name: 'Browse by set' })
    const views = screen.getByRole('tab', { name: 'Compare by view' })
    expect(sets).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('table')).toBeNull()

    await user.click(views)
    expect(views).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toContainElement(screen.getByRole('table'))
    expect(screen.queryAllByRole('article')).toHaveLength(0)

    await user.keyboard('{ArrowLeft}')
    expect(sets).toHaveAttribute('aria-selected', 'true')
    expect(sets).toHaveFocus()
    expect(screen.queryByRole('table')).toBeNull()

    await user.keyboard('{ArrowRight}')
    expect(views).toHaveAttribute('aria-selected', 'true')
    expect(views).toHaveFocus()
  })

  it('leads into the views page with a matrix column per screen type', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Compare by view' }))

    const table = screen.getByRole('table')
    for (const [slug, term] of Object.entries(SCREEN_TYPES)) {
      const header = within(table).getByRole('columnheader', { name: term.label })
      expect(within(header).getByRole('link')).toHaveAttribute('href', `#views/type/${slug}`)
    }
    expect(screen.getByRole('link', { name: 'Compare by UI element' })).toHaveAttribute(
      'href',
      '#views',
    )
  })

  it('marks every set and screen type pairing the manifest has, and only those', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Compare by view' }))

    const marks = document.querySelectorAll('a.gal-matrix__mark')
    const expected = [...coverage().entries()].flatMap(([slug, byTheme]) =>
      [...byTheme.values()].map((entry) => ({ slug, entry })),
    )
    expect(marks).toHaveLength(expected.length)

    for (const { slug, entry } of expected) {
      const name = `${THEMES.find((t) => t.slug === entry.theme)!.name} - ${SCREEN_TYPES[slug].label}`
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', `#${screenId(entry)}`)
    }
  })

  it('no longer lists every screen on the landing page', () => {
    render(<App />)
    expect(screen.queryByRole('heading', { name: 'Every screen' })).toBeNull()
  })
})

describe('screen viewer', () => {
  it('renders the routed screen with a way back', () => {
    atHash('#example-cfw/rg35xx/main-menu')
    render(<App />)

    expect(screen.getByRole('link', { name: 'All sets' })).toHaveAttribute('href', '#')
    expect(screen.getByRole('link', { name: 'Compare views' })).toHaveAttribute('href', '#views')
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

describe('screen viewer tags', () => {
  it("links each of the screen's types and elements to its comparison", () => {
    atHash('#example-cfw/rg35xx/game-list')
    render(<App />)

    const tags = screen.getByRole('group', { name: 'Tags' })
    expect(within(tags).getByRole('link', { name: 'Game list' })).toHaveAttribute(
      'href',
      '#views/type/game-list',
    )
    expect(within(tags).getByRole('link', { name: 'Hint bar' })).toHaveAttribute(
      'href',
      '#views/element/hint-bar',
    )
  })

  it('offers the same view in other sets, and never its own', () => {
    atHash('#example-cfw/rg35xx/game-list')
    render(<App />)

    const group = screen.getByRole('group', { name: 'Same view in other sets' })
    const links = within(group).getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) expect(link.getAttribute('href')).not.toMatch(/^#example-cfw\//)
  })

  it('shows no tags or same-view row on a live build', () => {
    atHash('#example-cfw/rg35xx/interactive')
    render(<App />)

    expect(screen.queryByRole('group', { name: 'Tags' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Same view in other sets' })).toBeNull()
  })
})

describe('views page', () => {
  it('lists every facet on the index', () => {
    atHash('#views')
    render(<App />)

    const nav = screen.getByRole('navigation', { name: 'Facets' })
    for (const slug of Object.keys(SCREEN_TYPES)) {
      expect(nav.querySelector(`a[href="#views/type/${slug}"]`)).not.toBeNull()
    }
    for (const slug of Object.keys(UI_ELEMENTS)) {
      expect(nav.querySelector(`a[href="#views/element/${slug}"]`)).not.toBeNull()
    }
    expect(screen.getByRole('heading', { level: 1, name: 'Compare views' })).toBeInTheDocument()
  })

  it('shows one tile per screen of the type, and marks the facet current', () => {
    atHash('#views/type/settings')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Settings\d* sets/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const tiles = document.querySelectorAll('a.gal-tile')
    expect(tiles.length).toBeGreaterThan(0)
    for (const tile of tiles) {
      const id = tile.getAttribute('href')!.slice(1)
      const entry = SCREEN_MANIFEST.find((s) => screenId(s) === id)
      expect(entry?.types).toContain('settings')
    }
  })

  it('every static screen is reachable from some type page', () => {
    // The landing page no longer lists every screen, so this is what keeps them reachable.
    const reached = new Set<string>()
    for (const slug of Object.keys(SCREEN_TYPES)) {
      atHash(`#views/type/${slug}`)
      const page = render(<App />)
      for (const a of document.querySelectorAll('a.gal-tile')) {
        const [theme, , name] = a.getAttribute('href')!.slice(1).split('/')
        reached.add(`${theme}/${name}`)
      }
      page.unmount()
    }

    for (const entry of SCREEN_MANIFEST.filter((s) => !s.interactive)) {
      expect(reached, screenId(entry)).toContain(`${entry.theme}/${entry.screen}`)
    }
  })

  it('switches a set off without dropping its links', async () => {
    atHash('#views/type/settings')
    render(<App />)

    const sets = screen.getByRole('group', { name: 'Sets' })
    const first = within(sets).getAllByRole('button')[0]!
    first.click()
    await screen.findByRole('button', { name: first.textContent!, pressed: false })

    const hidden = document.querySelectorAll('a.gal-tile[hidden]')
    expect(hidden.length).toBeGreaterThan(0)
  })

  it('lands on the index for an unknown term', () => {
    atHash('#views/type/nope')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Compare views' })).toBeInTheDocument()
  })
})
