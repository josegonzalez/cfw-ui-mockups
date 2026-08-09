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
  readonly note?: string
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
  },
  rg40xx: {
    slug: 'rg40xx',
    label: 'Anbernic RG40XX H / V',
    w: 640,
    h: 480,
    aspect: '4:3',
    resolutionClass: '640x480',
    viewScale: 1.3,
  },
  'miyoo-mini': {
    slug: 'miyoo-mini',
    label: 'Miyoo Mini / Mini Plus',
    w: 640,
    h: 480,
    aspect: '4:3',
    resolutionClass: '640x480',
    viewScale: 1.3,
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
  },
  'trimui-smart-pro': {
    slug: 'trimui-smart-pro',
    label: 'Trimui Smart Pro',
    w: 1280,
    h: 720,
    aspect: '16:9',
    resolutionClass: '1280x720',
    viewScale: 0.95,
  },
  'rg-cubexx': {
    slug: 'rg-cubexx',
    label: 'Anbernic RG CubeXX',
    w: 720,
    h: 720,
    aspect: '1:1',
    resolutionClass: '720x720',
    viewScale: 1.1,
  },
  rg34xx: {
    slug: 'rg34xx',
    label: 'Anbernic RG34XX',
    w: 720,
    h: 480,
    aspect: '3:2',
    resolutionClass: 'other',
    viewScale: 1.15,
  },
  rg351m: {
    slug: 'rg351m',
    label: 'Anbernic RG351M / RG351MP',
    w: 480,
    h: 320,
    aspect: '3:2',
    resolutionClass: 'other',
    viewScale: 1.8,
  },
  rg552: {
    slug: 'rg552',
    label: 'Anbernic RG552',
    w: 1920,
    h: 1152,
    aspect: '5:3',
    resolutionClass: 'other',
    viewScale: 0.62,
  },
  'trimui-brick': {
    slug: 'trimui-brick',
    label: 'Trimui Brick',
    w: 1024,
    h: 768,
    aspect: '4:3',
    resolutionClass: 'other',
    viewScale: 1.0,
  },
}

export const DEVICE_SLUGS = Object.keys(DEVICES) as DeviceSlug[]

export function getDevice(slug: DeviceSlug): Device {
  return DEVICES[slug]
}

export function isDeviceSlug(value: string): value is DeviceSlug {
  return Object.hasOwn(DEVICES, value)
}
