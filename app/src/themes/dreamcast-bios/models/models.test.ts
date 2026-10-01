import { describe, expect, it } from 'vitest'
import { MAIN_MODELS } from './MenuModels'
import { MOTION_FPS, VIEW, matrices, poseAt, rotation } from './scene'

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
      expect(m.motion.frames, m.name).toBe(60)
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

  it('places a model at its own position on screen', () => {
    const { clip } = matrices({ pos: [VIEW.centre[0] + 10, VIEW.centre[1], 0], ang: [0, 0, 0], scl: [1, 1, 1] })
    // Ten units right of the view's centre is 116 pixels right of the screen's.
    expect(clip[12]! * (VIEW.w / 2)).toBeCloseTo(10 * VIEW.ppu, 5)
    expect(rotation([0, 0, 0])).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1])
  })
})
