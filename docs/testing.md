# Testing

The original mockups had no tests, no test runner and no package manager. This describes what
replaced that.

All commands run from `app/`.

| Command | Suite |
| --- | --- |
| `npm run test` | Unit and component tests (Vitest + Testing Library) |
| `npm run test:watch` | The same, in watch mode |
| `npm run test:coverage` | The same, with a V8 coverage report |
| `npm run test:e2e` | Screen-level visual and interaction tests (Playwright) |
| `npm run test:e2e:update` | Re-baseline the Playwright screenshots |
| `npm run lint` | ESLint, including the portability rules |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run storybook` | Widget catalogue, for manual inspection |

Playwright needs its browser once: `npx playwright install chromium`.

## What is tested where

### Unit and component - Vitest

**Layout resolution.** Each theme's `resolve()` is a pure function of `(device, options)`, so
every device and option combination is resolved and snapshotted. This is the most error-prone
surface in the port: the resolvers turn fractional spec values into literal pixel boxes, and a
wrong constant produces a screen that looks plausible but is subtly wrong everywhere.

**Golden fixtures from the original.** Where a port reproduces existing code rather than
implementing a spec, the fixtures are captured by running the **original** under `node:vm` and
comparing value by value - `app/scripts/gen-layout-golden.mjs` and `gen-data.mjs` do this for
Elementerial's resolver, library and generated art. A self-snapshot only proves a port agrees
with itself; this proves it agrees with what it reproduces.

**The animation compiler.** Descriptors compile to a renderer-neutral timeline, and the
timeline is what is asserted, so the tests survive swapping the web adapter for another
renderer. Covered: the four compiler rules, hold-frame insertion, the `_` event fallback, the
ambient non-restart guard, and the rule that an autoreverse track rests at its `from` rather
than its `to`.

That last one matters more than it sounds. Without it, PlayStation X's selection frame ends
permanently displaced after the first cursor move.

**Storyboard corpus invariants.** Two invariants were previously verified by throwaway Python
scripts against the upstream XML theme, and recorded only as prose. They are load-bearing -
the compiler implements four rules instead of a general merge precisely because they hold - so
they are now executable assertions over the transcribed storyboards:

- no property group carries more than one repeating track
- every finite autoreverse track is alone on its property

**Widget behaviour.** List windowing, grid paging and wrap, carousel scroll maths, settings
cycling and its percent clamp, star fill thresholds, playtime formatting.

**Shared layers.** The key map, palette token derivation (including `RRGGBBAA` to `rgba()` and
the secondary colorset's eight-key override), and agreement between the typed device registry
and the table in the device registry document.

**Portability discipline.** That the widget registry, the documentation pages and the stories
cover the same set, and that any widget declaring a web-only effect also declares a fallback.

### Screen level - Playwright

**Per-route baselines.** Every screen is screenshotted and diffed. Screenshots target the
`.screen` element rather than the viewport, so the bezel scale is irrelevant and the image is
at native device resolution.

**Zero console errors per route.** A screen that renders but logs a missing asset is a screen
with a defect. The original mockups had no way to notice this.

**The settle invariant.** In all three original themes, a static screen is the live build with
animations settled to their resting values instead of played. That equivalence is what proves
the static snapshots and the interactive build agree, so it is asserted rather than assumed.

**A compositing guard.** An explicit check that no opaque full-bleed element sits above the
content. This exists because of a real failure: an overlay inherited a tinted background but
had no mask, and painted solid over every Elementerial view. Every numeric check passed -
element boxes, palette tokens, font sizes, row pitch, input handling, zero console errors -
because nothing about that fault is visible in computed styles. Only compositing shows it.

An element's own containers do not count as what it covers: they always sit below it, and counting
them flagged slot's game - one full-bleed picture, the whole screen by design - as covering the box
it is drawn in.

A dialog marked `data-dialog` is exempt while it is inset on every side. NeoStation's settings
dialogs are 16 units in from each edge over a dimmed screen, most of the screen by design; a
full-bleed layer is still caught whatever it calls itself, and a test proves it.

A masked scrim is exempt from that guard - the mask is what stops it painting solid, and
covering the whole panel is exactly what it is for. Its own failure mode, a mask that does not
load, shows up as a failed request in the zero-console-errors check.

The general lesson holds beyond that one bug: **verify a visual deliverable by looking at it.**
Geometry assertions are necessary and not sufficient. Every port in this repo found faults that
way and none of them found one any other way.

### The specs

| Spec | What it asserts |
| --- | --- |
| `baseline.spec.ts` | A screenshot of every route against a stored baseline |
| `fallback.spec.ts` | The same stills again in the degraded renderer |
| `settle.spec.ts` | A still is byte-identical to the live build with motion off |
| `compositing.spec.ts` | Nothing opaque covers the content - and that the check can fail |
| `interaction.spec.ts` | Cursor traces through carousel, list and grid, plus the hold gestures |
| `screens.spec.ts` | Zero console errors, something drawn inside the theme's root (or a root marked `data-screen-off`, for a screen dark on the device), controls inside the body |
| `previews.spec.ts` | The landing page's card art, captured from the routes themselves - opt-in with `UPDATE_PREVIEWS=1`, since it writes committed files |

The baselines are the whole regression gate. There is no A/B comparison against a prior
implementation any more: the original vanilla-JS mockups have been removed, so a screen's
evidence is its stored capture and the reference art under `docs/themes/<slug>/reference/`.

## What is not tested

Bats does not apply - the deliverable contains no shell scripts.

The Python scripts under `docs/themes/playstation-x/reference/checks/` are kept as source
analysis tooling, not tests. They scrape the upstream XML theme, which is a separate checkout
that is not present here, so they do not run as part of any suite. Their findings live on as
the Vitest invariants described above.## Playwright

Run with `npm run test:e2e`; `npm run test:e2e:update` rewrites the baselines. The baselines are
the regression gate: a change that leaves every number right and the screen wrong still fails.

| Spec | What it asserts |
| --- | --- |
| `baseline.spec.ts` | A screenshot of every route against a stored baseline |
| `fallback.spec.ts` | The same stills again in the degraded renderer |
| `settle.spec.ts` | A still is byte-identical to the live build with motion off |
| `compositing.spec.ts` | Nothing opaque covers the content - and that the check can fail |
| `interaction.spec.ts` | Cursor traces through carousel, list and grid, plus the hold gestures |
| `screens.spec.ts` | Zero console errors, something drawn inside the theme's root (or a root marked `data-screen-off`, for a screen dark on the device), controls inside the body |

### Two things that had to be got right first

**Sub-pixel placement.** A screen is drawn inside a `transform: scale()`, so where the device
lands on the page decides the sub-pixel phase every edge inside it rasterises at. The gallery
centres it vertically, so an interactive route - which carries a subset panel and is therefore
taller - put it on a half-pixel boundary. Two screens that were pixel-identical in content
differed by 4%. Every capture now pins the layout to a fixed integer origin and forces the
viewing zoom to 1, so a baseline records the device's own pixels and nothing else.

**Motion and input are different things.** `animate={false}` means motion is settled, not that the
screen is inert. The themes used to refuse input when it was off, which would have made an
interaction trace impossible to record with a stable background. A static screen is inert because
its frame is `interactive={false}` and has no input provider at all - that is the flag that means
"no controls", and the two are no longer conflated.
