/**
 * The BIOS's 3D models, decoded from the boot ROM by
 * `docs/themes/dreamcast-bios/reference/bios_models.py`, and how a screen places them. Everything
 * both renderers need is here - the projection, each model's transform at a frame, and the lighting -
 * so the shader and its CPU fallback draw one scene.
 */
export type Vec3 = readonly [number, number, number]

export interface Transform {
  readonly pos: Vec3
  /**
   * Degrees, applied to a vertex about X, then Y, then Z, as Ninja's default order does - or with
   * `zxy`, Ninja's other order, about Z, then X, then Y: what spins a disc in its own plane while it
   * lies tilted.
   */
  readonly ang: Vec3
  readonly scl: Vec3
  readonly zxy?: boolean
  /**
   * The whole of rotation and scale as one column-major 3x3, in place of `ang` and `scl`: what a node
   * of a model tree comes to, its parents' transforms composed into its own.
   */
  readonly linear?: Mat3
}

/** A run of triangles that draw alike. */
export interface Part {
  /** Into `indices`. */
  readonly start: number
  readonly count: number
  /** A texture from `assets/bios/`, by name, or none. */
  readonly texture: string | null
  /** Environment-mapped: the texture is looked up by the surface's facing, not by its UVs. */
  readonly env: boolean
  /** Lit; otherwise drawn at its own colour. */
  readonly lit: boolean
}

export interface ModelData {
  readonly name: string
  readonly positions: readonly number[]
  readonly normals: readonly number[]
  /** RGBA per vertex, 0-255: the material's diffuse colour and alpha. */
  readonly colors: readonly number[]
  readonly indices: readonly number[]
  /** Two per vertex, for a model with a mapped texture. */
  readonly uvs: readonly number[] | null
  readonly parts: readonly Part[]
  /** In the model's own space. */
  readonly bounds: { readonly min: Vec3; readonly max: Vec3 }
  readonly rest: Transform
  /**
   * The motion the model plays while focused, one key a frame: as Euler channels for the main menu's
   * models, or as whole matrices for a node of a tree, which its parents' keys move too.
   */
  readonly motion: {
    readonly frames: number
    /** Keys a second: 60, a key a vsync, unless the motion says otherwise. */
    readonly fps?: number
    readonly pos: readonly Vec3[]
    readonly ang?: readonly Vec3[]
    readonly scl?: readonly Vec3[]
    readonly linear?: readonly Mat3[]
  } | null
}

/**
 * World to screen: a pixel is `(ox + ppu * x, oy - ppu * y)`. The menu is drawn with no visible
 * perspective, so a view is a scale and an origin. World z only orders depth; nearer is larger.
 */
export interface View {
  readonly ppu: number
  readonly ox: number
  readonly oy: number
  /** Scales world y on screen: negative draws the model mirrored, as a reflection. */
  readonly sy?: number
}

/**
 * The hidden 3D mode's water reflects what is above it, upside down, squashed and faint: on screen, a
 * point at y shows again at `492 - 0.32 y` (`frames/music-3d.png`: the buttons at 347 reflect at 382
 * and the disc at 195 at 430; `main-3d.png` agrees), at about 0.3 of its alpha. The scene is drawn
 * before the mode's 0.875 scale (`REAL_MODE_VIEW`), and under it that line is at 577.
 */
export const REFLECTION = { line: 577, squash: 0.32, alpha: 0.3 } as const

/** An item's reflection in the 3D mode's water. */
export function reflected(item: Item): Item {
  const { view } = item
  return {
    ...item,
    view: { ...view, oy: REFLECTION.line - REFLECTION.squash * view.oy, sy: -REFLECTION.squash * (view.sy ?? 1) },
    alpha: item.alpha * REFLECTION.alpha,
  }
}

/** One model drawn: where, at what pose, and how see-through. */
export interface Item {
  readonly model: ModelData
  readonly pose: Transform
  readonly view: View
  /** Multiplies the materials' alpha. */
  readonly alpha: number
  /** Replaces the materials' colour, 0-1, as the BIOS does for a focused button's body. */
  readonly tint?: readonly [number, number, number]
  /** Draws a part with another texture than its own, by name: the repeat button's mode. */
  readonly textures?: Readonly<Record<string, string>>
}

