import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SCREEN_MANIFEST, screenId } from './manifest'
import { SCREEN_TYPES, UI_ELEMENTS } from './taxonomy'

const DOC = readFileSync(resolve(process.cwd(), '../docs/views.md'), 'utf8')
const STATIC = SCREEN_MANIFEST.filter((s) => !s.interactive)

describe('screen tags', () => {
  it('gives every static screen at least one type', () => {
    for (const entry of STATIC) expect(entry.types.length, screenId(entry)).toBeGreaterThan(0)
  })

  it('tags no live build, which is every screen at once', () => {
    for (const entry of SCREEN_MANIFEST.filter((s) => s.interactive)) {
      expect(entry.types, screenId(entry)).toEqual([])
      expect(entry.elements, screenId(entry)).toEqual([])
    }
  })

  it('never repeats a tag on one screen', () => {
    for (const entry of STATIC) {
      expect(new Set(entry.types).size, screenId(entry)).toBe(entry.types.length)
      expect(new Set(entry.elements).size, screenId(entry)).toBe(entry.elements.length)
    }
  })

  it('tags a screen the same on every device it exists on', () => {
    // The comparison is between sets, not panels: a screen cannot be settings on one device and
    // something else on another.
    const seen = new Map<string, string>()
    for (const entry of STATIC) {
      const key = `${entry.theme}/${entry.screen}`
      const tags = JSON.stringify([entry.types, entry.elements])
      if (seen.has(key)) expect(tags, screenId(entry)).toBe(seen.get(key))
      else seen.set(key, tags)
    }
  })
})

describe('the vocabulary', () => {
  it('uses every screen type somewhere', () => {
    const used = new Set(STATIC.flatMap((s) => s.types))
    for (const slug of Object.keys(SCREEN_TYPES)) expect(used, slug).toContain(slug)
  })

  it('uses every element somewhere', () => {
    const used = new Set(STATIC.flatMap((s) => s.elements))
    for (const slug of Object.keys(UI_ELEMENTS)) expect(used, slug).toContain(slug)
  })

  it('documents every term in docs/views.md', () => {
    for (const slug of [...Object.keys(SCREEN_TYPES), ...Object.keys(UI_ELEMENTS)]) {
      expect(DOC, `${slug} missing from docs/views.md`).toContain(`\`${slug}\``)
    }
  })
})
