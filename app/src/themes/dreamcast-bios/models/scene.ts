/**
 * The main menu's 3D scene: the BIOS's own four models, decoded from the boot ROM by
 * `docs/themes/dreamcast-bios/reference/bios_models.py`, each at its own resting transform and
 * playing its own focus motion. Everything both renderers need is here - the projection, each
 * model's transform at a frame, and the lighting - so the shader and its CPU fallback draw one scene.
 */
export type Vec3 = readonly [number, number, number]

export interface Transform {
  readonly pos: Vec3
  /** Degrees, applied to a vertex about X, then Y, then Z, as Ninja's default order does. */
  readonly ang: Vec3
  readonly scl: Vec3
}

export interface ModelData {
  readonly name: string
  readonly positions: readonly number[]
  readonly normals: readonly number[]
  /** RGBA per vertex, 0-255: the material's diffuse colour and alpha. */
  readonly colors: readonly number[]
  readonly indices: readonly number[]
  readonly rest: Transform
  /** The motion the model plays while focused: one key a frame for its root. */
  readonly motion: {
    readonly frames: number
    readonly pos: readonly Vec3[]
    readonly ang: readonly Vec3[]
    readonly scl: readonly Vec3[]
  }
}

/**
 * World to screen. The menu is drawn with no visible perspective, and an orthographic view at
 * 11.6 pixels a unit, centred on world (0, 1), puts the ROM's own label pills on the capture's
 * (`frames/main.png`). World z only orders depth; nearer is larger.
 */
export const VIEW = { ppu: 11.6, centre: [0, 1] as const, w: 640, h: 480, depth: 50 } as const

/**
 * The light, and how see-through the models are. The capture's models are close to flat-lit and
 * well see-through: solving the controller's red and blue against the sky behind it
 * (`frames/main.png` at 200,180 over 110,180) gives a brightness of about 0.76 and an alpha of about
 * 0.62, where its material says 0.95 - so the menu draws every model at about 0.65 of its own
 * alpha. The light comes from the upper left and front, mostly ambient.
 */
export const LIGHT = { dir: [-0.4, 0.5, 1] as Vec3, ambient: 0.7, alpha: 0.65 } as const

/** Ninja motions are keyed per frame of the console's 60 Hz display. */
export const MOTION_FPS = 60

/** The model's root transform `t` seconds into its focus motion, or at rest. */
export function poseAt(m: ModelData, t: number | null): Transform {
  if (t === null) return m.rest
  const { frames } = m.motion
  const f = (t * MOTION_FPS) % frames
  const i = Math.floor(f)
  const j = (i + 1) % frames
  const u = f - i
  const lerp = (a: Vec3, b: Vec3): Vec3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]
  // Angles cross 360 nowhere in these motions, so a plain lerp between neighbouring keys is enough.
  return { pos: lerp(m.motion.pos[i]!, m.motion.pos[j]!), ang: lerp(m.motion.ang[i]!, m.motion.ang[j]!), scl: lerp(m.motion.scl[i]!, m.motion.scl[j]!) }
}

/** Column-major 3x3. */
export type Mat3 = readonly [number, number, number, number, number, number, number, number, number]

function mul3(a: Mat3, b: Mat3): Mat3 {
  const o = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) o[c * 3 + r]! += a[k * 3 + r]! * b[c * 3 + k]!
  return o as unknown as Mat3
}

/** Rotation applied X, then Y, then Z, with Ninja's sense of each axis. */
export function rotation(ang: Vec3): Mat3 {
  const [x, y, z] = ang.map((d) => (d * Math.PI) / 180) as [number, number, number]
  const rx: Mat3 = [1, 0, 0, 0, Math.cos(x), Math.sin(x), 0, -Math.sin(x), Math.cos(x)]
  const ry: Mat3 = [Math.cos(y), 0, -Math.sin(y), 0, 1, 0, Math.sin(y), 0, Math.cos(y)]
  const rz: Mat3 = [Math.cos(z), Math.sin(z), 0, -Math.sin(z), Math.cos(z), 0, 0, 0, 1]
  return mul3(rz, mul3(ry, rx))
}

/**
 * A transform as the matrix taking a model-space point to screen-space clip coordinates, and the
 * one taking its normals to world space (rotation over scale, renormalised where used).
 */
export function matrices(t: Transform): { clip: Float32Array; normal: Float32Array } {
  const r = rotation(t.ang)
  const s = t.scl
  // model -> world: T * R * S
  const m = [r[0] * s[0], r[1] * s[0], r[2] * s[0], r[3] * s[1], r[4] * s[1], r[5] * s[1], r[6] * s[2], r[7] * s[2], r[8] * s[2]]
  const kx = VIEW.ppu / (VIEW.w / 2)
  const ky = VIEW.ppu / (VIEW.h / 2)
  const kz = -1 / VIEW.depth
  const clip = new Float32Array([
    m[0]! * kx, m[1]! * ky, m[2]! * kz, 0,
    m[3]! * kx, m[4]! * ky, m[5]! * kz, 0,
    m[6]! * kx, m[7]! * ky, m[8]! * kz, 0,
    (t.pos[0] - VIEW.centre[0]) * kx, (t.pos[1] - VIEW.centre[1]) * ky, t.pos[2] * kz, 1,
  ])
  const inv = [1 / s[0], 1 / s[1], 1 / s[2]]
  const normal = new Float32Array([r[0] * inv[0]!, r[1] * inv[0]!, r[2] * inv[0]!, r[3] * inv[1]!, r[4] * inv[1]!, r[5] * inv[1]!, r[6] * inv[2]!, r[7] * inv[2]!, r[8] * inv[2]!])
  return { clip, normal }
}

/** The light's brightness on a unit normal: ambient, plus the rest as diffuse. */
export function shade(nx: number, ny: number, nz: number): number {
  const [lx, ly, lz] = LIGHT.dir
  const ll = Math.hypot(lx, ly, lz)
  const d = Math.max(0, (nx * lx + ny * ly + nz * lz) / ll)
  return Math.min(1, LIGHT.ambient + (1 - LIGHT.ambient) * d)
}
