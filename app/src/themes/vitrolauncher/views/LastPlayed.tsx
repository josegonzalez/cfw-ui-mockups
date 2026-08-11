/**
 * PORTING NOTES
 * CFW: Vitro Launcher, a Love2D launcher for muOS by KevDoy
 * Devices: rg35xx, rg34xx
 * Source: the Last Played carousel
 * Mode: reproduce
 *
 * A horizontal shelf of covers. The focused one grows in place and the row slides so it lands
 * mid-screen; its caption fades in beneath.
 *
 * Layout:
 *   - Row centred on y 211. Cover height 160 unfocused, 200 focused, at 2:3, times the Cover Size
 *     setting's 0.75 / 1 / 1.2. Gap 20. Corner radius is 15% of the short edge.
 * Focus & selection:
 *   - Left/Right only. With Infinite Scrolling on the ends wrap; otherwise they clamp.
 * Buttons:
 *   - A launches. Nothing else acts here.
 * Transitions:
 *   - Size, radius and scroll all move together over 300ms on the launcher's own ease-out curve;
 *     the caption fades after a 150ms delay so it arrives once the tile has settled.
 */
import { cover, coverLetter } from '../art'
import { carouselScroll, coverMetrics } from '../layout'
import { formatPlaytime, type VitroGame, type VitroSettings } from '../library'

export interface LastPlayedProps {
  readonly games: readonly VitroGame[]
  readonly selected: number
  readonly settings: VitroSettings
  readonly screenWidth: number
  /** Motion off means the row is placed with no transition, for a static capture. */
  readonly animate: boolean
}

export function LastPlayed({
  games,
  selected,
  settings,
  screenWidth,
  animate,
}: LastPlayedProps) {
  if (games.length === 0) {
    return (
      <div className="empty-state">
        {'No games found.\nAdd folders with info.cfg inside the GAME directory.'}
      </div>
    )
  }

  const m = coverMetrics(settings)
  const scroll = carouselScroll(Math.min(selected, games.length - 1), m, screenWidth)

  return (
    <div
      className="carousel-row"
      style={{
        ['--cov-w' as string]: `${m.w}px`,
        ['--cov-h' as string]: `${m.h}px`,
        ['--cov-wf' as string]: `${m.wf}px`,
        ['--cov-hf' as string]: `${m.hf}px`,
        ['--cov-r' as string]: `${m.radius}px`,
        ['--cov-rf' as string]: `${m.radiusFocused}px`,
        ['--scroll' as string]: `${scroll}px`,
        ...(animate ? {} : { transition: 'none' }),
      }}
    >
      {games.map((game, i) => {
        const art = cover(game)
        const playtime = formatPlaytime(game.playSeconds)
        return (
          <div key={game.id} className={`cov${i === selected ? ' is-focused' : ''}`}>
            {/*
              The letter stands in when a game has no art. The original styled `.cov-letter` and
              then never emitted it, so the fallback was unreachable; generated covers mean it
              still never fires here, but a scraped library is exactly where it would.
            */}
            {art ? (
              <img className="cov-art" src={art} alt="" draggable={false} />
            ) : (
              <div className="cov-letter">{coverLetter(game)}</div>
            )}
            <div className="cov-caption">
              <div className="cov-title">{game.name}</div>
              <div className="cov-playtime">
                {settings.show_playtime && playtime ? `${playtime} Played` : ''}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
