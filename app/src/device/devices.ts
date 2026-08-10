/**
 * The device registry.
 *
 * Every screen renders at the exact panel resolution listed here. `docs/devices.md` carries the
 * same table in prose, and `devices.test.ts` asserts the two agree, so the document cannot
 * drift from the code that implements it.
 */

export type DeviceSlug =
  | 'rg35xx'
  | 'rg40xx'
  | 'miyoo-mini'
  | 'rg28xx'
  | 'trimui-smart-pro'
  | 'rg-cubexx'
  | 'rg34xx'
  | 'rg351m'
  | 'rg552'
  | 'trimui-brick'

/** The four first-class panel classes. `other` covers the odd sizes. */
export type ResolutionClass = '640x480' | '1280x720' | '720x720' | 'other'

/**
 * The shell drawn around a panel.
 *
 * **Stylised, not a technical drawing.** These are silhouettes chosen so the devices are
 * distinguishable at a glance - a square chunky body reads as a CubeXX, a wide slab with sticks
 * reads as an RG552 - not measurements of real hardware. Where a slug covers a family, the
 * profile follows the base model the slug is named for.
 *
 * It is mockup chrome and sits outside the portable widget vocabulary: real hardware has a real
 * bezel and real buttons, so none of this translates to a firmware renderer. The portable
 * boundary is the contents of `.screen`, and nothing here may reach inside it.
 */
interface ShellCommon {
  /** Bezel around the panel, in CSS pixels. Asymmetric where the silhouette calls for it. */
  readonly bezel: { readonly top: number; readonly side: number; readonly bottom: number }
  /** Body corner radius. A tight radius reads as a brick, a generous one as a rounded slab. */
  readonly radius: number
  /** Analog sticks. */
  readonly sticks: 0 | 2
  /** Whether L2 and R2 are drawn as well as L and R. */
  readonly triggers: boolean
  /** A lit ring around each stick, which some devices make a feature of. */
  readonly stickRing?: 'rgb' | undefined
  /** Body gradient, dark to darker. */
  readonly body: readonly [string, string]
}

/**
 * The two body layouts.
 *
 * `chin` is the upright Game Boy arrangement: panel on top, controls in a strip below it.
 * `flanking` is the landscape controller arrangement: the panel in the middle with a grip either
 * side, controls stacked down each grip.
 *
 * These are genuinely different bodies rather than one body with different spacing, which is why
 * they are a discriminated union - a `gripWidth` means nothing to a chin and a `controlScale`
 * means nothing to a grip, and an open shape invites both being set and one being ignored.
 */
export type ShellLayout = 'chin' | 'flanking'

export interface ChinShell extends ShellCommon {
  readonly layout: 'chin'
  /**
   * Control size relative to the reference handheld.
   *
   * Buttons are physical objects and roughly a thumb wide on every device, so they do *not*
   * scale with the panel - but they are drawn in CSS pixels beside a panel that does. On a
   * 1920x1152 body, controls at RG35XX size look like they came off a keyring.
   */
  readonly controlScale: number
}

export interface FlankingShell extends ShellCommon {
  readonly layout: 'flanking'
  /**
   * Width of each grip as a fraction of the panel width.
   *
   * A fraction rather than pixels, because the grip has to stay in proportion to the panel it
   * sits beside - the controls on it are sized from this in turn, so one number sets the lot.
   */
  readonly gripWidth: number
  /** A small round button on the left grip, below the stick. */
  readonly functionButton: boolean
}

export type DeviceShell = ChinShell | FlankingShell

/**
 * How tall the chin cluster is before scaling.
 *
 * Derived rather than stored beside `controlScale`, because a chin that disagrees with the
 * controls in it either crops them or leaves a gap, and two numbers that must agree eventually
 * will not.
 */
export function clusterHeight(shell: ChinShell): number {
  // Measured from the rendered cluster rather than guessed; `DeviceFrame.test.tsx` re-checks it.
  const base = 134
  return base + (shell.triggers ? 20 : 0) + (shell.sticks ? 58 : 0)
}

/** The chin the body reserves for the controls. Zero on a flanking body, which has none. */
export function chinHeight(shell: DeviceShell): number {
  if (shell.layout === 'flanking') return 0
  return Math.round(clusterHeight(shell) * shell.controlScale)
}

/** Grip width in pixels, for a flanking body. Zero for a chin body, which has no grips. */
export function gripWidth(shell: DeviceShell, panelWidth: number): number {
  if (shell.layout === 'chin') return 0
  return Math.round(shell.gripWidth * panelWidth)
}

export interface Device {
  readonly slug: DeviceSlug
  readonly label: string
  readonly w: number
  readonly h: number
  readonly aspect: string
  readonly resolutionClass: ResolutionClass
  /**
   * How far the bezel is scaled up for comfortable desktop viewing. A viewing preference, not
   * a device property - the same panel appears at two different scales in two different mockup
   * sets, because each set chose what read best. Nothing inside the screen ever sees it.
   */
  readonly viewScale: number
  readonly shell: DeviceShell
  readonly note?: string
}

/** The body tones the shells are drawn from, so ten devices are not ten arbitrary greys. */
const BODY = {
  graphite: ['#2b2d31', '#1b1c1f'],
  slate: ['#343740', '#20222a'],
  charcoal: ['#26282c', '#141517'],
  ivory: ['#d9d6cf', '#b3afa6'],
} as const satisfies Record<string, readonly [string, string]>

/**
 * The reference handheld: even bezel, generously rounded, no sticks.
 *
 * The starting point for a new device. Change only what makes it recognisable; a device with no
 * distinguishing features should use this outright rather than a near-copy of it.
 */
