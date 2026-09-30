import { createContext, use, type CSSProperties, type ReactNode } from 'react'
import { skin } from '../assets'
import { anchor, fit, type Box, type Geometry, type Size } from '../layout'
import type { State } from '../machine'
import type { Palette } from '../palette'
import type { PanelRes } from '../panel'
import { baselineShift, indexText, lineHeight } from '../text'

/**
 * PyUI's drawing calls - `render_image` and `render_text` with a `RenderMode` anchor
 * (`display/display.py:510-700`) - taking the same arguments and landing on the same pixels. PyUI
 * composes every screen from these two and nothing else, so the port does too, rather than
 * widening the shared list and grid widgets to fit a renderer that has no list or grid.
 */

export interface Spruce {
  readonly state: State
  readonly geo: Geometry
  readonly res: PanelRes
  readonly palette: Palette
  readonly animate: boolean
  /** The clock the top bar shows, `%I:%M %p`. */
  readonly clock: string
  /** Whether the volume level is showing in the top bar (3s after a change). */
  readonly volumeShowing: boolean
  /** Seconds of marquee: characters scrolled on the selected row, and on a long value. */
  readonly marquee: number
}

export const SpruceContext = createContext<Spruce | null>(null)

export function useSpruce(): Spruce {
  const s = use(SpruceContext)
  if (!s) throw new Error('spruceOS part outside its theme root')
  return s
}

export type Mode =
  | 'TOP_LEFT'
  | 'TOP_CENTER'
  | 'TOP_RIGHT'
  | 'MIDDLE_LEFT'
  | 'MIDDLE_CENTER'
  | 'MIDDLE_RIGHT'
  | 'BOTTOM_LEFT'
  | 'BOTTOM_CENTER'
  | 'BOTTOM_RIGHT'

export const boxStyle = (b: Box): CSSProperties => ({
  position: 'absolute',
  left: b.x,
  top: b.y,
  width: b.w,
  height: b.h,
})

/**
 * `render_image`: an image at its own size, or fitted into a target box, anchored at a point. Scaled
 * images are filtered linearly, as `SDL_HINT_RENDER_SCALE_QUALITY` "2" does (`display.py:255`).
 */
export function Image({
  src,
  natural,
  x,
  y,
  mode = 'TOP_LEFT',
  tw = null,
  th = null,
}: {
  src: string
  natural: Size
  x: number
  y: number
  mode?: Mode | undefined
  tw?: number | null | undefined
  th?: number | null | undefined
}) {
  const size = tw || th ? fit(natural, tw, th) : natural
  const b = anchor(x, y, size, mode)
  return <img alt="" src={src} draggable={false} style={boxStyle(b)} />
}

/** `render_image` with ZOOM into a box: the image fills it, cropped about its centre (`display.py:526-560`). */
export function Zoomed({
  src,
  natural,
  x,
  y,
  w,
  h,
  mode,
}: {
  src: string
  natural: Size
  x: number
  y: number
  w: number
  h: number
  mode: Mode
}) {
  const b = anchor(x, y, [w, h], mode)
  const scale = Math.max(w / natural[0], h / natural[1])
  const rw = Math.trunc(natural[0] * scale)
  const rh = Math.trunc(natural[1] * scale)
  return (
    <div style={{ ...boxStyle(b), overflow: 'hidden' }}>
      <img
        alt=""
        src={src}
        draggable={false}
        style={{ position: 'absolute', left: (w - rw) / 2, top: (h - rh) / 2, width: rw, height: rh }}
      />
    </div>
  )
}

/** `render_image` with `crop_w`: the image's left part, unscaled (`display.py:576-588`). */
export function Cropped({
  src,
  natural,
  x,
  y,
  mode,
  cropW,
}: {
  src: string
  natural: Size
  x: number
  y: number
  mode: Mode
  cropW: number
}) {
  const w = Math.min(cropW, natural[0])
  const b = anchor(x, y, [natural[0], natural[1]], mode)
  return (
    <div style={{ ...boxStyle({ ...b, w }), overflow: 'hidden' }}>
      <img
        alt=""
        src={src}
        draggable={false}
        style={{ position: 'absolute', left: 0, top: 0, width: natural[0], height: natural[1] }}
      />
    </div>
  )
}

