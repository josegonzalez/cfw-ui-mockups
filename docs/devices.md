# Device registry

Canonical device slugs and their screen resolutions. Use the slug as the
`<device-slug>` folder name and pass the width and height into the device frame. Render
every screen at the exact resolution listed here. Add a device before building screens
for it.

| Slug                | Device                        | Resolution | Aspect | Class     |
| ------------------- | ----------------------------- | ---------- | ------ | --------- |
| `rg35xx`            | Anbernic RG35XX / Plus / H    | 640x480    | 4:3    | 640x480   |
| `rg40xx`            | Anbernic RG40XX H / V         | 640x480    | 4:3    | 640x480   |
| `miyoo-mini`        | Miyoo Mini / Mini Plus        | 640x480    | 4:3    | 640x480   |
| `rg28xx`            | Anbernic RG28XX               | 480x640    | 3:4    | 640x480 * |
| `trimui-smart-pro`  | Trimui Smart Pro              | 1280x720   | 16:9   | 1280x720  |
| `rg-cubexx`         | Anbernic RG CubeXX            | 720x720    | 1:1    | 720x720   |
| `rg34xx`            | Anbernic RG34XX               | 720x480    | 3:2    | other     |
| `rg351m`            | Anbernic RG351M / RG351MP     | 480x320    | 3:2    | other     |
| `rg552`             | Anbernic RG552                | 1920x1152  | 5:3    | other     |
| `trimui-brick`      | Trimui Brick                  | 1024x768   | 4:3    | other     |

\* The RG28XX uses the 640x480 panel rotated to a 480x640 portrait orientation.

## Resolution classes

Four classes are first-class targets:

- **640x480** 4:3 - the most common SBC handheld panel.
- **1280x720** 16:9 - widescreen devices.
- **720x720** 1:1 - square screens.
- **other** - odd sizes such as 480x320, 720x480, 1024x768 and 1920x1152.

## Shells

Each device is drawn with its own shell: the body layout, bezel, corner radius, body tone, and
whether it has analog sticks, a second shoulder row and a lit stick collar. A generic body around
every panel makes a 720x720 square read as a tall rectangle with a square hole in it.

There are two body layouts, and they are genuinely different bodies rather than one body with
different spacing:

- **`chin`** - the upright arrangement: panel on top, controls in a strip below it.
- **`flanking`** - the landscape controller arrangement: panel in the middle, a rounded grip
  either side, controls stacked down each grip.

| Slug | Layout | Sticks | L2/R2 | Silhouette |
| --- | --- | --- | --- | --- |
| `rg35xx` | chin | - | - | The reference handheld |
| `rg40xx` | chin | - | - | As above, lighter body |
| `miyoo-mini` | chin | - | - | Smallest body, thin bezel, tight corners, cream shell |
| `rg28xx` | chin | - | - | Portrait, tall and narrow |
| `trimui-smart-pro` | chin | 2 | yes | Wide slab under a 16:9 panel |
| `rg-cubexx` | flanking | 2 | - | Landscape, square panel between two grips, ring-lit sticks |
| `rg34xx` | chin | - | - | Wide handheld |
| `rg351m` | chin | 2 | yes | Small body, full controls |
| `rg552` | chin | 2 | yes | Largest body, deep chin |
| `trimui-brick` | chin | - | - | Boxy, near-square corners |

**These are stylised silhouettes, not technical drawings.** They exist so the devices are
distinguishable at a glance. Where a slug covers a family, the shell follows the base model the
slug is named for. The shell is mockup chrome and sits outside the portable widget vocabulary:
real hardware has a real bezel and real buttons, so none of it translates to a firmware renderer.

Only **`rg-cubexx`** is matched against a reference photograph. Its grip positions, control order
and body proportions are read off Anbernic's product shot; the rest are inferred from the device's
general form factor and are the weaker claim. Several of the `chin` entries above are landscape
devices that probably want `flanking` too - they are marked chin because nothing has been checked
against a reference yet, not because a chin is known to be right.

Even where a shell is reference-matched, two things stay deliberately unfaithful. Face buttons
keep their colour coding, which is the mockup's own affordance for reading a control map at a
glance, and the body is drawn in the registry's palette rather than the device's real finish.

Three things about the shell are load-bearing rather than decorative:

- **Controls do not scale with the panel.** A button is about a thumb wide on every device, so
  a chin body's `controlScale` sizes the cluster against the body rather than against the
  resolution. Drawn at a fixed pixel size, the same cluster looks like jewellery on a 1920x1152
  body and like slabs on a 480x320 one.
- **A grip needs no `controlScale`.** Its controls are fractions of `gripWidth`, which is itself
  a fraction of the panel width, so one number keeps the whole side in proportion.
- **The chin is derived, not stored.** `chinHeight()` multiplies the cluster's measured height by
  `controlScale`. A chin recorded separately would eventually disagree with the controls in it,
  and that shows up as clipped buttons or a gap rather than as a failing assertion.

## Adding a device

Add a row above with a lowercase hyphenated slug, the exact panel resolution, the
aspect ratio, and the closest resolution class, and give it a `shell` in
`app/src/device/devices.ts`. For an upright device start from the exported `HANDHELD` profile and
change only what makes it recognisable; a device with no distinguishing features should reuse it
outright. For a landscape device, use `layout: 'flanking'` and set `gripWidth` - and find a
photograph first, because form factor is not something to guess at.
