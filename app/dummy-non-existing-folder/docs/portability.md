# Portability discipline

The React app is not the end goal. It is the reference renderer for a widget vocabulary that
will later be re-imagined as a C templating language and widget system. Everything below exists
so that translation is a port rather than a rewrite.

The target renderer is not pinned down, so nothing here assumes a particular graphics stack.
What it does assume is a renderer with **no CSS, no cascade and no DOM** - one that is handed a
widget, a rectangle and a set of values, and draws.

## The rules

### 1. Typed, enumerable props

Every widget's public surface is a named TypeScript type. No `...rest` spread onto the DOM, no
arbitrary `style` passthrough, no `className` used to inject behaviour.

A widget's prop type is the thing that becomes a struct. If it is open-ended, there is nothing
to translate.

### 2. Resolved pixel geometry

Widgets receive a `box` of literal device pixels and never derive position from CSS layout.

This is not a new constraint - all three original mockup sets already resolved every position
to literal pixels before touching the DOM, because they render at a fixed device resolution.
The rule just keeps it that way.

### 3. No cascade dependence

A widget's appearance comes from props, not from inherited custom properties or descendant
selectors. The web renderer may still emit CSS custom properties for a theme's decorative
styling, but nothing a widget owns may depend on them.

This is the biggest structural change from the original mockups, all three of which applied
their palette by writing custom properties onto a root element and letting CSS inherit them
down. A renderer without a cascade cannot do that, so palettes now resolve in TypeScript to a
token object and widgets take the concrete values they need.

### 4. Animation as data

Motion is declared as descriptors, never as imperative DOM writes. No widget calls
`element.animate`, writes `style.setProperty`, or forces a reflow. Those live in the renderer
adapter.

See [animation.md](animation.md) for the descriptor format.

There is one apparent exception worth naming: PlayStation X's transform channels
(`--px-ox`, `--px-oy`, `--px-x`, `--px-y`, `--px-sc`) are CSS custom properties. They are not
theme cascade - they are how the *web adapter* animates three transform channels at once
without two animations fighting over `transform`. A renderer that can compose transforms
directly has no need of them.

### 5. Explicit text metrics

Font family, size, weight, wrap and truncation are props. Where the original relies on CSS
ellipsis, the widget declares the truncation rule, so a renderer that has to measure text
itself has the information it needs.

### 6. A bounded vocabulary

Widgets are registered in one place. Adding a widget means adding a registry entry, a
documentation page and a story. A test asserts the three agree, so the catalogue cannot
silently drift from the code.

### 7. Effects declare a fallback

Any widget using a capability a simple renderer lacks - blur, shader, arbitrary mask,
reflection - declares a degraded variant. `RenderModeProvider` switches the whole app between
`web` and `fallback`, and both are screenshotted.

The point is that the degraded look is **designed now**, while the original is in front of us,
rather than discovered later by whoever writes the C renderer.

## What is exempt

The device bezel and button cluster are mockup-only chrome. Real hardware has a real bezel and
real buttons, so they are not part of the vocabulary being translated. They live in
`app/src/device/` rather than `app/src/widgets/`, and these rules do not bind them.

**The portable boundary is the contents of `.screen`.**

## How it is enforced

| Rule | Enforced by |
| --- | --- |
| 1, 2, 3, 5 | TypeScript prop types, reviewed per widget |
| 4 | `no-restricted-syntax` in `app/eslint.config.js`, scoped to `src/widgets/**` |
| 6 | A Vitest test asserting registry, docs and stories cover the same set |
| 7 | A Vitest test asserting any widget declaring a web-only effect also declares a fallback |

The lint rule bans, inside `src/widgets/**`: `element.animate()`, `setProperty()`, `classList`
access, `innerHTML` assignment, direct tree mutation (`appendChild` and friends),
`querySelector`, and assignment to `element.style`. Test and story files are exempt.

Running `npm run lint` from `app/` checks it.