export const HANDHELD: ChinShell = {
  layout: 'chin',
  bezel: { top: 26, side: 26, bottom: 26 },
  radius: 44,
  sticks: 0,
  triggers: false,
  controlScale: 1,
  body: BODY.graphite,
}

export const DEVICES: Record<DeviceSlug, Device> = {
  rg35xx: {
    slug: 'rg35xx',
    label: 'Anbernic RG35XX / Plus / H',
    w: 640,
    h: 480,
    aspect: '4:3',
    resolutionClass: '640x480',
    viewScale: 1.3,
    shell: HANDHELD,
  },
  rg40xx: {
    slug: 'rg40xx',
    label: 'Anbernic RG40XX H / V',
    w: 640,
    h: 480,
    aspect: '4:3',
    resolutionClass: '640x480',
    viewScale: 1.3,
    shell: { ...HANDHELD, body: BODY.slate },
  },
  'miyoo-mini': {
    slug: 'miyoo-mini',
    label: 'Miyoo Mini / Mini Plus',
    w: 640,
    h: 480,
    aspect: '4:3',
    resolutionClass: '640x480',
    viewScale: 1.3,
    // The smallest body here: thin bezel, short chin, and no sticks at all.
    shell: {
      layout: 'chin',
      bezel: { top: 18, side: 18, bottom: 16 },
      radius: 24,
      sticks: 0,
      triggers: false,
      controlScale: 0.85,
      body: BODY.ivory,
    },
  },
  rg28xx: {
    slug: 'rg28xx',
    label: 'Anbernic RG28XX',
    w: 480,
    h: 640,
    aspect: '3:4',
    resolutionClass: '640x480',
    viewScale: 1.3,
    note: 'The 640x480 panel rotated to a 480x640 portrait orientation.',
    shell: {
      layout: 'chin',
      bezel: { top: 22, side: 22, bottom: 20 },
      radius: 34,
      sticks: 0,
      triggers: false,
      controlScale: 0.9,
      body: BODY.charcoal,
    },
  },
  'trimui-smart-pro': {
    slug: 'trimui-smart-pro',
    label: 'Trimui Smart Pro',
    w: 1280,
    h: 720,
    aspect: '16:9',
    resolutionClass: '1280x720',
    viewScale: 0.95,
    // A wide slab: sticks and a second shoulder row under a 16:9 panel.
    shell: {
      layout: 'chin',
      bezel: { top: 24, side: 26, bottom: 18 },
      radius: 30,
      sticks: 2,
      triggers: true,
      controlScale: 1.3,
      body: BODY.charcoal,
    },
  },
  'rg-cubexx': {
    slug: 'rg-cubexx',
    label: 'Anbernic RG CubeXX',
    w: 720,
    h: 720,
    aspect: '1:1',
    resolutionClass: '720x720',
    viewScale: 0.68,
    /*
     * Matched to Anbernic's product photograph rather than inferred.
     *
     * The name is about the panel, not the body: this is a landscape controller with a square
     * screen in the middle and a rounded grip either side, not an upright handheld. Each grip
     * carries a shoulder at the top, then a circular D-pad or the face diamond, then a
     * ring-lit stick, then a small button at the bottom - the function button on the left, and
     * Select and Start as a pair of pills on the right.
     */
    shell: {
      layout: 'flanking',
      bezel: { top: 53, side: 14, bottom: 69 },
      radius: 160,
      sticks: 2,
      triggers: false,
      stickRing: 'rgb',
      gripWidth: 0.45,
      functionButton: true,
      body: BODY.charcoal,
    },
  },
  rg34xx: {
    slug: 'rg34xx',
    label: 'Anbernic RG34XX',
    w: 720,
    h: 480,
    aspect: '3:2',
    resolutionClass: 'other',
    viewScale: 1.15,
    shell: { ...HANDHELD, bezel: { top: 24, side: 24, bottom: 22 }, radius: 40 },
  },
  rg351m: {
    slug: 'rg351m',
    label: 'Anbernic RG351M / RG351MP',
    w: 480,
    h: 320,
    aspect: '3:2',
    resolutionClass: 'other',
    viewScale: 1.8,
    shell: {
      layout: 'chin',
      bezel: { top: 24, side: 24, bottom: 20 },
      radius: 34,
      sticks: 2,
      triggers: true,
      controlScale: 0.78,
      body: BODY.slate,
    },
  },
  rg552: {
    slug: 'rg552',
    label: 'Anbernic RG552',
    w: 1920,
    h: 1152,
    aspect: '5:3',
    resolutionClass: 'other',
    viewScale: 0.62,
    // The largest body in the registry, and the only clamshell-sized one: a deep chin with
    // sticks below the buttons, and a full set of shoulders.
    shell: {
      layout: 'chin',
      bezel: { top: 32, side: 32, bottom: 26 },
      radius: 36,
      sticks: 2,
      triggers: true,
      controlScale: 2.1,
      body: BODY.graphite,
    },
  },
  'trimui-brick': {
    slug: 'trimui-brick',
    label: 'Trimui Brick',
    w: 1024,
    h: 768,
    aspect: '4:3',
    resolutionClass: 'other',
    viewScale: 1.0,
    // Named for its silhouette, so the corners stay tight.
    shell: {
      layout: 'chin',
      bezel: { top: 20, side: 20, bottom: 18 },
      radius: 16,
      sticks: 0,
      triggers: false,
      controlScale: 1.15,
      body: BODY.charcoal,
    },
  },
}

export const DEVICE_SLUGS = Object.keys(DEVICES) as DeviceSlug[]

export function getDevice(slug: DeviceSlug): Device {
  return DEVICES[slug]
}

export function isDeviceSlug(value: string): value is DeviceSlug {
  return Object.hasOwn(DEVICES, value)
}
