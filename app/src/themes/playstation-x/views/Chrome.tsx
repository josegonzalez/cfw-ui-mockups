/**
 * PORTING NOTES
 * CFW: PlayStation X, a Batocera EmulationStation theme by pajarorrojo
 * Devices: trimui-smart-pro, rg35xx, rg34xx, rg552
 * Source: _theme_views/front.xml, top-info.xml, gamelist-overlay.xml, theme.xml
 * Mode: reproduce
 *
 * What sits behind and in front of every view: the background photograph and its Ken Burns
 * drift, the vignette scrim, the character cutout, the top information bar with its rotating
 * ticker, and the bottom rule, footer scrim and hint bar.
 *
 * Layout:
 *   - Background full-bleed at z 45, scrim at 50, cutout at 70 (gamelist) or 98 (system).
 *   - Top bar spans the width; bottom chrome sits on the 0.934 rule.
 * Buttons:
 *   - Reproduced as hint text only. The prompts differ between the system view and a gamelist.
 * Transitions:
 *   - Background drifts and scales over 15-30s; the ticker swaps its two blocks every 5350ms;
 *     the cutout drifts 2.8% of screen width over 22.2s, forever.
 */
import type { CSSProperties } from 'react'
import { useStoryboard } from '../../../anim/useStoryboard'
import { Ticker } from '../../../widgets/Ticker'
import { place } from '../../../layout/box'
import {
  avatar,
  background,
  caratula,
  frontend,
  image,
  overlay,
  overlayArt,
  systemOverlayArt,
} from '../assets'
import { STORYBOARDS } from '../storyboards'
import { formatGameTime, P, type PsxGame, type PsxSystem } from '../library'
import type { ColorSet } from '../palette'
import type { StoryboardEventKey } from '../../../anim/types'
import type { PsxLayout } from '../layout'

export type ChromeView = 'system' | 'gamelist'

export interface ChromeProps {
  readonly layout: PsxLayout
  readonly which: ChromeView
  readonly system: PsxSystem
  readonly game?: PsxGame | undefined
  readonly colorset: ColorSet
  readonly carouselType: string
  /** Which ticker block is showing. The screen owns the cycling. */
  readonly tickerIndex: number
  /**
   * The cursor event the gamelist background follows. Ambient elements ignore it.
   *
   * Motion on or off comes from the screen context rather than a prop, so a static screen and a
   * paused live one settle through exactly the same path.
   */
  readonly event: StoryboardEventKey
}

/**
 * The vignette each view names for itself.
 *
 * `front.xml` uses overlay-systemview and a PS3 variant; ps4Style and single use overlay-single;
 * grid and carousel use overlay-carousel; detailed, full-grid and the media tester use
 * overlay-full-grid.
 */
export function scrimFor(view: string, carouselType: string): string {
  if (view === 'system') {
    return carouselType === 'PS3' ? 'overlay-systemview-ps3' : 'overlay-systemview'
  }
  if (view === 'grid' || view === 'carousel') return 'overlay-carousel'
  if (view === 'detailed' || view === 'fullGrid' || view === 'mediaTester') {
    return 'overlay-full-grid'
  }
  return 'overlay-single'
}

/** The hint prompts. These come from EmulationStation rather than the theme. */
const HELP = {
  system: [
    ['START', 'MENU'],
    ['□', 'SEARCH/RANDOM'],
    ['△', 'NETPLAY'],
    ['✕', 'SELECT'],
    ['✛', 'CHOOSE'],
  ],
  gamelist: [
    ['SELECT', 'OPTIONS'],
    ['START', 'MENU'],
    ['○', 'BACK'],
    ['□', 'SEARCH/RANDOM'],
    ['△', 'GAME OPTIONS'],
    ['✕', 'LAUNCH'],
  ],
} as const

