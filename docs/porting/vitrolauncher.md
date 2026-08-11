# Porting notes: Vitro Launcher

What changed between [`legacy/vitrolauncher/`](../../legacy/vitrolauncher/) and
`app/src/themes/vitrolauncher/`.

The original was four files - a data and DOM-builder module, a background renderer, a controller
and a stylesheet - driving 8 boot stubs. The port keeps the data and the four background renderers
close to verbatim and replaces the builders and the controller with components.

This is the smallest set in the repo and the only one that is a *launcher* rather than a theme:
its screens are its own, not a frontend's, and its settings are a real feature rather than a
mockup affordance.

## Deviations

**The settings live in the theme, not in the interactive wrapper.** Every other set here keeps its
subsets outside the theme so a static screen and the live build take the same props. Vitro is the
exception on purpose: Theme, Color, Cover Size, Transparency and the rest are the *app's* own
configuration, and it ships a Settings screen for changing them. Putting them in the wrapper would
have meant two authorities on the same values. The panel below the device seeds them and then
stands back.

**The background renders one frame at t=0 on a static screen.** These are a continuous render loop
rather than a timeline, so there is no keyframe to settle to - what stands in for settling is the
clock. Pausing a running loop would capture an arbitrary moment; rendering t=0 is reproducible.

**The dust field is seeded rather than random.** The original built its motes from `Math.random`,
so no two captures of the particles theme matched. The port seeds a small PRNG, which is what
makes that theme diffable at all.

**The clock shows a fixed time**, as in every other set here.

**The navigation pill is clickable.** Mockup chrome, not launcher behaviour: a handheld has no
pointer and the app would never handle a tap, but the pill reads as a tab bar on a desktop and this
repo's convention is that on-screen controls in a mockup are clickable. The slots are only buttons
on the live build; a static screen renders plain elements and has no controls at all. The pill also
takes `pointer-events: none` once auto-hide has faded it, so an invisible tab bar cannot swallow
clicks.

**Glass is a widget.** The original expressed the whole chrome through a `.glass` class and a
`.no-transparency .glass` override. The port has a `GlassPanel`, which is what lets the user's
Transparency setting and the renderer's lack of `backdrop-filter` be told apart - in the original
they were the same code path, so there was no way to ask for one without the other.

## Defects fixed

Each was found by reading the source; each now has a test.

**Infinite Scrolling did nothing.** It was in the settings schema, drawn on the Settings screen and
changeable, and no code read it - the grid and the carousel stopped at their ends whatever it said.
Both wrap when it is on.

**The battery was hardcoded at 85%,** and `.batt-fill.low` and `.batt-fill.charging` were styled
but unreachable because nothing ever set the class. The level is a prop, and there is a static
screen at 12% so the low state is visible rather than merely possible.

**Cloud drift was frame-rate dependent.** `c.x += c.speed * 0.016` assumes exactly 60fps, so the
clouds crawled on a 30Hz panel and sprinted on a 120Hz one. Position is now a pure function of the
clock, which also means a paused tab resumes where it should rather than where it stopped.

**The mote tint was computed and thrown away** - literally `void moteCol`. Every colour scheme got
the same pale white dust. The tint is applied to the sprite at creation, so a red scheme now has
red dust.

**`drawWaves()` ran against a null `gl`** on any browser without WebGL. Shader creation returns
null instead, and the caller draws the 2D fallback.

**The render loop never paused.** Four canvases kept running in every hidden tab. It now stops on
`visibilitychange` and rebases its clock on resume, so the animation continues rather than jumping.

**`press()` had no `menu` or `start` case.** Both were handled out of band - Menu by a branch above
the dispatch, Start only as part of the exit chord - so the switch was not the whole input map. Both
are named now.

**`KEYS` had no `select`,** which was patched at the call site with an `e.code === 'ShiftRight'`
test. The shared keymap has it.

**`renderGridPage` was called as `renderGridPage(true)`** and took no parameter.

**A redundant early return.** The keydown handler dropped repeated Escapes before a branch whose
own guard already dropped them.

**`var bgTheme = simple ? theme : theme`** - a no-op that reads as if it meant something. The
background theme is just the theme.

**`.cov-letter` and `.gicon-letter` were styled and never emitted,** so the no-art fallback was
unreachable. Both render when a game has no cover. Generated covers mean it still never fires in
this mockup, but a scraped library is exactly where it would.

**A doc comment described a field the code did not return** - `valueEl` where the builder returned
`midEl`.

**Nothing cleaned up a hold that lost focus.** Both hold gestures tracked their own keyup on
`document`, so a window blurred mid-hold never got one and the power-off fade stayed at full black.
The shared input layer clears its held-set on blur, so this is handled once for every theme.

## The four transitions

All four are wired, and all four are also *poseable*: each is a 0-1 number, so a static screen sets
it directly rather than trying to catch a running clock. That is how the exit banner has a capture
at 62% without anyone holding three buttons at the right moment.

| Transition | Trigger | Length |
| --- | --- | --- |
| Startup fade | On load, when Startup Fade-In is on | 1100ms, in three stages |
| Launch | A on either game screen | 1100ms in, held 250ms, 500ms out |
| Power off | Hold Menu | 2000ms |
| Exit to muOS | Hold L1 + X + Start | 2000ms |

The two hold gestures are why the shared input layer has release events and a held-set at all. One
subtlety cost a round of debugging: **a press handler runs while the provider's held-set update is
still queued**, so the button that *completes* a chord is not in the set when its own handler runs.
Testing the chord there left it permanently one button behind and it never fired. The chord is read
as state instead, which has settled by the time it is observed - and picks up the on-screen buttons
for free.

## Fidelity faults found by looking at the screen

**A full-screen glass stadium.** The status pill's `GlassPanel` was given a wrapper with no
`position`, so it sized itself against the nearest positioned ancestor - the whole UI layer - and
painted a 999px-radius translucent ellipse across the entire screen. Nesting it inside the pill
fixed it. Numerically nothing was wrong: the pill's own geometry was correct throughout.

## The fallback variants

Vitro is where the two render modes earn their keep, because it is the only set that uses a
capability a simple renderer plainly lacks.

| Effect | Web | Fallback |
| --- | --- | --- |
| Glass chrome | `backdrop-filter: blur(12px)` over the live background | The flat gray gradient the launcher already ships for `Transparency = off` |
| Wave background | WebGL fragment shader | The same two crest functions drawn as filled paths on a 2D context |

The glass fallback is the happiest kind: authored upstream by the app's own author rather than
invented here. The wave fallback samples the identical crest functions, so the shapes are exact -
what is lost is the per-pixel glow along each crest, which becomes a stroke, and the smoothstep
edge, which becomes a hard fill.
