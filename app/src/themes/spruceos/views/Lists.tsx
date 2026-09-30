/**
 * PORTING NOTES
 * CFW: spruceOS (PyUI)   Devices: miyoo-a30 miyoo-flip miyoo-mini miyoo-mini-v4 trimui-brick trimui-smart-pro rg35xx rg40xx rg34xx rg28xx rg-cubexx miniloong-pocket1
 * Source: spruceUI/spruceOS `App/PyUI/main-ui/views/image_list_view.py`, `descriptive_list_view.py`,
 *         `text_list_view.py`, `popup_text_list_view.py`, `non_descriptive_list_view.py`, `list_view.py`
 * Mode: reproduce
 *
 * Layout:        Rows as tall as the theme's selection bar (`bg-list-s`, `bg-list-l`, `bg-list-s2`),
 *                the first 5px under the top bar. A game list leaves the right for the focused game's
 *                picture, fitted into a 320x300 box (scaled by the panel), and crops the selection bar
 *                where the picture starts. A descriptive list (Settings, Apps) sets an icon column an
 *                eighth of the row wide, a title, an optional description below it, and a value at the
 *                right as "<    value    >". A popup is `bg-pop-menu-4` at the top left, over a frozen
 *                copy of the screen beneath it, keeping that screen's title.
 * Focus & selection: the selection bar behind the focused row; colours do not change in SPRUCE.
 *                Lists wrap top to bottom. The index at the bottom right, with the focused row's first
 *                letter only when the rows are in `sorted()` order.
 * Buttons:       UP/DOWN move; L1/R1 page by a window less one; L2/R2 the same by letter; A chooses;
 *                B goes back; MENU opens a popup where the screen has one. Settings take LEFT, RIGHT,
 *                L1 and R1 as a row's own buttons.
 * Transitions:   the focused game's name rotates left a character per redraw (12 a second) once it
 *                has been focused a second, padded with at least eight spaces; PyUI rotates it
 *                whether it fits or not.
 * Notes:         a Miyoo Mini cannot draw popups (`supports_popup_menu`), so its popups are
 *                full-screen text lists titled with the popup's own name.
 */
import { appIcon, boxArt, hasSwitcherShot, skin, switcherShot } from '../assets'
import { APPS } from '../data'
import type { DescRowShape } from '../layout'
import { appRows, configRows, gameList, gameText, settingRows, titleOf, type Screen, type SettingRow } from '../machine'
import { systemOf } from '../library'
import { isAlphabetized, lineHeight, scrollString } from '../text'
import { BottomBar, Cropped, Image, IndexText, Page, Text, TopBar, useSpruce } from './parts'
import { Screens } from './screens'

const letterOf = (texts: readonly string[], sel: number) => (isAlphabetized(texts) ? (texts[sel]?.[0] ?? '') : '')

/** A game list in TEXT_AND_IMAGE view (`image_list_view.py`, TEXT_LEFT_IMAGE_RIGHT). */
export function GameList({ screen }: { screen: Extract<Screen, { kind: 'games' }> }) {
  const { state, geo, res, palette, marquee } = useSpruce()
  const { title, games, named } = gameList(state, screen.source)
  const g = geo.gameList
  const texts = games.map((x) => gameText(x, named))
  const available = g.imgLeft - g.textPad * 2
  const size = geo.font.list
  const mark = geo.panel.size('skin/ic-favorite-mark')
  // The Recents list prefers a game's save-state screenshot to its box art (`recents_menu.py`).
  const picture = (i: number) => {
    const game = games[i]!
    return screen.source.kind === 'recents' && state.hw.stateShots && hasSwitcherShot(game.name)
      ? { src: switcherShot(game.name), natural: [640, 480] as const }
      : { src: boxArt(game.system, game.name), natural: [250, 250] as const }
  }
  return (
    <Page title={title}>
      {games.slice(screen.list.top, screen.list.bottom).map((game, v) => {
        const i = screen.list.top + v
        const y = g.baseY + Math.floor(g.lineH / 2) + v * g.lineH
        const selected = i === screen.sel
        // Only a system's own list marks favourites (`rom_select_options_builder.py`).
        const fav = screen.source.kind === 'system' && state.favourites.includes(`${game.system}/${game.file}`)
        const x = g.textPad + (fav ? mark[0] + 5 : 0)
        const text = selected ? scrollString(texts[i]!, marquee, available, size) : texts[i]!
        return (
          <div key={i}>
            {selected ? (
              <Cropped
                src={skin(res, 'bg-list-s')}
                natural={geo.panel.size('skin/bg-list-s')}
                x={0}
                y={y}
                mode="MIDDLE_LEFT"
                cropW={g.imgLeft}
              />
            ) : null}
            {fav ? (
              <Image src={skin(res, 'ic-favorite-mark')} natural={mark} x={g.textPad} y={y} mode="MIDDLE_LEFT" />
            ) : null}
            <Text
              s={text}
              x={x}
              y={y}
              size={size}
              color={selected ? palette.listSelected : palette.list}
              mode="MIDDLE_LEFT"
              clip={available}
            />
          </div>
        )
      })}
      {games.length ? (
        <>
          <Image {...picture(screen.sel)} x={g.imgX} y={g.imgY} mode="MIDDLE_CENTER" tw={g.img[0]} th={g.img[1]} />
          <IndexText index={screen.sel + 1} total={games.length} letter={letterOf(texts, screen.sel)} />
        </>
      ) : null}
    </Page>
  )
}

