import THEME from './assets/theme.json'

/**
 * The SPRUCE theme as PyUI loads it for one panel: `config_<w>x<h>.json` with `skin_<w>x<h>/` and
 * `icons_<w>x<h>/`, or `config.json`, `skin/` and `icons/` at 640x480, which has no config of its
 * own (`themes/theme.py:39-58`). `assets/theme.json` carries each panel's config and the pixel size
 * of every image the port draws, because PyUI lays out from image sizes.
 */
export type PanelRes = '640x480' | '720x480' | '720x720' | '752x560' | '960x720' | '1024x768' | '1280x720'

export const PANEL_RESOLUTIONS: readonly PanelRes[] = [
  '640x480',
  '720x480',
  '720x720',
  '752x560',
  '960x720',
  '1024x768',
  '1280x720',
]

interface ThemeConfig {
  readonly list: { readonly size: number; readonly color: string; readonly selectedcolor: string }
  readonly grid: {
    readonly grid1x4: number
    readonly grid3x4: number
    readonly color: string
    readonly selectedcolor: string
  }
  readonly total: { readonly color: string }
  readonly currentpage: { readonly color: string }
  readonly batteryPercentage: { readonly color: string }
  readonly title: { readonly color: string }
  readonly recentsEnabled: boolean
  readonly topBarInitialXOffset: number
  readonly mainMenuColCount?: number
}

interface PanelData {
  readonly w: number
  readonly h: number
  readonly config: ThemeConfig
  readonly sizes: Readonly<Record<string, readonly number[]>>
}

const DATA = THEME as unknown as Readonly<Record<PanelRes, PanelData>>

export interface Panel {
  readonly res: PanelRes
  readonly w: number
  readonly h: number
  /** `_default_multiplier`, `width_multiplier` and `height_multiplier` (`theme.py:72-82`). */
  readonly m: number
  readonly widthMult: number
  readonly heightMult: number
  readonly config: ThemeConfig
  /** An image's size, by its path under the panel's folders without the extension. */
  readonly size: (key: string) => readonly [number, number]
}

export function panelFor(res: PanelRes): Panel {
  const data = DATA[res]
  const sw = data.w / 640
  const sh = data.h / 480
  return {
    res,
    w: data.w,
    h: data.h,
    m: Math.min(sw, sh),
    widthMult: sw > sh ? (sw - sh) / sh + 1 : 1,
    heightMult: sw > sh ? 1 : (sh - sw) / sw + 1,
    config: data.config,
    size: (key) => {
      const s = data.sizes[key]
      if (!s) throw new Error(`spruceOS image size missing: ${res} ${key}`)
      return [s[0]!, s[1]!]
    },
  }
}

/**
 * What text is drawn for, and the size each is set in (`Theme.get_font_size`, `theme.py:543-596`).
 * SPRUCE's `title`, `batteryPercentage`, `currentpage` and `total` sizes are never read: every
 * purpose but the grids and descriptions falls through to `list.size`.
 */
export type FontPurpose = 'list' | 'gridOne' | 'gridMulti' | 'description'

export function fontSize(p: Panel, purpose: FontPurpose): number {
  switch (purpose) {
    case 'list':
      return p.config.list.size
    case 'gridOne':
      return p.config.grid.grid1x4
    case 'gridMulti':
    case 'description':
      return p.config.grid.grid3x4
  }
}
