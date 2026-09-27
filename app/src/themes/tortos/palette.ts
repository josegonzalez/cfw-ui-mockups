/**
 * TortOS's colours, under the source's own names.
 *
 * There is one palette. What a player switches is the card art (UI Theme) and which way the shelf
 * runs (UI Direction); neither touches a colour. What changes colour from screen to screen is the
 * *accent*, and that is chosen by what a panel belongs to - see `accentFor` in `machine.ts`.
 */

/** `src/ui.h`. */
export const UI = {
  bg: 'rgb(7,8,12)',
  text: 'rgb(237,237,242)',
  soft: 'rgb(198,201,214)',
  dim: 'rgb(148,153,172)',
} as const

export const RGB = {
  text: [237, 237, 242],
  soft: [198, 201, 214],
  dim: [148, 153, 172],
} as const satisfies Record<string, readonly [number, number, number]>

/** TortOS's own accent: the menu, the volume bar, Favorites, an earned achievement. */
export const CYAN = 0x3dd6ff
/** Muse's green, the iPod's own, sampled from the photograph. */
export const MUSE_GREEN = 0x9cd345

/** Surfaces and chrome (`src/ui.c:667-679`, `src/main.c`). */
export const SURFACE = {
  panel: 'rgba(22,24,32,0.988)',
  panelRgb: [22, 24, 32] as const,
  /** The highlight plate: white, alpha 34. */
  plate: 'rgba(255,255,255,0.133)',
  /** Heading and footer rules: the accent at alpha 70. */
  ruleAlpha: 70 / 255,
  arrow: 'rgba(138,143,163,0.784)',
  key: 'rgb(32,35,46)',
  keySelected: 'rgb(62,68,86)',
  field: 'rgb(16,18,26)',
  chip: 'rgb(52,56,70)',
  emptySlot: 'rgba(12,13,18,0.933)',
  dot: 'rgb(90,94,110)',
  battery: 'rgb(224,72,72)',
  osdScrim: 'rgba(0,0,0,0.5)',
  osdTrack: 'rgb(60,62,72)',
} as const

/** The accent as a CSS colour, at an optional alpha. */
export function hex(rgb: number, alpha = 1): string {
  const r = (rgb >> 16) & 255
  const g = (rgb >> 8) & 255
  const b = rgb & 255
  return alpha >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${+alpha.toFixed(4)})`
}

/** Two colours, `t` of the way from a to b - `col_mix`, truncating as it does. */
export function mixRgb(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): string {
  if (t <= 0) return `rgb(${a[0]},${a[1]},${a[2]})`
  if (t >= 1) return `rgb(${b[0]},${b[1]},${b[2]})`
  const c = a.map((v, i) => Math.trunc(v + (b[i]! - v) * t))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

export const split = (rgb: number): readonly [number, number, number] => [
  (rgb >> 16) & 255,
  (rgb >> 8) & 255,
  rgb & 255,
]

/** `ui_mix`: truncating, per channel. */
export function mixHex(a: number, b: number, t: number): number {
  const [ar, ag, ab] = split(a)
  const [br, bg, bb] = split(b)
  const r = Math.trunc(ar + (br - ar) * t)
  const g = Math.trunc(ag + (bg - ag) * t)
  const bl = Math.trunc(ab + (bb - ab) * t)
  return (r << 16) | (g << 8) | bl
}
