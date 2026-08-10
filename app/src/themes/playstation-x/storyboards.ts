/**
 * The theme's `<storyboard>` blocks, transcribed.
 *
 * One entry per animated element, keyed by the element's own `name` attribute so a grep for
 * `marco-activo` hits both this file and the XML. Event keys are the source's own; `_` means a
 * `<storyboard>` with no `event=`, which fires when the element appears and then runs on its own
 * clock rather than following the cursor.
 *
 * `<sound>` entries are carried and never played, so this table stays 1:1 with the source.
 *
 * Every block cites `file:line` into `es-theme-PlayStation-X @ 26ce759`. 385 tracks across 211
 * storyboards upstream; this is the set the eleven mocked screens reach.
 */
import type { StoryboardMap } from '../../anim/types'

/**
 * The PS4/PS5 selection frame - the theme's signature motion.
 *
 * A bump on every cursor move, then a forever breathing pulse. Three transform channels run at
 * once on activate, which is why the renderer drives each through its own custom property
 * instead of composing one `transform`.
 *
 * `_theme_options/animated-list.xml:117-143`
 */
const MARCO_ACTIVO: StoryboardMap = {
  /* :118-121 */
  open: {
    animations: [
      { property: 'opacity', from: 0, to: 0, duration: 100, mode: 'linear' },
      { property: 'opacity', begin: 300, from: 0, to: 1.0, duration: 500, mode: 'easeInOut' },
      {
        property: 'opacity',
        from: 1,
        to: 0.3,
        begin: 2000,
        duration: 500,
        mode: 'easeInOut',
        autoreverse: true,
        repeat: 'forever',
      },
    ],
  },
  /* :123-129 - three transform channels at once, plus a finite and an infinite opacity */
  activateNext: {
    animations: [
      { property: 'scale', from: 0.94, to: 1, duration: 300, mode: 'bump' },
      { property: 'offsetX', to: -0.003, duration: 150, mode: 'ease', autoreverse: true },
      { property: 'offsetY', to: -0.008, duration: 150, mode: 'ease', autoreverse: true },
      { property: 'opacity', from: 0, to: 1.0, duration: 500, mode: 'easeInOut' },
      {
        property: 'opacity',
        from: 1,
        to: 0.3,
        begin: 1000,
        duration: 500,
        mode: 'easeInOut',
        autoreverse: true,
        repeat: 'forever',
      },
    ],
  },
  /* :131-137 - identical to activateNext */
  activatePrev: {
    animations: [
      { property: 'scale', from: 0.94, to: 1, duration: 300, mode: 'bump' },
      { property: 'offsetX', to: -0.003, duration: 150, mode: 'ease', autoreverse: true },
      { property: 'offsetY', to: -0.008, duration: 150, mode: 'ease', autoreverse: true },
      { property: 'opacity', from: 0, to: 1.0, duration: 500, mode: 'easeInOut' },
      {
        property: 'opacity',
        from: 1,
        to: 0.3,
        begin: 1000,
        duration: 500,
        mode: 'easeInOut',
        autoreverse: true,
        repeat: 'forever',
      },
    ],
  },
  /* :139-141 */
  deactivateNext: { animations: [{ property: 'opacity', to: 0, duration: 100, mode: 'linear' }] },
  deactivatePrev: { animations: [{ property: 'opacity', to: 0, duration: 100, mode: 'linear' }] },
}

/**
 * Game title on ps4Style and ps5Style. Rises 6% of screen height and fades in on every move.
 * `_theme_options/animated-list.xml:164-183`
 */
