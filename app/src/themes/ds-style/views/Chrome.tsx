/**
 * PORTING NOTES
 * CFW: DS Style            Devices: rg-sp
 * Source: FrankieT19/rg-sp-ds-style 2847683 - source/ui.h (ui_titlebar, battery_icon, ui_home, home_corners)
 * Mode: reproduce
 *
 * Layout:        The theme bar across the top 19 rows: the username at 3,3; the title centred in
 *                73..167 and cut at 15 characters; the clock at 189,3, or a choice/count counter
 *                in a list. Battery and Wi-Fi only on Home and Settings. Home is START.bmp with the
 *                recent card (art 56x37, title in three lines of 18), Games, the second button,
 *                and the Reset and Power icons.
 * Focus & selection: Four accent corner brackets on Home's six targets, a frame on Settings.
 * Buttons:       See machine.ts `home`: D-pad between the rows, A acts, SELECT swaps Recents and
 *                Favourites for the card, L/R and Left/Right on the card flip through them, Y
 *                opens Favourites, MENU Settings, L2/R2 Recents/Favourites.
 * Transitions:   The corners glide 200ms on smoothstep and retarget from where they are drawn
 *                (`ui.h:190-209`); the Settings frame appears once they arrive.
 * Notes:         The clock, battery and Wi-Fi are the reference renderer's --demo values: 12:34 PM,
 *                75%, not connected. The launcher reads the real ones every 10s and 2s.
 */
import { background, powerIcon, themeBar } from '../assets'
import { px } from '../layout'
import type { State } from '../machine'
import { cleanTitle, splitStartTitle } from '../text'
import { filename, type Entry } from '../library'
import { WHITE } from '../palette'
import { Art, Centered, Img, Rect, Text, motion, useDs } from './parts'

/** `battery_icon` at 75%, not charging (`ui.h:114-125`). */
function Battery() {
  const level = 75
  return (
    <>
      <BorderPx x={171} y={6} w={12} h={7} />
      <Rect x={183} y={8} w={1} h={3} color={WHITE} />
      <Rect x={173} y={8} w={Math.trunc((level * 8 + 99) / 100)} h={3} color={WHITE} />
    </>
  )
}

function BorderPx({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <>
      <Rect x={x} y={y} w={w} h={1} color={WHITE} />
      <Rect x={x} y={y + h - 1} w={w} h={1} color={WHITE} />
      <Rect x={x} y={y} w={1} h={h} color={WHITE} />
      <Rect x={x + w - 1} y={y} w={1} h={h} color={WHITE} />
    </>
  )
}

/** The demo clock (`ui.h:143`): the reference frames and every still show the same minute. */
export const clockText = (clock12: boolean) => (clock12 ? '12:34 PM' : '12:34:56')

/** `ui_titlebar` (`ui.h:137-145`). */
export function TitleBar({ title }: { title: string }) {
  const ds = useDs()
  const s = ds.state
  const shortTitle = [...title].slice(0, 15).join('')
  const counter = s.page === 1 && s.section !== 3
  const value = counter ? `${s.entries.length ? s.choice + 1 : 0}/${s.entries.length}` : clockText(s.prefs.clock12)
  return (
    <>
      <Img src={themeBar(ds.themeId)} x={0} y={0} w={240} h={19} />
      <Text x={3} y={3} s="DS Style" color={WHITE} max={11} />
      {shortTitle ? <Centered x={73} y={3} w={94} s={shortTitle} color={WHITE} /> : null}
      {counter ? (
        <Text x={Math.max(184, 235 - value.length * 6)} y={3} s={value} color={WHITE} max={9} />
      ) : (
        <Text x={189} y={3} s={value} color={WHITE} max={8} />
      )}
      {s.page === 0 || s.page === 2 ? <Battery /> : null}
    </>
  )
}

/** The six targets' corner boxes (`ui.h:178-189`), with the original renderer's corrections. */
const BOXES = [
  [25, 43, 190, 47],
  [25, 92, 95, 45],
  [120, 92, 95, 45],
  [111, 145, 18, 11],
  [182, 143, 14, 14],
  [201, 143, 14, 14],
] as const

