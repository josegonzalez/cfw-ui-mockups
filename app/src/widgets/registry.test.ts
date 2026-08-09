import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { WIDGETS, WIDGET_NAMES, widgetMeta } from './registry'

/**
 * Portability rule 6: the vocabulary is bounded.
 *
 * A widget that is registered but undocumented, or documented but unregistered, is exactly the
 * drift this check exists to prevent - the registry is meant to be the handoff list for a
 * second renderer, and a handoff list with holes in it is worse than none.
 */
const WIDGETS_DIR = resolve(process.cwd(), 'src/widgets')
const DOCS_DIR = resolve(process.cwd(), '../docs/widgets')

/** Directories under src/widgets that hold a widget, ignoring bare module files. */
const widgetDirs = readdirSync(WIDGETS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)

describe('widget registry', () => {
  it('registers every widget directory', () => {
    expect([...WIDGET_NAMES].sort()).toEqual([...widgetDirs].sort())
  })

  it('has a unique name per entry', () => {
    expect(new Set(WIDGET_NAMES).size).toBe(WIDGETS.length)
  })

  it('gives every widget a one-line summary and at least one consumer', () => {
    for (const widget of WIDGETS) {
      expect(widget.summary, `${widget.name} summary`).toBeTruthy()
      expect(widget.summary.length, `${widget.name} summary length`).toBeLessThan(160)
      expect(widget.usedBy.length, `${widget.name} usedBy`).toBeGreaterThan(0)
    }
  })

  it('describes a fallback wherever a web-only capability is declared', () => {
    // Rule 7. A widget may use blur, a shader or a mask - but the degraded look has to be
    // designed now, while the original is still in front of us.
    for (const widget of WIDGETS) {
      if (widget.webOnly && widget.webOnly.length > 0) {
        expect(widget.fallback, `${widget.name} declares ${widget.webOnly.join(', ')}`).toBeTruthy()
      }
    }
  })

  it('does not describe a fallback without a reason to have one', () => {
    for (const widget of WIDGETS) {
      if (!widget.webOnly || widget.webOnly.length === 0) {
        expect(widget.fallback, `${widget.name} has no web-only capability`).toBeUndefined()
      }
    }
  })
})

describe('widget documentation', () => {
  it('has a page per widget', () => {
    const documented = existsSync(DOCS_DIR)
      ? readdirSync(DOCS_DIR)
          .filter((f) => f.endsWith('.md') && f !== 'README.md')
          .map((f) => f.replace(/\.md$/, ''))
      : []

    expect([...documented].sort()).toEqual([...WIDGET_NAMES].sort())
  })

  it('names the widget in its own page', () => {
    for (const name of WIDGET_NAMES) {
      const page = readFileSync(resolve(DOCS_DIR, `${name}.md`), 'utf8')
      expect(page, `docs/widgets/${name}.md`).toContain(name)
    }
  })

  it('lists every widget in the catalogue index', () => {
    const index = readFileSync(resolve(DOCS_DIR, 'README.md'), 'utf8')
    for (const name of WIDGET_NAMES) {
      expect(index, `${name} missing from docs/widgets/README.md`).toContain(name)
    }
  })
})

describe('widget stories', () => {
  it('has a story file per widget', () => {
    for (const name of WIDGET_NAMES) {
      expect(
        existsSync(resolve(WIDGETS_DIR, name, `${name}.stories.tsx`)),
        `src/widgets/${name}/${name}.stories.tsx`,
      ).toBe(true)
    }
  })
})

describe('widgetMeta', () => {
  it('finds a registered widget', () => {
    expect(widgetMeta('TextList')?.name).toBe('TextList')
  })

  it('returns undefined for an unknown one', () => {
    expect(widgetMeta('NotAWidget')).toBeUndefined()
  })
})