const GAMENAME: StoryboardMap = {
  open: {
    animations: [
      { property: 'offsetY', from: 0.06, to: 0, duration: 500, mode: 'easeOut' },
      { property: 'opacity', from: 0, to: 1, duration: 500, mode: 'linear' },
    ],
  },
  activateNext: {
    animations: [
      { property: 'offsetY', from: 0.06, to: 0, duration: 300, mode: 'easeOut' },
      { property: 'opacity', from: 0, to: 1, duration: 300, mode: 'linear' },
    ],
  },
  activatePrev: {
    animations: [
      { property: 'offsetY', from: 0.06, to: 0, duration: 300, mode: 'easeOut' },
      { property: 'opacity', from: 0, to: 1, duration: 300, mode: 'linear' },
    ],
  },
  deactivateNext: { animations: [{ property: 'opacity', to: 0, duration: 100, mode: 'linear' }] },
  deactivatePrev: { animations: [{ property: 'opacity', to: 0, duration: 100, mode: 'linear' }] },
}

/** A 350ms overshoot pop on open and every scroll. `_theme_options/animated-list.xml:185-201` */
const LOGO_POP = {
  animations: [{ property: 'scale', from: 0.9, to: 1.0, duration: 350, mode: 'bump' }],
} as const

const MARQUEE: StoryboardMap = {
  open: LOGO_POP,
  activateNext: LOGO_POP,
  activatePrev: LOGO_POP,
}

/**
 * Detailed view - the vertical card slide. The outgoing panel leaves by 78% of screen height
 * and the incoming one arrives from the opposite 78%.
 * `_theme_options/animated-list.xml:10-33`
 */
const DETAILED_PANEL: StoryboardMap = {
  /* :11-15 - held invisible for 100ms, then slides in from the right after a 300ms hold */
  open: {
    animations: [
      { property: 'opacity', from: 0, to: 0, duration: 100, mode: 'linear' },
      { property: 'offsetX', from: 0.5, to: 0, begin: 300, duration: 300, mode: 'easeOutCubic' },
      { property: 'opacity', from: 0, to: 1, begin: 300, duration: 600, mode: 'easeInOut' },
    ],
  },
  activateNext: {
    animations: [
      { property: 'opacity', to: 0, duration: 1, mode: 'linear' },
      { property: 'offsetY', from: 0.78, to: 0, duration: 550, mode: 'easeOutCubic' },
      { property: 'opacity', from: 0, to: 1, duration: 800, mode: 'easeOut' },
    ],
  },
  activatePrev: {
    animations: [
      { property: 'offsetY', from: -0.78, to: 0, duration: 550, mode: 'easeOutCubic' },
      { property: 'opacity', from: 0, to: 1, duration: 800, mode: 'easeOut' },
    ],
  },
  deactivateNext: {
    animations: [
      { property: 'offsetY', to: -0.78, duration: 500, mode: 'easeOutCubic' },
      { property: 'opacity', to: 0, duration: 400, mode: 'easeOut' },
    ],
  },
  deactivatePrev: {
    animations: [
      { property: 'offsetY', to: 0.78, duration: 500, mode: 'easeOutCubic' },
      { property: 'opacity', to: 0, duration: 400, mode: 'easeOut' },
    ],
  },
}

/**
 * Grid metadata - a small horizontal nudge with a crossfade.
 * `_theme_options/animated-list.xml:62-81`
 *
 * Line 90 of the same file writes `zto="1"` where `to="1"` was meant, so the grid background's
 * activateNext opacity track is a no-op upstream. Reproduced as shipped - see the source notes
 * under "Source quirks".
 */
const GRID_META: StoryboardMap = {
  open: {
    animations: [
      { property: 'offsetY', from: 0.25, to: 0, begin: 50, duration: 500, mode: 'easeOutCubic' },
    ],
  },
  activateNext: {
    animations: [{ property: 'offsetX', from: 0.05, to: 0, duration: 300, mode: 'easeOutCubic' }],
  },
  activatePrev: {
    animations: [{ property: 'offsetX', from: -0.05, to: 0, duration: 300, mode: 'easeOutCubic' }],
  },
  deactivateNext: {
    animations: [
      { property: 'opacity', to: 0, duration: 300, mode: 'easeOut' },
      { property: 'offsetX', to: -0.05, duration: 300, mode: 'easeOutCubic' },
    ],
  },
  deactivatePrev: {
    animations: [
      { property: 'opacity', to: 0, duration: 300, mode: 'easeOut' },
      { property: 'offsetX', to: 0.05, duration: 300, mode: 'easeOutCubic' },
    ],
  },
}