/** The background photograph, its scrim, and the character cutout over both. */
export function Backdrop({ layout, which, system, game, carouselType, event }: ChromeProps) {
  const isSystem = which === 'system'
  /*
   * The system background is ambient and the gamelist one follows the cursor, which is exactly
   * the distinction `useStoryboard` draws: an ambient storyboard plays once and is left alone,
   * so a cursor move does not restart a 30-second drift.
   */
  const {
    attach: bgRef,
    style: bgStyle,
    className: bgClass,
  } = useStoryboard(
    STORYBOARDS[isSystem ? 'background-system' : 'background-gamelist'],
    isSystem ? '_' : event,
  )
  const {
    attach: artRef,
    style: artStyle,
    className: artClass,
  } = useStoryboard(STORYBOARDS['overlay-arts'], isSystem ? '_' : event)

  const bg = background(system.theme)
  const scrim = overlay(scrimFor(isSystem ? 'system' : 'ps4Style', carouselType))

  /*
   * Per-system art in the system view; matched to the game by name in a gamelist, which is what
   * `gamelist-overlay.xml` does with `contains(lower(name), ...)`. A system can opt out, and the
   * source tests `!== false` - so absent means yes.
   */
  const cutout = isSystem
    ? system.hasOverlayArt !== false
      ? systemOverlayArt(system.theme)
      : null
    : game?.overlay
      ? overlayArt(game.overlay)
      : null

  return (
    <>
      {bg ? (
        <img
          ref={bgRef}
          className={`psx-bg ${bgClass}`}
          style={{ ...bgStyle, zIndex: 45 }}
          src={bg}
          alt=""
        />
      ) : null}

      {scrim ? <img className="psx-overlay" style={{ zIndex: 50 }} src={scrim} alt="" /> : null}

      {cutout ? (
        <img
          ref={artRef}
          className={`psx-overlay-art ${artClass}`}
          style={{
            ...artStyle,
            zIndex: isSystem ? layout.system.overlayArt.z : layout.ps4Style.overlayArt.z,
          }}
          src={cutout}
          alt=""
        />
      ) : null}
    </>
  )
}

/** The rule, the footer scrim, the hint bar, the region tag and the folder chip. */
export function BottomChrome({ layout, which, system }: ChromeProps) {
  const L = layout

  return (
    <>
      <div className="psx-pie" style={{ ...place(boxOf(L.pieBarra)), zIndex: L.pieBarra.z }} />
      <div
        className="psx-linea"
        style={{
          ...place(boxOf(L.lineaInferior)),
          zIndex: L.lineaInferior.z,
          ['--psx-lineaFrom' as string]: system.linea[0],
          ['--psx-lineaTo' as string]: system.linea[1],
        }}
      />

      {/*
        The hint bar stops at the battery. Both are frontend elements the theme only positions,
        and EmulationStation lays them out together - it shrinks the prompt row to whatever the
        battery leaves. The mockup draws the prompts as fixed text, so without an explicit stop
        the last prompt runs underneath the battery.
      */}
      <div
        className="psx-help"
        style={{
          ...textLine(L.help),
          zIndex: 99,
          width: `${L.battery.left - L.help.left - L.help.font * 0.5}px`,
          overflow: 'hidden',
        }}
      >
        {HELP[which].map(([glyph, label]) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span className="glyph" data-word={glyph.length > 2 || undefined}>
              {glyph}
            </span>
            <span>{label}</span>
          </span>
        ))}
      </div>

      {L.region.visible !== false ? (
        <div
          className="psx-el"
          style={{
            ...place({ ...boxOf(L.region), font: L.region.font }),
            zIndex: L.region.z,
            textAlign: 'right',
            color: '#aaaaaa',
          }}
        >
          EU
        </div>
      ) : null}

      {/*
        The battery. Fully specified in the theme and never rendered by the original mockup -
        see docs/porting/playstation-x.md.
      */}
      <Battery layout={L} />

      {which === 'system' ? <FolderChip layout={L} system={system} /> : null}
    </>
  )
}

