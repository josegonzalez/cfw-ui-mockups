/**
 * PlayStation X geometry: normalised spec in, literal device pixels out.
 *
 * `resolve()` is a pure function of `(device, state)`, which is what lets `layout.test.ts`
 * assert it against output captured from the original resolver across 108 combinations rather
 * than against a snapshot of itself.
 *
 * The spec and its provenance live in `spec.ts`; this file is only the machinery that turns it
 * into boxes.
 */
import { getDevice, type DeviceSlug } from '../../device/devices'
import { GEOM_KEYS, SPEC, type Condition } from './spec'

/* eslint-disable @typescript-eslint/no-explicit-any --
 * The resolved tree mirrors the untyped spec; see the note in `spec.ts`. */

export type PsxDevice = 'trimui-smart-pro' | 'rg35xx' | 'rg34xx' | 'rg552'
export type Aspect = '16-9' | '4-3' | '3-2' | '5-3'
export type PsxView =
  | 'system'
  | 'ps4Style'
  | 'ps5Style'
  | 'detailed'
  | 'grid'
  | 'carousel'
  | 'fullGrid'
  | 'single'
  | 'mediaTester'
  | 'splash'
  | 'gamesplash'

export interface PsxDeviceInfo {
  readonly w: number
  readonly h: number
  readonly aspect: Aspect
  /**
   * Batocera's `height <= 480` flag. `theme.xml:340` includes `force-gridview.xml` when it is
   * set, whose whole body is `<theme defaultView="carousel">`.
   */
  readonly tinyScreen: boolean
  readonly defaultView: PsxView
}

/** Each device maps to exactly one of the theme's own aspect subset values, so none is invented. */
export const PSX_DEVICES: Record<PsxDevice, PsxDeviceInfo> = {
  'trimui-smart-pro': { w: 1280, h: 720, aspect: '16-9', tinyScreen: false, defaultView: 'ps4Style' },
  rg35xx: { w: 640, h: 480, aspect: '4-3', tinyScreen: true, defaultView: 'carousel' },
  rg34xx: { w: 720, h: 480, aspect: '3-2', tinyScreen: true, defaultView: 'carousel' },
  rg552: { w: 1920, h: 1152, aspect: '5-3', tinyScreen: false, defaultView: 'ps4Style' },
}

export const PSX_DEVICE_SLUGS = Object.keys(PSX_DEVICES) as PsxDevice[]

/** The live subsets the geometry conditions on. */
export interface PsxState {
  readonly carousel?: 'big' | 'medium' | 'small'
  readonly 'carousel-type'?: 'PS5' | 'PS4' | 'PS3'
  readonly 'top-info'?: 'default' | 'no-numbers' | 'clean'
  /**
   * Which view is showing.
   *
   * The original never put this into the matcher state, so the two `{ view: 'gamelist' }` rows
   * on the help bar were unreachable and its font size was always 0.03. See
   * `docs/porting/playstation-x.md`.
   */
  readonly view?: 'system' | 'gamelist'
}

type MatcherState = Record<string, string>

/** Does a variant row's condition match the current state? */
export function matches(cond: Condition, state: MatcherState): boolean {
  if (!cond) return true
  for (const key of Object.keys(cond)) {
    const want = String(cond[key]).split('|')
    if (!want.includes(String(state[key]))) return false
  }
  return true
}

/**
 * Last match wins.
 *
 * EmulationStation takes the last matching row rather than the most specific one, and the source
 * depends on it: `carousel-sizes/big.xml` writes a bare `<pos>` twice in a row purely so the
 * second overrides the first. A most-specific-wins scheme would silently disagree.
 */
export function pick<T>(variants: unknown, state: MatcherState, fallback?: T): T | undefined {
  if (variants === undefined) return fallback
  if (!Array.isArray(variants)) return variants as T
  let out = fallback
  for (const [cond, value] of variants as ReadonlyArray<readonly [Condition, T]>) {
    if (matches(cond, state)) out = value
  }
  return out
}

function resolveEl(el: Record<string, unknown>, state: MatcherState): Record<string, any> {
  const out: Record<string, any> = {}
  for (const key of Object.keys(el)) out[key] = pick(el[key], state)
  return out
}

function isElementSpec(o: unknown): o is Record<string, unknown> {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false
  return GEOM_KEYS.some((k) => Object.hasOwn(o, k))
}

/**
 * A normalised element to a literal pixel box, honouring `origin`.
 *
 * EmulationStation positions by origin: `pos` is where the origin point lands, so
 * `left = x * W - originX * w`.
 */
export function boxOf(el: Record<string, any>, W: number, H: number): Record<string, any> {
  let pos = el.pos ?? [el.x !== undefined ? el.x : 0, el.y !== undefined ? el.y : 0]
  if (el.x !== undefined) pos = [el.x, pos[1]]
  if (el.y !== undefined) pos = [pos[0], el.y]

  const origin = el.origin ?? [0, 0]
  const box: Record<string, any> = { x: pos[0] * W, y: pos[1] * H }

  if (el.size) {
    box.w = el.size[0] * W
    box.h = el.size[1] * H
  }

  /*
   * `maxSize` is a bounding box the image letterboxes inside, preserving aspect. A single number
   * means both axes. Callers that know the asset's natural aspect refine this with `fitInto`;
   * without it the box is exposed and `object-fit` does the work.
   */
  if (el.maxSize !== undefined) {
    const ms = Array.isArray(el.maxSize) ? el.maxSize : [el.maxSize, el.maxSize]
    box.maxW = ms[0] * W
    box.maxH = ms[1] * H
    if (box.w === undefined) {
      box.w = box.maxW
      box.h = box.maxH
    }
  }

  if (box.w !== undefined) {
    box.left = box.x - origin[0] * box.w
    box.top = box.y - origin[1] * box.h
  } else {
    box.left = box.x
    box.top = box.y
  }

  if (el.fontSize !== undefined) box.font = el.fontSize * H
  if (el.zIndex !== undefined) box.z = el.zIndex
  if (el.origin) box.origin = origin
  return box
}