/** The slow Ken Burns drift behind the system view. `_theme_options/animated-systems.xml:13-20` */
const BACKGROUND_SYSTEM: StoryboardMap = {
  _: {
    animations: [
      { property: 'offsetY', to: 0.08, duration: 15000, mode: 'ease', autoreverse: true },
      { property: 'opacity', from: 0.4, to: 1.0, duration: 600, mode: 'easeOut' },
      { property: 'scale', from: 1, to: 1.25, duration: 15000, mode: 'easeOut' },
      { property: 'scale', from: 1.25, to: 1, begin: 16000, duration: 15000, mode: 'ease' },
    ],
  },
}

/** The gamelist equivalent, which follows the cursor. `_theme_options/animated-list.xml:35-55` */
const BACKGROUND_GAMELIST: StoryboardMap = {
  open: {
    animations: [
      { property: 'scale', from: 1, to: 1.3, begin: 0, duration: 30000, mode: 'easeOut' },
    ],
  },
  activateNext: {
    animations: [
      { property: 'offsetY', from: 0.1, to: 0, begin: 0, duration: 400, mode: 'easeOut' },
      { property: 'opacity', from: 0, to: 1, duration: 300, mode: 'easeOut' },
      { property: 'scale', from: 1, to: 1.3, begin: 0, duration: 30000, mode: 'easeOut' },
    ],
  },
  activatePrev: {
    animations: [
      { property: 'offsetY', from: -0.1, to: 0, begin: 0, duration: 400, mode: 'easeOut' },
      { property: 'opacity', from: 0, to: 1, duration: 300, mode: 'easeOut' },
      { property: 'scale', from: 1, to: 1.3, begin: 0, duration: 30000, mode: 'easeOut' },
    ],
  },
  deactivateNext: {
    animations: [{ property: 'opacity', to: 0, begin: 0, duration: 400, mode: 'easeOut' }],
  },
  deactivatePrev: {
    animations: [{ property: 'opacity', to: 0, begin: 0, duration: 400, mode: 'easeOut' }],
  },
}

/* ---- system view entrance set. `_theme_options/animated-systems.xml:33-67` ---- */

const START: StoryboardMap = {
  _: { animations: [{ property: 'opacity', from: 0, to: 1, duration: 500, mode: 'easeIn' }] },
}

const SYSTEM_NAME: StoryboardMap = {
  _: {
    animations: [
      { property: 'offsetY', from: 0.1, duration: 350, mode: 'easeOutCubic' },
      { property: 'opacity', from: 0, duration: 500, mode: 'linear' },
    ],
  },
}

const SYSTEM_DESCRIPTION: StoryboardMap = {
  _: {
    animations: [
      { property: 'opacity', from: 0, to: 0, duration: 1, mode: 'linear' },
      { property: 'opacity', to: 1, begin: 400, duration: 300, mode: 'linear' },
      { property: 'offsetY', from: 0.2, begin: 200, duration: 350, mode: 'easeOut' },
    ],
  },
}

/**
 * The character cutout: a 22.2-second parallax drift, forever.
 * `_theme_options/animated-systems.xml:59-62` and `gamelist-overlay.xml:266-315`
 */
