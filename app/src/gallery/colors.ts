/**
 * Colour maths for the notes viewer's swatches.
 *
 * Pure and separate from the DOM work, because "is this text readable on this background" is
 * exactly the kind of thing that looks fine until one palette entry lands in the middle and
 * becomes unreadable. It is computed against the WCAG contrast definition rather than guessed
 * from a lightness threshold, which gets mid-tones wrong in both directions.
 */

export interface Rgb {
  readonly r: number
  readonly g: number
  readonly b: number
}

export interface Rgba extends Rgb {
  /** 0 to 1. */
  readonly a: number
}

/** The surface a swatch is drawn on, used to composite partially transparent colours. */
export const NOTES_SURFACE: Rgb = { r: 0x0e, g: 0x10, b: 0x17 }

/**
 * Parse a hex colour.
 *
 * Accepts `#rgb`, `#rrggbb` and `#rrggbbaa`, and the same without the hash - the source themes
 * store their palettes both ways. Returns null for anything else, including the 7-character
 * commit hashes that also appear in these documents.
 */
export function parseHexColor(text: string): Rgba | null {
  const body = text.trim().replace(/^#/, '')
  if (!/^[0-9a-f]+$/i.test(body)) return null

  if (body.length === 3) {
    const [r, g, b] = [...body].map((c) => parseInt(c + c, 16))
    return { r: r!, g: g!, b: b!, a: 1 }
  }

  if (body.length === 6 || body.length === 8) {
    const n = (i: number) => parseInt(body.slice(i, i + 2), 16)
    return {
      r: n(0),
      g: n(2),
      b: n(4),
      a: body.length === 8 ? n(6) / 255 : 1,
    }
  }

  return null
}

/** Flatten a partially transparent colour onto a background. */
export function compositeOver(color: Rgba, background: Rgb): Rgb {
  if (color.a >= 1) return { r: color.r, g: color.g, b: color.b }
  return {
    r: Math.round(color.r * color.a + background.r * (1 - color.a)),
    g: Math.round(color.g * color.a + background.g * (1 - color.a)),
    b: Math.round(color.b * color.a + background.b * (1 - color.a)),
  }
}

/** WCAG relative luminance. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio, 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (light! + 0.05) / (dark! + 0.05)
}

const BLACK: Rgb = { r: 0, g: 0, b: 0 }
const WHITE: Rgb = { r: 255, g: 255, b: 255 }

/**
 * Black or white, whichever reads better on the given colour.
 *
 * Chosen by contrast ratio rather than by a luminance threshold. A threshold picks wrong around
 * the middle of the range - a mid green and a mid blue of the same lightness want different ink.
 */
export function readableInk(background: Rgb): '#000000' | '#ffffff' {
  return contrastRatio(background, BLACK) >= contrastRatio(background, WHITE) ? '#000000' : '#ffffff'
}

export interface Swatch {
  /** CSS colour for the chip's background, alpha preserved. */
  readonly background: string
  /** CSS colour for the text on it. */
  readonly ink: string
  /** Contrast ratio actually achieved, for tests and debugging. */
  readonly contrast: number
}

/** Resolve a hex string into the styling for one swatch. */
export function swatchFor(text: string, surface: Rgb = NOTES_SURFACE): Swatch | null {
  const color = parseHexColor(text)
  if (!color) return null

  // Ink is chosen against what the eye actually sees, which for a translucent colour is the
  // colour composited over the surface behind it.
  const effective = compositeOver(color, surface)
  const ink = readableInk(effective)

  return {
    background:
      color.a >= 1
        ? `rgb(${color.r} ${color.g} ${color.b})`
        : `rgb(${color.r} ${color.g} ${color.b} / ${(color.a * 100).toFixed(1)}%)`,
    ink,
    contrast: contrastRatio(effective, ink === '#000000' ? BLACK : WHITE),
  }
}
