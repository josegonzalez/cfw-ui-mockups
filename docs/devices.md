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
| `rg28xx`            | Anbernic RG28XX               | 640x480    | 4:3    | 640x480   |
| `trimui-smart-pro`  | Trimui Smart Pro              | 1280x720   | 16:9   | 1280x720  |
| `rg-cubexx`         | Anbernic RG CubeXX            | 720x720    | 1:1    | 720x720   |
| `rg34xx`            | Anbernic RG34XX               | 720x480    | 3:2    | other     |
| `rg351m`            | Anbernic RG351M / RG351MP     | 480x320    | 3:2    | other     |
| `rg552`             | Anbernic RG552                | 1920x1152  | 5:3    | other     |
| `trimui-brick`      | Trimui Brick                  | 1024x768   | 4:3    | other     |

The RG28XX was previously recorded here as a 640x480 panel rotated into a 480x640 portrait. A
reference photograph shows a landscape device with the panel the right way up, so the entry is
corrected. Anything that rendered an RG28XX screen was rendering it at the wrong size and in the
wrong orientation.

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

| Slug | Layout | Sticks | Reference | Silhouette |
| --- | --- | --- | --- | --- |
| `rg35xx` | chin | - | yes | Warm grey, large controls, one corner swept away, speaker grille |
| `rg40xx` | flanking | 2 | yes | The CubeXX body around a 4:3 panel, ring-lit sticks |
| `miyoo-mini` | chin | - | yes | Khaki, panel edge to edge across the top, swept corner |
| `rg28xx` | flanking | - | yes | Wide grips, no sticks, both small buttons on the left |
| `trimui-smart-pro` | flanking | 2 | yes | Wide landscape body, pronounced grips, light stick collars |
| `rg-cubexx` | flanking | 2 | yes | Square panel between two grips, ring-lit sticks |
| `rg34xx` | flanking | - | yes | Game Boy Advance homage, indigo, no sticks |
| `rg351m` | flanking | 2 | yes | Slim landscape slab, Select and Start at the top of each grip |
| `rg552` | flanking | 2 | yes | Widest body, panel across nearly the whole face |
| `trimui-brick` | chin | - | yes | Boxy, tight corners, lower body as deep as the panel |

**These are stylised silhouettes, not technical drawings.** They exist so the devices are
distinguishable at a glance. Where a slug covers a family, the shell follows the base model the
slug is named for. The shell is mockup chrome and sits outside the portable widget vocabulary:
real hardware has a real bezel and real buttons, so none of it translates to a firmware renderer.

The **Reference** column matters. A row marked `yes` has its layout, proportions and control
positions read off a product photograph. Every row is marked `yes` today, and getting there took
three rounds of correction: the CubeXX was first drawn as an upright handheld because the name
suggested a square body; six more devices were then drawn with chins on the same reasoning and
five of them turned out to be landscape. The inference was wrong more often than it was right.
**Find a photograph before adding or changing a shell.**

The RG28XX correction went further than the shell. It was recorded as a 640x480 panel rotated into
a 480x640 portrait, and the photograph shows a landscape device with the panel the right way up -
so the panel entry in the table above is corrected too, not just the plastic around it.

The small buttons on a landscape body are described by `aux`, because no two of these devices
arrange them the same way: the RG351M and RG552 split Select and Start across the two grips at the
top, which pushes the pad to the middle and the sticks to the bottom; the CubeXX, RG40XX and
Trimui Smart Pro pair them low on the right opposite a system button; the RG28XX and RG34XX stack
both on the left and leave the right grip bare.

Even where a shell is reference-matched, some things stay deliberately unfaithful. Face buttons
keep their colour coding, which is the mockup's own affordance for reading a control map at a
glance, where several of these devices mould them all in black. The Trimui Brick puts Select and
Start above the pad row rather than between the pad and the faces, and the port keeps them in the
centre column. Body tones come from a small shared palette rather than matching each finish
exactly, though pale bodies carry their own `ink` so the printed names stay legible on them.

Four things about the shell are load-bearing rather than decorative:

- **Controls do not scale with the panel.** A button is about a thumb wide on every device, so
  a chin body's `controlScale` sizes the cluster against the body rather than against the
  resolution. Drawn at a fixed pixel size, the same cluster looks like jewellery on a 1920x1152
  body and like slabs on a 480x320 one.
- **`controlScale` scales sizes, not a transform.** Scaling the whole cluster with
  `transform: scale()` only works near 1: the box has to be narrowed by the same factor to come
  back out at full width, and past about 1.5 the controls stop fitting inside the narrowed box, so
  the grid refuses to shrink and the face buttons walk off the edge of the plastic.
- **A grip needs no `controlScale`.** Its controls are fractions of `gripWidth`, which is itself
  a fraction of the panel width, so one number keeps the whole side in proportion.
- **The chin is derived, not stored.** `chinHeight()` multiplies the cluster's measured height by
  `controlScale` and adds `chinExtra` for bodies with more plastic than their controls need. A
  chin recorded separately would eventually disagree with the controls in it, and that shows up as
  clipped buttons or a gap rather than as a failing assertion.

Control names are printed on the body beneath each button rather than set inside it, which is what
the hardware does - and what keeps a scaled-up cluster narrow enough to fit. `e2e/screens.spec.ts`
asserts no control escapes its body on any route, because nothing in the unit suite can see it:
jsdom has no layout.

## Adding a device

Add a row above with a lowercase hyphenated slug, the exact panel resolution, the
aspect ratio, and the closest resolution class, and give it a `shell` in
`app/src/device/devices.ts`. For an upright device start from the exported `HANDHELD` profile and
change only what makes it recognisable; a device with no distinguishing features should reuse it
outright. For a landscape device, use `layout: 'flanking'` and set `gripWidth` - and find a
photograph first, because form factor is not something to guess at.