/**
 * `render_text`: one line of `nunwen.ttf`, placed by the box SDL_ttf renders it into - as tall as
 * the font, as wide as the string - and hard-clipped at `clip` when there is one. The browser
 * measures the string, so right and centre anchors land on its width rather than SDL_ttf's.
 */
export function Text({
  s,
  x,
  y,
  size,
  color,
  mode = 'TOP_LEFT',
  clip,
}: {
  s: string
  x: number
  y: number
  size: number
  color: string
  mode?: Mode | undefined
  clip?: number | undefined
}) {
  if (!s) return null
  const h = lineHeight(size)
  const [ym, xm] = mode.split('_') as [string, string]
  const top = ym === 'MIDDLE' ? y - Math.floor(h / 2) : ym === 'BOTTOM' ? y - h : y
  const shift = xm === 'CENTER' ? 'translateX(-50%)' : xm === 'RIGHT' ? 'translateX(-100%)' : undefined
  return (
    <span
      className="spruce-text"
      style={{
        position: 'absolute',
        left: x,
        top: top + baselineShift(size),
        height: h,
        fontSize: size,
        lineHeight: `${h}px`,
        color,
        transform: shift,
        ...(clip !== undefined ? { maxWidth: Math.max(0, clip), overflow: 'hidden' } : null),
      }}
    >
      {s}
    </span>
  )
}

/** The ground: `background.png` stretched over the screen (`Display.clear`, `display.py:459-465`). */
export function Ground() {
  const { res, geo } = useSpruce()
  return (
    <img alt="" src={skin(res, 'background')} draggable={false} style={boxStyle({ x: 0, y: 0, w: geo.w, h: geo.h })} />
  )
}

/**
 * The battery icon for the pinned 75%, not charging (`theme.py:404-426`). The skin names them
 * `power-80%-icon`; the extractor writes `%` as `pct`.
 */
const batteryIcon = (percent: number) =>
  percent >= 81
    ? 'power-full-icon'
    : percent >= 51
      ? 'power-80pct-icon'
      : percent >= 21
        ? 'power-50pct-icon'
        : percent >= 10
          ? 'power-20pct-icon'
          : 'power-0pct-icon'

export const BATTERY = 75

/**
 * The top bar (`menus/common/top_bar.py:80-146`): `bg-title.png` with the spruce logo baked in, the
 * clock left, the title centred, and from the right edge in: the battery number, its icon, Wi-Fi,
 * and the volume for 3s after it changes. `hideIcons` drops everything but the title, as a grid or
 * the Game Switcher showing a game's name does.
 */
