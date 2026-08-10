/**
 * PORTING NOTES
 * CFW: PlayStation X, a Batocera EmulationStation theme by pajarorrojo
 * Devices: trimui-smart-pro, rg35xx, rg34xx, rg552
 * Source: splash.xml, gamesplash.xml
 * Mode: reproduce
 *
 * The two screens that are not views of the theme at all - each is its own theme root, which is
 * why neither carries the top bar, the hint bar or any of the shared chrome.
 *
 *   - splash      the boot screen: logo, avatar, progress bar, version footer
 *   - gamesplash  the "launching game" card, over the game's own art
 *
 * Layout:
 *   - The splash rule takes the colorset accent rather than the per-system gradient, because a
 *     boot screen is not tied to a system.
 * Buttons:
 *   - Neither screen takes input.
 */
import { ProgressBar } from '../../../widgets/ProgressBar'
import { place } from '../../../layout/box'
import { boxOf } from './Chrome'
import { Icons, MetaRows } from './parts'
import { fanart, marquee } from '../art'
import { avatar, colorsetBackground, consoleArt, frontend, image, overlay } from '../assets'
import type { ColorSet } from '../palette'
import type { PsxGame, PsxSystem } from '../library'
import type { PsxLayout } from '../layout'

export interface SplashProps {
  readonly layout: PsxLayout
  readonly colorset: ColorSet
  /** How far the boot has got. A prop, so the screen is reproducible. */
  readonly progress?: number
}

export function SplashView({ layout, colorset, progress = 0.86 }: SplashProps) {
  const L = layout.splash
  const bg = colorsetBackground(colorset)
  const logo = frontend('Batocera-splash.svg')
  const frame = image('frame-splash.png')
  const face = avatar()

  return (
    <>
      {bg ? <img className="psx-bg" style={{ zIndex: 0 }} src={bg} alt="" /> : null}

      {logo ? (
        <img
          className="psx-img"
          style={{ ...place(boxOf(L.logo)), zIndex: L.logo.z }}
          src={logo}
          alt="Batocera"
        />
      ) : null}

      <div
        className="psx-el psx-glow"
        style={{
          ...place({ ...boxOf(L.welcome), font: L.welcome.font }),
          zIndex: L.welcome.z,
          fontFamily: "'SST Light', 'SST', sans-serif",
          fontWeight: 300,
          textAlign: 'center',
        }}
      >
        Welcome to Playstation X for Batocera
      </div>

      {frame ? (
        <img
          className="psx-img"
          style={{ ...place(boxOf(L.avatarFrame)), zIndex: L.avatarFrame.z }}
          src={frame}
          alt=""
        />
      ) : null}
      {face ? (
        <img
          className="psx-img"
          style={{ ...place(boxOf(L.avatar)), zIndex: L.avatar.z }}
          src={face}
          alt=""
        />
      ) : null}

      <div
        className="psx-el"
        style={{
          ...place({ ...boxOf(L.username), font: L.username.font }),
          zIndex: L.username.z,
          fontFamily: "'SST Light', 'SST', sans-serif",
          fontWeight: 300,
          textAlign: 'center',
        }}
      >
        PlayStation-X
      </div>

      {/* The label sits on top of the bar - the source puts both at y 0.703. */}
      <ProgressBar
        box={boxOf(L.progressbar)}
        value={progress}
        trackColor="var(--psx-splash-progressbar)"
        fillColor="var(--psx-splash-progressbarActive)"
        fillColorEnd="var(--psx-splash-progressbarActiveEnd)"
        className="psx-el"
      />
      <div
        className="psx-splash-label"
        style={{
          ...place({ ...boxOf(L.label), font: L.label.font }),
          zIndex: L.label.z,
          lineHeight: `${L.progressbar.h}px`,
        }}
      >
        Preloading UI
      </div>

      {/*
        The boot screen is not tied to a system, so its rule takes the colorset accent rather
        than the per-system gradient.
      */}
      <div
        className="psx-el"
        style={{
          ...place(boxOf(L.linea)),
          zIndex: L.linea.z,
          background: 'var(--psx-sistema-lineainferior)',
        }}
      />

      <div
        className="psx-el"
        style={{
          ...place({ ...boxOf(L.region), font: L.region.font }),
          zIndex: L.region.z,
          textAlign: 'right',
        }}
      >
        Region: Europe
      </div>

      <div
        className="psx-el"
        style={{
          ...place({ ...boxOf(L.version), font: L.version.font }),
          zIndex: L.version.z,
          color: '#999999',
        }}
      >
        Theme by pajarorrojo - Version 43.1
      </div>
    </>
  )
}

export interface GamesplashProps {
  readonly layout: PsxLayout
  readonly system: PsxSystem
  readonly game: PsxGame
}

export function GamesplashView({ layout, system, game }: GamesplashProps) {
  const L = layout.gamesplash
  const scrim = overlay('overlay-gamesplash')
  const con = system.hasConsole ? consoleArt(system.theme) : null

  return (
    <>
      <img
        className="psx-bg"
        style={{ zIndex: 0, filter: 'brightness(0.63)' }}
        src={fanart(game, 960, 540)}
        alt=""
      />
      {scrim ? <img className="psx-overlay" style={{ zIndex: 1 }} src={scrim} alt="" /> : null}

      <img
        className="psx-img"
        style={{ ...place(boxOf(L.marquee)), zIndex: L.marquee.z }}
        src={marquee(game, 260, 90)}
        alt=""
      />

      <div className="psx-gamename" style={{ ...place(boxOf(L.gamename)), zIndex: L.gamename.z }}>
        <span
          className="name psx-glow"
          style={{ fontFamily: "'SST', sans-serif", fontWeight: 700, fontSize: `${L.gamename.font}px` }}
        >
          {game.name}
        </span>
      </div>

      <MetaRows layout={layout} view={L} game={game} event="_" />
      <Icons layout={layout} view={L} game={game} />

      {con ? (
        <img
          className="psx-img"
          style={{ ...place(boxOf(L.console)), zIndex: L.console.z }}
          src={con}
          alt=""
        />
      ) : null}

      <div
        className="psx-row"
        style={{
          ...place({ ...boxOf(L.loading), font: L.loading.font }),
          gap: `${(L.loading.separator ?? 0.01) * layout.w}px`,
          zIndex: L.loading.z,
          fontFamily: "'SST Light', 'SST', sans-serif",
          fontWeight: 300,
        }}
      >
        <span>Loading ...</span>
        <span style={{ fontSize: `${L.romPath.font}px` }}>{game.rom}</span>
      </div>
    </>
  )
}
