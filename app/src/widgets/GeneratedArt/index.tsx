import { place, type Box } from '../../layout/box'

/**
 * Placeholder artwork, generated rather than fetched.
 *
 * None of these mockups ship real box art - it is copyrighted, and a mockup does not need it.
 * Every theme instead generates a deterministic image from the game's identity, so a screen
 * looks populated and a screenshot is reproducible.
 *
 * Determinism is the requirement that shapes this file. Nothing here may use a random source:
 * the same game must produce the same image on every run, or every visual baseline fails.
 */

/** Encode an SVG document as a data URI. */
export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * A small deterministic hash, used to pick a colour pair from a title.
 *
 * FNV-1a: short, stable across runs, and good enough to scatter similar titles into different
 * buckets. It is not a security primitive and is not used as one.
 */
export function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export interface GradientArtOptions {
  readonly width: number
  readonly height: number
  readonly from: string
  readonly to: string
  /** Degrees, measured like a CSS linear-gradient angle. */
  readonly angle?: number | undefined
  readonly label?: string | undefined
  readonly labelColor?: string | undefined
}

/** A two-stop gradient panel, the simplest stand-in for cover art. */
export function gradientArt({
  width,
  height,
  from,
  to,
  angle = 150,
  label,
  labelColor = 'rgba(255,255,255,0.85)',
}: GradientArtOptions): string {
  const radians = ((angle - 90) * Math.PI) / 180
  const x2 = (0.5 + Math.cos(radians) / 2).toFixed(4)
  const y2 = (0.5 + Math.sin(radians) / 2).toFixed(4)
  const x1 = (0.5 - Math.cos(radians) / 2).toFixed(4)
  const y1 = (0.5 - Math.sin(radians) / 2).toFixed(4)

  const text = label
    ? `<text x="50%" y="92%" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${Math.round(height * 0.09)}" fill="${labelColor}">${escapeXml(label)}</text>`
    : ''

  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<defs><linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
      `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
      `</linearGradient></defs>` +
      `<rect width="${width}" height="${height}" fill="url(#g)"/>${text}</svg>`,
  )
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Pick a stable colour pair for a title from a supplied palette. */
export function paletteFor(
  title: string,
  palette: readonly (readonly [string, string])[],
): readonly [string, string] {
  if (palette.length === 0) return ['#1e2430', '#4a6ea8']
  return palette[hashString(title) % palette.length]!
}

export interface GeneratedArtProps {
  readonly box: Box
  /** A data URI, typically from `gradientArt`. */
  readonly src: string
  readonly alt: string
  readonly radius?: number | undefined
  readonly shadow?: string | undefined
  readonly fit?: 'cover' | 'contain' | 'fill' | undefined
  /** Pixel art must not be smoothed when scaled. */
  readonly pixelated?: boolean | undefined
}

/** Renders generated artwork into a resolved box. */
export function GeneratedArt({
  box,
  src,
  alt,
  radius,
  shadow,
  fit = 'cover',
  pixelated = false,
}: GeneratedArtProps) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        ...place({ ...box, ...(radius !== undefined ? { radius } : {}) }),
        objectFit: fit,
        boxShadow: shadow,
        imageRendering: pixelated ? 'pixelated' : 'auto',
      }}
      data-widget="GeneratedArt"
    />
  )
}
