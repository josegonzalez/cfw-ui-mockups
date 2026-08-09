# Porting notes: Example OS

What changed between [`legacy/example-cfw/`](../../legacy/example-cfw/) and
`app/src/themes/example-cfw/`.

The original was two hand-written HTML files driven by `shared/nav.js`, the repo's shared focus
helper. It was the only set that ever used it.

## Deviations

**The layout resolves for any device.** The original hardcoded pixel values for one 640x480
panel. Those values are now fractions of the screen, so the theme renders on any device in the
registry, and it is published for `rg35xx` and `rg-cubexx`. The fractions are exact divisions of
the originals and `layout.test.ts` asserts the 640x480 resolution matches them precisely, so this
generalises the layout without changing it.

**Back is a stack, not a fixed target.** The original declared a per-screen back destination with
`data-back`. `useScreenNav` keeps a back stack instead: "B goes back" means where you came from,
and once a screen is reachable from two places a fixed target is wrong from one of them. With two
screens the two models coincide, so the reproduction is unaffected.

**The clock shows a fixed time on static screens.** The original rendered the real wall clock
everywhere, so no two captures of the same screen matched. Static screens now pin a time, which
is what makes a visual baseline possible at all. The live build still ticks.

**The detail column follows the selection through state, not the DOM.** The original listened for
a `cfw-button` event and wrote into the detail pane by id, reading `data-*` attributes off the
focused row. The port renders the detail column from the same selected index the list uses, so
there is one source of truth rather than two that can disagree.

**Battery is drawn from a value.** The original hardcoded the string `85%`. It is still 85, but
it now flows through `StatusIndicators` as a number, so the low and charging branches exist and
are reachable rather than being dead CSS.

**Tailwind is gone from the screens.** The original used Tailwind utility classes for layout
inside the screen. Screen geometry now comes from the resolver, as it does in every other theme.
Tailwind remains a real dependency for the gallery chrome, no longer loaded from a CDN.

## Defects fixed

None. The original had no observable defects - it is a two-screen scaffold, and it worked.

The one latent problem it did have was structural: `shared/nav.js` supported a single flat focus
group with a fixed step size, which is why none of the three real themes adopted it. The shared
input and cursor layers replace it with something the other themes can actually use.

## Not carried over

**`.nav-item.is-focused`**, the base focus outline in the shared device frame stylesheet. It was
only ever used by this set, and selection is now a theme's own styling rather than a default
that every theme overrides.

**The `cfw-button` escape hatch.** It existed so a page could react to input without the helper
knowing about it. Components subscribe through `useButtonPress` instead.

## Found by looking at it

Four faults survived every automated check and were caught only by rendering both versions and
comparing the images. Each is now covered by an assertion.

**The two screens do not share body geometry.** The menu drops 12px below the header rule and
runs to the footer; the game list starts flush against the rule with a fixed 356px height,
leaving a band of background above the footer. Applying the menu's spacing to both pushed the
game list down and stretched its detail column over that band.

**The list clipped its own selection.** The selected row shifts 6px right, and the list
container's `overflow: hidden` sliced it off at the right edge. The clip is vertical in intent -
it exists so a partial bottom row cuts cleanly - but CSS cannot hide one axis and show the
other, so the container is now widened by the shift.

**A partial row must be drawn.** The original scrolls, so its seventh game is half-visible at
the bottom of the list. Rendering only whole rows made the list read as though it had nothing
more to show. `TextList` now counts whole rows for scrolling and includes the partial one for
drawing.

**Hint labels were bold.** `HelpBar`'s `bold` prop bolded the label as well as the glyph, where
the original bolds only the glyph. That widened the footer strip by about 13px.

None of these are visible in computed styles, element boxes, or console output. This is the
class of fault that only compositing shows.

## Verification

- `layout.test.ts` - the 640x480 resolution against the original's hardcoded values, and every
  registry device for a usable layout with no box escaping the panel.
- `ExampleOs.test.tsx` - menu and list navigation, wrapping, opening the game list, returning
  from it, the inert rows, and that a static screen ignores input and pins its clock.
- `e2e/screens.spec.ts` - both devices and all three routes render with no console errors, draw
  actual content, and have nothing opaque covering them.