/** The texture a part of an item draws with. */
export const textureOf = (item: Item, texture: string | null) => (texture ? (item.textures?.[texture] ?? texture) : null)

/**
 * The screen every scene is drawn to, and the depth its world z is scaled into. A scene that reflects
 * is drawn taller than the screen, as the 3D mode's scale brings what is below it into view.
 */
export const SCREEN = { w: 640, h: 480, reflecting: 560, depth: 50 } as const

/**
 * The main menu's view: 11.6 pixels a unit, world (0, 1) at the screen's centre, which puts the
 * ROM's own label pills, at their own transforms, on the capture's (`frames/main.png`).
 */
export const MAIN_VIEW: View = { ppu: 11.6, ox: SCREEN.w / 2, oy: SCREEN.h / 2 + 11.6 }

/**
 * A view that fits a model into a box of the screen, centred, for a model the BIOS places in code:
 * the File and Settings models all sit at the origin of their own space. Its rest scale counts.
 */
export function fitView(m: ModelData, box: { x: number; y: number; w: number; h: number }): { view: View; pose: Transform } {
  const s = m.rest.scl
  const size = [0, 1].map((i) => (m.bounds.max[i]! - m.bounds.min[i]!) * s[i]!)
  const ppu = Math.min(box.w / size[0]!, box.h / size[1]!)
  const centre = [0, 1, 2].map((i) => ((m.bounds.max[i]! + m.bounds.min[i]!) / 2) * s[i]!)
  return {
    view: { ppu, ox: box.x + box.w / 2, oy: box.y + box.h / 2 },
    pose: { pos: [-centre[0]!, -centre[1]!, m.rest.pos[2]], ang: m.rest.ang, scl: m.rest.scl },
  }
}

/**
 * The light: from the upper left and front. A face turned to the viewer comes out at about three
 * quarters of its material's colour: solving the main menu's controller's red and blue against the
 * sky behind it (`frames/main.png` at 200,180 over 110,180) gives 0.76, and Music's figures are their
 * material's #b2d8ff at 0.71 (`music-empty.png`). So the light is an ambient floor and a diffuse
 * share that brings a face to the viewer to about 0.75, and a face turned away darker.
 */
export const LIGHT = { dir: [-0.4, 0.5, 1] as Vec3, ambient: 0.45, diffuse: 0.37 } as const

/**
 * How see-through the main menu draws its models: the same solve gives an alpha of about 0.62 where
 * the controller's material says 0.95, so about 0.65 of their own. Elsewhere models are drawn at
 * their materials' alpha: the CD player's disc is solid in the capture (`frames/music-disc.png`).
 */
export const MAIN_ALPHA = 0.65

/** Ninja motions are keyed per frame of the console's 60 Hz display. */
export const MOTION_FPS = 60

/** The model's root transform `t` seconds into its focus motion, or at rest. */
export function poseAt(m: ModelData, t: number | null): Transform {
  if (t === null || !m.motion) return m.rest
  const { frames } = m.motion
  const f = (t * (m.motion.fps ?? MOTION_FPS)) % frames
  const i = Math.floor(f)
  const j = (i + 1) % frames
  const u = f - i
  const lerp = (a: Vec3, b: Vec3): Vec3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]
  // Angles cross 360 nowhere in these motions, so a plain lerp between neighbouring keys is enough.
  const { pos, ang, scl, linear } = m.motion
  if (linear) {
    const a = linear[i]!
    const b = linear[j]!
    return { pos: lerp(pos[i]!, pos[j]!), ang: [0, 0, 0], scl: [1, 1, 1], linear: a.map((v, k) => v + (b[k]! - v) * u) as unknown as Mat3 }
  }
  return { pos: lerp(pos[i]!, pos[j]!), ang: lerp(ang![i]!, ang![j]!), scl: lerp(scl![i]!, scl![j]!) }
}

/** Column-major 3x3. */
export type Mat3 = readonly [number, number, number, number, number, number, number, number, number]

