import { describe, expect, it } from 'vitest'
import { THEMES, THEME_GROUPS, themeAccent, themeName } from './catalogue'

describe('catalogue groups', () => {
  it('uses every group', () => {
    // A group no set is in would be a filter chip that empties the page.
    const used = new Set(THEMES.map((t) => t.group))
    for (const group of Object.keys(THEME_GROUPS)) expect(used, group).toContain(group)
  })

  it('puts every set in a known group', () => {
    for (const theme of THEMES) expect(Object.keys(THEME_GROUPS), theme.slug).toContain(theme.group)
  })
})

describe('theme lookups', () => {
  it('names and colours a set from its entry', () => {
    for (const theme of THEMES) {
      expect(themeName(theme.slug)).toBe(theme.name)
      expect(themeAccent(theme.slug)).toBe(theme.accent)
    }
  })

  it('falls back to the slug for a set it does not know', () => {
    expect(themeName('nope')).toBe('nope')
  })
})