/** A drawn battery at the authored box, since the theme ships no battery image. */
function Battery({ layout }: { layout: PsxLayout }) {
  const box = boxOf(layout.battery)
  const height = box.height * 0.52
  const width = box.width * 0.9

  return (
    <div
      className="psx-el"
      style={{
        ...place(box),
        zIndex: 99,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="battery 85%"
    >
      <span
        style={{
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          border: `${Math.max(1, height * 0.12)}px solid #DFDCDC`,
          borderRadius: `${height * 0.22}px`,
          display: 'block',
        }}
      >
        <span
          style={{
            position: 'absolute',
            inset: `${height * 0.14}px`,
            width: `calc(85% - ${height * 0.28}px)`,
            background: '#DFDCDC',
            borderRadius: `${height * 0.1}px`,
          }}
        />
      </span>
    </div>
  )
}

function FolderChip({ layout, system }: { layout: PsxLayout; system: PsxSystem }) {
  const folder = image('gamefolder.png')

  return (
    <>
      {folder ? (
        <img
          className="psx-img"
          style={{ ...place(boxOf(layout.system.gamefolder)), zIndex: layout.system.gamefolder.z }}
          src={folder}
          alt=""
        />
      ) : null}
      <div
        className="psx-el psx-glow"
        style={textLine(layout.system.systemFolder)}
      >
        /{system.theme}
      </div>
    </>
  )
}

/** The top information bar. */
export function TopInfo(props: ChromeProps) {
  const { layout, which, system, game, colorset, carouselType, tickerIndex } = props
  const T = layout.topInfo
  const isSystem = which === 'system'

  const {
    attach: logoRef,
    style: logoStyle,
    className: logoClass,
  } = useStoryboard(STORYBOARDS['frontend-logo'], '_')
  const {
    attach: coverRef,
    style: coverStyle,
    className: coverClass,
  } = useStoryboard(STORYBOARDS['caratula-top'], '_')
  const {
    attach: trophyRef,
    style: trophyStyle,
    className: trophyClass,
  } = useStoryboard(STORYBOARDS['cheevos-icon'], '_')

  const logo = frontend('Batocera-logo.svg')
  const cover = caratula(system.theme, colorset)
  const trophy = image('trophy-picto.svg')

  const blocks = isSystem
    ? [
        `${system.total} Games  •  ${system.favorites} Favorites  •  ${system.gamesPlayed} Played`,
        `Most played: ${system.mostPlayed}`,
      ]
    : game && P.neverPlayed(game)
      ? // `gameInfoExNull` replaces the ticker when a game has never been played.
        ['Times Played: 0', 'Last Played: never']
      : game
        ? [
            `Times Played: ${game.playcount}  •  Game Time: ${formatGameTime(game.gametime)}`,
            `Last Played: ${game.lastplayed}`,
          ]
        : ['', '']

  return (
    <div className="psx-top" style={{ zIndex: 99 }}>
      {isSystem && logo ? (
        <img
          ref={logoRef}
          className={`psx-img ${logoClass}`}
          style={{ ...place(boxOf(T.frontendLogo)), ...logoStyle, zIndex: T.frontendLogo.z }}
          src={logo}
          alt="Batocera"
        />
      ) : null}

      {!isSystem && T.caratulaTop.visible !== false && cover ? (
        /*
         * Square cover art in a maxSize box much wider than it is tall. Fitting it square keeps
         * it at the authored left edge rather than floating centred in the box.
         */
        <img
          ref={coverRef}
          className={`psx-img ${coverClass}`}
          style={{
            ...place(squareBox(T.caratulaTop)),
            ...coverStyle,
            zIndex: T.caratulaTop.z,
            ...(carouselType === 'PS5' ? { borderRadius: '15%' } : {}),
          }}
          src={cover}
          alt=""
        />
      ) : null}

      {T.plusPicto.visible !== false ? (
        <Picto box={T.plusPicto} src={image('plus-picto-bato.svg')} />
      ) : null}
      <Picto box={T.infoPicto} src={image('info-picto.svg')} />

      <Ticker
        className="psx-glow"
        box={{ ...boxOf(T.infoText), font: T.infoText.font }}
        items={blocks.map((text, i) => ({ key: String(i), content: text }))}
        activeIndex={tickerIndex}
      />

      {T.version.visible !== false ? <Version layout={layout} /> : null}

      <img
        className="psx-img"
        style={{
          ...place(squareBox(T.avatar)),
          zIndex: T.avatar.z,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
        src={avatar() ?? ''}
        alt=""
      />

      <div
        className="txt psx-glow"
        style={textLine(T.username)}
      >
        pajarorrojo
      </div>

      {/*
        The trophy is gold because `cheevosOnColor` says so. The original reached that colour
        with a filter stack over a white icon, which meant it could not follow the accent.
      */}
      {trophy ? (
        <div
          ref={trophyRef}
          className={`psx-trophy ${trophyClass}`}
          style={{
            ...place(squareBox(T.trophy)),
            ...trophyStyle,
            maskImage: `url(${trophy})`,
            WebkitMaskImage: `url(${trophy})`,
          }}
          aria-label="achievements"
        />
      ) : null}

      {T.starPicto.visible !== false ? (
        <Picto box={T.starPicto} src={image('star-picto.png')} />
      ) : null}

      {T.year.visible !== false ? (
        <div className="txt" style={textLine(T.year)}>
          2026
        </div>
      ) : null}

      <div className="txt" style={textLine(T.clock, 'right')}>
        10:24
      </div>
    </div>
  )
}

function Version({ layout }: { layout: PsxLayout }) {
  const T = layout.topInfo
  const dot = image('punto-azul.png')
  const dotSize = 0.011 * layout.w

  return (
    <>
      <div className="txt" style={textLine(T.version)}>
        v.43
      </div>
      {/* The separator dot sits immediately left of the version and centred on it. */}
      {dot ? (
        <img
          className="psx-img"
          style={{
            left: `${T.version.left - dotSize * 1.35}px`,
            top: `${T.version.top + (T.version.h - dotSize) / 2}px`,
            width: `${dotSize}px`,
            height: `${dotSize}px`,
          }}
          src={dot}
          alt=""
        />
      ) : null}
    </>
  )
}

function Picto({ box, src }: { box: PsxLayout; src: string | null }) {
  if (!src) return null
  return <img className="psx-img" style={{ ...place(squareBox(box)) }} src={src} alt="" />
}

/** A resolved node's box, in the shape `place()` wants. */
/**
 * Place a single line of text the way EmulationStation does.
 *
 * ES centres a text element vertically inside its authored box, and the theme relies on it in
 * two distinct ways.
 *
 * When the box has a real height - the top bar's `infoText` is `size 0.387 0.05`, `username`
 * `0.165 0.04` - the line is centred inside it. Placing the text at the box's top edge instead
 * lifts every string by half a line, which is enough to visibly break the alignment against the
 * pictograms sitting beside them.
 *
 * When the height is authored as ~0 - `system_name` is `size 0.6 0.001` - there is no box to
 * centre in, so the line is centred on the `y` coordinate itself. Taking that 0.001 literally
 * gives a half-pixel-tall element, which is exactly what the system name collapsed to before
 * this existed.
 *
 * A height authored as ~0 is not the same as no height at all, and conflating the two lifts an
 * unsized element by half a line. `help` and `systemFolder` author no size, and ES lays them out
 * from their `y` downwards like any other element - so they keep their top edge and size to their
 * own content. The original never hit this case: it called its `textLine` on six elements, five
 * with real boxes and one authored `0.001`.
 */
export function textLine(node: PsxLayout, align?: 'left' | 'right' | 'center'): CSSProperties {
  const font = node.font ?? 16
  const lineHeight = Math.ceil(font * 1.25)
  const sized = node.h !== undefined
  const hasBox = sized && node.h! >= lineHeight * 0.5

  return {
    position: 'absolute',
    left: `${node.left}px`,
    top: `${hasBox || !sized ? node.top : node.top - lineHeight / 2}px`,
    ...(node.w === undefined ? {} : { width: `${node.w}px` }),
    ...(sized ? { height: `${hasBox ? node.h : lineHeight}px` } : {}),
    fontSize: `${font}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
    whiteSpace: 'nowrap',
    ...(node.z === undefined ? {} : { zIndex: node.z }),
  }
}

export function boxOf(node: PsxLayout) {
  return {
    left: node.left,
    top: node.top,
    width: node.w ?? 0,
    height: node.h ?? 0,
    /*
     * `z` travels with the box. It used to be re-applied by hand at every call site, which is a
     * rule that only has to be forgotten once - and was, on the icon row, which then had no
     * z-index at all and painted underneath the z-45 background.
     */
    ...(node.z === undefined ? {} : { z: node.z }),
  }
}

/**
 * The square inscribed in a `maxSize` box.
 *
 * Several icons are authored with a single `maxSize` number, which resolves to a box as wide as
 * the screen fraction and as tall as the height fraction - much wider than tall. The asset is
 * square, so it letterboxes; fitting it square up front keeps it at the authored left edge
 * rather than floating in the middle of a box it never fills.
 */
export function squareBox(node: PsxLayout) {
  const size = Math.min(node.w ?? 0, node.h ?? 0)
  return { left: node.left, top: node.top, width: size, height: size }
}
