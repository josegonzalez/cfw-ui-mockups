/**
 * Mockup-only keys.
 *
 * The interactive builds let you cycle a theme's subsets - view, palette, font size - from the
 * keyboard. These bindings are deliberately outside the device map, on punctuation no handheld
 * has, so they can never be mistaken for a device button. Two of the three original themes
 * carried the same rationale in a comment; this is that convention made shared.
 *
 * These drive the mockup harness, not the firmware being mocked. Nothing in a theme's own
 * behaviour may depend on them.
 */

export type ChromeAction =
  | 'prevView'
  | 'nextView'
  | 'prevSubsetA'
  | 'nextSubsetA'
  | 'prevSubsetB'
  | 'nextSubsetB'
  | 'toggleStyle'
  | 'toggleAnimations'
  | 'cycleSystem'
  | 'cycleSecondary'

export const CHROME_KEYS: Readonly<Record<string, ChromeAction>> = {
  '[': 'prevView',
  ']': 'nextView',
  ',': 'prevSubsetA',
  '.': 'nextSubsetA',
  '-': 'prevSubsetB',
  '=': 'nextSubsetB',
  '\\': 'toggleStyle',
  ';': 'toggleAnimations',
  '/': 'cycleSystem',
  "'": 'cycleSecondary',
}

export function chromeActionForKey(key: string): ChromeAction | null {
  return CHROME_KEYS[key] ?? null
}
