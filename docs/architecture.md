# Architecture

One React application renders every screen in the repo. This describes how it is put together.

## Layout

```
app/src/
  device/    the shell: bezel, screen box, button cluster, device registry, screen context
  input/     the key map, the input provider, the mockup-only subset keys
  anim/      the animation vocabulary, compiler, neutral timeline and web adapter
  layout/    geometry primitives: boxes, anchored boxes, grid metrics
  nav/       selection cursors
  render/    the web / fallback render mode
  widgets/   the shared widget vocabulary
  themes/    one directory per mockup set
```

The dependency direction runs downward: `themes` use `widgets`, `widgets` use `layout`, `anim`
and `nav`, and nothing under `widgets` imports a theme.

## The composition root

A screen is a device frame wrapped around theme content:

```tsx
<DeviceFrame device="rg35xx" animate={false} interactive={false} renderMode="web">
  <ElementerialScreen view="menu" scheme="gb" style="light" />
</DeviceFrame>
```

`DeviceFrame` establishes four things a screen needs and cannot decide for itself:

| Provider | Supplies |
| --- | --- |
| `ScreenProvider` | which device, its exact pixel size, and whether motion runs |
| `InputProvider` | keyboard and on-screen button state |
| `RenderModeProvider` | whether web-only effects may be used |
| the bezel itself | the scaled shell and the clipped screen box |

Every axis a screen can vary on therefore enters from outside it. That is what lets the same
component render live, static, or in fallback mode with none of its own code changing.

## Native resolution, then scale

Screens lay out at the device's exact pixel resolution. The bezel is scaled up for comfortable
desktop viewing, and nothing inside the screen ever sees that scale.

The scaling splits across two elements:

```
.device-viewport   reserves the SCALED footprint, so the page lays out correctly
.device            draws UNSCALED, then transform: scale() from its top-left
```

Both are needed, because `transform: scale()` does not affect layout. With only the inner
element, a scaled-up shell would overlap whatever follows it on the page.

The viewing scale is a per-device preference, not a device property - the same 1920x1152 panel
appeared at two different scales in two different original mockup sets, because each chose what
read best.

## Geometry is resolved, never inferred

Every position is computed to literal device pixels before rendering, and no widget derives its
position from CSS flow. This was already true of all three original themes, because they draw at
a fixed resolution; portability rule 2 keeps it true.

`layout/box.ts` carries the two positioning forms:

- **`place`** - a resolved rectangle, absolutely positioned.
- **`placeAnchored`** - an auto-sized element anchored by a fraction of *its own* size. This is
  not the same as a fixed box with `object-fit: contain`: the anchored form has no letterbox, so
  neighbouring elements sit against the image rather than against its padding.

Each theme keeps its own resolver, because the two source formats genuinely differ - one uses
per-aspect override tables, the other condition-matched variant arrays. Merging them would be
the wrong kind of sharing. Both are pure functions of `(device, options)`, which is what makes
them snapshot-testable across every device and option combination.

## Input

One key map, replacing four byte-identical copies. One press path, used by both the keyboard and
the on-screen controller.

Press state is data rather than a DOM side effect: the original themes each queried
`[data-btn=...]` and toggled a class for 120ms, whereas here the provider tracks which buttons
are lit and the cluster renders from it.

Held buttons are tracked separately from the press flash, because two behaviours depend on real
hold state rather than on a press event - hold-to-power-off, and a three-button exit chord. A
window that loses focus mid-hold clears the held set, since the keyup will never arrive.

## Animation

Motion is declared as descriptors and compiled to a renderer-neutral timeline, with the Web
Animations adapter as the only web-specific part. See [animation.md](animation.md).

## Render modes

`RenderModeProvider` switches between `web` and `fallback`. Widgets relying on a capability a
simple renderer lacks - blur, shaders, arbitrary masks, reflections - declare both, and both are
screenshotted. The degraded look is therefore designed against the original rather than
discovered later. See [portability.md](portability.md).

## Assets

Theme assets live under `app/src/themes/<theme>/assets/` and are resolved through Vite, so a
missing file is a build error rather than a broken image discovered by eye.

`legacy/<theme>/assets/` holds an independent copy. That duplication is deliberate: it keeps the
archive from depending on a path inside the application it exists to validate. See
[legacy.md](legacy.md).

## What a screen may not do

Summarised from [portability.md](portability.md), because it shapes everything above: widgets
take typed props and resolved geometry, never read the cascade, never touch the DOM, and declare
their motion as data. The device bezel and button cluster are exempt - they are mockup-only
chrome, and real hardware has real buttons.

The portable boundary is the contents of `.screen`.
