import { createContext, use, type CSSProperties, type ReactNode } from 'react'
import type { TransitionSpec } from '../../../anim/types'
import { transitionsToCss } from '../../../anim/waapi'
import { art as artUrl, hasArt, platformIcon, themeIcon } from '../assets'
import { GLYPH, px } from '../layout'
import { effectiveView, isSystems, type State } from '../machine'
import { parent, systemOf, type Entry } from '../library'
import { BLACK, GREY, THEMES, WHITE } from '../palette'
import { drawable, glyphs, tr } from '../text'

/**
 * DS Style's drawing primitives - `rect`, `border`, `blit`, `icon` and `text` (`source/dsstyle.c:102-124`) -
 * each taking the source's logical coordinates and drawing at the panel's 3x. There is no blending
 * in the source, so there is none here: every element is opaque or absent.
 */

export interface Ds {
  readonly state: State
  readonly accent: string
  readonly themeId: string
  readonly dark: boolean
  readonly animate: boolean
  readonly web: boolean
  readonly tr: (s: string) => string
}

export const DsContext = createContext<Ds | null>(null)

export function useDs(): Ds {
  const ds = use(DsContext)
  if (!ds) throw new Error('DS Style part outside its theme root')
  return ds
}

export function makeDs(state: State, animate: boolean, web: boolean): Ds {
  const theme = THEMES[state.prefs.colour]!
  return {
    state,
    accent: theme.accent,
    themeId: theme.id,
    dark: state.prefs.dark,
    animate,
    web,
    tr: (s) => tr(s, state.prefs.language),
  }
}

/** A transition that exists only while motion is on, so a still is drawn at rest. */
export const motion = (animate: boolean, specs: readonly TransitionSpec[]) => transitionsToCss(animate ? specs : [])

const abs = (x: number, y: number, w: number, h: number): CSSProperties => ({
  position: 'absolute',
  left: px(x),
  top: px(y),
  width: px(w),
  height: px(h),
})

