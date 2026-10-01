import { LIGHT, VIEW, matrices, shade, type ModelData, type Transform } from './scene'

/**
 * The scene on the CPU, for fallback mode and a browser without WebGL: the same models, transforms,
 * light and blend as `gl.ts`, rasterised into a 2D canvas's pixels - back faces culled, depth
 * tested, each triangle's colours interpolated across it. It has no antialiasing, which is the
 * one way it differs from the shader.
 */
export function drawSceneCpu(ctx: CanvasRenderingContext2D, models: readonly ModelData[], poses: readonly Transform[]) {
  const { w, h } = VIEW
  const img = ctx.createImageData(w, h)
  const px = img.data
  const depth = new Float32Array(w * h).fill(Infinity)

  models.forEach((m, mi) => {
    const { clip, normal } = matrices(poses[mi]!)
    const n = m.positions.length / 3
    const sx = new Float32Array(n)
    const sy = new Float32Array(n)
    const sz = new Float32Array(n)
    const lit = new Float32Array(n)
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
    }
    for (let t = 0; t < m.indices.length; t += 3) {
      const a = m.indices[t]!
      const b = m.indices[t + 1]!
      const c = m.indices[t + 2]!
      // Counter-clockwise on screen, with y down, is a negative area: anything else faces away.
      const area = (sx[b]! - sx[a]!) * (sy[c]! - sy[a]!) - (sx[c]! - sx[a]!) * (sy[b]! - sy[a]!)
      if (area >= 0) continue
      const x0 = Math.max(0, Math.floor(Math.min(sx[a]!, sx[b]!, sx[c]!)))
      const x1 = Math.min(w - 1, Math.ceil(Math.max(sx[a]!, sx[b]!, sx[c]!)))
      const y0 = Math.max(0, Math.floor(Math.min(sy[a]!, sy[b]!, sy[c]!)))
      const y1 = Math.min(h - 1, Math.ceil(Math.max(sy[a]!, sy[b]!, sy[c]!)))
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const px0 = x + 0.5
          const py0 = y + 0.5
          const w0 = ((sx[b]! - px0) * (sy[c]! - py0) - (sx[c]! - px0) * (sy[b]! - py0)) / area
          const w1 = ((sx[c]! - px0) * (sy[a]! - py0) - (sx[a]! - px0) * (sy[c]! - py0)) / area
          const w2 = 1 - w0 - w1
          if (w0 < 0 || w1 < 0 || w2 < 0) continue
          const z = w0 * sz[a]! + w1 * sz[b]! + w2 * sz[c]!
          const k = y * w + x
          if (z >= depth[k]!) continue
          depth[k] = z
          const at = (v: number, ch: number) => m.colors[v * 4 + ch]!
          const l = w0 * lit[a]! + w1 * lit[b]! + w2 * lit[c]!
          const alpha = ((w0 * at(a, 3) + w1 * at(b, 3) + w2 * at(c, 3)) / 255) * LIGHT.alpha
          const o = k * 4
          // Over whatever is drawn here already, as the shader's blend does.
          const under = px[o + 3]! / 255
          const outA = alpha + under * (1 - alpha)
          for (let ch = 0; ch < 3; ch++) {
            const src = (w0 * at(a, ch) + w1 * at(b, ch) + w2 * at(c, ch)) * l
            px[o + ch] = outA ? (src * alpha + px[o + ch]! * under * (1 - alpha)) / outA : 0
          }
          px[o + 3] = outA * 255
        }
      }
    }
  })
  ctx.putImageData(img, 0, 0)
}
