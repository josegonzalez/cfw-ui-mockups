/**
 * NeoStation's colour themes, as typed tokens.
 *
 * Every built-in theme is the same 25 colours, a light or dark `ColorScheme`, and one of six
 * `CornerRadii` tiers (`lib/themes/*_theme.dart`). The values are in `palettes.ts`, generated from
 * those files by `docs/themes/neostation/reference/extract-palettes.py` - regenerate it rather than
 * editing it.
 *
 * What a theme changes is colour and corner radius. It does not change layout.
 */
import { PALETTES, type ThemeId } from './palettes'

export type RadiusTier = 'zero' | 'xs' | 's' | 'm' | 'l' | 'xl'

export interface NeoPalette {
  readonly id: string
  readonly name: string
  /** `ColorScheme.dark` rather than `.light`. */
  readonly dark: boolean
  readonly radius: RadiusTier
  readonly primary: string
  readonly onPrimary: string
  readonly secondary: string
  readonly onSecondary: string
  readonly tertiary: string
  readonly onTertiary: string
  readonly tertiaryFixed: string
  readonly onTertiaryFixed: string
  readonly surface: string
  readonly onSurface: string
  readonly outline: string
  readonly shadow: string
  /** The scaffold colour: what every screen is drawn on. */
  readonly background: string
  readonly batteryFull: string
  readonly batteryMedium: string
  readonly batteryLow: string
  readonly batteryPower: string
  readonly error: string
  readonly onError: string
  readonly warning: string
  readonly onWarning: string
  readonly success: string
  readonly onSuccess: string
  readonly info: string
  readonly onInfo: string
}

/** `CornerRadii` (`lib/themes/corner_radii.dart:27-54`), before scaling by `.r`. */
export const RADII: Readonly<Record<RadiusTier, { readonly external: number; readonly internal: number }>> = {
  zero: { external: 0, internal: 0 },
  xs: { external: 3, internal: 2 },
  s: { external: 8, internal: 5 },
  m: { external: 14, internal: 10 },
  l: { external: 16, internal: 12 },
  xl: { external: 24, internal: 20 },
}

export { PALETTES, type ThemeId }

/** In `ThemeProvider.availableThemes` order, which is the order the theme picker lists them. */
export const THEME_IDS = Object.keys(PALETTES) as ThemeId[]

export function paletteOf(id: ThemeId): NeoPalette {
  return PALETTES[id]
}

/** A `#rrggbb` colour at an alpha - Flutter's `withValues(alpha:)`. */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1, 7), 16)
  const base = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${+(a * base).toFixed(4)})`
}

/** `Color.lerp`, per channel, for the header's icon tint. */
export function lerpColor(a: string, b: string, t: number): string {
  const x = parseInt(a.slice(1, 7), 16)
  const y = parseInt(b.slice(1, 7), 16)
  const ch = (v: number, s: number) => (v >> s) & 255
  const mix = (s: number) => Math.round(ch(x, s) + (ch(y, s) - ch(x, s)) * t)
  return `rgb(${mix(16)},${mix(8)},${mix(0)})`
}