const OVERLAY_ARTS: StoryboardMap = {
  _: {
    animations: [
      { property: 'opacity', from: 0, to: 1, begin: 300, duration: 350, mode: 'linear' },
      {
        property: 'offsetX',
        to: 0.028,
        duration: 22222,
        mode: 'linear',
        autoreverse: true,
        repeat: 'forever',
      },
    ],
  },
  open: {
    animations: [
      { property: 'opacity', to: 1, duration: 500, mode: 'ease' },
      {
        property: 'offsetX',
        to: 0.028,
        duration: 22222,
        mode: 'linear',
        autoreverse: true,
        repeat: 'forever',
      },
    ],
  },
  activateNext: {
    animations: [
      { property: 'opacity', to: 1, duration: 500, mode: 'easeOut' },
      {
        property: 'offsetX',
        begin: 500,
        to: 0.028,
        duration: 22222,
        mode: 'linear',
        autoreverse: true,
        repeat: 'forever',
      },
    ],
  },
  activatePrev: {
    animations: [
      { property: 'opacity', to: 1, duration: 500, mode: 'easeOut' },
      {
        property: 'offsetX',
        begin: 500,
        to: 0.028,
        duration: 22222,
        mode: 'linear',
        autoreverse: true,
        repeat: 'forever',
      },
    ],
  },
  deactivateNext: { animations: [{ property: 'opacity', to: 0, duration: 350, mode: 'linear' }] },
  deactivatePrev: { animations: [{ property: 'opacity', to: 0, duration: 350, mode: 'linear' }] },
}

/** System logo and console render pop. `animated-systems.xml:64-67` */
const SYSTEM_CONSOLE: StoryboardMap = {
  _: { animations: [{ property: 'scale', from: 0.9, to: 1.0, duration: 350, mode: 'bump' }] },
}

/**
 * Carousel tile entry - rises from half a screen below.
 * `_theme_options/systemcarousels/carousel-ps4.xml:53-74` (ps3/ps5 identical at 500ms).
 */
const SYSTEM_CAROUSEL: StoryboardMap = {
  _: { animations: [{ property: 'y', from: 0.5, duration: 500, mode: 'easeOutCubic' }] },
}

/**
 * The top bar's rotating ticker. Two stacked info blocks swap forever on a 5350ms cycle - the
 * most visible ambient motion in the chrome, and a storyboard-level `repeat`, so the compiler's
 * group-repeat rule applies rather than the per-track one.
 * `_theme_views/top-info.xml:115-130`
 */
const SYSTEM_INFO_EX: StoryboardMap = {
  _: {
    repeat: 'forever',
    animations: [
      { property: 'opacity', from: 1, to: 0, begin: 2000, duration: 350, mode: 'easeOut' },
      { property: 'offsetY', to: -0.02, begin: 2000, duration: 350, mode: 'easeOut' },
      { property: 'opacity', from: 0, to: 1, begin: 5000, duration: 350, mode: 'easeIn' },
      { property: 'offsetY', to: 0, begin: 5000, duration: 350, mode: 'easeOut' },
    ],
  },
}

const SYSTEM_INFO_EX2: StoryboardMap = {
  _: {
    repeat: 'forever',
    animations: [
      { property: 'opacity', from: 0, to: 1, begin: 2000, duration: 350, mode: 'easeIn' },
      { property: 'offsetY', from: 0.02, begin: 2000, duration: 350, mode: 'easeOut' },
      { property: 'opacity', from: 1, to: 0, begin: 5000, duration: 350, mode: 'easeOut' },
      { property: 'offsetY', to: 0.02, begin: 5000, duration: 350, mode: 'easeIn' },
    ],
  },
}

/** Frontend logo slide-in. `top-info.xml:66-68` */
const FRONTEND_LOGO: StoryboardMap = {
  _: { animations: [{ property: 'offsetX', from: 0.004, duration: 600, mode: 'easeOutCubic' }] },
}

/** Top-bar cover art. `top-info.xml:253-255` */
const CARATULA_TOP: StoryboardMap = {
  _: {
    animations: [
      { property: 'offsetX', from: -0.1, duration: 600, mode: 'easeOutCubic' },
      { property: 'opacity', to: 1, duration: 350, mode: 'linear' },
    ],
  },
}

/** Achievements icon blinks forever. `top-info.xml:192-193` */
const CHEEVOS_ICON: StoryboardMap = {
  _: {
    animations: [
      {
        property: 'opacity',
        from: 0,
        to: 1,
        duration: 350,
        mode: 'easeInOut',
        autoreverse: true,
        repeat: 'forever',
      },
    ],
  },
}

