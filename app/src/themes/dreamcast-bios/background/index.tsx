import { useEffect, useRef, useState } from 'react'
import { useScreen } from '../../../device/ScreenContext'
import { useWebEffects } from '../../../render/RenderModeProvider'
import { bakeStillGl, stillGlCanvas } from '../../../render/stillGl'
import { SCENERY, VERT, frag, skyAt, type Palette, type Scenery } from './sky'

/** The fallback draws a pixel of sky per this many device pixels each way, then scales it up. */
const FALLBACK_STEP = 4

interface SkyGl {
  draw: (t: number) => void
  dispose: () => void
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[dreamcast-bios] shader error:', gl.getShaderInfoLog(sh))
    return null
  }
  return sh
}

function createSkyGl(canvas: HTMLCanvasElement, palette: Palette): SkyGl | null {
  // preserveDrawingBuffer, so a still's single frame is still there when it is captured.
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false })
  if (!gl) return null
  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag(palette))
  const prog = gl.createProgram()
  if (!vs || !fs || !prog) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  const res = gl.getUniformLocation(prog, 'res')
  const time = gl.getUniformLocation(prog, 't')
  return {
    draw(t) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(prog)
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(res, canvas.width, canvas.height)
      gl.uniform1f(time, t)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    dispose() {
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    },
  }
}

/** The fallback: `skyAt` on the CPU at a quarter of the resolution, smoothed up to the frame. */
function drawSkyFallback(ctx: CanvasRenderingContext2D, low: HTMLCanvasElement, t: number, palette: Palette) {
  const lctx = low.getContext('2d')
  if (!lctx) return
  const img = lctx.createImageData(low.width, low.height)
  for (let y = 0; y < low.height; y++) {
    for (let x = 0; x < low.width; x++) {
      const [r, g, b] = skyAt((x + 0.5) / low.width, (y + 0.5) / low.height, t, palette)
      const i = (y * low.width + x) * 4
      img.data[i] = Math.round(r * 255)
      img.data[i + 1] = Math.round(g * 255)
      img.data[i + 2] = Math.round(b * 255)
      img.data[i + 3] = 255
    }
  }
  lctx.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(low, 0, 0, ctx.canvas.width, ctx.canvas.height)
}

/**
 * The sky behind every screen - or in the hidden 3D mode, the sea. It never stops or fades: screens
 * come and go over it.
 *
 * Deliberately outside the storyboard system, as Vitro Launcher's backgrounds are: it is a render
 * loop, not a timeline, so what stands in for settling is the clock - a still draws exactly one
 * frame, at t = 0. The shader is the web-only capability; fallback mode, or a browser without
 * WebGL, draws the same sky on the CPU at a quarter of the resolution. Which canvas shows follows
 * whether the GL context actually came up.
 */
export function Sky({ scenery = 'open' }: { scenery?: Scenery }) {
  const palette = SCENERY[scenery]
  const { w, h, animate } = useScreen()
  const webEffects = useWebEffects()
  const glCanvas = useRef<HTMLCanvasElement>(null)
  const twoCanvas = useRef<HTMLCanvasElement>(null)
  const [glReady, setGlReady] = useState(false)
  // A still shows the 2D canvas whichever drew it: its GL frame is copied there (`stillGl.ts`).
  const useGl = webEffects && glReady && animate

  useEffect(() => {
    const two = twoCanvas.current
    const ctx = two?.getContext('2d')
    if (!two || !ctx) return
    const glTarget = animate ? glCanvas.current : stillGlCanvas(w, h)
    const sky = webEffects && glTarget ? createSkyGl(glTarget, palette) : null
    setGlReady(sky !== null)
    const low = document.createElement('canvas')
    low.width = Math.round(w / FALLBACK_STEP)
    low.height = Math.round(h / FALLBACK_STEP)
    const render = (t: number) => (sky ? sky.draw(t) : drawSkyFallback(ctx, low, t, palette))

    render(0)
    if (!animate) {
      if (sky && glTarget) bakeStillGl(glTarget, ctx)
      return () => sky?.dispose()
    }

    let raf = 0
    let start: number | null = null
    let last = 0
    let running = true
    const tick = (ts: number) => {
      if (start === null) start = ts
      last = (ts - start) / 1000
      render(last)
      raf = requestAnimationFrame(tick)
    }
    // Pause while the tab is hidden, and pick up where it stopped rather than jumping ahead.
    const onVisibility = () => {
      const hidden = document.visibilityState === 'hidden'
      if (hidden && running) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!hidden && !running) {
        running = true
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
      sky?.dispose()
    }
  }, [w, h, animate, webEffects, palette])

  return (
    <>
      <canvas ref={glCanvas} className="dc-bg" width={w} height={h} style={{ display: useGl ? 'block' : 'none' }} />
      <canvas ref={twoCanvas} className="dc-bg" width={w} height={h} style={{ display: useGl ? 'none' : 'block' }} />
    </>
  )
}