function mul3(a: Mat3, b: Mat3): Mat3 {
  const o = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) o[c * 3 + r]! += a[k * 3 + r]! * b[c * 3 + k]!
  return o as unknown as Mat3
}

/** Rotation applied X, then Y, then Z - or Z, then X, then Y - with Ninja's sense of each axis. */
export function rotation(ang: Vec3, zxy = false): Mat3 {
  const [x, y, z] = ang.map((d) => (d * Math.PI) / 180) as [number, number, number]
  const rx: Mat3 = [1, 0, 0, 0, Math.cos(x), Math.sin(x), 0, -Math.sin(x), Math.cos(x)]
  const ry: Mat3 = [Math.cos(y), 0, -Math.sin(y), 0, 1, 0, Math.sin(y), 0, Math.cos(y)]
  const rz: Mat3 = [Math.cos(z), Math.sin(z), 0, -Math.sin(z), Math.cos(z), 0, 0, 0, 1]
  return zxy ? mul3(ry, mul3(rx, rz)) : mul3(rz, mul3(ry, rx))
}

/**
 * A transform as the matrix taking a model-space point to screen-space clip coordinates, and the
 * one taking its normals to world space (rotation over scale, renormalised where used).
 */
export function matrices(t: Transform, view: View, h: number = SCREEN.h): { clip: Float32Array; normal: Float32Array } {
  const r = rotation(t.ang, t.zxy)
  const s = t.scl
  // model -> world: T * R * S, or the node's own composed matrix
  const m = t.linear ?? [r[0] * s[0], r[1] * s[0], r[2] * s[0], r[3] * s[1], r[4] * s[1], r[5] * s[1], r[6] * s[2], r[7] * s[2], r[8] * s[2]]
  const kx = view.ppu / (SCREEN.w / 2)
  const ky = (view.ppu * (view.sy ?? 1)) / (h / 2)
  const kz = -1 / SCREEN.depth
  // Where world (0, 0) lands, in clip space.
  const x0 = view.ox / (SCREEN.w / 2) - 1
  const y0 = 1 - view.oy / (h / 2)
  const clip = new Float32Array([
    m[0]! * kx, m[1]! * ky, m[2]! * kz, 0,
    m[3]! * kx, m[4]! * ky, m[5]! * kz, 0,
    m[6]! * kx, m[7]! * ky, m[8]! * kz, 0,
    t.pos[0] * kx + x0, t.pos[1] * ky + y0, t.pos[2] * kz, 1,
  ])
  // Normals take the inverse transpose, which for T * R * S is R over S.
  const inv = [1 / s[0], 1 / s[1], 1 / s[2]]
  const normal = t.linear
    ? inverseTranspose(t.linear)
    : new Float32Array([r[0] * inv[0]!, r[1] * inv[0]!, r[2] * inv[0]!, r[3] * inv[1]!, r[4] * inv[1]!, r[5] * inv[1]!, r[6] * inv[2]!, r[7] * inv[2]!, r[8] * inv[2]!])
  return { clip, normal }
}

/** A column-major 3x3's inverse transpose, for its normals; the cofactor matrix over the determinant. */
function inverseTranspose(a: Mat3): Float32Array {
  const [a0, a1, a2, a3, a4, a5, a6, a7, a8] = a
  const c = [a4 * a8 - a5 * a7, a5 * a6 - a3 * a8, a3 * a7 - a4 * a6, a2 * a7 - a1 * a8, a0 * a8 - a2 * a6, a1 * a6 - a0 * a7, a1 * a5 - a2 * a4, a2 * a3 - a0 * a5, a0 * a4 - a1 * a3]
  const det = a0 * c[0]! + a1 * c[1]! + a2 * c[2]! || 1
  return new Float32Array(c.map((v) => v / det))
}

/** The light's brightness on a unit normal: ambient, plus the rest as diffuse. */
export function shade(nx: number, ny: number, nz: number): number {
  const [lx, ly, lz] = LIGHT.dir
  const ll = Math.hypot(lx, ly, lz)
  const d = Math.max(0, (nx * lx + ny * ly + nz * lz) / ll)
  return Math.min(1, LIGHT.ambient + LIGHT.diffuse * d)
}