export interface DescRow extends SettingRow {
  readonly icon?: { readonly src: string; readonly natural: readonly [number, number] } | undefined
}

/** `DescriptiveListView`: Settings, Apps, a game's configuration, and a game list in ICON_AND_DESC view. */
export function DescList({
  title,
  rows,
  sel,
  top,
  bottom,
}: {
  title: string
  rows: readonly DescRow[]
  sel: number
  top: number
  bottom: number
}) {
  const { geo, res, palette } = useSpruce()
  const shapes: DescRowShape[] = rows.map((r) => ({ icon: r.icon ? '' : undefined, description: r.description }))
  const entry = geo.descEntry(shapes)
  const [ew, eh] = entry.size
  const d = geo.desc
  const iconW = rows.some((r) => r.icon) ? Math.trunc(ew * 0.125) : 0
  const titleSize = geo.font.list
  const descSize = geo.font.gridMulti
  const bg = entry.large ? 'bg-list-l' : 'bg-list-s'
  const texts = rows.map((r) => r.text)
  return (
    <Page title={title}>
      {rows.slice(top, bottom).map((row, v) => {
        const i = top + v
        const y = d.firstY + v * eh
        const selected = i === sel
        const color = selected ? palette.listSelected : palette.list
        const textX = d.offX + iconW + d.fromIcon
        return (
          <div key={i}>
            {selected ? (
              <Image src={skin(res, bg)} natural={geo.panel.size(`skin/${bg}`)} x={0} y={y} tw={geo.w} th={eh} />
            ) : null}
            {row.icon ? (
              <Image
                src={row.icon.src}
                natural={row.icon.natural}
                x={d.offX + Math.floor(iconW / 2)}
                y={y + Math.floor(eh / 2)}
                mode="MIDDLE_CENTER"
                tw={iconW}
                th={Math.trunc(eh * 0.9)}
              />
            ) : null}
            {row.description !== undefined ? (
              <>
                <Text s={row.text} x={textX} y={y + d.textOffY} size={titleSize} color={color} />
                <Text
                  s={row.description}
                  x={textX}
                  y={y + d.textOffY + lineHeight(titleSize)}
                  size={descSize}
                  color={color}
                />
              </>
            ) : (
              <Text
                s={row.text}
                x={textX}
                y={y + Math.floor(eh / 2)}
                size={titleSize}
                color={color}
                mode="MIDDLE_LEFT"
              />
            )}
            {row.value ? (
              <Text
                s={row.value}
                x={geo.w - d.fromIcon}
                y={y + Math.floor(eh / 2)}
                size={titleSize}
                color={color}
                mode="MIDDLE_RIGHT"
              />
            ) : null}
          </div>
        )
      })}
      <IndexText index={sel + 1} total={rows.length} letter={letterOf(texts, sel)} />
    </Page>
  )
}

export function Settings({ screen }: { screen: Extract<Screen, { kind: 'settings' }> }) {
  const { state } = useSpruce()
  const rows = settingRows(state, screen.page)
  return <DescList title="Settings" rows={rows} sel={screen.cur.sel} top={screen.cur.top} bottom={screen.cur.bottom} />
}

