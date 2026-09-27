/**
 * PORTING NOTES
 * CFW: DS Style            Devices: rg-sp
 * Source: FrankieT19/rg-sp-ds-style 2847683 - source/ui.h (ui_settings), about_snake.h
 * Mode: reproduce
 *
 * Layout:        SET.bmp; nine 14px rows from y=24, the label at x=23 (14 glyphs), the value at
 *                x=119 (17 glyphs), the chosen value in a 112x13 accent box. ^ and v mark more rows
 *                above and below. Help is two pages on SD_LIST.bmp; About is two pages with the
 *                page number where the clock goes, and Snake is a 20x14 board of 8px cells.
 * Focus & selection: The accent box on the chosen value; the menu's rows scroll to keep it on
 *                screen.
 * Buttons:       See machine.ts `settings`: Up/Down move, A enters or changes, Left/Right change
 *                a cycling row, B back, X the row's help, L/R the tab cycle. Help: Left/Right turn
 *                the page. About: A/Right/R and Left/L turn it, START starts Snake, B leaves.
 * Transitions:   None. Snake steps every 134ms in the live build.
 * Notes:         Snake's food is seeded with a constant rather than the clock, so its still is
 *                the same every time. Autoboot's value is the port's own switch; the source
 *                reads it from the files its boot manager writes.
 */
import { background, themeBar } from '../assets'
import {
  BOOT_NAMES,
  BUTTON_NAME,
  CATEGORY_NAMES,
  CONTROL_ACTIONS,
  CONTROL_NAMES,
  QUICK_NAMES,
  SET,
  VIEW_NAMES,
  settingsItems,
  type State,
} from '../machine'
import { THEMES, WHITE, snakeRgb } from '../palette'
import { LANGUAGES } from '../text'
import { TitleBar } from './Chrome'
import { Centered, Img, Rect, Text, useDs } from './parts'

const LABELS = [
  'Clock format',
  'List folders',
  'System names',
  'Clean list',
  'Colour',
  'View',
  'GBA res. art',
  'Art border',
  'Round corners',
  'Vert. side',
  'Horiz. side',
  'Horiz. fit',
  'List artwork',
  'Home button',
  'LCD grid',
  'Stock OS',
  'Autoboot',
  'Reboot',
  'Shutdown',
  'Apps',
  'UI sounds',
  'Startup sound',
  'System icons',
  'Dark mode',
  'Pixel transp.',
  'Boot to',
  'Home screen',
  'Home source',
  'Quick start',
  'Language',
  'Controller',
  'Reset controls',
  'Apps in Games',
]
const BORDER = ['Off', 'Accent', 'Black', 'Grey', 'White']
const ROUND = ['Off', 'Full', 'No Start']
const HSIDE = ['Centre', 'Top', 'Bottom']
const VSIDE = ['Centre', 'Left', 'Right']
const ARTPOS = ['Top', 'Centre', 'Bottom']
const onOff = (b: boolean) => (b ? 'On' : 'Off')

