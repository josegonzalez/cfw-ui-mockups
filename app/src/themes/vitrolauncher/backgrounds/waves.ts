import { css, mul, type BgFrame } from './types'

/**
 * The wave background: `wave.lua`'s GLSL fragment shader, ported to WebGL.
 *
 * Two travelling sine pairs, each contributing a filled region below its crest and a thin glow
 * along it. The light branch mixes towards the tint and the dark branch adds to it, which is why
 * this cannot be one branch with a signed coefficient: on a pale background adding would blow out
 * and on a dark one mixing would wash out.
 */
const VERT = 'attribute vec2 aPos; void main(){ gl_Position = vec4(aPos,0.0,1.0); }'

const FRAG = [
  'precision highp float;',
  'uniform vec4 phases; uniform vec3 tint; uniform vec3 gradTop; uniform vec3 gradBottom;',
  'uniform float lightMode; uniform vec2 res;',
  'void main(){',
  '  vec2 uv = gl_FragCoord.xy / res; uv.y = 1.0 - uv.y;',
  '  vec3 col = mix(gradTop, gradBottom, uv.y);',
  '  float y1 = 0.76 + 0.13*sin(uv.x*2.2 + phases.x) + 0.05*sin(uv.x*5.0 - phases.y);',
  '  float y2 = 0.92 + 0.12*sin(uv.x*2.8 - phases.z) + 0.06*sin(uv.x*4.1 + phases.w);',
  '  float f1 = smoothstep(y1-0.02, y1+0.05, uv.y);',
  '  float f2 = smoothstep(y2-0.02, y2+0.05, uv.y);',
  '  float g1 = exp(-abs(uv.y-y1)*55.0);',
  '  float g2 = exp(-abs(uv.y-y2)*55.0);',
  '  if(lightMode > 0.5){',
  '    col = mix(col, tint, f1*0.20);',
  '    col = mix(col, tint, f2*0.32);',
  '    col = mix(col, tint, (g1+g2)*0.45);',
  '  } else {',
  '    col += f1*(tint*0.45 + vec3(0.05));',
  '    col += f2*(tint*0.70 + vec3(0.10));',
  '    col += (g1+g2)*(tint*0.6 + vec3(0.4))*0.5;',
  '  }',
  '  gl_FragColor = vec4(col, 1.0);',
  '}',
].join('\n')

const TWO_PI = Math.PI * 2

/** The four phase offsets at a given time. Shared by the shader and its fallback. */
export function phases(time: number): [number, number, number, number] {
  return [
    (time * 0.45) % TWO_PI,
    (time * 0.26) % TWO_PI,
    (time * 0.36) % TWO_PI,
    (time * 0.31) % TWO_PI,
  ]
}

/** The vertical gradient the waves sit on. */
export function gradient(frame: BgFrame): { top: [number, number, number]; bottom: [number, number, number] } {
  const { bg, light } = frame
  return {
    top: light ? mul(bg, 1.04) : mul(bg, 0.2),
    bottom: light ? [bg[0] * 0.88, bg[1] * 0.88, bg[2] * 0.92] : mul(bg, 1.05),
  }
}

/** Crest height of wave 1 at `x`, in 0-1 screen space. Used by the 2D fallback. */
export function crest1(x: number, p: readonly number[]): number {
  return 0.76 + 0.13 * Math.sin(x * 2.2 + p[0]!) + 0.05 * Math.sin(x * 5.0 - p[1]!)
}
export function crest2(x: number, p: readonly number[]): number {
  return 0.92 + 0.12 * Math.sin(x * 2.8 - p[2]!) + 0.06 * Math.sin(x * 4.1 + p[3]!)
}

export interface WaveGl {
  draw: (frame: BgFrame) => void
  dispose: () => void
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[vitro] shader error:', gl.getShaderInfoLog(sh))
    return null
  }
  return sh
}

/**
 * Set up the shader, or return null when WebGL is unavailable.
 *
 * The original called its draw function unconditionally and threw against a null context on any
 * browser without WebGL. Returning null here forces the caller to have a fallback, which is the
 * whole point of the two render modes.
 */
export function createWaveGl(canvas: HTMLCanvasElement): WaveGl | null {
  const gl = (canvas.getContext('webgl') ??
    canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
  if (!gl) return null

  const prog = gl.createProgram()
  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!prog || !vs || !fs) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)

  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = {
    phases: gl.getUniformLocation(prog, 'phases'),
    tint: gl.getUniformLocation(prog, 'tint'),
    gradTop: gl.getUniformLocation(prog, 'gradTop'),
    gradBottom: gl.getUniformLocation(prog, 'gradBottom'),
    lightMode: gl.getUniformLocation(prog, 'lightMode'),
    res: gl.getUniformLocation(prog, 'res'),
  }

  return {
    draw(frame) {
      const p = phases(frame.time)
      const { top, bottom } = gradient(frame)
      gl.viewport(0, 0, frame.w, frame.h)
      gl.uniform4f(u.phases, p[0], p[1], p[2], p[3])
      gl.uniform3fv(u.tint, [...frame.accent])
      gl.uniform3fv(u.gradTop, top)
      gl.uniform3fv(u.gradBottom, bottom)
      gl.uniform1f(u.lightMode, frame.light ? 1 : 0)
      gl.uniform2f(u.res, frame.w, frame.h)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    dispose() {
      gl.deleteBuffer(quad)
      gl.deleteProgram(prog)
    },
  }
}

/**
 * The fallback: the same two waves drawn as filled paths on a 2D context.
 *
 * It samples the identical crest functions, so the wave *shapes* are exact - what is lost is the
 * per-pixel glow along each crest, which becomes a stroke, and the smoothstep edge, which becomes
 * a hard fill. At a glance it reads the same; side by side it is flatter.
 */
export function drawWavesFallback(ctx: CanvasRenderingContext2D, frame: BgFrame): void {
  const { w, h } = frame
  const p = phases(frame.time)
  const { top, bottom } = gradient(frame)

  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, css(top))
  g.addColorStop(1, css(bottom))
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const STEP = 4
  for (const [crest, fill, glow] of [
    [crest1, frame.light ? 0.2 : 0.45, 0.5],
    [crest2, frame.light ? 0.32 : 0.7, 0.7],
  ] as const) {
    ctx.beginPath()
    ctx.moveTo(0, h)
    for (let x = 0; x <= w; x += STEP) ctx.lineTo(x, crest(x / w, p) * h)
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fillStyle = css(frame.accent, fill)
    ctx.fill()

    // The crest glow, flattened to a stroke.
    ctx.beginPath()
    for (let x = 0; x <= w; x += STEP) {
      const y = crest(x / w, p) * h
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.lineWidth = 2
    ctx.strokeStyle = css(frame.light ? frame.accent : [1, 1, 1], glow * 0.5)
    ctx.stroke()
  }
}
