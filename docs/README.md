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

These pages currently describe the original mockups. Each is rewritten for the React
implementation as its theme is ported, at which point `themes/example-cfw.md` also becomes the
template for adding a new theme.

## Still to come

The port is being landed in phases, and these pages arrive with the phase that earns them.
Nothing links to them until they exist.

| Document | Arrives with |
| --- | --- |
| `porting/<theme>.md` | Each theme port, recording defects fixed and deviations taken |
