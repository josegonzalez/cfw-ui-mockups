/**
 * PORTING NOTES
 * CFW: spruceOS (PyUI)   Devices: miyoo-a30 miyoo-flip miyoo-mini miyoo-mini-v4 trimui-brick trimui-smart-pro rg35xx rg40xx rg34xx rg28xx rg-cubexx miniloong-pocket1
 * Source: spruceUI/spruceOS `App/PyUI/main-ui/display/on_screen_keyboard.py`, `display/display.py:1255-1289`,
 *         `devices/device_common.py:35-53`, `views/empty_view.py`, `menus/games/utils/rom_select_options_builder.py:208-236`
 * Mode: reproduce
 *
 * Layout:        Keyboard: `bg-grid-s` fitted to the screen under the top bar, the prompt, the entry on
 *                `bg-list-l` a key tall, then six rows of 13 keys at `w // 13` pitch, `w // 16` square,
 *                only the focused key (and an active shift or caps) on `bg-btn-01-f`. Messages: lines
 *                a text line plus `5h / 480` apart, centred as a block on the middle of the screen.
 *                The power prompt: its two lines centred at `h / 2` and 100px below.
 * Focus & selection: the keyboard's focus wraps on every edge.
 * Buttons:       Keyboard: A types, B deletes (or cancels when empty), L1 shift, R1 caps, START or
 *                the return key searches. Power: A powers down, X reboots where the device can, B
 *                cancels. Box-art question: A, B, X or Y answers.
 * Transitions:   none.
 * Notes:         the port has no box art to convert, so every answer to the box-art question opens
 *                the list as No does. Leaving PyUI - a game, an app, power, Reload UI - is a black
 *                screen, which is what the device shows while PyUI is down, for 1.5s.
 */
import { skin } from '../assets'
import { fit } from '../layout'
import { KEYS_NORMAL, KEYS_SHIFTED, current, type Screen } from '../machine'
import { lineHeight } from '../text'
import { Carousel } from './Carousel'
import { GameGrid, MainMenu, Systems } from './Grids'
import { Apps, Config, GameIcons, GameList, Popup, Settings } from './Lists'
import { Image, Page, Text, useSpruce } from './parts'
import { Switcher } from './Switcher'

/** The screen on top of the stack, with whatever it is drawn over. */
export function Top() {
  const { state } = useSpruce()
  const screen = current(state)
  const beneath = state.stack[state.stack.length - 2]
  if (screen.kind === 'popup' && beneath) return <Popup screen={screen} beneath={beneath} />
  return <Screens screen={screen} />
}

export function Screens({ screen }: { screen: Screen }) {
  const { state } = useSpruce()
  switch (screen.kind) {
    case 'main':
      return <MainMenu screen={screen} />
    case 'systems':
      return <Systems screen={screen} />
    case 'games':
      return <Games screen={screen} />
    case 'config':
      return <Config screen={screen} />
    case 'apps':
      return <Apps screen={screen} />
    case 'settings':
      return <Settings screen={screen} />
    case 'switcher':
      return <Switcher screen={screen} />
    case 'keyboard':
      return <Keyboard screen={screen} />
    case 'power':
      return <Power />
    case 'boxart':
      return <Message lines={BOXART_PROMPT} />
    case 'popup': {
      const i = state.stack.indexOf(screen)
      const beneath = state.stack[i - 1]
      return beneath ? <Popup screen={screen} beneath={beneath} /> : null
    }
  }
}

function Games({ screen }: { screen: Extract<Screen, { kind: 'games' }> }) {
  const { state } = useSpruce()
  // `ViewCreator` builds an EmptyView for a list with nothing in it (`view_creator.py:66-67`).
  if (!hasGames(screen)) return <Empty />
  switch (state.gameView) {
    case 'TEXT_AND_IMAGE':
      return <GameList screen={screen} />
    case 'GRID':
      return <GameGrid screen={screen} />
    case 'ICON_AND_DESC':
      return <GameIcons screen={screen} />
    case 'CAROUSEL':
      return <Carousel screen={screen} />
  }
}

function hasGames(screen: Extract<Screen, { kind: 'games' }>) {
  return screen.list.bottom > screen.list.top
}

