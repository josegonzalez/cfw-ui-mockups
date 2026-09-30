/**
 * The BIOS's live sky: a gradient from pale cyan to deep blue, soft clouds drifting across the top,
 * and low down a bright band of cloud turning slowly about a point below the middle - the "water"
 * the recording's menus float over (`frames/main.png`, `music-empty.png`).
 *
 * The BIOS draws it in 3D from its own geometry; this is a flat, procedural reading of what that
 * produces, the same function written twice - once in GLSL for the shader, once in TypeScript for
 * the canvas fallback - so the two paths agree about the picture and differ only in resolution.
 * Every input is the clock, and a still is drawn at t = 0.
 */
export type Rgb = readonly [number, number, number]

export const SKY = {
  top: [0xbc / 255, 0xdb / 255, 0xe8 / 255] as Rgb,
  mid: [0x87 / 255, 0xa6 / 255, 0xd6 / 255] as Rgb,
  low: [0x50 / 255, 0x70 / 255, 0xc9 / 255] as Rgb,
  cloud: [0xe6 / 255, 0xef / 255, 0xf8 / 255] as Rgb,
  band: [0xc4 / 255, 0xd6 / 255, 0xf4 / 255] as Rgb,
  /** The band's centre, as a fraction of the frame, and how much flatter it is than it is wide. */
  centre: [0.5, 0.71] as const,
  squash: 5,
  /** Drift, seconds to fractions of the frame; and the band's turn, radians a second. */
  drift: 0.006,
  turn: 0.12,
} as const

const fract = (v: number) => v - Math.floor(v)
const hash = (x: number, y: number) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453)
const smooth = (t: number) => t * t * (3 - 2 * t)
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

function noise(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = smooth(x - ix)
  const fy = smooth(y - iy)
  return mix(mix(hash(ix, iy), hash(ix + 1, iy), fx), mix(hash(ix, iy + 1), hash(ix + 1, iy + 1), fx), fy)
}

function fbm(x: number, y: number): number {
  let v = 0
  let a = 0.5
  for (let i = 0; i < 4; i++) {
    v += a * noise(x, y)
    x *= 2.03
    y *= 2.03
    a *= 0.5
  }
  return v
}

/** The sky's colour at `(u, v)` - fractions of the frame, v down - at `t` seconds. */
export function skyAt(u: number, v: number, t: number): [number, number, number] {
  const lo = smoothstep(0.45, 1, v)
  const hi = smoothstep(0, 0.5, v)
  const col = [0, 1, 2].map((i) => mix(mix(SKY.top[i]!, SKY.mid[i]!, hi), SKY.low[i]!, lo)) as [number, number, number]

  const cloud = smoothstep(0.4, 0.75, fbm(u * 1.8 + t * SKY.drift * 10, v * 2.4)) * 0.6 * Math.max(0, 1.2 - v)
  for (let i = 0; i < 3; i++) col[i] = mix(col[i]!, SKY.cloud[i]!, cloud)

  const dx = u - SKY.centre[0]
  const dy = (v - SKY.centre[1]) * SKY.squash
  const r = Math.hypot(dx, dy)
  const a = Math.atan2(dy, dx)
  const swirl = fbm(a * 1.2 + r * 2.5 - t * SKY.turn, r * 3)
  const band = smoothstep(0.46, 0.3, r) * (0.35 + 0.6 * smoothstep(0.3, 0.7, swirl))
  for (let i = 0; i < 3; i++) col[i] = mix(col[i]!, SKY.band[i]!, band)
  return col
}

const glVec = (c: Rgb) => `vec3(${c.map((x) => x.toFixed(4)).join(',')})`

/** `skyAt` in GLSL. Kept line for line with the TypeScript above. */
export const FRAG = `
precision highp float;
uniform vec2 res;
uniform float t;
float hash(float x, float y) { return fract(sin(x * 127.1 + y * 311.7) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i.x, i.y), hash(i.x + 1.0, i.y), f.x), mix(hash(i.x, i.y + 1.0), hash(i.x + 1.0, i.y + 1.0), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / res;
  float u = uv.x;
  float v = 1.0 - uv.y;
  vec3 col = mix(mix(${glVec(SKY.top)}, ${glVec(SKY.mid)}, smoothstep(0.0, 0.5, v)), ${glVec(SKY.low)}, smoothstep(0.45, 1.0, v));
  float cloud = smoothstep(0.4, 0.75, fbm(vec2(u * 1.8 + t * ${(SKY.drift * 10).toFixed(4)}, v * 2.4))) * 0.6 * max(0.0, 1.2 - v);
  col = mix(col, ${glVec(SKY.cloud)}, cloud);
  float dx = u - ${SKY.centre[0].toFixed(3)};
  float dy = (v - ${SKY.centre[1].toFixed(3)}) * ${SKY.squash.toFixed(3)};
  float r = length(vec2(dx, dy));
  float a = atan(dy, dx);
  float swirl = fbm(vec2(a * 1.2 + r * 2.5 - t * ${SKY.turn.toFixed(4)}, r * 3.0));
  float band = smoothstep(0.46, 0.3, r) * (0.35 + 0.6 * smoothstep(0.3, 0.7, swirl));
  col = mix(col, ${glVec(SKY.band)}, band);
  gl_FragColor = vec4(col, 1.0);
}
`

export const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'
