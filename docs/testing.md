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

**Legacy A/B fidelity.** Each route is diffed against the corresponding pre-React page under
`legacy/`, served from the same origin. Because the legacy assets were duplicated rather than
moved, those pages still render exactly as they did, which makes this a true before-and-after
comparison rather than a comparison against a remembered intent.

**Fallback mode.** Every route is also screenshotted with `RenderModeProvider` in `fallback`,
so the degraded look is a reviewed artifact.

**The settle invariant.** In all three original themes, a static screen is the live build with
animations settled to their resting values instead of played. That equivalence is what proves
the static snapshots and the interactive build agree, so it is asserted rather than assumed.

**A compositing guard.** An explicit check that no opaque full-bleed element sits above the
content. This exists because of a real failure: an overlay inherited a tinted background but
had no mask, and painted solid over every Elementerial view. Every numeric check passed -
element boxes, palette tokens, font sizes, row pitch, input handling, zero console errors -
because nothing about that fault is visible in computed styles. Only compositing shows it.

The general lesson holds beyond that one bug: **verify a visual deliverable by looking at it.**
Geometry assertions are necessary and not sufficient.

## What is not tested

Bats does not apply - the deliverable contains no shell scripts.

The Python scripts under `docs/themes/playstation-x/reference/checks/` are kept as source
analysis tooling, not tests. They scrape the upstream XML theme, which is a separate checkout
that is not present here, so they do not run as part of any suite. Their findings live on as
the Vitest invariants described above.
