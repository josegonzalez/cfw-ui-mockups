# CFW UI Mockups

HTML mockups of the on-screen UI of SBC gaming handheld custom firmware and launchers -
projects like muOS, Knulli, ArkOS, AmberELEC, ROCKNIX and their launchers. Each screen is
recreated at the device's exact resolution inside a device frame, as a visual and interaction
reference. Nothing here ships to a device.

## Running it

```sh
cd app
npm install
npm run dev
```

Other commands, all from `app/`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build && npm run preview` | Production build, served |
| `npm run test` | Unit and component tests |
| `npm run test:e2e` | Screen-level visual and interaction tests |
| `npm run storybook` | Widget catalogue |
| `npm run lint` | Lint, including the portability rules |

## Layout

```
app/      the React application - every screen is rendered from here
docs/     architecture, widget catalogue, device and framework registries, per-theme notes
legacy/   the original vanilla-JS mockups, kept as a fidelity reference
```

Start with [docs/README.md](docs/README.md).

## Why a React app

The repo began as three independent vanilla-JS mockup sets that each reinvented the same
pipeline - device frame, layout resolution, palette, input map, animation - and shared
essentially nothing. The React app replaces that with one shared widget vocabulary.

That vocabulary is the real deliverable. It is written to be re-implementable by a renderer
with no CSS, no cascade and no DOM, so the components hold to the rules in
[docs/portability.md](docs/portability.md) and the animations are data rather than imperative
DOM writes.