/** `EmptyView`: "No Entries Found" as the title and in the middle (`views/empty_view.py:18-21`). */
function Empty() {
  const { geo, palette } = useSpruce()
  return (
    <Page title="No Entries Found">
      <Text
        s="No Entries Found"
        x={Math.trunc(geo.w / 2)}
        y={Math.trunc(geo.h / 2)}
        size={geo.font.list}
        color={palette.list}
        mode="TOP_CENTER"
      />
    </Page>
  )
}

const BOXART_PROMPT = [
  'Would you like to optimize boxart?',
  'Originals will be converted, be sure to backup!',
  'A = Yes, B = No, X/Y = Never Prompt',
  '',
  'You can manually do this in:',
  'Settings -> Extra Settings -> Optimize BoxArt',
]

/** `display_message_multiline`: a cleared screen, no title, the lines centred as a block. */
function Message({ lines }: { lines: readonly string[] }) {
  const { geo, palette } = useSpruce()
  const size = geo.font.list
  const pitch = lineHeight(size) + Math.trunc((5 * geo.h) / 480)
  const start = Math.floor(geo.h / 2) - Math.floor((lines.length * pitch) / 2)
  return (
    <Page title="">
      {lines.map((line, i) => (
        <Text
          key={i}
          s={line}
          x={Math.floor(geo.w / 2)}
          y={start + i * pitch}
          size={size}
          color={palette.list}
          mode="TOP_CENTER"
        />
      ))}
    </Page>
  )
}

/** `prompt_power_down`: titled "Power", the question and the buttons (`device_common.py:35-53`). */
function Power() {
  const { state, geo, palette } = useSpruce()
  const size = geo.font.list
  const x = Math.floor(geo.w / 2)
  const y = Math.floor(geo.h / 2)
  const options = state.hw.reboot ? 'A = Power Down, X = Reboot, B = Cancel' : 'A = Power Down, B = Cancel'
  return (
    <Page title="Power">
      <Text s="Would you like to power down?" x={x} y={y} size={size} color={palette.list} mode="TOP_CENTER" />
      <Text s={options} x={x} y={y + 100} size={size} color={palette.list} mode="TOP_CENTER" />
    </Page>
  )
}

/** `OnScreenKeyboard.get_input` (`display/on_screen_keyboard.py:30-120`). */
function Keyboard({ screen }: { screen: Extract<Screen, { kind: 'keyboard' }> }) {
  const { geo, res, palette } = useSpruce()
  const size = geo.font.list
  const { keyW, keyPitch } = geo.keyboard
  const p = geo.panel
  const keys = screen.shifted || screen.caps ? KEYS_SHIFTED : KEYS_NORMAL
  let y = geo.topH
  const promptY = y
  y += lineHeight(size)
  const entry = fit(p.size('skin/bg-list-l'), null, keyW)
  const entryY = y
  y += entry[1]
  const keysY = y
  return (
    <Page title="Keyboard">
      <Image src={skin(res, 'bg-grid-s')} natural={p.size('skin/bg-grid-s')} x={0} y={geo.topH} tw={geo.w} th={geo.h} />
      {/* The keyboard's text takes the grid's colours (`theme.py:648-744`). */}
      <Text s="Game Search:" x={10} y={promptY} size={size} color={palette.gridSelected} />
      <Image src={skin(res, 'bg-list-l')} natural={p.size('skin/bg-list-l')} x={0} y={entryY} th={keyW} />
      <Text s={screen.text} x={10} y={entryY} size={size} color={palette.gridSelected} />
      {keys.map((row, r) =>
        row.map((key, k) => {
          const x = 10 + keyPitch * k
          const ky = keysY + r * keyW
          const lit =
            (r === screen.row && k === screen.col) || (key === '⇪' && screen.caps) || (key === '↑' && screen.shifted)
          return (
            <div key={`${r}:${k}`}>
              {lit ? (
                <Image
                  src={skin(res, 'bg-btn-01-f')}
                  natural={p.size('skin/bg-btn-01-f')}
                  x={x}
                  y={ky}
                  tw={keyW}
                  th={keyW}
                />
              ) : null}
              <Text
                s={key}
                x={x + Math.floor(keyW / 2)}
                y={ky + Math.floor(keyW / 2)}
                size={size}
                color={lit ? palette.gridSelected : palette.grid}
                mode="MIDDLE_CENTER"
              />
            </div>
          )
        }),
      )}
    </Page>
  )
}
