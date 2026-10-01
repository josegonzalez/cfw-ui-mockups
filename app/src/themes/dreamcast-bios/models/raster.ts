import { SCREEN, matrices, shade, type Item } from './scene'

/** A texture's pixels, for sampling on the CPU. */
export interface Texels {
  readonly w: number
  readonly h: number
  readonly data: Uint8ClampedArray
}

/** An image's pixels, read once through a 2D canvas. */
export function texels(img: HTMLImageElement): Texels | null {
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, 0, 0)
  return { w: c.width, h: c.height, data: ctx.getImageData(0, 0, c.width, c.height).data }
}

/** Nearest texel, repeating, as RGBA 0-1. */
function sample(t: Texels, u: number, v: number, out: number[]) {
  const x = ((Math.floor(u * t.w) % t.w) + t.w) % t.w
  const y = ((Math.floor(v * t.h) % t.h) + t.h) % t.h
  const i = (y * t.w + x) * 4
  out[0] = t.data[i]! / 255
  out[1] = t.data[i + 1]! / 255
  out[2] = t.data[i + 2]! / 255
  out[3] = t.data[i + 3]! / 255
}

/**
 * The scene on the CPU, for fallback mode and a browser without WebGL: the same items, transforms,
 * light, textures and blend as `gl.ts`, rasterised into a 2D canvas's pixels - back faces culled,
 * depth tested, each triangle's colours and texture coordinates interpolated across it. It samples
 * the nearest texel and has no antialiasing, which is how it differs from the shader.
 */
export function drawSceneCpu(ctx: CanvasRenderingContext2D, items: readonly Item[], textures: ReadonlyMap<string, Texels>) {
  const { w, h } = SCREEN
  const img = ctx.createImageData(w, h)
  const px = img.data
  const depth = new Float32Array(w * h).fill(Infinity)
  const tex = [1, 1, 1, 1]

  for (const { model: m, pose, view, alpha: itemAlpha } of items) {
    const { clip, normal } = matrices(pose, view)
    const n = m.positions.length / 3
    const sx = new Float32Array(n)
    const sy = new Float32Array(n)
    const sz = new Float32Array(n)
    const lit = new Float32Array(n)
    const eu = new Float32Array(n)
    const ev = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const [x, y, z] = [m.positions[i * 3]!, m.positions[i * 3 + 1]!, m.positions[i * 3 + 2]!]
      const cx = clip[0]! * x + clip[4]! * y + clip[8]! * z + clip[12]!
      const cy = clip[1]! * x + clip[5]! * y + clip[9]! * z + clip[13]!
      sz[i] = clip[2]! * x + clip[6]! * y + clip[10]! * z + clip[14]!
      sx[i] = (cx + 1) * (w / 2)
      sy[i] = (1 - cy) * (h / 2)
      const [nx, ny, nz] = [m.normals[i * 3]!, m.normals[i * 3 + 1]!, m.normals[i * 3 + 2]!]
      const wx = normal[0]! * nx + normal[3]! * ny + normal[6]! * nz
      const wy = normal[1]! * nx + normal[4]! * ny + normal[7]! * nz
      const wz = normal[2]! * nx + normal[5]! * ny + normal[8]! * nz
      const len = Math.hypot(wx, wy, wz) || 1
      lit[i] = shade(wx / len, wy / len, wz / len)
      // The sphere map the shader looks an environment-mapped part up in.
      eu[i] = (wx / len) * 0.5 + 0.5
      ev[i] = 0.5 - (wy / len) * 0.5
    }
    for (const part of m.parts) {
      const t = part.texture ? textures.get(part.texture) : undefined
      const uvAt = (v: number, i: number) => (part.env ? (i === 0 ? eu[v]! : ev[v]!) : (m.uvs?.[v * 2 + i] ?? 0))
      for (let k = part.start; k < part.start + part.count; k += 3) {
        const a = m.indices[k]!
        const b = m.indices[k + 1]!
        const c = m.indices[k + 2]!
        // Counter-clockwise on screen, with y down, is a negative area: anything else faces away.
        const area = (sx[b]! - sx[a]!) * (sy[c]! - sy[a]!) - (sx[c]! - sx[a]!) * (sy[b]! - sy[a]!)
        if (area >= 0) continue
        const x0 = Math.max(0, Math.floor(Math.min(sx[a]!, sx[b]!, sx[c]!)))
        const x1 = Math.min(w - 1, Math.ceil(Math.max(sx[a]!, sx[b]!, sx[c]!)))
        const y0 = Math.max(0, Math.floor(Math.min(sy[a]!, sy[b]!, sy[c]!)))
        const y1 = Math.min(h - 1, Math.ceil(Math.max(sy[a]!, sy[b]!, sy[c]!)))
        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            const fx = x + 0.5
            const fy = y + 0.5
            const w0 = ((sx[b]! - fx) * (sy[c]! - fy) - (sx[c]! - fx) * (sy[b]! - fy)) / area
            const w1 = ((sx[c]! - fx) * (sy[a]! - fy) - (sx[a]! - fx) * (sy[c]! - fy)) / area
            const w2 = 1 - w0 - w1
            if (w0 < 0 || w1 < 0 || w2 < 0) continue
            const z = w0 * sz[a]! + w1 * sz[b]! + w2 * sz[c]!
            const p = y * w + x
            if (z >= depth[p]!) continue
            const col = (v: number, ch: number) => m.colors[v * 4 + ch]! / 255
            if (t) sample(t, w0 * uvAt(a, 0) + w1 * uvAt(b, 0) + w2 * uvAt(c, 0), w0 * uvAt(a, 1) + w1 * uvAt(b, 1) + w2 * uvAt(c, 1), tex)
            else tex.fill(1)
            const l = part.lit ? w0 * lit[a]! + w1 * lit[b]! + w2 * lit[c]! : 1
            const alpha = (w0 * col(a, 3) + w1 * col(b, 3) + w2 * col(c, 3)) * tex[3]! * itemAlpha
            if (alpha <= 0) continue
            depth[p] = z
            const o = p * 4
            // Over whatever is drawn here already, as the shader's blend does.
            const under = px[o + 3]! / 255
            const outA = alpha + under * (1 - alpha)
            for (let ch = 0; ch < 3; ch++) {
              const src = (w0 * col(a, ch) + w1 * col(b, ch) + w2 * col(c, ch)) * tex[ch]! * l * 255
              px[o + ch] = outA ? (src * alpha + px[o + ch]! * under * (1 - alpha)) / outA : 0
            }
            px[o + 3] = outA * 255
          }
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0)
}
