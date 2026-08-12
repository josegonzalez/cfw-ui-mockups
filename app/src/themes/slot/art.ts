import { svgDataUri } from '../../widgets/GeneratedArt'
import { CART_PATH, DETAIL_PATHS } from './assets/cartPaths'
import { CART, LABEL, LABEL_MAX_LINES, LABEL_MAX_PX, LABEL_MIN_PX } from './layout'
import { cleanLabel, shellFor, type Cart } from './library'

/**
 * The cart face, assembled the way `cart.rs` assembles it.
 *
 * Four passes, in the source's order: the shell colour through the traced silhouette, the moulded
 * detail darkened into it, a bevelled recess for the label, then the paper label and its text.
 * Built as one SVG rather than by writing pixels, but the geometry and every colour derivation
 * below is the source's own arithmetic.
 */

function shade(hex: string, factor: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const out = parts.map((c) => Math.min(255, Math.round(c * factor)))
  return `#${out.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * The label's paper colour: an FNV-1a hash of the title, at a fixed saturation and value.
 *
 * The constants are the source's, so a given title gets the same paper here as on the device.
 * Deterministic by construction, which is also what makes the baselines reproducible.
 */
export function labelColour(title: string): string {
  let h = 0xcbf29ce484222325n
  const mask = (1n << 64n) - 1n
  for (const byte of new TextEncoder().encode(title)) {
    h = (h ^ BigInt(byte)) & mask
    h = (h * 0x100000001b3n) & mask
  }
  return hsv(Number(h % 360n), 0.52, 0.74)
}

function hsv(hDeg: number, s: number, v: number): string {
  const c = v * s
  const x = c * (1 - Math.abs(((hDeg / 60) % 2) - 1))
  const m = v - c
  const seg = Math.floor(hDeg / 60) % 6
  const rgb =
    seg === 0
      ? [c, x, 0]
      : seg === 1
        ? [x, c, 0]
        : seg === 2
          ? [0, c, x]
          : seg === 3
            ? [0, x, c]
            : seg === 4
              ? [x, 0, c]
              : [c, 0, x]
  const out = rgb.map((n) => Math.round((n + m) * 255))
  return `#${out.map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

/**
 * The label's ink, flipped on the paper's luminance rather than fixed.
 *
 * "Hue rotation alone puts yellow and blue at very different luminance, so the ink flips rather
 * than sitting at one fixed value."
 */
export function labelInk(paper: string): string {
  const n = Number.parseInt(paper.slice(1), 16)
  const luma = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)
  return luma > 140 ? '#1a1816' : '#f4f1ea'
}

/** Wrap a title onto at most three lines, shrinking until it fits - `text::fit`'s job. */
export function fitLabel(title: string): { lines: string[]; px: number } {
  const words = title.toUpperCase().split(/\s+/).filter(Boolean)
  const inner = LABEL.w - 10 * 2

  for (let px = Math.floor(LABEL_MAX_PX); px >= LABEL_MIN_PX; px -= 1) {
    /* Open Sans Bold averages a little over half its em across the ASCII range. */
    const advance = px * 0.56
    const perLine = Math.max(1, Math.floor(inner / advance))
    const lines: string[] = []
    let line = ''
    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (next.length > perLine && line) {
        lines.push(line)
        line = word
      } else {
        line = next
      }
    }
    if (line) lines.push(line)
    if (lines.length <= LABEL_MAX_LINES && lines.every((l) => l.length <= perLine)) {
      return { lines, px }
    }
  }

  return { lines: [title.toUpperCase().slice(0, 14)], px: LABEL_MIN_PX }
}

/** The bevel around the label recess, in px. Light comes from the upper left. */
const BEVEL = 3

export function cartFace(cart: Cart): string {
  const shell = shellFor(cart.code)
  const title = cleanLabel(cart.file)
  const paper = labelColour(title)
  const { lines, px } = fitLabel(title)

  /* The recess walls: top and left turned away from the light, bottom and right catching it. */
  const dark = shade(shell, 0.55)
  const lit = shade(shell, 1.45)
  const moulded = shade(shell, 0.62)

  const lineH = px * 1.36
  const top = LABEL.y + LABEL.h / 2 - ((lines.length - 1) * lineH) / 2

  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CART.w}" height="${CART.h}" viewBox="0 0 ${CART.w} ${CART.h}">` +
      `<defs><clipPath id="c"><path d="${CART_PATH}"/></clipPath></defs>` +
      `<g clip-path="url(#c)">` +
      `<path d="${CART_PATH}" fill="${shell}"/>` +
      DETAIL_PATHS.map((d) => `<path d="${d}" fill="${moulded}"/>`).join('') +
      /* The recess: the lit walls first, then the shadowed ones over them at the corners. */
      `<rect x="${LABEL.x - BEVEL}" y="${LABEL.y - BEVEL}" width="${LABEL.w + BEVEL * 2}" height="${LABEL.h + BEVEL * 2}" fill="${lit}"/>` +
      `<path d="M${LABEL.x - BEVEL} ${LABEL.y - BEVEL} h${LABEL.w + BEVEL * 2} l-${BEVEL} ${BEVEL} h-${LABEL.w} v${LABEL.h} l-${BEVEL} ${BEVEL} v-${LABEL.h + BEVEL * 2} z" fill="${dark}"/>` +
      `<rect x="${LABEL.x}" y="${LABEL.y}" width="${LABEL.w}" height="${LABEL.h}" fill="${paper}"/>` +
      lines
        .map(
          (line, i) =>
            `<text x="${CART.w / 2}" y="${(top + i * lineH).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="SlotLabel, sans-serif" font-weight="700" font-size="${px}" fill="${labelInk(paper)}">${esc(line)}</text>`,
        )
        .join('') +
      `</g></svg>`,
  )
}

/** The cart's own shape in black, drawn under a side cart so dimming reads as shadow. */
export function cartShadow(): string {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CART.w}" height="${CART.h}" viewBox="0 0 ${CART.w} ${CART.h}">` +
      `<path d="${CART_PATH}" fill="#000000"/>` +
      `</svg>`,
  )
}

/**
 * A save-state thumbnail: a 240x160 picture of the panel.
 *
 * slot's are real screenshots taken at save time. There is nothing to screenshot here, so these
 * are generated from the title and the slot index - deterministically, because a thumbnail seeded
 * from `Math.random` would make every capture differ.
 */
export function thumbnail(title: string, slot: number): string {
  const hue = (Number.parseInt(labelColour(title).slice(1), 16) + slot * 4099) % 360
  const bands = Array.from({ length: 10 }, (_, i) => {
    const l = 26 + Math.abs(5 - i) * 3
    return `<rect x="0" y="${i * 16}" width="240" height="17" fill="hsl(${hue},34%,${l}%)"/>`
  }).join('')

  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160">` +
      bands +
      `<rect x="86" y="58" width="68" height="44" rx="4" fill="hsl(${hue},44%,62%)"/>` +
      `</svg>`,
  )
}