/** `rect`: a filled box. */
export function Rect({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) {
  return <div style={{ ...abs(x, y, w, h), background: color }} />
}

/** `border`: a one-pixel outline drawn on the box's own edge pixels. */
export function Border({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) {
  return <div style={{ ...abs(x, y, w, h), boxSizing: 'border-box', border: `${px(1)}px solid ${color}` }} />
}

/** `blit` and `icon`: an image at a size, already hard-edged by the asset script. */
export function Img({ src, x, y, w, h }: { src: string; x: number; y: number; w: number; h: number }) {
  return <img alt="" src={src} style={{ ...abs(x, y, w, h), imageRendering: 'pixelated' }} />
}

/**
 * `text`: the bitmap face, six pixels a glyph, cut after `max` glyphs. The source draws "black"
 * text white in dark mode (`dsstyle.c:119`), so black here means ink.
 */
export function Text({
  x,
  y,
  s,
  color = BLACK,
  max,
}: {
  x: number
  y: number
  s: string
  color?: string
  max: number
}) {
  const { dark } = useDs()
  const shown = [...drawable(s)].slice(0, Math.max(0, max)).join('')
  return (
    <span
      className="ds-text"
      style={{ position: 'absolute', left: px(x), top: px(y), color: dark && color === BLACK ? WHITE : color }}
    >
      {shown}
    </span>
  )
}

/** `centered` (`ui.h:67-70`): centred by glyph count, never left of the box. */
export function Centered({ x, y, w, s, color }: { x: number; y: number; w: number; s: string; color?: string }) {
  const tx = Math.max(x, x + Math.trunc((w - glyphs(s) * GLYPH) / 2))
  return <Text x={tx} y={y} s={s} color={color ?? BLACK} max={Math.trunc(w / GLYPH)} />
}

/** An absolutely placed group in logical coordinates. */
export function At({ x, y, children, style }: { x: number; y: number; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'absolute', left: px(x), top: px(y), ...style }}>{children}</div>
}

/* ---- icons and art --------------------------------------------------------------------------- */

const ICON_NAMES = [
  'GB',
  'GBC',
  'FC',
  'GG',
  'SMS',
  'PCE',
  'WS',
  'MSX',
  'TXT',
  'other',
  'folder',
  'gba',
  'PS',
  'NDS',
  'PSP',
  'SFC',
  'N64',
  'MD',
  'DREAMCAST',
  'SATURN',
  'disc',
  'cart',
  'apps',
]
const ALIASES: Readonly<Record<string, string>> = {
  PSX: 'PS',
  PLAYSTATION: 'PS',
  SNES: 'SFC',
  GENESIS: 'MD',
  MEGADRIVE: 'MD',
  DC: 'DREAMCAST',
  NES: 'FC',
  FAMICOM: 'FC',
  GAMEGEAR: 'GG',
  MASTERSYSTEM: 'SMS',
  PCENGINE: 'PCE',
  WONDERSWAN: 'WS',
}
const OPTICAL = ['3DO', 'MDCD', 'SEGACD', 'MEGACD', 'PCECD', 'NEOCD', 'AMIGACD32', 'PS2', 'GC', 'WII', 'SATURN']
const EXT_ICONS: readonly [string, string][] = [
  ['.gb', 'GB'],
  ['.gbc', 'GBC'],
  ['.nes', 'FC'],
  ['.gg', 'GG'],
  ['.sms', 'SMS'],
  ['.pce', 'PCE'],
  ['.ws', 'WS'],
  ['.msx', 'MSX'],
  ['.txt', 'TXT'],
]

/** `entry_icon` (`ui.h:93-113`): the 16x14 icon a list row shows. */
export function entryIcon(ds: Ds, e: Entry): string {
  const s = ds.state
  if (e.app) return platformIcon('apps')
  if (e.dir && (!isSystems(s) || !s.prefs.systemIcons)) return themeIcon(ds.themeId, 'folder')
  let dir = e.dir ? e.path : parent(e.path)
  for (let depth = 0; depth < 20 && dir; depth++) {
    const n = dir.slice(dir.lastIndexOf('/') + 1).toUpperCase()
    if (n === 'GBA') return themeIcon(ds.themeId, 'gba')
    const own = ICON_NAMES.find((i) => i.toUpperCase() === n)
    if (own) return platformIcon(own)
    if (ALIASES[n]) return platformIcon(ALIASES[n])
    if (OPTICAL.includes(n)) return platformIcon('disc')
    if (!dir.includes('/')) break
    dir = parent(dir)
  }
  const ext = e.name.slice(e.name.lastIndexOf('.')).toLowerCase()
  if (ext === '.gba' || ext === '.agb') return themeIcon(ds.themeId, 'gba')
  const byExt = EXT_ICONS.find(([x]) => x === ext)
  if (byExt) return platformIcon(byExt[1])
  if (['.chd', '.cue', '.iso', '.gdi', '.pbp'].includes(ext)) return platformIcon('disc')
  return platformIcon('cart')
}

/** The picture `getart` finds: the system's wide art for its folders and games (`artwork.h`). */
function artName(e: Entry): string | null {
  if (e.app) return null
  const sys = systemOf(e.path)?.toUpperCase() ?? null
  if (sys && hasArt(sys)) return sys
  return e.dir ? null : 'NOTFOUND'
}

/** `art_size` (`ui.h:146-152`) for a 480x320 picture. */
export function artSize(slotW: number, slotH: number, role: number, viewmode: number, hFit: boolean): [number, number] {
  const pw = 480
  const ph = 320
  let h = slotH
  let w = Math.trunc((pw * slotH) / ph)
  if (w < 1) w = 1
  const limit = role !== 1 && viewmode === 2 && !hFit ? 238 : slotW
  if (w > limit) {
    w = limit
    h = Math.trunc((ph * limit) / pw)
  }
  if (h < 1) h = 1
  if (role !== 1 && viewmode === 2 && w & 1 && w < limit) w++
  return [w, h]
}

/** One row's inset for rounded art: 5, 3, 2, 1, 1 in from each end (`ui.h:163`). */
const inset = (j: number, h: number) => {
  const edge = Math.min(j, h - 1 - j)
  return edge === 0 ? 5 : edge === 1 ? 3 : edge === 2 ? 2 : edge < 5 ? 1 : 0
}

/** A stepped outline: `left(j)`/`right(j)` bound row `j`, rows `from..to`; in device px. */
function stepped(from: number, to: number, left: (j: number) => number, right: (j: number) => number): string {
  const pts: string[] = []
  for (let j = from; j <= to; j++) pts.push(`${px(left(j))}px ${px(j)}px`, `${px(left(j))}px ${px(j + 1)}px`)
  for (let j = to; j >= from; j--) pts.push(`${px(right(j))}px ${px(j + 1)}px`, `${px(right(j))}px ${px(j)}px`)
  return `polygon(${pts.join(', ')})`
}

/**
 * `ui_art` (`ui.h:153-173`): a picture sized to its slot, rounded and outlined as the settings say,
 * or the entry's icon when there is no picture. Role 0 is a carousel's centre, 1 Home, 2 a side
 * picture and 3 List + Art.
 */
export function Art({
  entry,
  x,
  y,
  w,
  h,
  role,
}: {
  entry: Entry
  x: number
  y: number
  w: number
  h: number
  role: number
}) {
  const ds = useDs()
  const p = ds.state.prefs
  const home = role === 1
  const side = role === 2
  const name = artName(entry)
  if (!name) {
    const zoom = home || side ? 1 : 2
    return (
      <Img
        src={entryIcon(ds, entry)}
        x={x + Math.trunc((w - 16 * zoom) / 2)}
        y={y + Math.trunc((h - 14 * zoom) / 2)}
        w={16 * zoom}
        h={14 * zoom}
      />
    )
  }
  const [dw, dh] = artSize(w, h, role, p.viewmode, p.hFit)
  let ax: number
  if (side && p.viewmode === 3) ax = p.vSide === 1 ? 7 : p.vSide === 2 ? 91 - dw : 49 - Math.trunc(dw / 2)
  else if (role === 3) ax = x + w - dw
  else ax = x + Math.trunc((w - dw) / 2)
  const ay = y + Math.trunc((h - dh) / 2)
  const rounded = p.round !== 0 && (p.round === 1 || !home)
  const shape = rounded
    ? stepped(
        0,
        dh - 1,
        (j) => inset(j, dh),
        (j) => dw - inset(j, dh),
      )
    : undefined
  let ring: ReactNode = null
  if (p.artBorder && !home) {
    const color =
      p.artBorder === 1 ? (side ? GREY : ds.accent) : p.artBorder === 2 ? BLACK : p.artBorder === 3 ? GREY : WHITE
    if (!rounded) ring = <Border x={ax - 1} y={ay - 1} w={dw + 2} h={dh + 2} color={color} />
    else {
      // The ring is every pixel beside the rounded shape, diagonals included (`ui.h:168-171`):
      // row j spans one pixel past the tightest inset of its neighbouring rows.
      const near = (j: number) =>
        Math.min(...[j - 1, j, j + 1].filter((r) => r >= 0 && r < dh).map((r) => inset(r, dh)))
      ring = (
        <div
          style={{
            ...abs(ax - 1, ay - 1, dw + 2, dh + 2),
            background: color,
            clipPath: stepped(
              0,
              dh + 1,
              (j) => near(j - 1),
              (j) => dw + 2 - near(j - 1),
            ),
          }}
        />
      )
    }
  }
  return (
    <>
      {ring}
      <img
        alt=""
        src={artUrl(name, dw, dh, p.gbaArt)}
        style={{ ...abs(ax, ay, dw, dh), imageRendering: 'pixelated', clipPath: shape }}
      />
    </>
  )
}

export { effectiveView }
