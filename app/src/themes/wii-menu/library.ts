/**
 * The console the port shows: System Menu 4.3U with only the channels it ships with, the clock and
 * date fixed at the values in the reference capture, and an empty SD card slot.
 */

export type ChannelId =
  | 'disc'
  | 'mii'
  | 'photo'
  | 'shop'
  | 'forecast'
  | 'news'
  | 'internet'
  | 'votes'
  | 'cmoc'
  | 'nintendo'

export interface Channel {
  readonly id: ChannelId
  /** The name the highlight bubble and the preview's own title use. */
  readonly title: string
  /** Whether the preview's Start button can be pressed: only the Disc Channel's cannot, with no disc. */
  readonly startable: boolean
}

export const CHANNELS: Readonly<Record<ChannelId, Channel>> = {
  disc: { id: 'disc', title: 'Disc Channel', startable: false },
  mii: { id: 'mii', title: 'Mii Channel', startable: true },
  photo: { id: 'photo', title: 'Photo Channel', startable: true },
  shop: { id: 'shop', title: 'Wii Shop Channel', startable: true },
  forecast: { id: 'forecast', title: 'Forecast Channel', startable: true },
  news: { id: 'news', title: 'News Channel', startable: true },
  internet: { id: 'internet', title: 'Internet Channel', startable: true },
  votes: { id: 'votes', title: 'Everybody Votes Channel', startable: true },
  cmoc: { id: 'cmoc', title: 'Check Mii Out Channel', startable: true },
  nintendo: { id: 'nintendo', title: 'Nintendo Channel', startable: true },
}

/** Four pages of a 4x3 grid (Wikipedia, "Wii system software", Wii Menu). */
export const PAGES = 4
export const COLS = 4
export const ROWS = 3
export const PER_PAGE = COLS * ROWS
export const SLOTS = PAGES * PER_PAGE

/**
 * The 48 slots, read left to right then top to bottom a page at a time. The Disc Channel is fixed
 * in the first; the rest are the pre-installed and free 4.3U channels in the order the issue lists
 * them, and every other slot is empty.
 */
export const GRID: readonly (ChannelId | null)[] = [
  'disc',
  'mii',
  'photo',
  'shop',
  'forecast',
  'news',
  'internet',
  'votes',
  'cmoc',
  'nintendo',
  ...Array<null>(SLOTS - 10).fill(null),
]

/** The slots holding a channel, in grid order: what the preview's arrows step through. */
export const FILLED: readonly number[] = GRID.flatMap((id, i) => (id ? [i] : []))

/** The clock and date in `docs/themes/wii-menu/reference/frames/menu.png`. */
export const CLOCK = { hour: 9, minute: 12, pm: true } as const
export const DATE = { weekday: 'Fri', month: 2, day: 25 } as const
export const DATE_LABEL = `${DATE.weekday} ${DATE.month}/${DATE.day}`

/** The Message Board's calendar opens on the month of `DATE`, in a year where the 25th of February is a Friday. */
export const CALENDAR = { year: 2022, month: 2, firstWeekday: 2, days: 28 } as const

/**
 * Sample data. The Wii Number is sixteen digits in groups of four; this one is made up, so a
 * still never carries a real console's number.
 */
export const WII_NUMBER = '1234 5678 9012 3456'
