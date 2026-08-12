import { CART, LIP_Y, REST_Y, SEATED_Y } from './layout'

/**
 * slot's two motions, and neither one is a timeline.
 *
 * This set is the reason `docs/frameworks.md` gained a physics row. Everything else in this repo
 * animates as a descriptor - `channel, from, to, begin, duration, easing` - and neither of these
 * fits that shape:
 *
 * - The shelf is a **critically damped spring** with no duration at all. Its path depends on the
 *   velocity it already carries, so the same press from a moving row and a still one produces
 *   different motion. There is no `from` and no `to` to write down.
 * - The insert is a **piecewise travel over one progress**: ease, a linear creep, then ease again.
 *   One value drives six things at once, so it is a function rather than six tracks.
 *
 * Both live in the theme rather than in `anim/`, which is the precedent Vitro's backgrounds set:
 * a continuous integrator is not a timeline and pretending otherwise would mean widening the
 * descriptor format until it stopped meaning anything.
 *
 * **Both still settle**, which is what keeps `animate={false}` honest. The spring's resting state
 * is `scroll === target, vel === 0` and is computable without integrating; the travel's is
 * `seat === 0` or `seat === 1`. Neither still requires running a clock.
 */

/* ---- the shelf spring --------------------------------------------------- */

/** Critically damped, "so a flick lands on a cart instead of bouncing past and returning". */
export const OMEGA = 16

export interface Spring {
  readonly scroll: number
  readonly vel: number
}

export const AT_REST = (target: number): Spring => ({ scroll: target, vel: 0 })

/**
 * One step of the integrator, exactly as `shelf.rs` writes it.
 *
 * `dt` is real elapsed seconds rather than a fixed step, because that is what the source uses and
 * because a fixed step would make the motion depend on frame rate.
 */
export function step(s: Spring, target: number, dt: number): Spring {
  const accel = -2 * OMEGA * s.vel - OMEGA * OMEGA * (s.scroll - target)
  const vel = s.vel + accel * dt
  return { scroll: s.scroll + vel * dt, vel }
}

/** Whether the spring has arrived, so a caller can stop stepping and hold the resting value. */
export function settled(s: Spring, target: number): boolean {
  return Math.abs(s.scroll - target) < 0.01 && Math.abs(s.vel) < 0.01
}

/* ---- the cart travel ---------------------------------------------------- */

/**
 * Smootherstep. Zero velocity at both ends, so the two halves of the travel meet the catch
 * without a step in speed.
 */
export function ease(u: number): number {
  return u * u * u * (u * (u * 6 - 15) + 10)
}

/** Where the cart meets the lip, as a fraction of the whole travel. Derived from the geometry. */
export const CATCH_AT = (LIP_Y - CART.h - REST_Y) / (SEATED_Y - REST_Y)
export const CATCH_IN = 0.42
export const CATCH_OUT = 0.62
export const CREEP = 0.03

/**
 * The travel, in three parts: the cart falls to the lip, rests on it, then is pushed through and
 * settles.
 *
 * The source records that a single ease was tried and rejected - it "arrives seated without ever
 * having met anything, which is what makes it read as a card going down a chute". The creep in the
 * middle is the cart sitting on the lip before the mechanism takes it.
 */
export function travel(seat: number): number {
  if (seat < CATCH_IN) return CATCH_AT * ease(seat / CATCH_IN)
  if (seat < CATCH_OUT) return CATCH_AT + (CREEP * (seat - CATCH_IN)) / (CATCH_OUT - CATCH_IN)
  const caught = CATCH_AT + CREEP
  return caught + (1 - caught) * ease((seat - CATCH_OUT) / (1 - CATCH_OUT))
}

/** The cart's y for a given progress: rest at 0, seated in the bay at 1. */
export function cartY(seat: number): number {
  return REST_Y + travel(seat) * (SEATED_Y - REST_Y)
}

/* ---- the durations ------------------------------------------------------ */

/**
 * From `slot/src/app.rs`, with the source's own reasoning kept because every one of these was
 * argued for there.
 */
export const TIMING = {
  /** A floor, not a delay: the animation is where the core load hides. */
  insertS: 0.73,
  /** The tail spent on a cart that has already landed, so the game does not read as a cut. */
  insertHoldS: 0.28,
  /** Where the cart is against the contacts, which is what it clicks on. */
  seatedAt: 0.73 - 0.28,
  /** The eject is the insert backwards, deliberately the same length. */
  ejectS: 0.73 - 0.28,
  ejectHoldS: 0.35,
  powerOnS: 0.22,
  /** Going out is quicker than coming up, the way a panel dies faster than it strikes. */
  powerOffS: 0.16,
  refusalMs: 300,
  hudMs: 1500,
  hudFadeMs: 250,
  undoGraceMs: 30_000,
  playHoldMs: 500,
  repeatDelayMs: 400,
  repeatMs: 110,
} as const

/** The refusal shake, applied by the compositor rather than by moving a draw. */
export const SHAKE = { px: 6, hz: 14 } as const

/** How far through a refused cart's exit the alert holds at full, and where it has finished. */
export const ALERT = { hold: 0.45, gone: 0.9 } as const

export function shakeOffset(elapsedMs: number): number {
  if (elapsedMs >= TIMING.refusalMs) return 0
  const t = elapsedMs / TIMING.refusalMs
  return SHAKE.px * (1 - t) * Math.sin(2 * Math.PI * SHAKE.hz * (elapsedMs / 1000))
}
