# Documentation

Index of the documentation in this repo. Start here.

## Architecture

| Document | What it covers |
| --- | --- |
| [architecture.md](architecture.md) | How the app is put together: composition root, geometry, input, assets |
| [portability.md](portability.md) | The discipline that keeps widgets translatable to a non-DOM renderer, and how it is enforced |
| [animation.md](animation.md) | The animation descriptor format, the neutral timeline, easing registry and renderer adapters |
| [testing.md](testing.md) | What is tested where, and how to run each suite |
| [legacy.md](legacy.md) | What lives under `legacy/`, why it is kept, and how to compare against it |

## Widgets

[widgets/README.md](widgets/README.md) is the widget catalogue - the shared vocabulary every
screen is built from, and the real deliverable of this port. Each widget has a page recording
what it does, its props, its animation parameters, which themes use it, and its fallback where
it relies on something a simple renderer lacks.

## Registries

| Document | What it covers |
| --- | --- |
| [devices.md](devices.md) | Canonical device slugs, screen resolutions and aspect classes |
| [frameworks.md](frameworks.md) | Candidate frameworks for implementing these mockups for real, and their capability gaps |

## Themes

One page per mockup set, describing its palette, fonts, layout system, input map and screen
inventory, alongside the reference material extracted from its upstream source.

| Theme | Page | Reference material |
| --- | --- | --- |
| Elementerial | [themes/elementerial.md](themes/elementerial.md) | [themes/elementerial/reference/](themes/elementerial/reference/) |
| PlayStation X | [themes/playstation-x.md](themes/playstation-x.md) | [themes/playstation-x/reference/](themes/playstation-x/reference/) |
| Vitro Launcher | [themes/vitrolauncher.md](themes/vitrolauncher.md) | [themes/vitrolauncher/reference/](themes/vitrolauncher/reference/) |
| Example OS | [themes/example-cfw.md](themes/example-cfw.md) | none - it is a scaffold, not a reproduction |

Pages still carrying a status banner describe the original mockups; each is rewritten for the
React implementation as its theme is ported. All four sets are ported.

**[themes/example-cfw.md](themes/example-cfw.md) is the template for adding a theme.** It is
ported, and it documents what a theme is made of and how to start a new one.

## Porting notes

What changed between the original vanilla-JS mockup and the React implementation: every defect
fixed, every deliberate deviation, and how each was verified.

- [porting/elementerial.md](porting/elementerial.md)
- [porting/playstation-x.md](porting/playstation-x.md)
- [porting/vitrolauncher.md](porting/vitrolauncher.md)
- [porting/example-cfw.md](porting/example-cfw.md)

All four sets are ported, so this list is complete. Each page records what changed against the
original: every defect fixed, every deliberate deviation, and how each was verified.