export function Config({ screen }: { screen: Extract<Screen, { kind: 'config' }> }) {
  const rows = configRows(screen)
  const label = systemOf(screen.game.split('/')[0]!).label
  return (
    <DescList
      title={`${label} Configuration`}
      rows={rows}
      sel={screen.cur.sel}
      top={screen.cur.top}
      bottom={screen.cur.bottom}
    />
  )
}

export function Apps({ screen }: { screen: Extract<Screen, { kind: 'apps' }> }) {
  const { state, geo, res } = useSpruce()
  const rows: DescRow[] = appRows(state).map((text) => {
    const app = APPS[text.replace(/\(Hidden\)$/, '')]!
    const key = `icons/app/${app.icon.replace(/\.png$/, '')}`
    return { text, description: app.description, icon: { src: appIcon(res, app.icon), natural: geo.panel.size(key) } }
  })
  return <DescList title="Apps" rows={rows} sel={screen.cur.sel} top={screen.cur.top} bottom={screen.cur.bottom} />
}

/** A game list in ICON_AND_DESC view: each game's art as its icon, the list's title as its description. */
export function GameIcons({ screen }: { screen: Extract<Screen, { kind: 'games' }> }) {
  const { state } = useSpruce()
  const { title, games, named } = gameList(state, screen.source)
  const rows: DescRow[] = games.map((g) => ({
    text: gameText(g, named),
    description: title,
    icon: { src: boxArt(g.system, g.name), natural: [250, 250] },
  }))
  return <DescList title={title} rows={rows} sel={screen.list.sel} top={screen.list.top} bottom={screen.list.bottom} />
}

/**
 * A popup: `PopupTextListView` over the screen beneath it, or, on a device without popup support,
 * `TextListView` as a screen of its own.
 */
export function Popup({ screen, beneath }: { screen: Extract<Screen, { kind: 'popup' }>; beneath: Screen }) {
  const { state, geo, res, palette } = useSpruce()
  const size = geo.font.list
  const rows = screen.rows
  const letter = letterOf(rows, screen.cur.sel)
  if (!state.hw.popups) {
    const t = geo.textList
    return (
      <Page title={screen.title}>
        {rows.slice(screen.cur.top, screen.cur.bottom).map((row, v) => {
          const i = screen.cur.top + v
          const y = t.baseY + v * t.lineH
          const selected = i === screen.cur.sel
          return (
            <div key={i}>
              {selected ? (
                <Image src={skin(res, 'bg-list-s')} natural={geo.panel.size('skin/bg-list-s')} x={0} y={y} />
              ) : null}
              <Text
                s={row}
                x={20}
                y={y + Math.floor(t.lineH / 2)}
                size={size}
                color={selected ? palette.listSelected : palette.list}
                mode="MIDDLE_LEFT"
              />
            </div>
          )
        })}
        <IndexText index={screen.cur.sel + 1} total={rows.length} letter={letter} />
      </Page>
    )
  }
  const p = geo.popup
  return (
    <>
      {/* The frozen screen, then `Display.clear` over it: the bars redrawn with the screen's own
          title and every icon, which covers a grid's index and the Game Switcher's strip. */}
      <Screens screen={beneath} />
      <TopBar title={titleOf(state, beneath)} />
      <BottomBar />
      <Image src={skin(res, 'bg-pop-menu-4')} natural={geo.panel.size('skin/bg-pop-menu-4')} x={p.x} y={p.y} />
      {rows.slice(screen.cur.top, screen.cur.bottom).map((row, v) => {
        const i = screen.cur.top + v
        const y = p.y + v * p.lineH
        const selected = i === screen.cur.sel
        return (
          <div key={i}>
            {selected ? (
              <Image src={skin(res, 'bg-list-s2')} natural={geo.panel.size('skin/bg-list-s2')} x={p.x} y={y} />
            ) : null}
            <Text
              s={row}
              x={p.x + p.textX}
              y={y + Math.floor(p.lineH / 2)}
              size={size}
              color={selected ? palette.listSelected : palette.list}
              mode="MIDDLE_LEFT"
            />
          </div>
        )
      })}
      <IndexText index={screen.cur.sel + 1} total={rows.length} letter={letter} />
    </>
  )
}
