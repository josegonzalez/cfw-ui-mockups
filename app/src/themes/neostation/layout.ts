import { getDevice, type DeviceSlug } from '../../device/devices'

/**
 * NeoStation's units, resolved for a device.
 *
 * The source sizes everything through flutter_screenutil 5.9.3 against a 640x480 design
 * (`lib/main.dart:1021`, `minTextAdapt: true, splitScreenMode: true`). Its own definitions, kept in
 * `docs/themes/neostation/reference/flutter_screenutil-5.9.3-screen_util.dart.txt:216-251`, are:
 *
 * - `.w`  = W / 640
 * - `.h`  = max(H, 700) / 480 - `splitScreenMode` floors the height at 700, which is why `.h` is
 *   the same on both devices here, and why an earlier reading of it as H / 480 was wrong
 * - `.r`  = min(.w, .h)
 * - `.sp` = min(.w, .h) as well, because of `minTextAdapt`
 * - `.dm` = max(.w, .h)
 *
 * all in logical px, where W and H are the logical screen. The views are written in those units -
 * `u.r(12)` for the source's `12.r` - so a value reads back to its line in the source unchanged.
 * Every function returns **device** px: logical times the device's pixel ratio.
 *
 * The ratio is not something the source says. On the Odin 2 Mini it is measured: the header's tab
 * slot is `32.r` in every version of the source, and 96px wide in the website's 1920x1080 frames,
 * so one `.r` is 3 device px, a 640x360 logical screen. The rg40xx is a 640x480 Linux panel at 1.
 */
const DPR: Partial<Record<DeviceSlug, number>> = {
  'odin2-mini': 3,
  rg40xx: 1,
}

/**
 * Which of the source's platform branches each device takes: the Odin runs Android, the rg40xx a
 * Linux CFW. It decides the Android card and apps grid, the wizard's Permissions step, the
 * Android-only General rows, and BarTOP Shutdown.
 */
/**
 * The device's own text size setting. Flutter multiplies every font size by it
 * (`MediaQuery.textScaler`, clamped 0.6-1.4 at `lib/main.dart:1057-1060`) and leaves boxes alone.
 * The website's frames were taken at Android's "Small" font size: every label in them measures 0.85
 * of the source's size while every box matches it exactly. The rg40xx's Linux has no such setting.
 */
const TEXT_SCALE: Partial<Record<DeviceSlug, number>> = {
  'odin2-mini': 0.85,
  rg40xx: 1,
}

export const PLATFORM: Partial<Record<DeviceSlug, 'android' | 'linux'>> = {
  'odin2-mini': 'android',
  rg40xx: 'linux',
}

/** `Responsive` (`lib/responsive.dart:22-40`), by logical width. */
export type Breakpoint = 'xs' | 'small' | 'medium' | 'large' | 'xl'

export function breakpointOf(logicalWidth: number): Breakpoint {
  if (logicalWidth < 560) return 'xs'
  if (logicalWidth < 690) return 'small'
  if (logicalWidth < 840) return 'medium'
  if (logicalWidth < 1280) return 'large'
  return 'xl'
}

export interface NeoUnits {
  /** Device px. */
  readonly W: number
  readonly H: number
  /** Logical px, what Flutter lays out in. */
  readonly lw: number
  readonly lh: number
  readonly dpr: number
  readonly breakpoint: Breakpoint
  /** Logical px to device px. */
  readonly px: (n: number) => number
  readonly r: (n: number) => number
  readonly w: (n: number) => number
  readonly h: (n: number) => number
  readonly sp: (n: number) => number
  readonly dm: (n: number) => number
  /** A font size in `.r`, after the device's text scale - every text size goes through this. */
  readonly t: (n: number) => number
  readonly textScale: number
}

/** Resolve NeoStation's units for a device. Pure, so every device can be tested. */
export function resolve(device: DeviceSlug): NeoUnits {
  const { w: W, h: H } = getDevice(device)
  const dpr = DPR[device]
  if (dpr === undefined) throw new Error(`NeoStation has no pixel ratio for ${device}`)
  const textScale = TEXT_SCALE[device] ?? 1
  const lw = W / dpr
  const lh = H / dpr
  const sw = lw / 640
  const sh = Math.max(lh, 700) / 480
  const sr = Math.min(sw, sh)
  const sd = Math.max(sw, sh)
  return {
    W,
    H,
    lw,
    lh,
    dpr,
    breakpoint: breakpointOf(lw),
    px: (n) => n * dpr,
    r: (n) => n * sr * dpr,
    w: (n) => n * sw * dpr,
    h: (n) => n * sh * dpr,
    sp: (n) => n * sr * dpr,
    dm: (n) => n * sd * dpr,
    t: (n) => n * sr * dpr * textScale,
    textScale,
  }
}