/** Each row's value (`ui.h:236-237`). */
function valueOf(s: State, id: number): string {
  const p = s.prefs
  if (id >= SET.bind0) return BUTTON_NAME[s.bindings[id - SET.bind0]!] ?? '?'
  switch (id) {
    case SET.appsInGames:
      return onOff(p.appsInGames)
    case SET.boot:
      return BOOT_NAMES[p.bootTo]!
    case SET.homeEnabled:
      return onOff(p.homeEnabled)
    case SET.source:
      return s.homeFavourites ? 'Favourites' : 'Recents'
    case SET.quick:
      return QUICK_NAMES[p.quick]!
    case SET.language:
      return LANGUAGES[p.language]!
    case SET.controller:
      return 'RG SP'
    case SET.pt:
      return onOff(p.pt)
    case SET.dark:
      return onOff(p.dark)
    case SET.uiSound:
      return onOff(p.uiSounds)
    case SET.startSound:
      return onOff(p.startupSound)
    case SET.sysIcons:
      return p.systemIcons ? 'Systems' : 'Folders'
    case SET.clock:
      return p.clock12 ? '12 hour' : '24 hour'
    case SET.view:
      return VIEW_NAMES[p.viewmode]!
    case SET.colour:
      return THEMES[p.colour]!.name
    case SET.homeButton:
      return p.homeButton === 1 ? 'Favs' : p.homeButton === 2 ? 'Recents' : 'Apps'
    case SET.folders:
      return p.listFolders === 2 ? 'List + Art' : p.listFolders ? 'List' : 'Off'
    case SET.names:
      return p.fullNames ? 'Full' : 'Short'
    case SET.clean:
      return onOff(p.cleanList)
    case SET.gbaArt:
      return onOff(p.gbaArt)
    case SET.border:
      return BORDER[p.artBorder]!
    case SET.round:
      return ROUND[p.round]!
    case SET.vSide:
      return VSIDE[p.vSide]!
    case SET.hSide:
      return HSIDE[p.hSide]!
    case SET.artPos:
      return ARTPOS[p.artPosition]!
    case SET.lcd:
      return onOff(p.lcd)
    case SET.autoboot:
      return onOff(p.autoboot)
    case SET.hFit:
      return p.hFit ? 'Contain' : 'Overlap'
    default:
      return '>'
  }
}

function Help() {
  const ds = useDs()
  const s = ds.state
  const label = (action: (typeof CONTROL_ACTIONS)[number]) =>
    BUTTON_NAME[s.bindings[CONTROL_ACTIONS.indexOf(action)]!] ?? '?'
  const rows: [string, string][] =
    s.helpPage === 1
      ? [
          [label('accept'), 'Open / change'],
          [label('back'), 'Back / cancel'],
          [label('view'), 'Search / help'],
          [label('fav'), 'Set favourite'],
          [label('recent'), 'View / source'],
          [label('pgup'), 'Previous tab'],
          [label('pgdn'), 'Next tab'],
          [label('start'), 'Launch mode'],
          [label('menu'), 'Settings'],
        ]
      : [
          [label('history'), 'Recents'],
          [label('favourites'), 'Favourites'],
          ['D-pad', 'Navigate'],
          ['VOL', 'Volume'],
          ['MENU + VOL', 'Brightness'],
          ['START', 'Startup escape'],
        ]
  return (
    <>
      {rows.map(([key, desc], i) => (
        <div key={i}>
          <Text x={8} y={24 + i * 14} s={key} max={11} />
          <Text x={82} y={24 + i * 14} s={ds.tr(desc)} max={25} />
        </div>
      ))}
      <Text x={220} y={146} s={s.helpPage === 1 ? '1/2' : '2/2'} max={3} />
    </>
  )
}

/** `ui_settings` (`ui.h:225-240`). */
export function Settings() {
  const ds = useDs()
  const s = ds.state
  const categories = s.category < 0
  const items = settingsItems(s)
  const total = categories ? 9 : items.length
  const selected = categories ? s.categoryChoice : s.setting
  const title = s.helpPage ? 'Help' : categories ? 'Settings' : CATEGORY_NAMES[s.category]!
  return (
    <>
      <Img src={background(s.helpPage ? 'SD_LIST' : 'SET', ds.dark)} x={0} y={0} w={240} h={160} />
      <TitleBar title={ds.tr(title)} />
      {s.helpPage ? (
        <Help />
      ) : (
        <>
          {Array.from({ length: Math.min(9, total - s.settingsTop) }, (_, row) => {
            const pos = s.settingsTop + row
            const id = categories ? -1 : items[pos]!
            const y = 24 + row * 14
            const label = id < 0 ? CATEGORY_NAMES[pos]! : id >= SET.bind0 ? CONTROL_NAMES[id - SET.bind0]! : LABELS[id]!
            const value = id < 0 ? '>' : valueOf(s, id)
            const raw = id === SET.controller || id >= SET.bind0
            return (
              <div key={pos}>
                <Text x={23} y={y} s={ds.tr(label)} max={14} />
                {pos === selected ? <Rect x={112} y={y} w={112} h={13} color={ds.accent} /> : null}
                <Text
                  x={119}
                  y={y}
                  s={raw ? value : ds.tr(value)}
                  color={pos === selected ? WHITE : '#000000'}
                  max={17}
                />
              </div>
            )
          })}
          {s.settingsTop ? <Text x={230} y={25} s="^" max={1} /> : null}
          {s.settingsTop + 9 < total ? <Text x={230} y={137} s="v" max={1} /> : null}
        </>
      )}
    </>
  )
}

