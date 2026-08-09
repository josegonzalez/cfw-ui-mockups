/**
 * Example OS palette.
 *
 * A fictional launcher, so these values are authored rather than extracted from a firmware. A
 * real theme's palette module is where the colours read out of the source's theme format go,
 * with the source's own key names kept so a grep hits both.
 */
export const PALETTE = {
  background: '#12141c',
  panel: '#1b1e2b',
  accent: '#4cc9f0',
  text: '#e7e9f0',
  muted: '#8b90a3',
  /** Text on an accent-filled row. */
  onAccent: '#0b0d13',
  /** A subtitle on an accent-filled row: darkened accent rather than muted grey. */
  onAccentMuted: '#0b3b47',
  tile: '#2a2e40',
  tileText: '#cfd3e0',
} as const

export type Palette = typeof PALETTE
