# Documentation

Index of the documentation in this repo. Start here.

## Architecture

| Document | What it covers |
| --- | --- |
| [portability.md](portability.md) | The discipline that keeps widgets translatable to a non-DOM renderer, and how it is enforced |
| [testing.md](testing.md) | What is tested where, and how to run each suite |
| [legacy.md](legacy.md) | What lives under `legacy/`, why it is kept, and how to compare against it |

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
| `architecture.md`, `animation.md` | The shared foundation layers |
| `widgets/README.md` and a page per widget | The widget kit |
| `porting/<theme>.md` | Each theme port, recording defects fixed and deviations taken |
