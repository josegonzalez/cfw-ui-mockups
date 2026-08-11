/**
 * PORTING NOTES
 * CFW: Vitro Launcher, a Love2D launcher for muOS by KevDoy
 * Devices: rg35xx, rg34xx
 * Source: the All Titles grid
 * Mode: reproduce
 *
 * A paged icon grid with a caption underneath naming the focused game.
 *
 * Layout:
 *   - 7x3 of 68px icons, or 5x2 of 98px when Icon Size is Large. Gap 12 / 15, top 69 / 78.
 * Focus & selection:
 *   - Up and down move within the page only. Left and right move within a row and turn the page
 *     at its edge, landing on the same row's opposite column - which is why paging keeps its
 *     place vertically instead of jumping to a corner.
 * Buttons:
 *   - A launches, X skips a page, Y toggles the bookmark.
 * Transitions:
 *   - The focused icon scales 1.14 over 300ms. Pages swap instantly, as the app does.
 */
import { cover, coverLetter } from '../art'
import { bookmarkGlyph, image, skipGlyph } from '../assets'
import { gridDims } from '../layout'
import { formatPlaytime, type VitroGame, type VitroSettings } from '../library'

export interface AllTitlesProps {
  readonly games: readonly VitroGame[]
  readonly selected: number
  readonly settings: VitroSettings
}

export function AllTitles({ games, selected, settings }: AllTitlesProps) {
  if (games.length === 0) {
    return (
      <div className="empty-state">
        {'No games found.\nAdd folders with info.cfg inside the GAME directory.'}
      </div>
    )
  }

  const d = gridDims(settings)
  const per = d.cols * d.rows
  const page = Math.floor(selected / per)
  const pageCount = Math.ceil(games.length / per)
  const slice = games.slice(page * per, page * per + per)
  const game = games[Math.min(selected, games.length - 1)]!
  const playtime = formatPlaytime(game.playSeconds)

  const arrow = image('glass-arrow-right.png')
  const skip = skipGlyph(settings.button_style)
  const mark = bookmarkGlyph(settings.button_style)
  const bookmarkBadge = image('bookmark.png')
  const showSkip = settings.tooltips && pageCount > 1

  return (
    <>
      <div
        className={`grid-page ${d.layout}`}
        style={{ gridTemplateColumns: `repeat(${d.cols}, auto)` }}
      >
        {slice.map((g, i) => {
          const art = cover(g)
          return (
            <div
              key={g.id}
              className={`gicon${page * per + i === selected ? ' is-focused' : ''}`}
            >
              {art ? (
                <img className="gicon-art" src={art} alt="" draggable={false} />
              ) : (
                <div className="gicon-letter">{coverLetter(g)}</div>
              )}
              {g.bookmarked && bookmarkBadge ? (
                <img className="gicon-bm" src={bookmarkBadge} alt="" />
              ) : null}
            </div>
          )
        })}
      </div>

      {arrow && page > 0 ? (
        <img className="grid-arrow left invertible" src={arrow} alt="" />
      ) : null}
      {arrow && page < pageCount - 1 ? (
        <img className="grid-arrow right invertible" src={arrow} alt="" />
      ) : null}
      {showSkip && skip ? <img className="grid-xskip invertible" src={skip} alt="" /> : null}

      <div className="grid-caption">
        <div className="grid-name">{game.name}</div>
        <div className="grid-info">
          {settings.show_playtime && playtime ? <span>{playtime} Played&nbsp; |&nbsp;</span> : null}
          {mark ? <img className="invertible" src={mark} alt="" /> : null}
          <span>{` to ${game.bookmarked ? 'Unbookmark' : 'Bookmark'}`}</span>
        </div>
      </div>
    </>
  )
}

/**
 * Where the cursor lands after a d-pad press.
 *
 * Exported and pure so the paging rules can be tested without a keyboard. `infinite` is the
 * launcher's Infinite Scrolling setting, which the original carried in its settings schema and
 * never implemented - the rows and pages simply stopped at the ends whatever it was set to.
 */
export function gridMove(
  selected: number,
  dx: number,
  dy: number,
  total: number,
  settings: VitroSettings,
): number {
  const d = gridDims(settings)
  const per = d.cols * d.rows
  const page = Math.floor(selected / per)
  const local = selected - page * per
  const col = local % d.cols
  const row = Math.floor(local / d.cols)
  const pageCount = Math.ceil(total / per)
  const wrap = settings.infinite

  if (dy === -1) {
    if (row > 0) return selected - d.cols
    return wrap ? Math.min(selected + (d.rows - 1) * d.cols, total - 1) : selected
  }
  if (dy === 1) {
    if (row < d.rows - 1 && selected + d.cols < total) return selected + d.cols
    return wrap ? page * per + col : selected
  }
  if (dx === -1) {
    if (col > 0) return selected - 1
    if (page > 0) return clampTo(page - 1, row * d.cols + (d.cols - 1), per, total)
    return wrap ? clampTo(pageCount - 1, row * d.cols + (d.cols - 1), per, total) : selected
  }
  if (dx === 1) {
    if (col < d.cols - 1 && selected + 1 < total) return selected + 1
    if (page < pageCount - 1) return clampTo(page + 1, row * d.cols, per, total)
    return wrap ? clampTo(0, row * d.cols, per, total) : selected
  }
  return selected
}

function clampTo(page: number, local: number, per: number, total: number): number {
  return Math.max(0, Math.min(page * per + local, total - 1))
}

/** X skips forward a page, keeping the cursor's place within it. Always wraps. */
export function skipPage(selected: number, total: number, settings: VitroSettings): number {
  const d = gridDims(settings)
  const per = d.cols * d.rows
  const pageCount = Math.ceil(total / per)
  const page = Math.floor(selected / per)
  const local = selected - page * per
  return clampTo((page + 1) % pageCount, local, per, total)
}
