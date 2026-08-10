/*
 * storyboards.js - the theme's <storyboard> blocks, transcribed.
 *
 * One entry per animated theme element, keyed by the element's own `name` attribute so a grep
 * for e.g. "marco-activo" hits both this file and the XML. Event keys are the source's own;
 * `_` means a <storyboard> with no event=, which fires when the element appears.
 *
 * Attribute names match the XML exactly: property, from, to, begin, duration, mode,
 * autoreverse, repeat. Omitted `to` means "animate to the element's authored value" and is
 * left undefined here rather than resolved, because the resolved value is per-device px.
 *
 * <sound> entries are carried and never played, so this table stays 1:1 with the source.
 *
 * Every block cites file:line into es-theme-PlayStation-X @ 26ce759.
 */
window.PlayStationX = window.PlayStationX || {};

(function (PSX) {
  'use strict';

  var S = {};

  /* ------------------------------------------------------------------ *
   * marco-activo - the PS4/PS5 selection frame.
   * The signature motion: a bump on every cursor move, then a forever breathing pulse.
   * _theme_options/animated-list.xml:117-143  (ps4Style / ps5Style gamelist)
   * ------------------------------------------------------------------ */
  S['marco-activo'] = {
    /* :118-121 */
    open: {
      animations: [
        { property: 'opacity', from: 0, to: 0, duration: 100, mode: 'linear' },
        { property: 'opacity', begin: 300, from: 0, to: 1.0, duration: 500, mode: 'easeInOut' },
        { property: 'opacity', from: 1, to: 0.3, begin: 2000, duration: 500, mode: 'easeInOut', autoreverse: true, repeat: 'forever' }
      ]
    },
    /* :123-129 - three transform channels at once, plus a finite and an infinite opacity */
    activateNext: {
      animations: [
        { property: 'scale', from: 0.94, to: 1, duration: 300, mode: 'bump' },
        { property: 'offsetX', to: -0.003, duration: 150, mode: 'ease', autoreverse: true },
        { property: 'offsetY', to: -0.008, duration: 150, mode: 'ease', autoreverse: true },
        { property: 'opacity', from: 0, to: 1.0, duration: 500, mode: 'easeInOut' },
        { property: 'opacity', from: 1, to: 0.3, begin: 1000, duration: 500, mode: 'easeInOut', autoreverse: true, repeat: 'forever' }
      ]
    },
    /* :131-137 - identical to activateNext */
    activatePrev: {
      animations: [
        { property: 'scale', from: 0.94, to: 1, duration: 300, mode: 'bump' },
        { property: 'offsetX', to: -0.003, duration: 150, mode: 'ease', autoreverse: true },
        { property: 'offsetY', to: -0.008, duration: 150, mode: 'ease', autoreverse: true },
        { property: 'opacity', from: 0, to: 1.0, duration: 500, mode: 'easeInOut' },
        { property: 'opacity', from: 1, to: 0.3, begin: 1000, duration: 500, mode: 'easeInOut', autoreverse: true, repeat: 'forever' }
      ]
    },
    /* :139-141 */
    deactivateNext: {
      animations: [{ property: 'opacity', to: 0, duration: 100, mode: 'linear' }]
    },
    deactivatePrev: {
      animations: [{ property: 'opacity', to: 0, duration: 100, mode: 'linear' }]
    }
  };

  /* ------------------------------------------------------------------ *
   * Game title (ps4Style + ps5Style). Rises 6% of screen height and fades in on every move.
   * _theme_options/animated-list.xml:164-183
   * ------------------------------------------------------------------ */
  S['gamename'] = {
    open: {
      animations: [
        { property: 'offsetY', from: 0.06, to: 0, duration: 500, mode: 'easeOut' },
        { property: 'opacity', from: 0, to: 1, duration: 500, mode: 'linear' }
      ]
    },
    activateNext: {
      animations: [
        { property: 'offsetY', from: 0.06, to: 0, duration: 300, mode: 'easeOut' },
        { property: 'opacity', from: 0, to: 1, duration: 300, mode: 'linear' }
      ]
    },
    activatePrev: {
      animations: [
        { property: 'offsetY', from: 0.06, to: 0, duration: 300, mode: 'easeOut' },
        { property: 'opacity', from: 0, to: 1, duration: 300, mode: 'linear' }
      ]
    },
    deactivateNext: { animations: [{ property: 'opacity', to: 0, duration: 100, mode: 'linear' }] },
    deactivatePrev: { animations: [{ property: 'opacity', to: 0, duration: 100, mode: 'linear' }] }
  };

  /* ------------------------------------------------------------------ *
   * Marquee / logo - a 350ms overshoot pop on open and every scroll.
   * _theme_options/animated-list.xml:185-201
   * ------------------------------------------------------------------ */
  var LOGO_POP = { animations: [{ property: 'scale', from: 0.9, to: 1.0, duration: 350, mode: 'bump' }] };
  S['marquee'] = {
    open: LOGO_POP,
    activateNext: LOGO_POP,
    activatePrev: LOGO_POP
  };

  /* ------------------------------------------------------------------ *
   * Detailed view - the vertical card slide. Outgoing panel leaves by 78% of screen height,
   * incoming arrives from the opposite 78%.
   * _theme_options/animated-list.xml:10-33
   * ------------------------------------------------------------------ */
  S['detailed-panel'] = {
    /* :11-15 - held invisible for 100ms, then slides in from the right after a 300ms hold */
    open: {
      animations: [
        { property: 'opacity', from: 0, to: 0, duration: 100, mode: 'linear' },
        { property: 'offsetX', from: 0.5, to: 0, begin: 300, duration: 300, mode: 'easeOutCubic' },
        { property: 'opacity', from: 0, to: 1, begin: 300, duration: 600, mode: 'easeInOut' }
      ]
    },
    activateNext: {
      animations: [
        { property: 'opacity', to: 0, duration: 1, mode: 'linear' },
        { property: 'offsetY', from: 0.78, to: 0, duration: 550, mode: 'easeOutCubic' },
        { property: 'opacity', from: 0, to: 1, duration: 800, mode: 'easeOut' }
      ]
    },
    activatePrev: {
      animations: [
        { property: 'offsetY', from: -0.78, to: 0, duration: 550, mode: 'easeOutCubic' },
        { property: 'opacity', from: 0, to: 1, duration: 800, mode: 'easeOut' }
      ]
    },
    deactivateNext: {
      animations: [
        { property: 'offsetY', to: -0.78, duration: 500, mode: 'easeOutCubic' },
        { property: 'opacity', to: 0, duration: 400, mode: 'easeOut' }
      ]
    },
    deactivatePrev: {
      animations: [
        { property: 'offsetY', to: 0.78, duration: 500, mode: 'easeOutCubic' },
        { property: 'opacity', to: 0, duration: 400, mode: 'easeOut' }
      ]
    }
  };

  /* ------------------------------------------------------------------ *
   * Grid metadata - a small horizontal nudge with a crossfade.
   * _theme_options/animated-list.xml:62-81
   * NOTE :90 in the same file has `zto="1"` where `to="1"` was meant, so the grid background's
   * activateNext opacity track is a no-op upstream. Reproduced as shipped - see
   * reference/source-notes.md "Source quirks".
   * ------------------------------------------------------------------ */
  S['grid-meta'] = {
    open: {
      animations: [{ property: 'offsetY', from: 0.25, to: 0, begin: 50, duration: 500, mode: 'easeOutCubic' }]
    },
    activateNext: {
      animations: [{ property: 'offsetX', from: 0.05, to: 0, duration: 300, mode: 'easeOutCubic' }]
    },
    activatePrev: {
      animations: [{ property: 'offsetX', from: -0.05, to: 0, duration: 300, mode: 'easeOutCubic' }]
    },
    deactivateNext: {
      animations: [
        { property: 'opacity', to: 0, duration: 300, mode: 'easeOut' },
        { property: 'offsetX', to: -0.05, duration: 300, mode: 'easeOutCubic' }
      ]
    },
    deactivatePrev: {
      animations: [
        { property: 'opacity', to: 0, duration: 300, mode: 'easeOut' },
        { property: 'offsetX', to: 0.05, duration: 300, mode: 'easeOutCubic' }
      ]
    }
  };

  /* ------------------------------------------------------------------ *
   * Backgrounds - the slow Ken Burns drifts.
   * System view: _theme_options/animated-systems.xml:13-20
   * Gamelist:    _theme_options/animated-list.xml:35-55
   * ------------------------------------------------------------------ */
  S['background-system'] = {
    _: {
      animations: [
        { property: 'offsetY', to: 0.08, duration: 15000, mode: 'ease', autoreverse: true },
        { property: 'opacity', from: 0.4, to: 1.0, duration: 600, mode: 'easeOut' },
        { property: 'scale', from: 1, to: 1.25, duration: 15000, mode: 'easeOut' },
        { property: 'scale', from: 1.25, to: 1, begin: 16000, duration: 15000, mode: 'ease' }
      ]
    }
  };

  S['background-gamelist'] = {
    open: {
      animations: [{ property: 'scale', from: 1, to: 1.3, begin: 0, duration: 30000, mode: 'easeOut' }]
    },
    activateNext: {
      animations: [
        { property: 'offsetY', from: 0.1, to: 0, begin: 0, duration: 400, mode: 'easeOut' },
        { property: 'opacity', from: 0, to: 1, duration: 300, mode: 'easeOut' },
        { property: 'scale', from: 1, to: 1.3, begin: 0, duration: 30000, mode: 'easeOut' }
      ]
    },
    activatePrev: {
      animations: [
        { property: 'offsetY', from: -0.1, to: 0, begin: 0, duration: 400, mode: 'easeOut' },
        { property: 'opacity', from: 0, to: 1, duration: 300, mode: 'easeOut' },
        { property: 'scale', from: 1, to: 1.3, begin: 0, duration: 30000, mode: 'easeOut' }
      ]
    },
    deactivateNext: { animations: [{ property: 'opacity', to: 0, begin: 0, duration: 400, mode: 'easeOut' }] },
    deactivatePrev: { animations: [{ property: 'opacity', to: 0, begin: 0, duration: 400, mode: 'easeOut' }] }
  };

  /* ------------------------------------------------------------------ *
   * System view entrance set. _theme_options/animated-systems.xml:33-67
   * ------------------------------------------------------------------ */
  S['start'] = {
    _: { animations: [{ property: 'opacity', from: 0, to: 1, duration: 500, mode: 'easeIn' }] }
  };

  S['system_name'] = {
    _: {
      animations: [
        { property: 'offsetY', from: 0.1, duration: 350, mode: 'easeOutCubic' },
        { property: 'opacity', from: 0, duration: 500, mode: 'linear' }
      ]
    }
  };

  S['system_description'] = {
    _: {
      animations: [
        { property: 'opacity', from: 0, to: 0, duration: 1, mode: 'linear' },
        { property: 'opacity', to: 1, begin: 400, duration: 300, mode: 'linear' },
        { property: 'offsetY', from: 0.2, begin: 200, duration: 350, mode: 'easeOut' }
      ]
    }
  };

  /* Character cutout: a 22.2-second parallax drift, forever.
   * _theme_options/animated-systems.xml:59-62 and gamelist-overlay.xml:266-315 */
  S['overlay-arts'] = {
    _: {
      animations: [
        { property: 'opacity', from: 0, to: 1, begin: 300, duration: 350, mode: 'linear' },
        { property: 'offsetX', to: 0.028, duration: 22222, mode: 'linear', autoreverse: true, repeat: 'forever' }
      ]
    },
    open: {
      animations: [
        { property: 'opacity', to: 1, duration: 500, mode: 'ease' },
        { property: 'offsetX', to: 0.028, duration: 22222, mode: 'linear', autoreverse: true, repeat: '-1' }
      ]
    },
    activateNext: {
      animations: [
        { property: 'opacity', to: 1, duration: 500, mode: 'easeOut' },
        { property: 'offsetX', begin: 500, to: 0.028, duration: 22222, mode: 'linear', autoreverse: true, repeat: '-1' }
      ]
    },
    activatePrev: {
      animations: [
        { property: 'opacity', to: 1, duration: 500, mode: 'easeOut' },
        { property: 'offsetX', begin: 500, to: 0.028, duration: 22222, mode: 'linear', autoreverse: true, repeat: '-1' }
      ]
    },
    deactivateNext: { animations: [{ property: 'opacity', to: 0, duration: 350, mode: 'linear' }] },
    deactivatePrev: { animations: [{ property: 'opacity', to: 0, duration: 350, mode: 'linear' }] }
  };

  /* System logo / console render pop. animated-systems.xml:64-67 */
  S['system-console'] = {
    _: { animations: [{ property: 'scale', from: 0.9, to: 1.0, duration: 350, mode: 'bump' }] }
  };

  /* Carousel tile entry - rises from half a screen below.
   * _theme_options/systemcarousels/carousel-ps4.xml:53-74 (ps3/ps5 identical at 500ms;
   * ff 300ms, sd 400ms - we pin nav-sound to ps5). */
  S['systemcarousel'] = {
    _: { animations: [{ property: 'y', from: 0.5, duration: 500, mode: 'easeOutCubic' }] }
  };

  /* ------------------------------------------------------------------ *
   * Top bar. Two stacked info blocks swap forever on a 5350ms cycle - the most visible
   * ambient motion in the chrome. Storyboard-level repeat, so compiler rule 4 applies.
   * _theme_views/top-info.xml:115-130
   * ------------------------------------------------------------------ */
  S['systemInfoEx'] = {
    _: {
      repeat: 'forever',
      animations: [
        { property: 'opacity', from: 1, to: 0, begin: 2000, duration: 350, mode: 'easeOut' },
        { property: 'offsetY', to: -0.02, begin: 2000, duration: 350, mode: 'easeOut' },
        { property: 'opacity', from: 0, to: 1, begin: 5000, duration: 350, mode: 'easeIn' },
        { property: 'offsetY', to: 0, begin: 5000, duration: 350, mode: 'easeOut' }
      ]
    }
  };

  S['systemInfoEx2'] = {
    _: {
      repeat: 'forever',
      animations: [
        { property: 'opacity', from: 0, to: 1, begin: 2000, duration: 350, mode: 'easeIn' },
        { property: 'offsetY', from: 0.02, begin: 2000, duration: 350, mode: 'easeOut' },
        { property: 'opacity', from: 1, to: 0, begin: 5000, duration: 350, mode: 'easeOut' },
        { property: 'offsetY', to: 0.02, begin: 5000, duration: 350, mode: 'easeIn' }
      ]
    }
  };

  /* Frontend logo slide-in. top-info.xml:66-68 */
  S['frontend-logo'] = {
    _: { animations: [{ property: 'offsetX', from: 0.004, duration: 600, mode: 'easeOutCubic' }] }
  };

  /* Top-bar cover art. top-info.xml:253-255 */
  S['caratula-top'] = {
    _: {
      animations: [
        { property: 'offsetX', from: -0.1, duration: 600, mode: 'easeOutCubic' },
        { property: 'opacity', to: 1, duration: 350, mode: 'linear' }
      ]
    }
  };

  /* Achievements icon blinks forever. top-info.xml:192-193 */
  S['cheevos-icon'] = {
    _: {
      animations: [
        { property: 'opacity', from: 0, to: 1, duration: 350, mode: 'easeInOut', autoreverse: true, repeat: 'forever' }
      ]
    }
  };

  /* ------------------------------------------------------------------ *
   * Status badges - the universal pulse. Identical in 14 places:
   * _theme_views/grid.xml:503,514,526,538,549,560,571,592,616; detailed.xml:152;
   * gamesplash.xml:313,326,338,358.
   * ------------------------------------------------------------------ */
  S['badge'] = {
    _: {
      animations: [
        { property: 'opacity', from: 1, to: 0.6, duration: 400, mode: 'easeInOut', autoreverse: true, repeat: 'forever' }
      ]
    }
  };

  /* ------------------------------------------------------------------ *
   * Single view - the "more games" arrow. Fades in, bobs forever, then fades out at 2s.
   * The bob keeps running invisibly, exactly as upstream.
   * _theme_views/single.xml:59-62  (note: source spells it autoReverse, capital R)
   * ------------------------------------------------------------------ */
  S['arrow-right'] = {
    _: {
      animations: [
        { property: 'opacity', to: 0.8, begin: 300, duration: 500, mode: 'easeInOut' },
        { property: 'opacity', to: 0, begin: 2000, duration: 500, mode: 'easeInOut' },
        { property: 'offsetX', to: 0.005, begin: 500, duration: 300, mode: 'easeInOut', autoreverse: true, repeat: 'forever' }
      ]
    }
  };

  /* ------------------------------------------------------------------ *
   * Box-art launch flourish - the PS4 "zoom into the app" moment on activate.
   * _theme_options/animated-systems.xml:74-100
   * ------------------------------------------------------------------ */
  S['caratula-overlay'] = {
    _: {
      animations: [
        { property: 'opacity', to: 0.4, duration: 400, mode: 'easeIn' },
        { property: 'scale', begin: 200, from: 1, to: 3, duration: 400, mode: 'easeInCubic' },
        { property: 'y', to: 0.1, begin: 200, duration: 400, mode: 'easeInCubic' },
        { property: 'x', to: 0.27, begin: 200, duration: 400, mode: 'easeInCubic' },
        { property: 'opacity', to: 0, begin: 520, duration: 300, mode: 'easeOut' }
      ]
    }
  };

  /* Gamelist entry, from the nav-sound pack we pin (ps5).
   * _theme_options/sound-effects/ps5.xml - <sound> carried, never played. */
  S['gamegrid-enter'] = {
    _: {
      sound: '_theme_inc/sound-effects/ps5/enter-gamelist.ogg',
      animations: [
        { property: 'y', from: 0.2, duration: 600, mode: 'easeOutCubic' },
        { property: 'opacity', from: 0, to: 1, duration: 600, mode: 'easeInOut' }
      ]
    }
  };

  PSX.STORYBOARDS = S;
})(window.PlayStationX);
