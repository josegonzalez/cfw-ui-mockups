# Animation

All motion in this repo is declared as data. Nothing calls `element.animate` outside one
adapter file, and no widget writes to the DOM to move something.

That is not stylistic. The widget vocabulary is meant to be re-implementable by a renderer with
no CSS and no DOM, and imperative motion is the part of a UI that translates worst. A
descriptor survives; a sequence of style writes does not.

## Where it came from

Three separate animation architectures existed before this port:

| Theme | How it animated |
| --- | --- |
| Elementerial | CSS transitions, with durations and easings kept as annotated custom properties |
| Vitro Launcher | CSS transitions plus imperative `style.transition` writes, and a canvas render loop |
| PlayStation X | A data-driven compiler, porting the Batocera EmulationStation `<storyboard>` XML format and compiling it to Web Animations |

Only the third was a system. It was promoted to the shared one because it already expressed
motion as data, and because it subsumes what the other two express as transitions.

Vitro's animated backgrounds are the exception and stay outside it: a WebGL shader and two
canvas renderers are a continuous render loop, not a timeline, and nothing is gained by
pretending otherwise.

## The authored format

```ts
{ property: 'offsetY', from: 0.78, to: 0, duration: 550, mode: 'easeOutCubic' }
```

which is the source XML transcribed:

```xml
<animation property="offsetY" from="0.78" to="0" duration="550" mode="easeOutCubic" />
```

| Field | Meaning |
| --- | --- |
| `property` | The channel: `opacity`, `offsetX`, `offsetY`, `x`, `y`, `scale`, `scaleX`, `zIndex` |
| `from` / `to` | Endpoints. Length channels are fractions of screen width or height |
| `begin` / `duration` | Milliseconds. With `autoreverse`, `duration` is **one leg** |
| `mode` | A named easing curve |
| `autoreverse` | Play out and back |
| `repeat` | `'forever'` - on a track it loops that track, on a storyboard it loops the group |

A **storyboard** is a bundle of tracks keyed by event: `open`, `activateNext`, `activatePrev`,
`deactivateNext`, `deactivatePrev`, plus `_` for a storyboard authored with no event at all.

### Omitted endpoints

A track with `from` but no `to` animates to the element's *authored* value. Because authored
position is expressed as left/top rather than as a transform, that value is always the
channel's identity - 0 for offsets, 1 for opacity, scale and scaleX. That is what `CHANNELS[].rest` is,
and why it is per-channel rather than per-element.

## The pipeline

```
Storyboard (authored)
      |  compile.ts          pure, no DOM, no CSS
      v
CompiledTrack[]              channel + keyframes + timing, values already in device pixels
      |  waapi.ts            the web adapter
      v
element.animate(...)
```

The split is the point. `CompiledTrack[]` is the handoff: a second renderer implements its own
adapter against it and reuses the compiler, the easings and every test.

Values are resolved to device pixels **in the compiler**, not the adapter, because that is
device geometry rather than a property of the output format - any renderer needs it.

## The four compiler rules

Per channel:

1. Partition the tracks into finite ones plus at most one repeating tail.
2. A lone finite `autoreverse` track becomes two alternating iterations of one leg.
3. Any other finite set merges into one track that holds its final value.
4. A repeating tail becomes its own endless track.

Overriding all four: a storyboard-level `repeat` merges every track on the channel into one
looping timeline, so the whole group cycles together.

Four rules suffice only because two properties hold across the authored corpus: no channel ever
carries more than one repeating track, and every finite `autoreverse` track is alone on its
channel. Both were originally verified by scraping the upstream XML and recorded as prose;
they are now asserted in the test suite, so a future transcription that breaks one fails loudly
instead of producing subtly wrong motion.

### Hold frames

A track beginning at 300ms must keep its previous value until then. The compiler inserts
explicit hold keyframes to do it. Without them a delayed track interpolates from t=0 and drifts
visibly for the whole delay.

### Resting values

Where a channel sits once motion has stopped:

| Case | Rests at |
| --- | --- |
| One-shot | its final value |
| Finite `autoreverse` | its **`from`** |
| Repeat-only, one-directional | its `from` |
| Repeat-only, `autoreverse` | the **authored** end - see below |
| Group repeat | the first authored value |

The finite autoreverse row is the one that bites. Such a track plays out and back, so it ends
where it started. Treating it as resting at `to` leaves every static screen permanently displaced
by the outbound leg - a 150ms nudge becomes a permanent offset.

An *infinite* autoreverse track is a different case, and reading it the same way is what the
second-to-last row exists to prevent. It has no end: it alternates forever and spends equal time
at both extremes, so what it comes to rest at is the element's authored value - which is the
channel's identity, `opacity` 1, `scale` 1, offsets 0. For almost every such track `from` already
*is* that value and the animation moves away from it, so both readings agree and the distinction
never shows. Where they disagree, taking `from` does not displace the element, it deletes it:
PlayStation X's achievements trophy blinks `opacity 0 -> 1`, so resting at `from` makes it
invisible on every static screen. An alternator whose ends straddle neither the identity keeps
the `from` reading rather than guessing.

## Why transform is never animated directly

Up to three transform channels animate simultaneously on one element. Two Web Animations cannot
both target `transform`, so each channel drives its own registered custom property and CSS
recomposes them:

```css
.px-anim {
  transform: translate(var(--px-x), var(--px-y)) translate(var(--px-ox), var(--px-oy))
    scale(var(--px-sc)) scaleX(var(--px-scx));
}
```