/**
 * Status badges - the universal pulse, identical in fourteen places:
 * `_theme_views/grid.xml:503,514,526,538,549,560,571,592,616`, `detailed.xml:152`,
 * `gamesplash.xml:313,326,338,358`.
 */
const BADGE: StoryboardMap = {
  _: {
    animations: [
      {
        property: 'opacity',
        from: 1,
        to: 0.6,
        duration: 400,
        mode: 'easeInOut',
        autoreverse: true,
        repeat: 'forever',
      },
    ],
  },
}

/**
 * The single view's "more games" arrow. Fades in, bobs forever, then fades out at 2s - and the
 * bob keeps running invisibly, exactly as upstream.
 * `_theme_views/single.xml:59-62` (the source spells it `autoReverse`, capital R).
 */
const ARROW_RIGHT: StoryboardMap = {
  _: {
    animations: [
      { property: 'opacity', to: 0.8, begin: 300, duration: 500, mode: 'easeInOut' },
      { property: 'opacity', to: 0, begin: 2000, duration: 500, mode: 'easeInOut' },
      {
        property: 'offsetX',
        to: 0.005,
        begin: 500,
        duration: 300,
        mode: 'easeInOut',
        autoreverse: true,
        repeat: 'forever',
      },
    ],
  },
}

/**
 * The box-art launch flourish - the PS4 "zoom into the app" moment.
 * `_theme_options/animated-systems.xml:74-100`
 *
 * Transcribed but never bound upstream in the original mockup, because nothing there navigated
 * from the system view into a gamelist. It is bound here: the port makes A on the system view
 * enter the gamelist, which is the transition this storyboard exists for.
 */
const CARATULA_OVERLAY: StoryboardMap = {
  _: {
    animations: [
      { property: 'opacity', to: 0.4, duration: 400, mode: 'easeIn' },
      { property: 'scale', begin: 200, from: 1, to: 3, duration: 400, mode: 'easeInCubic' },
      { property: 'y', to: 0.1, begin: 200, duration: 400, mode: 'easeInCubic' },
      { property: 'x', to: 0.27, begin: 200, duration: 400, mode: 'easeInCubic' },
      { property: 'opacity', to: 0, begin: 520, duration: 300, mode: 'easeOut' },
    ],
  },
}

/**
 * Gamelist entry, from the nav-sound pack pinned to ps5.
 * `_theme_options/sound-effects/ps5.xml` - the `<sound>` is carried and never played.
 */
const GAMEGRID_ENTER: StoryboardMap = {
  _: {
    sound: '_theme_inc/sound-effects/ps5/enter-gamelist.ogg',
    animations: [
      { property: 'y', from: 0.2, duration: 600, mode: 'easeOutCubic' },
      { property: 'opacity', from: 0, to: 1, duration: 600, mode: 'easeInOut' },
    ],
  },
}

export const STORYBOARDS = {
  'marco-activo': MARCO_ACTIVO,
  gamename: GAMENAME,
  marquee: MARQUEE,
  'detailed-panel': DETAILED_PANEL,
  'grid-meta': GRID_META,
  'background-system': BACKGROUND_SYSTEM,
  'background-gamelist': BACKGROUND_GAMELIST,
  start: START,
  system_name: SYSTEM_NAME,
  system_description: SYSTEM_DESCRIPTION,
  'overlay-arts': OVERLAY_ARTS,
  'system-console': SYSTEM_CONSOLE,
  systemcarousel: SYSTEM_CAROUSEL,
  systemInfoEx: SYSTEM_INFO_EX,
  systemInfoEx2: SYSTEM_INFO_EX2,
  'frontend-logo': FRONTEND_LOGO,
  'caratula-top': CARATULA_TOP,
  'cheevos-icon': CHEEVOS_ICON,
  badge: BADGE,
  'arrow-right': ARROW_RIGHT,
  'caratula-overlay': CARATULA_OVERLAY,
  'gamegrid-enter': GAMEGRID_ENTER,
} as const satisfies Record<string, StoryboardMap>

export type StoryboardName = keyof typeof STORYBOARDS
