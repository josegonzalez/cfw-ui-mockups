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
export interface DeviceShell {
  /** Bezel around the panel, in CSS pixels. Asymmetric where the silhouette calls for it. */
  readonly bezel: { readonly top: number; readonly side: number; readonly bottom: number }
  /** Body corner radius. A tight radius reads as a brick, a generous one as a rounded slab. */
  readonly radius: number
  /** Analog sticks, drawn in a row under the D-pad and face buttons. */
  readonly sticks: 0 | 2
  /** Whether a second shoulder row is drawn for L2 and R2. */
  readonly triggers: boolean
  /**
   * Control size relative to the reference handheld.
   *
   * Buttons are physical objects and roughly a thumb wide on every device, so they do *not*
   * scale with the panel - but they are drawn in CSS pixels beside a panel that does. On a
   * 1920x1152 body, controls at RG35XX size look like they came off a keyring.
   */
  readonly controlScale: number
  /** Body gradient, dark to darker. */
  readonly body: readonly [string, string]
}

/**
 * How tall the cluster is before scaling.
 *
 * Derived rather than stored beside `controlScale`, because a chin that disagrees with the
 * controls in it either crops them or leaves a gap, and two numbers that must agree eventually
 * will not.
 */
export function clusterHeight(shell: DeviceShell): number {
  // Measured from the rendered cluster rather than guessed; `DeviceFrame.test.tsx` re-checks it.
  const base = 134
  return base + (shell.triggers ? 20 : 0) + (shell.sticks ? 58 : 0)
}

/** The chin the body reserves for the controls. */
export function chinHeight(shell: DeviceShell): number {
  return Math.round(clusterHeight(shell) * shell.controlScale)
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
export const HANDHELD: DeviceShell = {
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
    viewScale: 1.1,
    /*
     * The square one. A generic handheld shell around a square panel reads as a tall rectangle
     * with a square hole in it, which is the opposite of what this device looks like. Wide side
     * bezels and a heavy corner radius give it the chunky squared-off body the name refers to,
     * and it carries two sticks.
     */
    shell: {
      bezel: { top: 34, side: 44, bottom: 22 },
      radius: 68,
      sticks: 2,
      triggers: false,
      controlScale: 1.15,
      body: BODY.slate,
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
