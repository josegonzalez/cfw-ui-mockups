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

Each device is also drawn with its own shell - the bezel, chin, corner radius, body tone, and
whether it has analog sticks and a second shoulder row. A generic body around every panel makes
a 720x720 square read as a tall rectangle with a square hole in it, and an RG552 look like an
RG35XX that someone zoomed in on.

| Slug | Sticks | L2/R2 | Silhouette |
| --- | --- | --- | --- |
| `rg35xx` | - | - | The reference handheld |
| `rg40xx` | - | - | As above, lighter body |
| `miyoo-mini` | - | - | Smallest body, thin bezel, tight corners, cream shell |
| `rg28xx` | - | - | Portrait, tall and narrow |
| `trimui-smart-pro` | 2 | yes | Wide slab under a 16:9 panel |
| `rg-cubexx` | 2 | - | Square panel, wide side bezels, heavily rounded, chunky |
| `rg34xx` | - | - | Wide handheld |
| `rg351m` | 2 | yes | Small body, full controls |
| `rg552` | 2 | yes | Largest body, deep chin |
| `trimui-brick` | - | - | Boxy, near-square corners |

**These are stylised silhouettes, not technical drawings.** They exist so the devices are
distinguishable at a glance, and they are chosen for that rather than measured from hardware.
Where a slug covers a family, the shell follows the base model the slug is named for. The shell
is mockup chrome and sits outside the portable widget vocabulary: real hardware has a real bezel
and real buttons, so none of it translates to a firmware renderer.

Two things about the shell are load-bearing rather than decorative:

- **Controls do not scale with the panel.** A button is about a thumb wide on every device, so
  `controlScale` sizes the cluster against the body rather than against the resolution. Drawn at
  a fixed pixel size, the same cluster looks like jewellery on a 1920x1152 body and like slabs on
  a 480x320 one.
- **The chin is derived, not stored.** `chinHeight()` multiplies the cluster's measured height by
  `controlScale`. A chin recorded separately would eventually disagree with the controls in it,
  and that shows up as clipped buttons or a gap rather than as a failing assertion.

## Adding a device

Add a row above with a lowercase hyphenated slug, the exact panel resolution, the
aspect ratio, and the closest resolution class, and give it a `shell` in
`app/src/device/devices.ts`. Start from the exported `HANDHELD` profile and change only what
makes the device recognisable; a device with no distinguishing features should reuse it
outright.
