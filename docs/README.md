# Documentation

Index of the documentation in this repo. Start here.

## Architecture

| Document | What it covers |
| --- | --- |
| [portability.md](portability.md) | The discipline that keeps widgets translatable to a non-DOM renderer, and how it is enforced |
| [testing.md](testing.md) | What is tested where, and how to run each suite |

## Still to come

The port is being landed in phases, and these pages arrive with the phase that earns them.
Nothing links to them until they exist.

| Document | Arrives with |
| --- | --- |
| `legacy.md`, `devices.md`, `frameworks.md` | Moving the original mockups to `legacy/` |
| `architecture.md`, `animation.md` | The shared foundation layers |
| `widgets/README.md` and a page per widget | The widget kit |
| `themes/<theme>.md` and its reference material | Each theme port |
| `porting/<theme>.md` | Each theme port, recording defects fixed and deviations taken |

`themes/example-cfw.md` will double as the template for adding a new theme.
