import { useEffect, useRef, useState } from 'react'
import { useScreen } from '../../../device/ScreenContext'
import { useWebEffects } from '../../../render/RenderModeProvider'
import { bakeStillGl, stillGlCanvas } from '../../../render/stillGl'
import { hexToRgb } from '../palette'
import { drawClouds, drawSimple, makeClouds } from './clouds'
import { drawParticles, makeDotSprite, makeMotes, moteTint } from './particles'
import { createWaveGl, drawWavesFallback, type WaveGl } from './waves'
import type { BgFrame } from './types'
import type { BackgroundTheme } from '../library'

export interface BackgroundProps {
  readonly theme: BackgroundTheme
  readonly accent: string
  readonly bg: string
  readonly light: boolean
}

/**
 * The animated background.
 *
 * Deliberately outside the storyboard system: these are a continuous render loop, not a timeline,
 * so there is no keyframe to settle to. What stands in for settling is the clock - a static screen
 * renders exactly one frame at t=0, which is reproducible in a way that pausing a running loop at
 * an arbitrary moment would not be.
 *
 * Two canvases rather than one, because the wave theme needs a WebGL context and the other three
 * need a 2D one, and a canvas can only ever have one.
 */
export function Background({ theme, accent, bg, light }: BackgroundProps) {
  const { w, h, animate } = useScreen()
  const webEffects = useWebEffects()
  const glCanvas = useRef<HTMLCanvasElement>(null)
  const twoCanvas = useRef<HTMLCanvasElement>(null)

  /*
   * The shader is the one web-only capability here; fallback mode draws the waves in 2D instead.
   * Which canvas is shown follows whether the context actually came up, not whether we asked for
   * it - a browser without WebGL would otherwise be left staring at an empty GL canvas while the
   * fallback drew to a hidden one.
   */
  const wantGl = theme === 'waves' && webEffects
  const [glReady, setGlReady] = useState(false)
  // A still shows the 2D canvas whichever drew it: its GL frame is copied there (`stillGl.ts`).
  const useGl = wantGl && glReady && animate

  useEffect(() => {
    const two = twoCanvas.current
    const gl = animate ? glCanvas.current : stillGlCanvas(w, h)
    if (!two) return

    const ctx = two.getContext('2d')
    if (!ctx) return

    let wave: WaveGl | null = null
    if (wantGl && gl) wave = createWaveGl(gl)
    setGlReady(wave !== null)

    const accentRgb = hexToRgb(accent) ?? [0.1, 0.62, 1]
    const bgRgb = hexToRgb(bg) ?? [0.055, 0.078, 0.106]

    const motes = makeMotes()
    const sprite = theme === 'particles' ? makeDotSprite(moteTint(accentRgb)) : null
    const clouds = makeClouds()
    const low = document.createElement('canvas')
    low.width = Math.round(w / 3)
    low.height = Math.round(h / 3)

    const render = (time: number, dt: number) => {
      const frame: BgFrame = { w, h, time, dt, accent: accentRgb, bg: bgRgb, light }
      if (theme === 'waves') {
        if (wave) wave.draw(frame)
        else drawWavesFallback(ctx, frame)
      } else if (theme === 'particles' && sprite) {
        drawParticles(ctx, frame, motes, sprite)
      } else if (theme === 'clouds') {
        drawClouds(ctx, frame, low, clouds)
      } else {
        drawSimple(ctx, frame)
      }
    }

    render(0, 0)
    if (!animate) {
      if (wave && gl) bakeStillGl(gl, ctx)
      return () => wave?.dispose()
    }

    let raf = 0
    let start: number | null = null
    let last = 0
    let running = true

    const tick = (ts: number) => {
      if (start === null) start = ts
      const time = (ts - start) / 1000
      render(time, time - last)
      last = time
      raf = requestAnimationFrame(tick)
    }

    /*
     * Pause when the tab is hidden. The original never did, so four canvases kept a shader and a
     * particle field running in every background tab. On resume the clock is rebased so the
     * animation continues from where it stopped rather than jumping forward by the hidden time.
     */
    const onVisibility = () => {
      const hidden = document.visibilityState === 'hidden'
      if (hidden && running) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!hidden && !running) {
        running = true
        start = null
        raf = requestAnimationFrame((ts) => {
          start = ts - last * 1000
          tick(ts)
        })
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      wave?.dispose()
    }
  }, [theme, accent, bg, light, w, h, animate, wantGl])

  return (
    <>
      <canvas
        ref={glCanvas}
        className="vitro-bg"
        width={w}
        height={h}
        style={{ display: useGl ? 'block' : 'none' }}
      />
      <canvas
        ref={twoCanvas}
        className={`vitro-bg${theme === 'clouds' ? ' pixelated' : ''}`}
        width={w}
        height={h}
        style={{ display: useGl ? 'none' : 'block' }}
      />
    </>
  )
}
