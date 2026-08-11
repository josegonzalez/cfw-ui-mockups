import { COLORS, type BackgroundTheme, type VitroSettings } from './library'

/**
 * The resolved look: which colours the UI paints with, given a scheme and a background theme.
 *
 * Two different "light" questions are being answered here and conflating them is the trap. The
 * *UI* is light when the background it sits on is pale - that is `simple-light`, or any theme
 * running the White & Blue scheme. The *background module* is light on its own terms, which for
 * the two simple themes is fixed by the theme name and otherwise follows the scheme.
 *
 * The original wrote `var bgTheme = simple ? theme : theme`, a no-op that reads as if it meant
 * to do something. It did not; the background theme is just the theme.
 */
export interface VitroTokens {
  readonly accent: string
  readonly bg: string
  readonly fg: string
  readonly fgRgb: string
  readonly wash: string
  readonly highlight: string
  /** The UI is dark-on-light. */
  readonly uiLight: boolean
  /** What the background renderer should draw for. */
  readonly bgLight: boolean
}

export function tokens(settings: VitroSettings): VitroTokens {
  const c = COLORS[settings.color] ?? COLORS[9]!
  const theme = settings.theme
  const simple = theme.startsWith('simple')
  const uiLight = theme === 'simple-light' ? true : theme === 'simple-dark' ? false : !!c.light
  const bgLight = theme === 'simple-light' ? true : theme === 'simple-dark' ? false : !!c.light

  return {
    accent: c.accent,
    bg: c.bg,
    fg: uiLight ? '#1f242e' : '#ffffff',
    fgRgb: uiLight ? '31,36,46' : '255,255,255',
    wash: uiLight ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
    /*
     * The selection border is white on a dark photographic background, but on a light scheme or
     * either simple theme white would vanish, so it becomes the accent.
     */
    highlight: uiLight || simple ? c.accent : '#ffffff',
    uiLight,
    bgLight,
  }
}

/** The tokens as custom properties, for the decorative CSS that is not a widget's own. */
export function paletteVariables(settings: VitroSettings): Record<string, string> {
  const t = tokens(settings)
  return {
    '--accent': t.accent,
    '--bg': t.bg,
    '--fg': t.fg,
    '--fg-rgb': t.fgRgb,
    '--wash': t.wash,
    '--highlight': t.highlight,
  }
}

/** `#rrggbb` to a 0-1 triple, for the canvas and shader renderers. */
export function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!m) return null
  return [
    Number.parseInt(m[1]!, 16) / 255,
    Number.parseInt(m[2]!, 16) / 255,
    Number.parseInt(m[3]!, 16) / 255,
  ]
}

export function isSimple(theme: BackgroundTheme): boolean {
  return theme.startsWith('simple')
}
