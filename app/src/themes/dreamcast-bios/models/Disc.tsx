import { useCallback, useState } from 'react'
import { MUSIC } from '../layout'
import { ModelScene, model } from './MenuModels'
import type { Item, Transform, View } from './scene'

/** The ROM's disc: its label on the front, its data side on the back, its edge and its hub. */
const DISC = model('disc')

/**
 * The disc's motion, read off the recording at 10 frames a second (times into `c69qVhS_WOU`):
 * stopped, it turns about its upright axis, a turn every 3.2 s (261-262.7s); playing, it lies back
 * until it is 0.39 as tall as it is wide - tipped 67 degrees - and turns in its own plane once a
 * second (266-270s); between the two it tips over in about 0.6 s (262.8-263.4s).
 */
export const DISC_MOTION = { upright: 3.2, flat: 1, tilt: -67, tip: 0.6 } as const

/** Where the disc is: its rim 244 pixels across about (320, 240) (`frames/music-disc.png`). */
const VIEW: View = { ppu: MUSIC.disc.d / (2 * 13.6), ox: MUSIC.disc.cx, oy: MUSIC.disc.cy }

const ease = (k: number) => k * k * (3 - 2 * k)

/**
 * The disc's pose `t` seconds after it last changed, or at rest. `tipping` is whether it has just
 * gone from upright to flat or back, and so tips over first.
 */
export function discPose(flat: boolean, spinning: boolean, tipping: boolean, t: number | null): Transform {
  const at = (ang: [number, number, number], zxy: boolean): Transform => ({ pos: [0, 0, 0], ang, scl: [1, 1, 1], zxy })
  const { upright, flat: turn, tilt, tip } = DISC_MOTION
  if (t === null) return flat ? at([tilt, 0, 0], true) : at([0, 0, 0], false)
  if (tipping && t < tip) {
    const k = ease(t / tip)
    return at([tilt * (flat ? k : 1 - k), 0, 0], true)
  }
  const s = tipping ? t - tip : t
  if (flat) return at([tilt, 0, spinning ? (-360 * s) / turn : 0], true)
  return at([0, (360 * s) / upright, 0], false)
}

/** The CD in the drive: upright and turning while stopped, lying back and spinning while it plays. */
export function Disc({ state }: { state: 'stopped' | 'playing' | 'paused' }) {
  const flat = state !== 'stopped'
  // Tipping over plays only when the disc changes, never when it first appears.
  const [shown, setShown] = useState(flat)
  const [tipping, setTipping] = useState(false)
  if (shown !== flat) {
    setShown(flat)
    setTipping(true)
  }
  const spinning = state === 'playing'
  const items = useCallback(
    (t: number | null): Item[] => [{ model: DISC, pose: discPose(flat, spinning, tipping, t), view: VIEW, alpha: 1 }],
    [flat, spinning, tipping],
  )
  return <ModelScene items={items} moving />
}