`scaleX` stretches only horizontally, after `scale`, for something turning edge-on about its
vertical axis - the Wii Menu's Disc Channel icon.

The `@property` registration is load-bearing. Without it a custom property is an untyped string,
the browser cannot interpolate it, and every animation snaps between keyframes instead of
tweening.

Collapsing these into one animated `transform` looks like a simplification and silently drops
two of the three channels. A renderer that composes transforms itself does not need any of this.

## Motion off

`animate: false` on the device frame is the entire static-snapshot mechanism, inherited from all
three original themes. It is not a separate build: no `Animation` objects are created at all,
and each channel's resting value is written as plain style instead.

Same descriptors, same resolution path. That is what makes a static screen and a paused live one
provably the same picture, and it is asserted as a test rather than assumed.

## Ambient storyboards

An element whose only storyboard is the no-event `_` block is *ambient*: it starts when the
element appears and runs on its own clock. Replaying it whenever the cursor moves would restart
a 5350ms ticker and a 30s background drift on every keypress, so it plays once and is then left
alone.

The `_` block is also the fallback for every event lookup. Returning nothing instead would
silently kill every ambient animation in a theme - the top-bar ticker, the background drift, the
badge pulses are all authored with no event.

## Transitions

The two themes that animate with CSS transitions declare them as data too:

```ts
transitionsToCss([
  { property: 'transform', duration: 500, easing: 'easeOutQuint' },
  { property: 'opacity', duration: 150, easing: 'linear' },
])
```

An empty list compiles to `'none'` rather than an empty string, so a component can positively
disable transitions rather than merely fail to enable them.

## The easing registry

Every curve in the repo, in one table with its provenance. Eight are the source format's own
`mode=` vocabulary; `easeOutQuint` and `easeOutQuad` arrived from the other two themes and are the
standard bezier approximations of the Penner curves they are named for, and `smoothstep` arrived
with TortOS. The last eight are Flutter's `Curves`, which NeoStation uses by name. Flutter's cubic
curves are different beziers from the two above that share their names, so those two take a
`flutter` prefix rather than moving every other set's motion.

| Name | Curve | From |
| --- | --- | --- |
| `linear` | `linear` | |
| `ease` | `cubic-bezier(0.25,0.1,0.25,1)` | |
| `easeIn` | `cubic-bezier(0.42,0,1,1)` | |
| `easeOut` | `cubic-bezier(0,0,0.58,1)` | also Elementerial's `--el-ease-out` |
| `easeInOut` | `cubic-bezier(0.42,0,0.58,1)` | |
| `easeInCubic` | `cubic-bezier(0.32,0,0.67,0)` | |
| `easeOutCubic` | `cubic-bezier(0.33,1,0.68,1)` | |
| `bump` | `cubic-bezier(0.34,1.56,0.64,1)` | inferred - see below |
| `easeOutQuint` | `cubic-bezier(0.23,1,0.32,1)` | Elementerial, `Math::easeOutQuint` |
| `easeOutQuad` | `cubic-bezier(0.25,0.46,0.45,0.94)` | Vitro Launcher's `--ease-out` |
| `smoothstep` | `cubic-bezier(0.3333,0,0.6667,1)` | TortOS's `ease_smooth`, `3u^2 - 2u^3` - exact, not approximated |
| `easeOutQuart` | `cubic-bezier(0.165,0.84,0.44,1)` | Flutter's `Curves.easeOutQuart`, NeoStation |
| `easeOutExpo` | `cubic-bezier(0.19,1,0.22,1)` | Flutter's `Curves.easeOutExpo`, NeoStation |
| `easeInQuint` | `cubic-bezier(0.755,0.05,0.855,0.06)` | Flutter's `Curves.easeInQuint`, NeoStation |
| `easeInOutCubic` | `cubic-bezier(0.645,0.045,0.355,1)` | Flutter's `Curves.easeInOutCubic`, NeoStation |
| `easeOutBack` | `cubic-bezier(0.175,0.885,0.32,1.275)` | Flutter's `Curves.easeOutBack`, NeoStation |
| `fastOutSlowIn` | `cubic-bezier(0.4,0,0.2,1)` | Flutter's `Curves.fastOutSlowIn`, NeoStation |
| `flutterEaseInCubic` | `cubic-bezier(0.55,0.055,0.675,0.19)` | Flutter's `Curves.easeInCubic`, NeoStation |
| `flutterEaseOutCubic` | `cubic-bezier(0.215,0.61,0.355,1)` | Flutter's `Curves.easeOutCubic`, NeoStation |

`bump` is the one inference. It has no documented curve upstream, but all thirteen of its uses
are `scale 0.9|0.94 -> 1.0` and it never appears on opacity, so it reads as an overshoot pop.
The 1.56 control point is what produces the overshoot.

`EASING_BEZIER` carries the four control points per curve, for a renderer that evaluates the
curve itself rather than handing a string to a browser. `evaluateEasing(name, u)` solves that bezier in
JavaScript, for a theme that integrates its own motion - TortOS's shelf is retargeted by every
press, so it cannot be a descriptor, but it still names its curves from this table.

## Using it

```tsx
<Animated storyboard={STORYBOARDS.gamename} event={cursor.direction > 0 ? 'activateNext' : 'activatePrev'} />
```

For anything that is not a `div`, call the hook and attach what it returns, rather than wrapping
and changing the element's own box:

```tsx
const { attach, className, style } = useStoryboard(STORYBOARDS.marquee, event)
return <img ref={attach} className={className} style={{ ...box, ...style }} src={src} />
```
