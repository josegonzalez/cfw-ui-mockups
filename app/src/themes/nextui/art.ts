import { svgDataUri } from '../../widgets/GeneratedArt'

/**
 * Box art, and the stock backdrop.
 *
 * The menu ships no artwork - a real install scrapes it into a `.media` folder beside the ROMs -
 * so covers are generated. Hue comes from the title's hash, deterministically, because a field
 * seeded from `Math.random` makes every capture differ and every baseline useless.
 *
 * The reference screenshot shows the art with visible horizontal banding, which is what a 16-bit
 * framebuffer does to a gradient. That is reproduced rather than smoothed: it is the most
 * recognisable thing about how this menu actually looks on hardware, and it is the reason the art
 * reads as a console screenshot rather than as a web page.
 */
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Wrap a title onto lines short enough to read at art width. */
function wrap(name: string, perLine: number): string[] {
  const words = name.split(' ')
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
  return lines
}

/**
 * Banded box art with the title over it, at whatever size fits inside 288x288.
 *
 * The title is drawn into the image rather than beside it because that is what a scraped cover
 * looks like: the art carries its own wordmark. Nothing in the theme labels the art slot.
 */
export function boxart(name: string, w: number, h: number): string {
  const hue = hash(name) % 360
  const bands = 24
  const rows = Array.from({ length: bands }, (_, i) => {
    // Alternating lightness in steps rather than a smooth ramp - the 16bpp banding.
    const t = i / (bands - 1)
    const l = 40 - t * 30 + (i % 2 === 0 ? 2 : 0)
    return `<rect x="0" y="${((i * h) / bands).toFixed(2)}" width="${w}" height="${(h / bands + 1).toFixed(2)}" fill="hsl(${hue},52%,${l.toFixed(1)}%)"/>`
  }).join('')

  const size = Math.round(Math.min(w, h) / 7)
  const lines = wrap(name, Math.max(8, Math.floor(w / (size * 0.55))))
  const top = h / 2 - ((lines.length - 1) * size * 1.25) / 2
  const label = lines
    .map(
      (line, i) =>
        `<text x="${w / 2}" y="${(top + i * size * 1.25).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="BPreplay, sans-serif" font-weight="700" font-size="${size}" fill="#ffffff">${esc(line)}</text>`,
    )
    .join('')

  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${rows}${label}</svg>`,
  )
}

/**
 * The dark backdrop the reference screenshots were taken against.
 *
 * Not part of the theme. The menu clears to the palette's background slot and nothing else, so a
 * stock install of the Default palette is flat black; this is a `bg.png` such as a user drops in
 * `.media/`, kept so the reference screenshot can actually be reproduced. The overlay the menu
 * applies over a background image is drawn separately, at the alpha the source uses.
 */
export function backgroundImage(): string {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1">` +
      `<stop offset="0" stop-color="#0b1220"/><stop offset="1" stop-color="#16203a"/>` +
      `</linearGradient></defs>` +
      `<rect width="640" height="480" fill="url(#g)"/>` +
      `<circle cx="150" cy="392" r="215" fill="rgba(255,255,255,0.05)"/>` +
      `<circle cx="505" cy="96" r="130" fill="rgba(255,255,255,0.04)"/>` +
      `</svg>`,
  )
}
