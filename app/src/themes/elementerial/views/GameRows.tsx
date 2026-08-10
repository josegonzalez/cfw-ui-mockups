import { place } from '../../../layout/box'
import type { ElementerialGame } from '../library'

export interface GameRowsProps {
  readonly box: { left: number; top: number; width: number; height: number; hMargin: number; row: number }
  readonly games: readonly ElementerialGame[]
  readonly selectedIndex: number
  readonly font: number
}

/**
 * The game list.
 *
 * Not the shared `TextList` widget, and deliberately so. Two behaviours here are specific to
 * this engine and would be wrong as defaults for everyone else:
 *
 * **It hard-clips rather than ellipsising.** An over-long title simply stops at the list edge -
 * visible in the reference screenshots, where one entry ends mid-word with no marker.
 *
 * **The selection bar spans the full list width while the text is inset.** The shared widget
 * insets content within a full-width bar too, but here the inset is the engine's own list
 * margin rather than row padding, so it is applied to the label alone.
 *
 * There is no scroll animation. The engine's list snaps: the bar and the offset both move in one
 * frame, and easing it would be a change to the thing being reproduced.
 */
export function GameRows({ box, games, selectedIndex, font }: GameRowsProps) {
  // Two counts, and they differ by one whenever the list box is not a whole number of rows.
  // The engine scrolls by whole rows, so the window is sized on rows that fit completely; it
  // also draws whatever the box can show, so the row straddling the bottom edge is still
  // painted and clipped. Sizing both on the same number either loses that row or scrolls early.
  const visible = Math.max(1, Math.floor(box.height / box.row))
  const drawn = Math.max(1, Math.ceil(box.height / box.row))

  // The window follows the selection by the minimum needed, and stops at the end of the list.
  const maxFirst = Math.max(0, games.length - visible)
  const first = Math.min(Math.max(0, selectedIndex - visible + 1), maxFirst)
  const window = games.slice(first, first + drawn)

  return (
    <div className="el-list" style={{ ...place(box), zIndex: 5 }} data-part="list">
      {window.map((game, offset) => {
        const index = first + offset
        return (
          <div
            key={game.name}
            className="el-row"
            style={{
              ...place({ left: 0, top: offset * box.row, width: box.width, height: box.row }),
              fontSize: `${font}px`,
              paddingLeft: `${box.hMargin}px`,
              paddingRight: `${box.hMargin}px`,
            }}
            data-selected={index === selectedIndex || undefined}
          >
            <span>{game.name}</span>
          </div>
        )
      })}
    </div>
  )
}
