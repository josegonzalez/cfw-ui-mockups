import { describe, expect, it } from 'vitest'
import { MAIN_MODELS, model } from './MenuModels'
import { MAIN_VIEW, MOTION_FPS, REFLECTION, SCREEN, fitView, matrices, poseAt, reflected, rotation } from './scene'

describe('Dreamcast BIOS models', () => {
  it('carries the four main-menu models, each a whole mesh', () => {
    expect(MAIN_MODELS.map((m) => m.name)).toEqual(['controller', 'vmu', 'note', 'clock'])
    for (const m of MAIN_MODELS) {
      const n = m.positions.length / 3
      expect(m.normals.length, m.name).toBe(m.positions.length)
      expect(m.colors.length, m.name).toBe(n * 4)
      expect(m.indices.length % 3, m.name).toBe(0)
      expect(Math.max(...m.indices), m.name).toBeLessThan(n)
    }
  })

  it('starts each focus motion at the model at rest, so a still and frame 0 agree', () => {
    for (const m of MAIN_MODELS) {
      expect(m.motion?.frames, m.name).toBe(60)
      const first = poseAt(m, 0)
      for (const k of ['pos', 'ang', 'scl'] as const) {
        first[k].forEach((v, i) => expect(v, `${m.name} ${k}`).toBeCloseTo(m.rest[k][i]!, 3))
      }
      expect(poseAt(m, null)).toBe(m.rest)
    }
  })

  it('loops each motion once a second, as the console plays 60 keys at 60 Hz', () => {
    const [controller] = MAIN_MODELS
    const later = poseAt(controller!, 60 / MOTION_FPS)
    later.ang.forEach((v, i) => expect(v).toBeCloseTo(controller!.rest.ang[i]!, 3))
    // A quarter of the way in, the controller has rocked about Z (the ROM's own keys).
    expect(Math.abs(poseAt(controller!, 0.25).ang[2])).toBeGreaterThan(20)
  })

  it("places a main-menu model at its own position, on the menu's view", () => {
    const { clip } = matrices({ pos: [10, 1, 0], ang: [0, 0, 0], scl: [1, 1, 1] }, MAIN_VIEW)
    // World (10, 1) is ten units right of the view's centre: 116 pixels right of the screen's.
    expect((clip[12]! + 1) * (SCREEN.w / 2)).toBeCloseTo(SCREEN.w / 2 + 10 * MAIN_VIEW.ppu, 3)
    expect((1 - clip[13]!) * (SCREEN.h / 2)).toBeCloseTo(SCREEN.h / 2, 3)
    expect(rotation([0, 0, 0])).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1])
  })

  it("reflects a model in the 3D mode's water: mirrored, squashed and faint", () => {
    const [controller] = MAIN_MODELS
    const item = { model: controller!, pose: controller!.rest, view: MAIN_VIEW, alpha: 1 }
    const r = reflected(item)
    expect(r.view.sy).toBeCloseTo(-REFLECTION.squash, 5)
    expect(r.view.oy).toBeCloseTo(REFLECTION.line - REFLECTION.squash * MAIN_VIEW.oy, 5)
    expect(r.alpha).toBeCloseTo(REFLECTION.alpha, 5)
  })

  it('fits a model the BIOS places in code into its box, centred, keeping its shape', () => {
    const card = model('file-vmu')
    const box = { x: 100, y: 200, w: 80, h: 120 }
    const { view, pose } = fitView(card, box)
    const { clip } = matrices(pose, view)
    const centre = [0, 1].map((i) => (card.bounds.min[i]! + card.bounds.max[i]!) / 2)
    const px = (clip[0]! * centre[0]! + clip[4]! * centre[1]! + clip[12]! + 1) * (SCREEN.w / 2)
    const py = (1 - (clip[1]! * centre[0]! + clip[5]! * centre[1]! + clip[13]!)) * (SCREEN.h / 2)
    expect(px).toBeCloseTo(box.x + box.w / 2, 3)
    expect(py).toBeCloseTo(box.y + box.h / 2, 3)
    const width = (card.bounds.max[0]! - card.bounds.min[0]!) * view.ppu
    const height = (card.bounds.max[1]! - card.bounds.min[1]!) * view.ppu
    expect(Math.max(width / box.w, height / box.h)).toBeCloseTo(1, 5)
  })

  it('draws a node by its own composed matrix exactly as by the angles and scale it comes to', () => {
    const euler = { pos: [1, 2, 3] as const, ang: [10, -20, 30] as const, scl: [2, 0.5, 1.5] as const }
    const r = rotation(euler.ang)
    const s = euler.scl
    const linear = [r[0] * s[0], r[1] * s[0], r[2] * s[0], r[3] * s[1], r[4] * s[1], r[5] * s[1], r[6] * s[2], r[7] * s[2], r[8] * s[2]] as const
    const a = matrices(euler, MAIN_VIEW)
    const b = matrices({ ...euler, linear }, MAIN_VIEW)
    a.clip.forEach((v, i) => expect(b.clip[i]).toBeCloseTo(v, 5))
    // Normals agree up to length, which the renderers normalise.
    const norm = (m: Float32Array) => {
      const cols = [0, 1, 2].map((c) => Math.hypot(m[c * 3]!, m[c * 3 + 1]!, m[c * 3 + 2]!))
      return [...m].map((v, i) => v / cols[Math.floor(i / 3)]!)
    }
    norm(b.normal).forEach((v, i) => expect(v).toBeCloseTo(norm(a.normal)[i]!, 4))
  })

  it("plays a focused button's motion from the ROM: its icon shrinks as its body widens, a cycle a second", () => {
    const [icon, body] = [model('music/button-next-1'), model('music/button-next-2')]
    expect(icon.motion?.frames).toBe(30)
    expect(icon.motion?.fps).toBe(30)
    const width = (m: typeof icon, t: number | null) => Math.hypot(...(poseAt(m, t).linear ?? [1, 0, 0]).slice(0, 3))
    expect(width(icon, 0.5)).toBeLessThan(width(icon, null) * 0.95)
    expect(width(body, 0.5)).toBeGreaterThan(width(body, null) * 1.05)
    expect(width(icon, 1)).toBeCloseTo(width(icon, 0), 3)
  })
})
