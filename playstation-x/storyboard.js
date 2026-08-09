/*
 * storyboard.js - a port of the Batocera-ES <storyboard> animation format.
 *
 * The theme declares 385 <animation> tags in 211 <storyboard> blocks. Rather than
 * hand-translate each into CSS, this file carries them as data in the source's own
 * vocabulary and compiles them to Web Animations at runtime. Full format spec and the
 * counts behind every table below: reference/source-notes.md.
 *
 *   <animation property="offsetY" from="0.78" to="0" duration="550" mode="easeOutCubic" />
 *
 * property   opacity | offsetX | offsetY | x | y | scale | zIndex
 * mode       linear | ease | easeIn | easeOut | easeInOut | easeInCubic | easeOutCubic | bump
 * event      open | activateNext | activatePrev | deactivateNext | deactivatePrev
 * begin/duration  milliseconds
 * offsetX/offsetY/x/y  fractions of screen width/height, resolved to px via the device
 * autoreverse  yo-yo; duration is per leg
 * repeat       on an <animation>, that track is infinite; on the <storyboard>, the group loops
 *
 * The runtime NEVER writes `transform`. Up to three transform channels animate at once
 * (animated-list.xml:124-126 runs scale + offsetX + offsetY together), so each channel drives
 * its own registered custom property and CSS recomposes them - see .px-anim in
 * playstation-x.css. That sidesteps WAAPI composite:'add' entirely.
 *
 * PSX.SB.play(el, event, ctx)   run the storyboard
 * PSX.SB.settle(el, event, ctx) write resting values, create zero Animations
 * PSX.SB.settleAll(root)        freeze everything under root
 * PSX.SB.cancelAll(root)        drop every Animation under root
 */
window.PlayStationX = window.PlayStationX || {};

