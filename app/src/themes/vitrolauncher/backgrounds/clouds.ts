import { css, type BgFrame } from './types'

/**
 * Pixel-art clouds drifting over a cyan sky.
 *
 * Drawn at a third resolution and upscaled with nearest-neighbour, which is what gives the chunky
 * edge - smoothing it would lose the whole point of the theme.
 */
export interface Cloud {
  x: number
  readonly y: number
  readonly w: number
  readonly h: number
  /** Screen widths per second. */
  readonly speed: number
}

const DEFS = [
  { w: 150, h: 60, y: 0.3, speed: 0.008 },
  { w: 100, h: 42, y: 0.52, speed: 0.006 },
  { w: 64, h: 26, y: 0.22, speed: 0.004 },
  { w: 120, h: 50, y: 0.68, speed: 0.005 },
  { w: 80, h: 34, y: 0.42, speed: 0.007 },
  { w: 100, h: 42, y: 0.8, speed: 0.003 },
]

/** Deterministic start positions, so a static capture of this theme is reproducible. */
export function makeClouds(): Cloud[] {
  return DEFS.map((d, i) => ({
    x: i / DEFS.length + (i % 3) * 0.033,
    y: d.y,
    w: d.w / 3,
    h: d.h / 3,
    speed: d.speed,
  }))
}

/** Where a cloud sits at `time`, wrapped. Pure, so drift no longer depends on frame rate. */
export function cloudX(cloud: Cloud, time: number): number {
  const span = 1.5
  const x = cloud.x + cloud.speed * time
  return ((((x + 0.25) % span) + span) % span) - 0.25
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [f(0), f(8), f(4)]
}

/** The accent's hue, so the cloud ramp belongs to the scheme. */
export function accentHue(accent: readonly [number, number, number]): number {
  const mx = Math.max(...accent)
  const mn = Math.min(...accent)
  const d = mx - mn
  let h: number
  if (d === 0) h = 0.6
  else if (mx === accent[0]) h = ((accent[1] - accent[2]) / d) % 6
  else if (mx === accent[1]) h = (accent[2] - accent[0]) / d + 2
  else h = (accent[0] - accent[1]) / d + 4
  h /= 6
  return h < 0 ? h + 1 : h
}

export function drawClouds(
  ctx: CanvasRenderingContext2D,
  frame: BgFrame,
  low: HTMLCanvasElement,
  clouds: readonly Cloud[],
): void {
  const lowCtx = low.getContext('2d')!
  const lowW = low.width
  const lowH = low.height

  const sky = lowCtx.createLinearGradient(0, 0, 0, lowH)
  sky.addColorStop(0, css(hsl(0.588, 0.43, 0.48)))
  sky.addColorStop(0.4, css(hsl(0.564, 0.487, 0.56)))
  sky.addColorStop(0.72, css(hsl(0.54, 0.543, 0.64)))
  sky.addColorStop(1, css(hsl(0.516, 0.6, 0.72)))
  lowCtx.fillStyle = sky
  lowCtx.fillRect(0, 0, lowW, lowH)

  const hue = accentHue(frame.accent)
  const puffs = [
    [0, 0.15, 1],
    [-0.55, 0.25, 0.6],
    [0.55, 0.25, 0.6],
    [-0.28, -0.2, 0.7],
    [0.28, -0.2, 0.7],
    [0, -0.05, 0.85],
  ] as const

  for (const cloud of clouds) {
    /*
     * Position comes from the clock, not from accumulating per frame. The original added
     * `speed * 0.016` each frame, which assumes exactly 60fps - so the clouds crawled on a 30Hz
     * panel and sprinted on a 120Hz one, and a paused tab resumed wherever it left off rather
     * than where it should be.
     */
    const cx = cloudX(cloud, frame.time) * lowW
    const cy = cloud.y * lowH
    const cw = cloud.w
    const ch = cloud.h

    const grad = lowCtx.createLinearGradient(0, cy - ch, 0, cy + ch * 0.6)
    grad.addColorStop(0, css(hsl(hue, 0.594, 0.985)))
    grad.addColorStop(0.5, css(hsl(hue, 0.594, 0.87)))
    grad.addColorStop(1, css(hsl(hue, 0.594, 0.62)))
    lowCtx.fillStyle = grad

    lowCtx.beginPath()
    for (const [dx, dy, r] of puffs) {
      lowCtx.moveTo(cx + dx * cw + r * ch, cy + dy * ch)
      lowCtx.arc(cx + dx * cw, cy + dy * ch, r * ch, 0, Math.PI * 2)
    }
    lowCtx.fill()
    lowCtx.fillRect(cx - cw, cy - ch * 0.05, cw * 2, ch * 0.55)
  }

  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, frame.w, frame.h)
  ctx.drawImage(low, 0, 0, lowW, lowH, 0, 0, frame.w, frame.h)
  ctx.imageSmoothingEnabled = true
}

/** The flat gradient the two simple themes draw. No motion at all. */
export function drawSimple(ctx: CanvasRenderingContext2D, frame: BgFrame): void {
  const g = ctx.createLinearGradient(0, 0, 0, frame.h)
  if (frame.light) {
    g.addColorStop(0, '#f4f4f6')
    g.addColorStop(1, '#dddee2')
  } else {
    g.addColorStop(0, '#333337')
    g.addColorStop(1, '#202022')
  }
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = g
  ctx.fillRect(0, 0, frame.w, frame.h)
}
