import { LIGHT, matrices, type Item, type ModelData } from './scene'

/**
 * The scene in WebGL: every model's triangles, lit per vertex as `scene.ts` lights them, textured
 * where a part has a texture - by its UVs, or by its facing where it is environment-mapped - and
 * blended with its materials' alpha, as the menu's models are a little see-through.
 */
const VERT = `
attribute vec3 p;
attribute vec3 n;
attribute vec4 c;
attribute vec2 uv;
uniform mat4 m;
uniform mat3 nm;
uniform vec3 l;
uniform float amb;
uniform float alpha;
uniform float lit;
uniform float env;
varying vec4 col;
varying vec2 tuv;
void main() {
  gl_Position = m * vec4(p, 1.0);
  vec3 wn = normalize(nm * n);
  float s = lit > 0.5 ? min(amb + (1.0 - amb) * max(dot(wn, l), 0.0), 1.0) : 1.0;
  col = vec4(c.rgb * s, c.a * alpha);
  // An environment map is looked up by the surface's facing: a sphere map, centred on the viewer.
  tuv = env > 0.5 ? vec2(wn.x * 0.5 + 0.5, 0.5 - wn.y * 0.5) : uv;
}
`

// Premultiplied, as the canvas is: the colour is already scaled by its coverage.
const FRAG = `
precision mediump float;
varying vec4 col;
varying vec2 tuv;
uniform sampler2D tex;
uniform float hasTex;
void main() {
  vec4 o = col * (hasTex > 0.5 ? texture2D(tex, tuv) : vec4(1.0));
  // A texel with no coverage draws nothing, depth included - the PowerVR's alpha test.
  if (o.a < 0.004) discard;
  gl_FragColor = vec4(o.rgb * o.a, o.a);
}
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
  /** Draw the items, in order. */
  draw: (items: readonly Item[]) => void
  dispose: () => void
}

/** `textures` holds every texture the models' parts name, loaded. */
export function createSceneGl(
  canvas: HTMLCanvasElement,
  models: readonly ModelData[],
  textures: ReadonlyMap<string, HTMLImageElement>,
): SceneGl | null {
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
  const meshes = new Map(
    models.map((m) => [
      m,
      {
        pos: buffer(new Float32Array(m.positions), gl.ARRAY_BUFFER),
        nrm: buffer(new Float32Array(m.normals), gl.ARRAY_BUFFER),
        col: buffer(new Uint8Array(m.colors), gl.ARRAY_BUFFER),
        uv: buffer(new Float32Array(m.uvs ?? new Array((m.positions.length / 3) * 2).fill(0)), gl.ARRAY_BUFFER),
        idx: buffer(new Uint16Array(m.indices), gl.ELEMENT_ARRAY_BUFFER),
      },
    ]),
  )
  // The PowerVR filters bilinearly and repeats; every ROM texture is a power of two, so WebGL can too.
  const glTextures = new Map<string, WebGLTexture>()
  for (const [name, img] of textures) {
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    glTextures.set(name, t)
  }
  const at = { p: gl.getAttribLocation(prog, 'p'), n: gl.getAttribLocation(prog, 'n'), c: gl.getAttribLocation(prog, 'c'), uv: gl.getAttribLocation(prog, 'uv') }
  const u = Object.fromEntries(['m', 'nm', 'l', 'amb', 'alpha', 'lit', 'env', 'tex', 'hasTex'].map((k) => [k, gl.getUniformLocation(prog, k)]))
  const [lx, ly, lz] = LIGHT.dir
  const ll = Math.hypot(lx, ly, lz)
  const attrib = (loc: number, b: WebGLBuffer, size: number, type: number, normalized = false) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, b)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, size, type, normalized, 0, 0)
  }

  return {
    draw(items) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.DEPTH_TEST)
      gl.enable(gl.CULL_FACE)
      gl.enable(gl.BLEND)
      // "Over", in premultiplied terms, so the canvas hands the page true colour and coverage.
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.useProgram(prog)
      gl.uniform3f(u.l!, lx / ll, ly / ll, lz / ll)
      gl.uniform1f(u.amb!, LIGHT.ambient)
      gl.uniform1i(u.tex!, 0)
      gl.activeTexture(gl.TEXTURE0)
      for (const item of items) {
        const mesh = meshes.get(item.model)
        if (!mesh) continue
        const { clip, normal } = matrices(item.pose, item.view)
        gl.uniformMatrix4fv(u.m!, false, clip)
        gl.uniformMatrix3fv(u.nm!, false, normal)
        gl.uniform1f(u.alpha!, item.alpha)
        attrib(at.p, mesh.pos, 3, gl.FLOAT)
        attrib(at.n, mesh.nrm, 3, gl.FLOAT)
        attrib(at.c, mesh.col, 4, gl.UNSIGNED_BYTE, true)
        attrib(at.uv, mesh.uv, 2, gl.FLOAT)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idx)
        for (const part of item.model.parts) {
          const t = part.texture ? glTextures.get(part.texture) : undefined
          gl.uniform1f(u.hasTex!, t ? 1 : 0)
          if (t) gl.bindTexture(gl.TEXTURE_2D, t)
          gl.uniform1f(u.env!, part.env ? 1 : 0)
          gl.uniform1f(u.lit!, part.lit ? 1 : 0)
          gl.drawElements(gl.TRIANGLES, part.count, gl.UNSIGNED_SHORT, part.start * 2)
        }
      }
    },
    dispose() {
      for (const b of buffers) gl.deleteBuffer(b)
      for (const t of glTextures.values()) gl.deleteTexture(t)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    },
  }
}
