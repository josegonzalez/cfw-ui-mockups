import { LIGHT, matrices, type ModelData, type Transform } from './scene'

/**
 * The scene in WebGL: every model's triangles, lit per vertex as `scene.ts` lights them and blended
 * with their materials' alpha, as the menu's models are a little see-through.
 */
const VERT = `
attribute vec3 p;
attribute vec3 n;
attribute vec4 c;
uniform mat4 m;
uniform mat3 nm;
uniform vec3 l;
uniform float amb;
uniform float alpha;
varying vec4 col;
void main() {
  gl_Position = m * vec4(p, 1.0);
  float d = max(dot(normalize(nm * n), l), 0.0);
  col = vec4(c.rgb * min(amb + (1.0 - amb) * d, 1.0), c.a * alpha);
}
`

// Premultiplied, as the canvas is: the colour is already scaled by its coverage.
const FRAG = `
precision mediump float;
varying vec4 col;
void main() { gl_FragColor = vec4(col.rgb * col.a, col.a); }
`

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[dreamcast-bios] model shader:', gl.getShaderInfoLog(sh))
    return null
  }
  return sh
}

export interface SceneGl {
  /** Draw every model, each at its transform. */
  draw: (poses: readonly Transform[]) => void
  dispose: () => void
}

export function createSceneGl(canvas: HTMLCanvasElement, models: readonly ModelData[]): SceneGl | null {
  // preserveDrawingBuffer, so a still's one frame is still there when it is captured.
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: true, antialias: true })
  if (!gl) return null
  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  const prog = gl.createProgram()
  if (!vs || !fs || !prog) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null

  const buffers: WebGLBuffer[] = []
  const buffer = (data: ArrayBufferView, target: number) => {
    const b = gl.createBuffer()!
    gl.bindBuffer(target, b)
    gl.bufferData(target, data, gl.STATIC_DRAW)
    buffers.push(b)
    return b
  }
  const meshes = models.map((m) => ({
    pos: buffer(new Float32Array(m.positions), gl.ARRAY_BUFFER),
    nrm: buffer(new Float32Array(m.normals), gl.ARRAY_BUFFER),
    col: buffer(new Uint8Array(m.colors), gl.ARRAY_BUFFER),
    idx: buffer(new Uint16Array(m.indices), gl.ELEMENT_ARRAY_BUFFER),
    count: m.indices.length,
  }))
  const at = { p: gl.getAttribLocation(prog, 'p'), n: gl.getAttribLocation(prog, 'n'), c: gl.getAttribLocation(prog, 'c') }
  const u = { m: gl.getUniformLocation(prog, 'm'), nm: gl.getUniformLocation(prog, 'nm'), l: gl.getUniformLocation(prog, 'l'), amb: gl.getUniformLocation(prog, 'amb'), alpha: gl.getUniformLocation(prog, 'alpha') }
  const [lx, ly, lz] = LIGHT.dir
  const ll = Math.hypot(lx, ly, lz)

  return {
    draw(poses) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.DEPTH_TEST)
      gl.enable(gl.CULL_FACE)
      gl.enable(gl.BLEND)
      // "Over", in premultiplied terms, so the canvas hands the page true colour and coverage.
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.useProgram(prog)
      gl.uniform3f(u.l, lx / ll, ly / ll, lz / ll)
      gl.uniform1f(u.amb, LIGHT.ambient)
      gl.uniform1f(u.alpha, LIGHT.alpha)
      meshes.forEach((mesh, i) => {
        const { clip, normal } = matrices(poses[i]!)
        gl.uniformMatrix4fv(u.m, false, clip)
        gl.uniformMatrix3fv(u.nm, false, normal)
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pos)
        gl.enableVertexAttribArray(at.p)
        gl.vertexAttribPointer(at.p, 3, gl.FLOAT, false, 0, 0)
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nrm)
        gl.enableVertexAttribArray(at.n)
        gl.vertexAttribPointer(at.n, 3, gl.FLOAT, false, 0, 0)
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.col)
        gl.enableVertexAttribArray(at.c)
        gl.vertexAttribPointer(at.c, 4, gl.UNSIGNED_BYTE, true, 0, 0)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idx)
        gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0)
      })
    },
    dispose() {
      for (const b of buffers) gl.deleteBuffer(b)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    },
  }
}
