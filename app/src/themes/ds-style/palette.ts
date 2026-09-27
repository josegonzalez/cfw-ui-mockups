/**
 * DS Style's 16 accent themes (`source/original_layout.h:83-85`) and the fixed colours the drawing
 * code uses. The accent is the only colour a theme changes; its bar and icons are images.
 */
export interface Theme {
  readonly id: string
  readonly name: string
  readonly accent: string
}

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`

const NAMES = [
  'Pale Blue',
  'Light Blue',
  'Blue',
  'Dark Blue',
  'Green',
  'Pale Green',
  'Bright Green',
  'Lime',
  'Yellow',
  'Red',
  'Orange',
  'Brown',
  'Pink',
  'Pale Pink',
  'Magenta',
  'Purple',
]
const IDS = [
  'pale_blue',
  'light_blue',
  'blue',
  'dark_blue',
  'green',
  'pale_green',
  'bright_green',
  'lime',
  'yellow',
  'red',
  'orange',
  'brown',
  'pink',
  'pale_pink',
  'magenta',
  'purple',
]
const ACCENTS = [
  0x52738c, 0x299cce, 0x5af7, 0x94, 0xa539, 0x4ac67b, 0xc600, 0x94d600, 0xd6c600, 0xff0010, 0xff9400, 0xbd4a00,
  0xff18a5, 0xd673d6, 0xd600ef, 0x8c00d6,
]

export const THEMES: readonly Theme[] = IDS.map((id, i) => ({ id, name: NAMES[i]!, accent: hex(ACCENTS[i]!) }))

export const WHITE = '#ffffff'
export const BLACK = '#000000'
/** The grey art border, and the search field (`ui.h:166`, `extra_ui.h:51`). */
export const GREY = '#848484'

/** Popup boxes and their borders, light and dark (`ui.h:313-333`, `extra_ui.h:42-49, 85`). */
export const box = (dark: boolean) => ({
  fill: dark ? '#151515' : WHITE,
  border: dark ? '#7b7b7b' : '#494949',
  /** The two-row stripe of the Launching and notice boxes: odd rows, then even. */
  stripe: dark ? (['#0d0d0d', '#1e1e1e'] as const) : ([WHITE, '#e7e7e7'] as const),
})

/** Text drawn "black" is white in dark mode (`dsstyle.c:119`). */
export const ink = (dark: boolean) => (dark ? WHITE : BLACK)

/** `SNAKE_RGB`: a GBA 5-bit channel widened to 8 (`about_snake.h:4`). */
export const snakeRgb = (r: number, g: number, b: number) =>
  hex((((r << 3) | (r >> 2)) << 16) | (((g << 3) | (g >> 2)) << 8) | ((b << 3) | (b >> 2)))
