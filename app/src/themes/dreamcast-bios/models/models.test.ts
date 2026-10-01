import { describe, expect, it } from 'vitest'
import { MAIN_MODELS, model } from './MenuModels'
import { MAIN_VIEW, MOTION_FPS, SCREEN, fitView, matrices, poseAt, rotation } from './scene'

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
})