(function (PSX) {
  'use strict';

  /* Easing. Seven map to standard curves; `bump` is an inference - all 13 uses are
   * scale 0.9|0.94 -> 1.0 and it never appears on opacity, so it reads as an overshoot pop.
   * source-notes.md "Easing map". */
  var EASING = {
    linear: 'linear',
    ease: 'cubic-bezier(0.25,0.1,0.25,1)',
    easeIn: 'cubic-bezier(0.42,0,1,1)',
    easeOut: 'cubic-bezier(0,0,0.58,1)',
    easeInOut: 'cubic-bezier(0.42,0,0.58,1)',
    easeInCubic: 'cubic-bezier(0.32,0,0.67,0)',
    easeOutCubic: 'cubic-bezier(0.33,1,0.68,1)',
    bump: 'cubic-bezier(0.34,1.56,0.64,1)'
  };

  /* Which CSS property each source property drives, and how a normalized number becomes a
   * CSS value. `unit` picks the screen axis: offsetX/x scale by W, offsetY/y by H. */
  var CHANNEL = {
    opacity: { css: 'opacity', axis: null, rest: 1 },
    offsetX: { css: '--px-ox', axis: 'w', rest: 0 },
    offsetY: { css: '--px-oy', axis: 'h', rest: 0 },
    x: { css: '--px-x', axis: 'w', rest: 0 },
    y: { css: '--px-y', axis: 'h', rest: 0 },
    scale: { css: '--px-sc', axis: null, rest: 1 },
    zIndex: { css: 'z-index', axis: null, rest: 0 }
  };

  function isLength(prop) {
    return CHANNEL[prop] && CHANNEL[prop].axis !== null;
  }

  /* Normalized -> CSS value string. Lengths become px against the device size. */
  function toCss(prop, n, ctx) {
    var ch = CHANNEL[prop];
    if (!ch) return String(n);
    if (ch.axis === 'w') return (n * ctx.w).toFixed(3) + 'px';
    if (ch.axis === 'h') return (n * ctx.h).toFixed(3) + 'px';
    if (prop === 'zIndex') return String(Math.round(n));
    return String(n);
  }

  /*
   * An <animation> with `from` but no `to` animates from that value to the element's
   * AUTHORED value - the value it already has. That is why end values cannot be baked into a
   * stylesheet, and why `rest` below is per-property rather than per-element: every animated
   * element sits at the channel's identity when at rest, because the authored position is
   * expressed as left/top, not as a transform.
   */
  function endValue(a) {
    return a.to !== undefined ? a.to : CHANNEL[a.property].rest;
  }
  function startValue(a) {
    return a.from !== undefined ? a.from : CHANNEL[a.property].rest;
  }

  /* Split a storyboard's animations by property, preserving source order. */
  function byProperty(anims) {
    var groups = {};
    var order = [];
    anims.forEach(function (a) {
      if (!CHANNEL[a.property]) return;
      if (!groups[a.property]) {
        groups[a.property] = [];
        order.push(a.property);
      }
      groups[a.property].push(a);
    });
    return { groups: groups, order: order };
  }

  /*
   * Expand one animation into timeline segments.
   *
   * autoreverse means the track plays out and back, with `duration` counting ONE leg. A lone
   * autoreverse track is expressed exactly by WAAPI (iterations 2, direction alternate) and
   * takes that path below; this expansion is the fallback for an autoreverse animation that
   * shares its property with another, where a single merged track has to carry the return leg
   * in its own keyframes. No such case exists in the theme today (all 8 finite autoreverse
   * tracks are alone on their property, checked mechanically), but expanding rather than
   * dropping means a future one cannot silently lose its return leg.
   */
  function segmentsOf(a) {
    var begin = a.begin || 0;
    var dur = a.duration || 0;
    var from = startValue(a);
    var to = endValue(a);
    if (!a.autoreverse) {
      return [{ begin: begin, dur: dur, from: from, to: to, mode: a.mode }];
    }
    return [
      { begin: begin, dur: dur, from: from, to: to, mode: a.mode },
      { begin: begin + dur, dur: dur, from: to, to: from, mode: a.mode }
    ];
  }

  /*
   * Build the keyframe list for a set of FINITE animations on one property.
   * Walks the timeline inserting explicit holds so a track that starts at begin=300 keeps its
   * authored value until then rather than interpolating from t=0.
   */
  function finiteKeyframes(anims, prop, ctx) {
    var segs = [];
    anims.forEach(function (a) {
      segs = segs.concat(segmentsOf(a));
    });

    var total = 0;
    segs.forEach(function (s) {
      total = Math.max(total, s.begin + s.dur);
    });
    if (total <= 0) total = 1;

    var frames = [];
    var cursor = 0;
    var value = segs.length ? segs[0].from : CHANNEL[prop].rest;

    segs.forEach(function (s) {
      var begin = s.begin;
      var dur = s.dur;
      var from = s.from;
      var to = s.to;

      if (begin > cursor) {
        /* hold the previous value until this track starts */
        frames.push({ offset: cursor / total, v: value, ease: 'linear' });
        frames.push({ offset: begin / total, v: value, ease: 'linear' });
        cursor = begin;
      }
      frames.push({ offset: begin / total, v: from, ease: EASING[s.mode] || 'linear' });
      cursor = Math.max(cursor, begin + dur);
      frames.push({ offset: Math.min(cursor / total, 1), v: to, ease: 'linear' });
      value = to;
    });

    if (cursor < total) {
      frames.push({ offset: 1, v: value, ease: 'linear' });
    }

    /* Dedupe identical consecutive offsets, keeping the last write at each. */
    var out = [];
    frames.forEach(function (f) {
      var prev = out[out.length - 1];
      if (prev && Math.abs(prev.offset - f.offset) < 1e-6) out.pop();
      out.push(f);
    });

    return {
      total: total,
      keyframes: out.map(function (f) {
        var kf = { offset: Math.max(0, Math.min(1, f.offset)), easing: f.ease };
        kf[CHANNEL[prop].css] = toCss(prop, f.v, ctx);
        return kf;
      })
    };
  }

  /*
   * Storyboard-level repeat: the whole GROUP loops. Merge every animation of one property
   * into a single looping track whose length is max(begin+duration), with each segment placed
   * at its own begin offset. top-info.xml:116 is the model - two blocks swapping on a 5350ms
   * cycle. 16 blocks in the theme use this, all in top-info{,-clean}.xml.
   */
  function groupLoopEffect(anims, prop, ctx) {
    var built = finiteKeyframes(anims, prop, ctx);
    return {
      keyframes: built.keyframes,
      timing: { duration: built.total, iterations: Infinity, easing: 'linear', fill: 'both' }
    };
  }

  /*
   * Compile one storyboard for one element into a list of {keyframes, timing} effects.
   *
   * Per (element, property):
   *   1. partition into finite list + at most one infinite tail
   *   2. finite  -> ONE effect, fill forwards
   *   3. infinite -> its own effect, delay=begin, iterations=Infinity
   *   4. group repeat -> one merged looping track (handled above)
   *
   * Verified mechanically that no property ever carries two infinite tracks, so 1-3 are
   * total - see reference/source-notes.md "Compiler rules".
   */
  function compile(sb, ctx) {
    var split = byProperty(sb.animations || []);
    var effects = [];

    split.order.forEach(function (prop) {
      var anims = split.groups[prop];

      if (sb.repeat) {
        effects.push(groupLoopEffect(anims, prop, ctx));
        return;
      }

      var finite = anims.filter(function (a) { return !a.repeat; });
      var infinite = anims.filter(function (a) { return a.repeat; })[0];

      if (finite.length === 1 && finite[0].autoreverse) {
        /*
         * A lone autoreverse track is exactly WAAPI's alternate: two iterations of one leg.
         * This is the faithful path and covers every autoreverse case in the theme - the
         * 150ms jolt on marco-activo (animated-list.xml:125-126) is the one that matters,
         * since without the return leg the frame stays permanently displaced.
         */
        var a0 = finite[0];
        var kf0 = [{}, {}];
        kf0[0][CHANNEL[prop].css] = toCss(prop, startValue(a0), ctx);
        kf0[1][CHANNEL[prop].css] = toCss(prop, endValue(a0), ctx);
        effects.push({
          keyframes: kf0,
          timing: {
            duration: a0.duration || 1,
            delay: a0.begin || 0,
            iterations: 2,
            direction: 'alternate',
            easing: EASING[a0.mode] || 'linear',
            fill: 'backwards'
          }
        });
      } else if (finite.length) {
        var built = finiteKeyframes(finite, prop, ctx);
        effects.push({
          keyframes: built.keyframes,
          timing: { duration: built.total, fill: 'forwards', easing: 'linear' }
        });
      }

      if (infinite) {
        var from = startValue(infinite);
        var to = endValue(infinite);
        var kf = [{}, {}];
        kf[0][CHANNEL[prop].css] = toCss(prop, from, ctx);
        kf[1][CHANNEL[prop].css] = toCss(prop, to, ctx);
        effects.push({
          keyframes: kf,
          timing: {
            duration: infinite.duration || 1,
            delay: infinite.begin || 0,
            iterations: Infinity,
            direction: infinite.autoreverse ? 'alternate' : 'normal',
            easing: EASING[infinite.mode] || 'linear',
            fill: 'both'
          }
        });
      }
    });

    return effects;
  }

  /* Resting value for a property under one storyboard: where the element sits once motion
   * has stopped. One-shots settle at their final value; infinite and autoreverse tracks
   * settle at t=0, which is where they visually begin. */
  function restingValue(anims, sb) {
    var finite = anims.filter(function (a) { return !a.repeat; });
    var infinite = anims.filter(function (a) { return a.repeat; })[0];
    if (sb && sb.repeat) return startValue(anims[0]);
    if (infinite && !finite.length) return startValue(infinite);
    if (finite.length) {
      var last = finite[finite.length - 1];
      /* An autoreverse track plays out and back, so it comes to rest where it began - not at
       * its `to`. Getting this wrong leaves the static snapshots permanently displaced by the
       * outbound leg. */
      return last.autoreverse ? startValue(last) : endValue(last);
    }
    return startValue(anims[0]);
  }

  /* ---- public API ---- */

  var SB = {};

  SB.EASING = EASING;
  SB.CHANNEL = CHANNEL;

  /* Look up an element's storyboard for an event. `defs` is a
   * { <event or '_'>: {repeat, animations:[...]} } map from PSX.STORYBOARDS. */
  SB.forEvent = function (defs, event) {
    if (!defs) return null;
    if (event && defs[event]) return defs[event];
    /*
     * '_' is a <storyboard> with no event= - 73 of the theme's 211. It fires when the element
     * appears and is not tied to cursor movement, so it must ALSO answer for an element that
     * only has a '_' block when a specific event is requested. Returning null here instead
     * silently kills every ambient animation in the theme: the top-bar ticker, the background
     * Ken Burns, the badge pulses and the overlay-art drift are all '_'-only.
     */
    if (defs._) return defs._;
    return null;
  };

  /*
   * Run a storyboard on an element. Cancels only the animations this runtime created, so a
   * caller's own transitions survive.
   */
  SB.play = function (el, defs, event, ctx) {
    if (!el) return [];
    var sb = SB.forEvent(defs, event);
    SB.cancel(el);
    if (!sb) return [];

    el.classList.add('px-anim');
    var running = [];
    compile(sb, ctx).forEach(function (fx) {
      var anim = el.animate(fx.keyframes, fx.timing);
      running.push(anim);
    });
    el.__pxAnims = running;
    return running;
  };

  /*
   * Write resting values as inline styles and create zero Animations. This is what
   * interactive:false and the chrome strip's animations-off toggle both call, which is what
   * proves the static snapshots and the live build agree - same descriptors, same function.
   */
  SB.settle = function (el, defs, event, ctx) {
    if (!el) return;
    SB.cancel(el);
    el.classList.add('px-anim');

    var sb = SB.forEvent(defs, event) || SB.forEvent(defs, 'open') || SB.forEvent(defs, null);
    if (!sb) return;

    var split = byProperty(sb.animations || []);
    split.order.forEach(function (prop) {
      var v = restingValue(split.groups[prop], sb);
      el.style.setProperty(CHANNEL[prop].css, toCss(prop, v, ctx));
    });
  };

  SB.cancel = function (el) {
    if (el && el.__pxAnims) {
      el.__pxAnims.forEach(function (a) {
        try { a.cancel(); } catch (e) { /* already gone */ }
      });
      el.__pxAnims = null;
    }
  };

  SB.cancelAll = function (root) {
    if (!root) return;
    root.querySelectorAll('.px-anim').forEach(SB.cancel);
  };

  /* Freeze every animated element under root at its resting value. Elements record which
   * descriptor set and event they were last played with, so settling needs no extra state. */
  SB.settleAll = function (root, ctx) {
    if (!root) return;
    root.querySelectorAll('.px-anim').forEach(function (el) {
      if (el.__pxDefs) SB.settle(el, el.__pxDefs, el.__pxEvent, ctx || el.__pxCtx);
      else SB.cancel(el);
    });
  };

  /*
   * Bind an element to its descriptor set once. After this, drive() alone runs or settles it
   * depending on the controller's animate flag.
   */
  SB.bind = function (el, defs, ctx) {
    if (!el) return el;
    el.__pxDefs = defs;
    el.__pxCtx = ctx;
    el.classList.add('px-anim');
    return el;
  };

  /*
   * Fire an event at a bound element.
   *
   * An element whose only storyboard is the no-event '_' block is ambient: it starts when the
   * element appears and runs on its own clock. Re-playing it on every cursor move would
   * restart the top bar's 5350ms ticker and the 30s background drift on every keypress, so it
   * is played once and then left alone.
   */
  SB.drive = function (el, event, animate) {
    if (!el || !el.__pxDefs) return;
    var defs = el.__pxDefs;
    var ambient = !defs[event] && !!defs._;
    if (ambient && el.__pxStarted && animate) return;

    el.__pxEvent = event;
    if (animate) {
      SB.play(el, defs, event, el.__pxCtx);
      el.__pxStarted = true;
    } else {
      SB.settle(el, defs, event, el.__pxCtx);
      el.__pxStarted = false;
    }
  };

  /* Exposed for the Phase 1 gate and for tests: compile without running. */
  SB._compile = compile;

  PSX.SB = SB;
})(window.PlayStationX);
