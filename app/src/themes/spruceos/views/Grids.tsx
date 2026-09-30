/**
 * PORTING NOTES
 * CFW: spruceOS (PyUI)   Devices: miyoo-a30 miyoo-flip miyoo-mini miyoo-mini-v4 trimui-brick trimui-smart-pro rg35xx rg40xx rg34xx rg28xx rg-cubexx miniloong-pocket1
 * Source: spruceUI/spruceOS `App/PyUI/main-ui/views/grid_view.py`, `menus/main_menu.py`,
 *         `menus/games/game_system_select_menu.py`, `menus/games/roms_menu_common.py`
 * Mode: reproduce
 *
 * Layout:        GridView: columns of `(w - 20) / cols`, rows of the usable height over the row
 *                count. One row (the main menu): icons at their own size on the row's centre, labels'
 *                bottoms at `h * 310 / 480`. Several rows (Games, a game grid): the image lifted by
 *                half a label's height, the selection image behind it fitted to 1.05 x the cell plus
 *                padding, labels bottomed a label's height above the row's foot.
 * Focus & selection: the main menu has no selection image - its `-f` icon and the label's colour
 *                change. Games puts `bg-game-item-f` behind the focused system and swaps in its
 *                colour icon; a game grid puts `grid-game-selected` behind the focused art.
 * Buttons:       D-pad moves (UP from the first cell wraps to the last); L1/R1 page; L2/R2 page by
 *                letter. Main menu: A opens, MENU the popup, B nothing. Games: A opens the system,
 *                MENU its popup, B back.
 * Transitions:   none - `animate_transition` exists but is never called.
 * Notes:         a game grid titles the top bar with the focused game and hides the clock and
 *                icons (`set_top_bar_text_to_selection`).
 */
import { boxArt, skin, systemIcon } from '../assets'
import { gridWindow } from '../cursor'
import type { GridGeometry } from '../layout'
import { gameList, gameText, mainEntries, systemList, type Screen } from '../machine'
import { lineHeight, isAlphabetized } from '../text'
import { Image, IndexText, Page, Text, Zoomed, useSpruce } from './parts'

const ICON: Record<string, string> = {
  recent: 'recent',
  favorite: 'favorite',
  game: 'game',
  app: 'app',
  setting: 'setting',
}

/** The main menu: one row of the theme's `ic-*` icons (`main_menu.py:41-116`). */
export function MainMenu({ screen }: { screen: Extract<Screen, { kind: 'main' }> }) {
  const { state, geo, res, palette } = useSpruce()
  const entries = mainEntries(state)
  const g = geo.main
  const visible = gridWindow(screen.cur, entries.length, 1)
  return (
    <Page title="">
      {visible.map((i, v) => {
        const e = entries[i]!
        const selected = i === screen.cur.sel
        const name = `ic-${ICON[e.id]}-${selected ? 'f' : 'n'}`
        return (
          <div key={i}>
            <Image
              src={skin(res, name)}
              natural={geo.panel.size(`skin/${name}`)}
              x={g.cellX[v]!}
              y={g.cellY[0]!}
              mode="MIDDLE_CENTER"
            />
            <Text
              s={e.label}
              x={g.cellX[v]!}
              y={g.textBottom}
              size={geo.font.gridOne}
              color={selected ? palette.gridSelected : palette.grid}
              mode="BOTTOM_CENTER"
            />
          </div>
        )
      })}
    </Page>
  )
}

/** Where a multi-row grid's cell `v` of the window sits. */
function cell(g: GridGeometry, v: number) {
  return { x: g.cellX[v % g.cols]!, bottom: g.bottomY[Math.trunc(v / g.cols)]!, y: g.cellY[Math.trunc(v / g.cols)]! }
}

/** Games: every system with games, two rows of their icons (`game_system_select_menu.py`). */
export function Systems({ screen }: { screen: Extract<Screen, { kind: 'systems' }> }) {
  const { geo, res, palette } = useSpruce()
  const systems = systemList()
  const g = geo.systems
  const textH = lineHeight(geo.font.gridMulti)
  // `get_grid_multi_row_img_y_offset`: the image is lifted by a label's height, halved (`theme.py:1471-1476`).
  const imgOffset = Math.floor(-textH / 2)
  const labels = systems.map((s) => s.label)
  return (
    <Page title="Games">
      {gridWindow(screen.cur, systems.length, g.rows).map((i, v) => {
        const sys = systems[i]!
        const selected = i === screen.cur.sel
        const c = cell(g, v)
        const icon = `icons/${selected ? 'sel/' : ''}${sys.folder.toLowerCase()}`
        return (
          <div key={i}>
            {selected ? (
              <Image
                src={skin(res, 'bg-game-item-f')}
                natural={geo.panel.size('skin/bg-game-item-f')}
                x={c.x}
                y={c.y}
                mode="MIDDLE_CENTER"
                tw={g.bg[0]}
                th={g.bg[1]}
              />
            ) : null}
            <Image
              src={systemIcon(res, sys.folder, selected)}
              natural={geo.panel.size(icon)}
              x={c.x}
              y={c.y + imgOffset}
              mode="MIDDLE_CENTER"
            />
            <Text
              s={sys.label}
              x={c.x}
              y={c.bottom - textH}
              size={geo.font.gridMulti}
              color={selected ? palette.gridSelected : palette.grid}
              mode="BOTTOM_CENTER"
            />
          </div>
        )
      })}
      <IndexText
        index={screen.cur.sel + 1}
        total={systems.length}
        letter={isAlphabetized(labels) ? labels[screen.cur.sel]![0]! : ''}
      />
    </Page>
  )
}

/** A game list in GRID view: two rows of box art, zoomed to square cells, no labels. */
export function GameGrid({ screen }: { screen: Extract<Screen, { kind: 'games' }> }) {
  const { state, geo, res } = useSpruce()
  const { games, named } = gameList(state, screen.source)
  const g = geo.gameGrid
  const texts = games.map((x) => gameText(x, named))
  const focused = games[screen.grid.sel]
  // With no labels the image still lifts by the theme's default 25, halved (`theme.py:1471-1476`).
  const imgOffset = Math.floor(-25 / 2)
  return (
    <Page title={focused ? gameText(focused, named) : ''} hideIcons>
      {gridWindow(screen.grid, games.length, g.rows).map((i, v) => {
        const game = games[i]!
        const c = cell(g, v)
        return (
          <div key={i}>
            {i === screen.grid.sel ? (
              <Image
                src={skin(res, 'grid-game-selected')}
                natural={geo.panel.size('skin/grid-game-selected')}
                x={c.x}
                y={c.y}
                mode="MIDDLE_CENTER"
                tw={g.bg[0]}
                th={g.bg[1]}
              />
            ) : null}
            <Zoomed
              src={boxArt(game.system, game.name)}
              natural={[250, 250]}
              x={c.x}
              y={c.y + imgOffset}
              w={g.resized}
              h={g.resized}
              mode="MIDDLE_CENTER"
            />
          </div>
        )
      })}
      {games.length ? (
        <IndexText
          index={screen.grid.sel + 1}
          total={games.length}
          letter={isAlphabetized(texts) ? texts[screen.grid.sel]![0]! : ''}
        />
      ) : null}
    </Page>
  )
}
