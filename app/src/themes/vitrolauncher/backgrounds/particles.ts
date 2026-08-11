import { css, mul, type BgFrame } from './types'

/**
 * PS5-style dust motes over a diagonal gradient.
 *
 * The mote field is deterministic: positions come from a seeded generator rather than
 * `Math.random`, so a static screenshot of this theme is reproducible and the fidelity diff has
 * something stable to compare. The original seeded from `Math.random` and every capture differed.
 */
export interface Mote {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly size: number
  readonly twinkle: number
  readonly phase: number
  readonly driftX: number
  readonly driftY: number
}

/** Mulberry32 - small, fast, and good enough for a dust field. */
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeMotes(count = 70, seed = 0x5177_0): Mote[] {
  const rnd = seeded(seed)
  const out: Mote[] = []
  for (let i = 0; i < count; i++) {
    const z = Math.pow(rnd(), 1.4)
    out.push({
      x: rnd() * 1.2 - 0.1,
      y: rnd() * 1.2 - 0.1,
      z,
      size: 1.5 + 20 * z * z,
      twinkle: 0.5 + rnd() * 2.5,
      phase: rnd() * 6.28,
      driftX: (rnd() - 0.5) * 0.01,
      driftY: (rnd() - 0.5) * 0.006,
    })
  }
  return out
}

/**
 * One 48px radial sprite, drawn once and blitted per mote.
 *
 * Tinted at creation rather than composited afterwards: the motes are drawn additively over a
 * gradient, so any tint pass wide enough to catch them would catch the gradient too.
 */
export function makeDotSprite(tint: readonly [number, number, number]): HTMLCanvasElement {
  const s = 48
  const c = document.createElement('canvas')
  c.width = s
  c.height = s
  const g = c.getContext('2d')!
  const rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  rg.addColorStop(0, 'rgba(255,255,255,1)')
  rg.addColorStop(0.3, 'rgba(255,255,255,0.55)')
  rg.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = rg
  g.fillRect(0, 0, s, s)
  g.globalCompositeOperation = 'source-in'
  g.fillStyle = css(tint)
  g.fillRect(0, 0, s, s)
  return c
}

/**
 * The colour the dust takes, three-quarters of the way from the accent to white.
 *
 * The original computed exactly this and then threw it away with `void moteCol`, so every scheme
 * got the same pale white field - on a red or green scheme the dust did not belong to the
 * background it sat over.
 */
export function moteTint(accent: readonly [number, number, number]): [number, number, number] {
  return [
    1 - (1 - accent[0]) * 0.25,
    1 - (1 - accent[1]) * 0.25,
    1 - (1 - accent[2]) * 0.25,
  ]
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  frame: BgFrame,
  motes: readonly Mote[],
  sprite: HTMLCanvasElement,
): void {
  const { w, h, bg, accent, time } = frame
  const lit = mul(bg, 1.15)
  const mid = mul(bg, 0.66)
  const dark = mul(bg, 0.36)

  const g = ctx.createLinearGradient(0, h, w, 0)
  g.addColorStop(0, css(dark))
  g.addColorStop(0.55, css(mid))
  g.addColorStop(1, css(lit))
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const glow = ctx.createRadialGradient(w * 0.82, -h * 0.18, 0, w * 0.82, -h * 0.18, h * 1.3)
  glow.addColorStop(0, css(accent, 0.16))
  glow.addColorStop(1, css(accent, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  ctx.globalCompositeOperation = 'lighter'
  for (const m of motes) {
    const px = (((m.x + ((m.driftX * time) % 1) + 1) % 1.2) - 0.1) * w
    const py = (((m.y + ((m.driftY * time) % 1) + 1) % 1.2) - 0.1) * h
    const twinkle = 0.72 + 0.28 * Math.sin(time * m.twinkle + m.phase)
    ctx.globalAlpha = Math.min(0.85, (0.1 + 0.5 * m.z) * twinkle)
    ctx.drawImage(sprite, px - m.size / 2, py - m.size / 2, m.size, m.size)
  }
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}
