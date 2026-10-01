/**
 * The animation vocabulary, shared by every theme.
 *
 * This is a port of the Batocera EmulationStation `<storyboard>` format, which PlayStation X
 * already carried as data. It was promoted to the shared system because it is the only one of
 * the three original themes that had an animation *system* rather than a set of conventions,
 * and because a declarative format is the only kind that survives being re-implemented by a
 * renderer with no CSS.
 *
 *   <animation property="offsetY" from="0.78" to="0" duration="550" mode="easeOutCubic" />
 *
 * becomes
 *
 *   { property: 'offsetY', from: 0.78, to: 0, duration: 550, mode: 'easeOutCubic' }
 */

/**
 * Named easing curves. Every curve any theme uses, with its provenance.
 *
 * The eight from `linear` through `bump` are the source format's own `mode=` vocabulary.
 * `smoothstep` is TortOS's vertical shelf and cube turn: `3u^2 - 2u^3`, which is exactly the cubic
 * bezier `(1/3, 0, 2/3, 1)` rather than an approximation of it.
 *
 * `easeOutQuint` and `easeOutQuad` were added by the other two themes as CSS custom
 * properties; they are the standard bezier approximations of those Penner curves, so they
 * name cleanly rather than needing a theme-specific alias.
 *
 * The eight from `easeOutQuart` on are Flutter's `Curves`, for NeoStation. Flutter's cubic and
 * quartic curves are not the same beziers as the ones above that share a name, so the two that
 * collide carry a `flutter` prefix rather than moving every other set's motion.
 */
export type EasingName =
  | 'linear'
  | 'ease'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'bump'
  | 'easeOutQuint'
  | 'easeOutQuad'
  | 'smoothstep'
  | 'easeOutQuart'
  | 'easeOutExpo'
  | 'easeInQuint'
  | 'easeInOutCubic'
  | 'easeOutBack'
  | 'fastOutSlowIn'
  | 'flutterEaseInCubic'
  | 'flutterEaseOutCubic'

/**
 * What an animation track drives.
 *
 * The four length channels (`offsetX`, `offsetY`, `x`, `y`) are authored as fractions of the
 * screen and resolved against the device size at compile time. `offset*` and the bare axes are
 * separate channels rather than one, because the source runs them concurrently on the same
 * element and they must not collapse into a single value.
 */
export type Channel = 'opacity' | 'offsetX' | 'offsetY' | 'x' | 'y' | 'scale' | 'scaleX' | 'zIndex'

/**
 * The UI events a storyboard can answer.
 *
 * `_` is a storyboard authored with no event at all - 73 of the source theme's 211. It fires
 * when the element appears and runs on its own clock rather than following the cursor. It is
 * part of the type because it is the fallback every lookup falls through to.
 */
export type StoryboardEvent =
  | 'open'
  | 'activateNext'
  | 'activatePrev'
  | 'deactivateNext'
  | 'deactivatePrev'

export type StoryboardEventKey = StoryboardEvent | '_'

/** `'forever'` in authored data; the source also writes `-1`, normalised on the way in. */
export type Repeat = 'forever'

export interface AnimationSpec {
  readonly property: Channel
  /** Omitted means "start from the channel's resting value" - see CHANNELS. */
  readonly from?: number
  /** Omitted means "end at the channel's resting value", which is the element's authored state. */
  readonly to?: number
  /** Milliseconds before this track starts. Defaults to 0. */
  readonly begin?: number
  /** Milliseconds. With `autoreverse`, this counts ONE leg, not the round trip. */
  readonly duration: number
  readonly mode?: EasingName
  /** Play out and back. The track comes to rest at `from`, not `to`. */
  readonly autoreverse?: boolean
  /** Makes this single track loop forever. */
  readonly repeat?: Repeat
}

export interface Storyboard {
  /** Loops the whole group, rather than any single track. */
  readonly repeat?: Repeat
  /**
   * Carried from the source for fidelity, and not played: the files it names are not in the repo.
   * A theme that does play sound derives it from its own state and plays it through
   * `audio/SoundProvider`, not from here.
   */
  readonly sound?: string
  readonly animations: readonly AnimationSpec[]
}

export type StoryboardMap = Partial<Record<StoryboardEventKey, Storyboard>>

/** Device pixel dimensions, used to resolve fractional length channels. */
export interface DeviceContext {
  readonly w: number
  readonly h: number
}

/* ---- the compiled, renderer-neutral timeline ---- */

/**
 * One keyframe. `value` is already resolved: device pixels for length channels, and a plain
 * number for `opacity`, `scale` and `zIndex`. Resolution happens here rather than in the
 * adapter because it is device geometry, which every renderer needs, rather than a property of
 * the output format.
 */
export interface CompiledKeyframe {
  readonly offset: number
  readonly value: number
  readonly easing: EasingName
}

export interface CompiledTiming {
  readonly duration: number
  readonly delay: number
  /** `Infinity` for a looping track. */
  readonly iterations: number
  readonly direction: 'normal' | 'alternate'
  readonly easing: EasingName
  readonly fill: 'none' | 'forwards' | 'backwards' | 'both'
}

/**
 * One compiled track: a channel, its keyframes and its timing. This is the handoff point.
 * A renderer consumes `CompiledTrack[]` and needs to know nothing about the authored format.
 */
export interface CompiledTrack {
  readonly channel: Channel
  readonly keyframes: readonly CompiledKeyframe[]
  readonly timing: CompiledTiming
}

/* ---- discrete transitions ---- */

/**
 * Properties a theme transitions directly, rather than through a storyboard. Enumerated rather
 * than left as an open string so the set stays translatable.
 *
 * `filter`, `backgroundColor`, `color` and `borderColor` have no storyboard channel because
 * the source themes only ever transition them, never keyframe them.
 */
export type TransitionProperty =
  | 'opacity'
  | 'transform'
  | 'width'
  | 'height'
  | 'borderRadius'
  | 'filter'
  | 'backgroundColor'
  | 'color'
  | 'borderColor'

/**
 * A CSS-style transition expressed as data, so the two themes that animate with transitions
 * declare their motion the same way the third does.
 */
export interface TransitionSpec {
  readonly property: TransitionProperty
  readonly duration: number
  readonly easing: EasingName
  readonly delay?: number
}
