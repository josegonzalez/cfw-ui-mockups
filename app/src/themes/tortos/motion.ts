import { evaluateEasing } from '../../anim/easings'
import type { EasingName } from '../../anim/types'
import { CF_LABEL_EDGE, CF_WARM_CARDS } from './spec'
import { mixHex, split } from './palette'
import type { Direction } from './library'

/**
 * TortOS's shelf motion, as pure functions of time.
 *
 * None of it is a timeline in the descriptor sense. A coverflow move is a tween, but one that is
 * retargeted by every press and restarts from wherever the cards are *drawn* at that moment
 * (`cf_set_cursor_dir`, `src/coverflow.c:234`), so there is no `from` known ahead of time; and the
 * background tint is an exponential chase with no duration at all. Both follow the precedent slot
 * set for its shelf spring: the integrator lives in the theme, and what keeps `animate={false}`
 * honest is that each one's resting value is known without running a clock - the cursor, and the
 * focused system's accent.
 *
 * The curves themselves are looked up by name in the shared registry, so the shelf and a
 * descriptor that named the same curve would agree.
 */

/** How a shelf moves, per UI Direction (`shelf_pacing`, `src/main.c:2432`). */
export interface Pacing {
  readonly ms: number
  readonly easing: EasingName
  /** Never let the drawn position fall more than one step behind the target. */
  readonly chase: boolean
  /** How far a long move travels before it cuts to its destination; 0 never cuts. */
  readonly glide: number
}

export function pacingFor(dir: Direction): Pacing {
  if (dir === 'cubic') return { ms: 450, easing: 'smoothstep', chase: true, glide: 0 }
  if (dir === 'vertical') return { ms: 360, easing: 'smoothstep', chase: false, glide: 2 }
  return { ms: 240, easing: 'easeOutCubic', chase: false, glide: CF_WARM_CARDS }
}

/** One shelf's motion: where it set off from, where it is going, and when. */
export interface Tween {
  readonly from: number
  readonly target: number
  readonly t0: number
  /** Set when the move is a departure that cuts: where the departure stops. */
  readonly cutTo: number | null
  readonly pacing: Pacing
}

export const atRest = (pos: number, pacing: Pacing): Tween => ({
  from: pos,
  target: pos,
  t0: Number.NEGATIVE_INFINITY,
  cutTo: null,
  pacing,
})

/**
 * The shortest way round a ring from `from` to `to` (`src/coverflow.c:239-253`). A ring of two
 * has both neighbours one step away, so the press's own direction breaks the tie.
 */
export function ringDelta(from: number, to: number, count: number, dir = 0): number {
  if (count < 2) return 0
  let raw = to - from
  while (raw > count / 2) raw -= count
  while (raw < -count / 2) raw += count
  if (count === 2 && dir) raw = dir
  return raw
}

/** Where a tween is drawn at `now` (`step_anim`, `src/coverflow.c:417`). */
export function positionAt(tw: Tween, now: number): number {
  const u = (now - tw.t0) / tw.pacing.ms
  if (u >= 1 || !Number.isFinite(u)) return tw.target
  if (u <= 0) return tw.from
  if (tw.cutTo !== null) return tw.from + (tw.cutTo - tw.from) * evaluateEasing('easeInCubic', u)
  return tw.from + (tw.target - tw.from) * evaluateEasing(tw.pacing.easing, u)
}

export const active = (tw: Tween, now: number) => now - tw.t0 < tw.pacing.ms

/**
 * Retarget a shelf by `delta` cards at `now`, from wherever it is drawn.
 *
 * The three rules the source settled on, kept together because each exists to stop one of the
 * others misbehaving: a move restarts from the drawn position, so a held direction is one glide
 * rather than a stutter; a chase shelf is never more than a step behind, so a fast thumb cannot
 * queue up seconds of turning; and a move past the warm window is a departure that cuts at full
 * speed rather than a flight past cards that have no art yet.
 */
export function retarget(tw: Tween, delta: number, now: number, pacing: Pacing): Tween {
  // A press arriving while a cut is still in flight lands the cut first.
  let pos = tw.cutTo !== null && active(tw, now) ? tw.target : positionAt(tw, now)
  const target = tw.target + delta
  if (pacing.chase) {
    if (target - pos > 1) pos = target - 1
    if (target - pos < -1) pos = target + 1
  }
  const span = target - pos
  const g = Math.min(pacing.glide, CF_WARM_CARDS)
  const cuts = !pacing.chase && g > 0 && Math.abs(span) > CF_WARM_CARDS
  return { from: pos, target, t0: now, cutTo: cuts ? pos + Math.sign(span) * g : null, pacing }
}

/**
 * The vertical systems row's name: which card it names and how visible it is
 * (`cf_label`, `src/coverflow.c:329`). Read off the linear clock rather than the eased position,
 * so the fade is even whatever curve the cards ride; the name swaps at the halfway mark, where it
 * is invisible.
 */
export function labelAt(tw: Tween, now: number): { at: number; alpha: number } {
  if (!active(tw, now)) return { at: tw.target, alpha: 1 }
  const u = Math.min(1, Math.max(0, (now - tw.t0) / tw.pacing.ms))
  const at = u < 0.5 ? tw.from : tw.target
  if (u <= CF_LABEL_EDGE) return { at, alpha: 1 - u / CF_LABEL_EDGE }
  if (u >= 1 - CF_LABEL_EDGE) return { at, alpha: (u - (1 - CF_LABEL_EDGE)) / CF_LABEL_EDGE }
  return { at, alpha: 0 }
}

/** An index into a ring, from a position that runs past its ends. */
export const wrapIndex = (pos: number, count: number) =>
  count > 0 ? ((Math.floor(pos + 0.5) % count) + count) % count : 0

/* ---- the background tint ------------------------------------------------- */

/**
 * One step of the tint's chase toward `target` (`tick_tint`, `src/main.c:3154`): `1 - e^(-9dt)`
 * of the gap, with dt capped at 0.1s, and landing outright once every channel is within 12.
 */
export function tintStep(tint: number, target: number, dtS: number): number {
  const dt = Math.min(dtS, 0.1)
  const next = mixHex(tint, target, 1 - Math.exp(-dt * 9))
  const [nr, ng, nb] = split(next)
  const [tr, tg, tb] = split(target)
  return Math.abs(nr - tr) <= 12 && Math.abs(ng - tg) <= 12 && Math.abs(nb - tb) <= 12 ? target : next
}

/* ---- the menu plate ------------------------------------------------------ */

/**
 * The plate's two chained exponential decays (`src/main.c:3780-3861`), advanced by `dt` ms toward
 * `goal`. `mid` is the first stage, `at` the second, which is what gives an S rather than a lurch.
 */
export function chase(at: number, mid: number, goal: number, dtMs: number, tau: number): [number, number] {
  const k = 1 - Math.exp(-Math.min(dtMs, 100) / tau)
  const m = mid + (goal - mid) * k
  return [at + (m - at) * k, m]
}
