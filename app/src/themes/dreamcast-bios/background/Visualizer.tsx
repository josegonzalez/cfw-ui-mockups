import { useEffect, useRef } from 'react'
import { useScreen } from '../../../device/ScreenContext'
import { H, MUSIC, W } from '../layout'

/**
 * The CD player's visualiser, which only the hidden 3D mode has: while a disc plays, the screen
 * darkens from its edges and a haze of coloured light gathers round the disc and turns
 * (`frames/visualizer-early.png`, `visualizer.png`; 293-297s). By four seconds in, the corners have
 * gone from the sea's `#1194bd` to `#10232a`.
 *
 * The BIOS's own visualiser follows the music, which the port does not have; this is a reading of
 * what it looks like, built up over the first seconds of a track, with its colours - orange, pink,
 * green and blue - turning slowly round the disc. It is a 2D canvas, so it is its own fallback.
 * Like the sky, it is a render loop, and a still draws it as the player's time leaves it.
 */
export const VISUALIZER = {
  /** Seconds of playing to build up fully. */
  build: 4.5,
  /** How dark the corners and the middle go, at full strength. */
  dark: { edge: 0.94, centre: 0.7 },
  /** The haze: its colours, how far round the disc they sit, and how fast they turn (turns a second). */
  colours: ['#ffb060', '#ff7090', '#ffd870', '#80e090', '#7090ff'],
  orbit: { rx: 105, ry: 38 },
  spread: 105,
  turn: 0.08,
  glow: 0.42,
} as const

function draw(ctx: CanvasRenderingContext2D, seconds: number) {
  const k = Math.min(1, Math.max(0, seconds / VISUALIZER.build))
  const { cx, cy } = MUSIC.disc
  ctx.clearRect(0, 0, W, H)
  if (k === 0) return
  const dark = ctx.createRadialGradient(cx, cy, 40, cx, cy, Math.hypot(W, H) / 2)
  dark.addColorStop(0, `rgba(6, 14, 20, ${VISUALIZER.dark.centre * k})`)
  dark.addColorStop(1, `rgba(6, 14, 20, ${VISUALIZER.dark.edge * k})`)
  ctx.fillStyle = dark
  ctx.fillRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'lighter'
  VISUALIZER.colours.forEach((colour, i) => {
    const a = 2 * Math.PI * (i / VISUALIZER.colours.length + seconds * VISUALIZER.turn)
    const x = cx + VISUALIZER.orbit.rx * Math.cos(a)
    const y = cy + VISUALIZER.orbit.ry * Math.sin(a)
    const g = ctx.createRadialGradient(x, y, 0, x, y, VISUALIZER.spread)
    const alpha = Math.round(VISUALIZER.glow * k * 255)
      .toString(16)
      .padStart(2, '0')
    g.addColorStop(0, `${colour}${alpha}`)
    g.addColorStop(1, `${colour}00`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  })
  ctx.globalCompositeOperation = 'source-over'
}

/** `elapsed` is how long the track has played, from the player, when this is drawn. */
export function Visualizer({ elapsed }: { elapsed: number }) {
  const { animate } = useScreen()
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    draw(ctx, elapsed)
    if (!animate) return
    let raf = 0
    let start: number | null = null
    const tick = (ts: number) => {
      start ??= ts
      draw(ctx, elapsed + (ts - start) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // The player's time is where the build starts; it is read once, as the loop carries it on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate])
  return <canvas ref={canvas} width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} />
}