/* ---- About and Snake (`about_snake.h`) -------------------------------------------------------- */

const ABOUT = [
  [
    'DS Style',
    'Created by FrankieT19.',
    'Originally a Nintendo DS-inspired',
    'GBA frontend for EZ-FLASH Omega',
    'and Omega Definitive Edition.',
    '',
    'Free and open source.',
    '',
    'RG SP port v1.0',
  ],
  [
    'Credits',
    '',
    'LCD grid: based on lcd1x',
    'Gigaherz and jdgleaver',
    '',
    'Pixel Transparency:',
    'Matt Akins (mattakins)',
    '',
    '',
  ],
]

/** `about_header`: the bar, the username, a title, and a number where the clock would be. */
function AboutHeader({ title, number }: { title: string; number: string }) {
  const ds = useDs()
  return (
    <>
      <Img src={themeBar(ds.themeId)} x={0} y={0} w={240} h={19} />
      <Text x={3} y={3} s="DS Style" color={WHITE} max={11} />
      <Centered x={73} y={3} w={94} s={title} color={WHITE} />
      <Text x={237 - number.length * 6} y={3} s={number} color={WHITE} max={20} />
    </>
  )
}

function SnakeBoard() {
  const ds = useDs()
  const sn = ds.state.snake
  const board = ds.dark ? snakeRgb(2, 2, 2) : snakeRgb(29, 29, 29)
  const grid = ds.dark ? snakeRgb(7, 7, 7) : snakeRgb(24, 24, 24)
  const X = 40
  const Y = 33
  return (
    <>
      <Rect x={X} y={Y} w={160} h={112} color={board} />
      {Array.from({ length: 21 }, (_, i) => (
        <Rect key={`c${i}`} x={X + i * 8} y={Y} w={1} h={113} color={grid} />
      ))}
      {Array.from({ length: 15 }, (_, i) => (
        <Rect key={`r${i}`} x={X} y={Y + i * 8} w={161} h={1} color={grid} />
      ))}
      <Rect x={X + sn.food[0] * 8 + 2} y={Y + sn.food[1] * 8 + 2} w={5} h={5} color={snakeRgb(31, 0, 0)} />
      {sn.body.map(([x, y], i) => (
        <Rect key={i} x={X + x * 8 + 1} y={Y + y * 8 + 1} w={7} h={7} color={ds.accent} />
      ))}
      {sn.over ? (
        <>
          <Rect x={51} y={65} w={138} h={38} color={ds.accent} />
          <Text x={51 + (138 - 9 * 6) / 2} y={71} s="Game over" color={WHITE} max={37} />
          <Text x={51 + (138 - 17 * 6) / 2} y={86} s="A: Again  B: Back" color={WHITE} max={37} />
        </>
      ) : null}
    </>
  )
}

/** `about_draw` (`about_snake.h:196-204`). */
export function About() {
  const ds = useDs()
  const s = ds.state
  if (s.snake.active) {
    return (
      <>
        <Img src={background('SD_LIST', ds.dark)} x={0} y={0} w={240} h={160} />
        <AboutHeader title="Snake" number={`${s.snake.body.length - 4} (${s.snake.best})`} />
        <SnakeBoard />
      </>
    )
  }
  return (
    <>
      <Img src={background('SD_LIST', ds.dark)} x={0} y={0} w={240} h={160} />
      <AboutHeader title={ds.tr('About')} number={`${s.aboutPage + 1}/2`} />
      {ABOUT[s.aboutPage]!.map((line, i) =>
        i === 0 ? (
          <Centered key={i} x={0} y={24} w={240} s={ds.tr(line)} />
        ) : (
          <Text key={i} x={14} y={24 + i * 14} s={ds.tr(line)} max={36} />
        ),
      )}
    </>
  )
}