export function TopBar({ title, hideIcons = false }: { title: string; hideIcons?: boolean | undefined }) {
  const { res, geo, palette, state, clock, volumeShowing } = useSpruce()
  const p = geo.panel
  const c = geo.topBar.center
  const size = geo.font.list
  const bg = p.size('skin/bg-title')
  const battery = batteryIcon(BATTERY)
  const wifi = state.hw.wifi && state.wifiOn
  const volIcon = `icon-volume-${String(state.volume).padStart(2, '0')}`
  return (
    <>
      <Image src={skin(res, 'bg-title')} natural={bg} x={0} y={0} />
      {hideIcons ? null : (
        <>
          {/* The right-hand group, laid out right to left with 10px between (`top_bar.py:110-135`). */}
          <div
            style={{
              position: 'absolute',
              right: geo.w - geo.topBar.right,
              top: 0,
              height: geo.topH,
              display: 'flex',
              flexDirection: 'row-reverse',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <InlineText s={String(BATTERY)} size={size} color={palette.bar} center={c} />
            <InlineImage src={skin(res, battery)} natural={p.size(`skin/${battery}`)} center={c} />
            {/* The harness pins the signal at GOOD, `icon-wifi-signal-03` (`theme.py:429-441`). */}
            {wifi ? (
              <InlineImage
                src={skin(res, 'icon-wifi-signal-03')}
                natural={p.size('skin/icon-wifi-signal-03')}
                center={c}
              />
            ) : null}
            {volumeShowing ? <InlineText s={String(state.volume)} size={size} color={palette.bar} center={c} /> : null}
            {volumeShowing ? (
              <InlineImage src={skin(res, volIcon)} natural={p.size(`skin/${volIcon}`)} center={c} />
            ) : null}
          </div>
          <Text s={clock} x={geo.topBar.clockX} y={c} size={size} color={palette.bar} mode="MIDDLE_LEFT" />
        </>
      )}
      <Text s={title} x={Math.trunc(geo.w / 2)} y={c} size={size} color={palette.bar} mode="MIDDLE_CENTER" />
    </>
  )
}

/** An item in the top bar's right-hand group, centred on the bar's centre line as MIDDLE_RIGHT does. */
function InlineImage({ src, natural, center }: { src: string; natural: Size; center: number }) {
  return (
    <img
      alt=""
      src={src}
      draggable={false}
      style={{
        position: 'relative',
        flex: 'none',
        width: natural[0],
        height: natural[1],
        marginTop: center - Math.floor(natural[1] / 2),
      }}
    />
  )
}

function InlineText({ s, size, color, center }: { s: string; size: number; color: string; center: number }) {
  const h = lineHeight(size)
  return (
    <span
      className="spruce-text"
      style={{
        position: 'relative',
        flex: 'none',
        height: h,
        fontSize: size,
        lineHeight: `${h}px`,
        color,
        marginTop: center - Math.floor(h / 2) + baselineShift(size),
      }}
    >
      {s}
    </span>
  )
}

/**
 * The bottom bar (`menus/common/bottom_bar.py`): `tips-bar-bg.png`. Its "Okay" and "Back" hints sit
 * beside `icon-A-54` and `icon-B-54`, which SPRUCE ships fully transparent and as wide as the screen,
 * so both land off screen and the bar is a plain strip on every screen.
 */
export function BottomBar() {
  const { res, geo } = useSpruce()
  const bg = geo.panel.size('skin/tips-bar-bg')
  return <Image src={skin(res, 'tips-bar-bg')} natural={bg} x={0} y={geo.h} mode="BOTTOM_LEFT" />
}

/** `add_index_text`: the total, the zero-padded index and "/", and the letter when the list is sorted. */
export function IndexText({ index, total, letter }: { index: number; total: number; letter: string }) {
  const { geo, palette } = useSpruce()
  const size = geo.font.list
  return (
    <div
      style={{
        position: 'absolute',
        right: geo.w - geo.index.x,
        top: geo.index.y - lineHeight(size),
        height: lineHeight(size),
        display: 'flex',
        flexDirection: 'row-reverse',
      }}
    >
      <IndexPart s={String(total)} size={size} color={palette.total} />
      <IndexPart s={`${indexText(index, total)}/`} size={size} color={palette.index} />
      {letter ? <IndexPart s={letter} size={size} color={palette.index} gap={10} /> : null}
    </div>
  )
}

function IndexPart({ s, size, color, gap = 0 }: { s: string; size: number; color: string; gap?: number }) {
  const h = lineHeight(size)
  return (
    <span
      className="spruce-text"
      style={{
        position: 'relative',
        flex: 'none',
        fontSize: size,
        lineHeight: `${h}px`,
        height: h,
        color,
        marginRight: gap,
        top: baselineShift(size),
      }}
    >
      {s}
    </span>
  )
}

/** A screen: the ground, the bars, then its own drawing, in `Display.clear`'s order. */
export function Page({
  title,
  hideIcons,
  children,
}: {
  title: string
  hideIcons?: boolean | undefined
  children?: ReactNode
}) {
  return (
    <>
      <Ground />
      <TopBar title={title} hideIcons={hideIcons} />
      <BottomBar />
      {children}
    </>
  )
}
