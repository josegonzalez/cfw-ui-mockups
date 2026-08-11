import type { VitroSettings } from './library'

/**
 * The launcher's metrics.
 *
 * The app scales everything by `s = height / 480`, and both devices are 480 tall, so `s` is 1
 * and every number here is a literal device pixel. Width only matters for centring.
 */
export const COVER_SCALE = { small: 0.75, medium: 1, large: 1.2 } as const

export interface CoverMetrics {
  /** Unfocused tile. */
  readonly w: number
  readonly h: number
  /** Focused tile, which grows in place. */
  readonly wf: number
  readonly hf: number
  readonly radius: number
  readonly radiusFocused: number
  readonly gap: number
}

export function coverMetrics(settings: VitroSettings): CoverMetrics {
  const scale = COVER_SCALE[settings.cover_size] ?? 1.2
  const aspect = 2 / 3 // cover_aspect default 2:3
  const h = 160 * scale
  const hf = 200 * scale
  const w = h * aspect
  const wf = hf * aspect
  return {
    w,
    h,
    wf,
    hf,
    radius: 0.15 * Math.min(w, h),
    radiusFocused: 0.15 * Math.min(wf, hf),
    gap: 20,
  }
}

/**
 * How far the carousel row is translated so the focused tile lands mid-screen.
 *
 * Measured in *target* widths - the unfocused pitch plus half the focused width - because the
 * tile grows as it becomes focused and the scroll has to account for where it will be, not
 * where it is.
 */
export function carouselScroll(index: number, m: CoverMetrics, screenWidth: number): number {
  const centre = index * (m.w + m.gap) + m.wf / 2
  return screenWidth * 0.5 - centre
}

export interface GridDims {
  readonly cols: number
  readonly rows: number
  readonly layout: 'small' | 'large'
}

export function gridDims(settings: VitroSettings): GridDims {
  return settings.all_icon_size === 'large'
    ? { cols: 5, rows: 2, layout: 'large' }
    : { cols: 7, rows: 3, layout: 'small' }
}

/** Rows visible in the settings list at once, and the row pitch. */
export const SETTINGS_WINDOW = 7
export const SETTINGS_ROW_HEIGHT = 42
