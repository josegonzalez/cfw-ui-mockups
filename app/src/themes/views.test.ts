import { describe, expect, it } from 'vitest'
import { SCREEN_MANIFEST, screenId, type ScreenManifestEntry } from './manifest'
import { facetSummary, sameTypeElsewhere, screensFor, viewsHref, viewsTargetFromHash } from './views'

function entry(theme: string, device: string, screen: string): ScreenManifestEntry {
  const found = SCREEN_MANIFEST.find(
    (s) => s.theme === theme && s.device === device && s.screen === screen,
  )
  if (!found) throw new Error(`no ${theme}/${device}/${screen}`)
  return found
}

describe('viewsTargetFromHash', () => {
  it('reads the index and both facets', () => {
    expect(viewsTargetFromHash('views')).toEqual({ facet: null })
    expect(viewsTargetFromHash('views/type/settings')).toEqual({ facet: 'type', slug: 'settings' })
    expect(viewsTargetFromHash('views/element/keyboard')).toEqual({
      facet: 'element',
      slug: 'keyboard',
    })
  })

  it('sends an unknown term to the index, and leaves other hashes alone', () => {
    expect(viewsTargetFromHash('views/type/setings')).toEqual({ facet: null })
    expect(viewsTargetFromHash('views/element/settings')).toEqual({ facet: null })
    expect(viewsTargetFromHash('nextui/n64/browser')).toBeNull()
    expect(viewsTargetFromHash('')).toBeNull()
  })

  it('round-trips with viewsHref', () => {
    expect(viewsTargetFromHash(viewsHref('type', 'boot').slice(1))).toEqual({
      facet: 'type',
      slug: 'boot',
    })
    expect(viewsHref()).toBe('#views')
  })
})

describe('screensFor', () => {
  it('lists each screen once, on the first device its theme lists', () => {
    const screens = screensFor('type', 'game-list')
    const keys = screens.map((s) => `${s.theme}/${s.screen}`)
    expect(new Set(keys).size).toBe(keys.length)

    const example = screens.find((s) => s.theme === 'example-cfw')
    expect(example?.device).toBe('rg35xx')
  })

  it('never includes a live build', () => {
    for (const s of screensFor('element', 'list')) expect(s.interactive).toBe(false)
  })

  it('keeps manifest order, so a set stays together', () => {
    const themes = screensFor('type', 'settings').map((s) => s.theme)
    const runs = themes.filter((t, i) => t !== themes[i - 1])
    expect(new Set(runs).size).toBe(runs.length)
  })

  it('counts sets and screens from the same list', () => {
    const summary = facetSummary('type', 'settings')
    expect(summary.screens).toBe(screensFor('type', 'settings').length)
    expect(summary.sets).toBe(summary.themes.length)
  })
})

describe('sameTypeElsewhere', () => {
  it("offers one screen per other set sharing this screen's primary type", () => {
    const route = entry('example-cfw', 'rg35xx', 'game-list')
    const others = sameTypeElsewhere(route)

    expect(others.length).toBeGreaterThan(0)
    expect(new Set(others.map((o) => o.theme)).size).toBe(others.length)
    for (const o of others) {
      expect(o.theme).not.toBe('example-cfw')
      expect(o.types[0]).toBe('game-list')
    }
  })

  it('prefers the same device where the other set has it', () => {
    // Elementerial's game list runs on the RG35XX too, so the jump changes one thing, not two.
    const route = entry('example-cfw', 'rg35xx', 'game-list')
    const elementerial = sameTypeElsewhere(route).find((o) => o.theme === 'elementerial')
    expect(elementerial && screenId(elementerial)).toMatch(/^elementerial\/rg35xx\//)
  })

  it('offers nothing from a live build', () => {
    expect(sameTypeElsewhere(entry('example-cfw', 'rg35xx', 'interactive'))).toEqual([])
  })
})