export function cornerPosition(item: number, c: number): [number, number] {
  const b = BOXES[item]!
  let x = b[0] + (c % 2 ? b[2] - 1 : 0)
  let y = b[1] + (c >= 2 ? b[3] - 1 : 0)
  if (item === 0 && c >= 2) y--
  if (item === 1) {
    if (c < 2) y--
    if (c % 2) x--
  }
  if (item === 2) {
    if (c < 2) y--
    if (c % 2 === 0) x++
  }
  if (item >= 3) {
    x += c % 2 ? 1 : -1
    if (c < 2) y -= 2
  } else {
    if (c % 2) x++
    if (c >= 2) y++
  }
  return [x, y]
}

/**
 * `home_corners` (`ui.h:198-209`). Each corner is two accent bars; they glide to the new target on
 * a 200ms smoothstep, and a move mid-glide sets off from where they are - which is what a CSS
 * transition does. On Settings, once they have arrived, a 23x16 frame replaces them.
 */
function Corners({ s }: { s: State }) {
  const ds = useDs()
  if (s.homechoice === 3 && !s.homeMoving) {
    return (
      <>
        <Rect x={109} y={142} w={23} h={3} color={ds.accent} />
        <Rect x={109} y={155} w={23} h={3} color={ds.accent} />
        <Rect x={109} y={142} w={3} h={16} color={ds.accent} />
        <Rect x={129} y={142} w={3} h={16} color={ds.accent} />
      </>
    )
  }
  const glide = motion(ds.animate, [{ property: 'transform', duration: 200, easing: 'smoothstep' }])
  return (
    <>
      {[0, 1, 2, 3].map((c) => {
        const [x, y] = cornerPosition(s.homechoice, c)
        const left = c % 2 === 1
        const up = c >= 2
        return (
          <div
            key={c}
            data-part="home-corner"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate(${px(x)}px, ${px(y)}px)`,
              transition: glide,
            }}
          >
            <Rect x={left ? -8 : 0} y={up ? -2 : 0} w={9} h={3} color={ds.accent} />
            <Rect x={left ? -2 : 0} y={up ? -8 : 0} w={3} h={9} color={ds.accent} />
          </div>
        )
      })}
    </>
  )
}

/** `ui_home` (`ui.h:210-224`). */
export function Home() {
  const ds = useDs()
  const s = ds.state
  const games = s.homeFavourites ? s.favourites : s.recents
  const path = games.length ? games[s.homeRecent >= games.length ? 0 : s.homeRecent]! : ''
  const last: Entry = { name: path ? filename(path) : '', path, dir: false, app: 0 }
  const title = path ? cleanTitle(last.name) : ds.tr(s.homeFavourites ? 'No favourite game' : 'No recent game')
  const lines = splitStartTitle(title)
  const n = lines.length
  const y = n === 3 ? 49 : 66 - Math.trunc((n * 11) / 2) - (n === 1 ? 1 : 0)
  const second = s.prefs.homeButton === 1 ? 'Favs' : s.prefs.homeButton === 2 ? 'Recents' : 'Apps'
  return (
    <>
      <Img src={background('START', ds.dark)} x={0} y={0} w={240} h={160} />
      <TitleBar title="" />
      <Art entry={last} x={30} y={48} w={56} h={37} role={1} />
      {lines.map((line, i) => (
        <Centered key={i} x={93} y={y + i * 11} w={114} s={line} />
      ))}
      <Centered x={42} y={108} w={60} s={ds.tr('Games')} />
      <Centered x={137} y={108} w={60} s={ds.tr(second)} />
      <Img src={powerIcon('RESET', ds.dark)} x={182} y={143} w={14} h={14} />
      <Img src={powerIcon('POWER', ds.dark)} x={201} y={143} w={14} h={14} />
      <Corners s={s} />
    </>
  )
}