/** Letterbox a natural w:h into a maxW x maxH box, the way the engine fits an image into maxSize. */
export function fitInto(maxW: number, maxH: number, naturalW: number, naturalH: number) {
  const s = Math.min(maxW / naturalW, maxH / naturalH)
  return { w: naturalW * s, h: naturalH * s }
}

function resolveTree(node: unknown, state: MatcherState, W: number, H: number): any {
  if (isElementSpec(node)) {
    const r = resolveEl(node, state)
    const box = boxOf(r, W, H)

    /* Carry through the non-geometric bits callers need. */
    if (r.visible !== undefined) box.visible = r.visible
    if (r.autoLayout !== undefined) box.autoLayout = r.autoLayout
    if (r.padding !== undefined) box.padding = r.padding
    if (r.margin !== undefined) box.margin = r.margin
    if (r.separator !== undefined) box.separator = r.separator
    if (r.scale !== undefined) box.scaleFactor = r.scale

    /* An explicit `<y>` on top of a `<pos>` - ps4-style.xml:175 does this. */
    if (r.y !== undefined && r.pos !== undefined) {
      box.top = r.y * H
      box.y = r.y * H
    }
    return box
  }

  if (node && typeof node === 'object' && !Array.isArray(node)) {
    const out: Record<string, any> = {}
    for (const k of Object.keys(node)) out[k] = resolveTree((node as any)[k], state, W, H)
    return out
  }
  return node
}

export type PsxLayout = any

/** Every measurement a device needs, in literal pixels. */
export function resolve(device: PsxDevice, state: PsxState = {}): PsxLayout {
  const dev = PSX_DEVICES[device]
  if (!dev) throw new Error(`unknown device: ${device}`)

  const W = dev.w
  const H = dev.h

  /*
   * Booleans are stringified because the source writes them as attribute strings
   * (`tinyScreen="true"`), and the matcher compares strings.
   */
  const st: MatcherState = {
    ...(state as Record<string, string>),
    'aspect-ratio': dev.aspect,
    tinyScreen: String(dev.tinyScreen),
  }

  const out = resolveTree(SPEC, st, W, H)

  out.device = device
  out.w = W
  out.h = H
  out.aspect = dev.aspect
  out.tinyScreen = dev.tinyScreen
  out.defaultView = dev.defaultView
  out.state = st

  /*
   * Grid geometry that only makes sense derived: cell size, and the column the selection sits
   * in. `centerSelection` is set on the strip views (ps4-style.xml:55, carousel.xml:31), so the
   * selected cell is always the middle column and the strip translates behind it.
   */
  function gridMetrics(specNode: any, boxNode: any) {
    const r = resolveEl(specNode, st)
    const cols = r.autoLayout[0]
    const rows = r.autoLayout[1]
    boxNode.cols = cols
    boxNode.rows = rows
    boxNode.cellW = (r.size[0] / cols) * W
    boxNode.cellH = (r.size[1] / rows) * H
    boxNode.padX = (r.padding ? r.padding[0] : 0) * W
    boxNode.padY = (r.padding ? r.padding[1] : 0) * H
    boxNode.marginX = (r.margin ? r.margin[0] : 0) * W
    boxNode.marginY = (r.margin ? r.margin[1] : 0) * H
    boxNode.centerIndex = Math.floor(cols / 2)
    return boxNode
  }

  gridMetrics(SPEC.ps4Style.gamegrid, out.ps4Style.gamegrid)
  gridMetrics(SPEC.grid.gamegrid, out.grid.gamegrid)
  gridMetrics(SPEC.ps5Style.gamegrid, out.ps5Style.gamegrid)
  gridMetrics(SPEC.carousel.gamegrid, out.carousel.gamegrid)
  gridMetrics(SPEC.fullGrid.gamegrid, out.fullGrid.gamegrid)

  /*
   * `marco-activo` letterboxes `marco-activo-iso.png` (410x481) inside its maxSize box. That is
   * what lands it exactly over the centred tile: at 16:9 the fit is height-constrained to about
   * 213px wide, which is the cell width, and its authored x of 0.162 is the centred cell's left
   * edge.
   */
  for (const m of [out.ps4Style.marcoActivo, out.system.marcoActivo]) {
    const fit = fitInto(m.maxW, m.maxH, 410, 481)
    m.w = fit.w
    m.h = fit.h
  }

  /* logoSize is a fraction of screen HEIGHT, and logoScale is the selected item's zoom. */
  const carRaw = resolveEl(SPEC.system.carousel, st)
  out.system.carousel.tile = carRaw.logoSize * H
  out.system.carousel.scale = carRaw.logoScale
  out.system.carousel.maxLogoCount = carRaw.maxLogoCount
  out.system.carousel.minLogoOpacity = carRaw.minLogoOpacity
  out.system.carousel.roundCorners = carRaw.roundCorners

  return out
}

/** The registry slug each PSX device maps to, for the device frame. */
export function deviceSlug(device: PsxDevice): DeviceSlug {
  return device as DeviceSlug
}

/** Panel size straight from the shared registry, so the two cannot disagree. */
export function panelOf(device: PsxDevice) {
  const d = getDevice(device as DeviceSlug)
  return { w: d.w, h: d.h }
}
