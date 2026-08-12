import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotesViewer, notesPathFromHash } from './NotesViewer'

function mockFetch(body: string, ok = true) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    statusText: ok ? 'OK' : 'Not Found',
    text: async () => body,
  } as Response)
}

afterEach(() => vi.restoreAllMocks())

/**
 * Wait for the effect that rewrites links and paints swatches.
 *
 * The document is injected as HTML and then post-processed in an effect, so an element exists
 * one commit before it carries its final `href` or class. A `findBy*` query resolves on the
 * element appearing, which is the earlier of the two - assert inside this instead, or the test
 * passes or fails depending on how the two land in the same tick.
 */
function eventually(assert: () => void) {
  return waitFor(assert)
}

describe('notesPathFromHash', () => {
  it('accepts a documentation path', () => {
    expect(notesPathFromHash('notes/docs/themes/elementerial.md')).toBe('docs/themes/elementerial.md')
  })

  it('ignores anything that is not a notes route', () => {
    expect(notesPathFromHash('example-cfw/rg35xx/main-menu')).toBeNull()
    expect(notesPathFromHash('')).toBeNull()
  })

  it('refuses to leave the documentation directory', () => {
    // The path comes from the URL, so it is user input however unlikely that is here.
    expect(notesPathFromHash('notes/../etc/passwd')).toBeNull()
    expect(notesPathFromHash('notes/docs/../../etc/passwd')).toBeNull()
  })

  it('decodes an escaped path', () => {
    expect(notesPathFromHash('notes/docs/themes/example-cfw.md')).toBe('docs/themes/example-cfw.md')
  })
})

describe('NotesViewer', () => {
  it('renders markdown as a page rather than as text', async () => {
    mockFetch('# Elementerial\n\nSome **notes** about it.\n')
    render(<NotesViewer path="docs/themes/elementerial.md" />)

    const heading = await screen.findByRole('heading', { name: 'Elementerial' })
    expect(heading.tagName).toBe('H1')
    expect(screen.getByText('notes').tagName).toBe('STRONG')
  })

  it('renders tables, which carry most of the reference material', async () => {
    mockFetch('| Widget | Used by |\n| --- | --- |\n| TextList | all |\n')
    render(<NotesViewer path="docs/widgets/README.md" />)

    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Widget' })).toBeInTheDocument()
  })

  it('keeps links to other documents inside the viewer', async () => {
    // Relative links are written for reading the file in the repo; left alone they would
    // resolve against the app's URL and go nowhere.
    mockFetch('[widgets](../widgets/README.md)')
    render(<NotesViewer path="docs/themes/elementerial.md" />)

    const link = await screen.findByRole('link', { name: 'widgets' })
    await eventually(() => expect(link).toHaveAttribute('href', '#notes/docs/widgets/README.md'))
  })

  it('rewrites links to non-documents as site paths', async () => {
    mockFetch('[the widgets](../../app/src/widgets/registry.ts)')
    render(<NotesViewer path="docs/themes/elementerial.md" />)

    const link = await screen.findByRole('link', { name: 'the widgets' })
    await eventually(() =>
      expect(link).toHaveAttribute('href', '/app/src/widgets/registry.ts'),
    )
  })

  it('leaves absolute and anchor links alone', async () => {
    mockFetch('[repo](https://example.com/x) and [top](#top)')
    render(<NotesViewer path="docs/README.md" />)

    expect(await screen.findByRole('link', { name: 'repo' })).toHaveAttribute(
      'href',
      'https://example.com/x',
    )
    expect(screen.getByRole('link', { name: 'top' })).toHaveAttribute('href', '#top')
  })

  it('says so when a document cannot be loaded', async () => {
    mockFetch('', false)
    render(<NotesViewer path="docs/themes/missing.md" />)

    await waitFor(() => {
      expect(screen.getByText(/could not load/i)).toBeInTheDocument()
    })
  })

  it('offers the raw file and a way back', async () => {
    mockFetch('# Title')
    render(<NotesViewer path="docs/README.md" />)

    expect(screen.getByRole('link', { name: 'All screens' })).toHaveAttribute('href', '#')
    expect(screen.getByRole('link', { name: 'View raw' })).toHaveAttribute('href', '/docs/README.md')
  })
})

describe('colour swatches', () => {
  it('paints a hex colour as itself, with readable ink', async () => {
    mockFetch('| Token | Value |\n| --- | --- |\n| accent | `#4cc9f0` |\n')
    render(<NotesViewer path="docs/themes/example-cfw.md" />)

    const swatch = await screen.findByText('#4cc9f0')
    await eventually(() => expect(swatch).toHaveClass('notes__swatch'))
    expect(swatch).toHaveStyle({ background: 'rgb(76 201 240)', color: '#000000' })
  })

  it('flips to light ink on a dark colour', async () => {
    mockFetch('`#12141c`')
    render(<NotesViewer path="docs/themes/example-cfw.md" />)

    const swatch = await screen.findByText('#12141c')
    await eventually(() => expect(swatch).toHaveStyle({ color: '#ffffff' }))
  })

  it('paints bare hex too, since the source palettes are stored that way', async () => {
    mockFetch('`ED5353`')
    render(<NotesViewer path="docs/themes/elementerial.md" />)

    const swatch = await screen.findByText('ED5353')
    await eventually(() => expect(swatch).toHaveClass('notes__swatch'))
  })

  it('leaves a commit hash alone', async () => {
    // Seven characters, so it cannot be a colour - and painting it would be nonsense.
    mockFetch('at commit `e710525` and `#4cc9f0`')
    render(<NotesViewer path="docs/themes/elementerial.md" />)

    // Wait for the swatch pass to have run before asserting that it skipped this one, or the
    // negative passes for the wrong reason.
    const swatch = await screen.findByText('#4cc9f0')
    await eventually(() => expect(swatch).toHaveClass('notes__swatch'))
    expect(screen.getByText('e710525')).not.toHaveClass('notes__swatch')
  })

  it('leaves ordinary code spans alone', async () => {
    mockFetch('`layout.js` and `#4cc9f0`')
    render(<NotesViewer path="docs/themes/elementerial.md" />)

    const swatch = await screen.findByText('#4cc9f0')
    await eventually(() => expect(swatch).toHaveClass('notes__swatch'))
    expect(screen.getByText('layout.js')).not.toHaveClass('notes__swatch')
  })
})
