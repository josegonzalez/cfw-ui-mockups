/**
 * The theme's seven colour slots, and the eighteen palettes shipped with the menu.
 *
 * NextUI's palette format is seven colours in a fixed order, and N64FlashcartMenu adopts it whole
 * so palettes made for NextUI devices drop straight in. The slot *names* below are the menu's own,
 * because a palette file only carries `color1` through `color7` and the mapping is the thing worth
 * writing down.
 */
export type ColorSlot =
  | 'main'
  | 'primaryAccent'
  | 'secondaryAccent'
  | 'listText'
  | 'listTextSelected'
  | 'hintText'
  | 'background'

/** `color1`..`color7`, in file order. */
export const SLOT_ORDER: readonly ColorSlot[] = [
  'main',
  'primaryAccent',
  'secondaryAccent',
  'listText',
  'listTextSelected',
  'hintText',
  'background',
]

/** What each slot paints, from `docs/20_nextui_theme.md`. */
export const SLOT_MEANING: Record<ColorSlot, string> = {
  main: 'Selection pill, button circles, progress fills',
  primaryAccent: 'Chrome pills, the title pill, the folder placeholder tint',
  secondaryAccent: 'Button glyph letters',
  listText: 'Unselected list text',
  listTextSelected: 'Text on the selection pill',
  hintText: 'Hint pill text, screen titles, load-screen icons',
  background: 'Screen background when no image is set',
}

export type Tokens = Record<ColorSlot, string>

export interface Palette {
  readonly id: string
  readonly name: string
  readonly colors: readonly [string, string, string, string, string, string, string]
  /**
   * A palette may switch the title treatment on. None of the eighteen built-ins do - it is an
   * N64FlashcartMenu extension to NextUI's format, so a palette written for a NextUI device
   * cannot carry it.
   */
  readonly titlePill?: boolean
}

/**
 * The palettes in `assets/palettes/`, transcribed in the order the menu sorts them: built-ins
 * first, then by name. `Default` is NextUI's stock look and is what the menu boots with.
 */
export const PALETTES: readonly Palette[] = [
  {
    id: 'Default',
    name: 'Default',
    colors: ['#ffffff', '#9b2257', '#1e2329', '#ffffff', '#000000', '#ffffff', '#000000'],
  },
  {
    id: 'Brick_Blush',
    name: 'Brick Blush',
    colors: ['#B5442E', '#F6DFD9', '#FBEAE6', '#33201D', '#FBEAE6', '#8A6259', '#FBECE8'],
  },
  {
    id: 'Catppuccin_Frappe',
    name: 'Catppuccin Frappe',
    colors: ['#A6D189', '#292C3C', '#232634', '#C6D0F5', '#232634', '#A5ADCE', '#303446'],
  },
  {
    id: 'Catppuccin_Latte',
    name: 'Catppuccin Latte',
    colors: ['#8839EF', '#E6E9EF', '#EFF1F5', '#4C4F69', '#EFF1F5', '#6C6F85', '#EFF1F5'],
  },
  {
    id: 'Catppuccin_Macchiato',
    name: 'Catppuccin Macchiato',
    colors: ['#F5A97F', '#1E2030', '#24273A', '#CAD3F5', '#24273A', '#A5ADCB', '#24273A'],
  },
  {
    id: 'Catppuccin_Mocha',
    name: 'Catppuccin Mocha',
    colors: ['#CBA6F7', '#181825', '#1E1E2E', '#CDD6F4', '#1E1E2E', '#A6ADC8', '#1E1E2E'],
  },
  {
    id: 'Charcoal_Coral',
    name: 'Charcoal Coral',
    colors: ['#FF6B5B', '#161416', '#2A0D06', '#F2F0EC', '#2A0D06', '#948F8C', '#1D1B1E'],
  },
  {
    id: 'Deep_Violet',
    name: 'Deep Violet',
    colors: ['#6C4BC9', '#E7DCF7', '#F4EFFD', '#241B3D', '#F4EFFD', '#6E6389', '#F1EAFA'],
  },
  {
    id: 'Forest_Lime',
    name: 'Forest Lime',
    colors: ['#B7DD5B', '#0A1712', '#1B2708', '#E7EFE7', '#1B2708', '#7F998A', '#0F1F18'],
  },
  {
    id: 'Ink_Gold',
    /* The only built-in whose display name is not its filename with the underscores removed. */
    name: 'Ink & Gold',
    colors: ['#F2A93B', '#0C0E17', '#241A05', '#E7E6F2', '#241A05', '#8A87A3', '#12141F'],
  },
  {
    id: 'Maroon_Rose',
    name: 'Maroon Rose',
    colors: ['#E9A6A0', '#1C0B0E', '#2E100C', '#F3E6E4', '#2E100C', '#9C7B78', '#271014'],
  },
  {
    id: 'MinUI',
    name: 'MinUI',
    colors: ['#ffffff', '#262626', '#999999', '#ffffff', '#000000', '#ffffff', '#000000'],
  },
  {
    id: 'Mossy_Sage',
    name: 'Mossy Sage',
    colors: ['#4B6B3F', '#E4EBD9', '#EBF3E4', '#1F2A1B', '#EBF3E4', '#647459', '#EEF2E6'],
  },
  {
    id: 'Mustard_Butter',
    name: 'Mustard Butter',
    colors: ['#B08117', '#F5E9C4', '#FDF3DA', '#2E2610', '#FDF3DA', '#8A7A45', '#FBF3DC'],
  },
  {
    id: 'Plum_Magenta',
    name: 'Plum Magenta',
    colors: ['#D6559E', '#170F1D', '#2E0A1F', '#EEE6F2', '#2E0A1F', '#93849E', '#1F1526'],
  },
  {
    id: 'Slate_Cyan',
    name: 'Slate Cyan',
    colors: ['#45CFC3', '#111A28', '#0A2320', '#E6EDF3', '#0A2320', '#7E8FA3', '#182233'],
  },
  {
    id: 'Teal_Powder',
    name: 'Teal Powder',
    colors: ['#1E6E76', '#DCEBEF', '#E7F5F5', '#17232E', '#E7F5F5', '#5B7480', '#E9F2F5'],
  },
  {
    id: 'Terracotta_Cream',
    name: 'Terracotta Cream',
    colors: ['#C1602E', '#F1E8D9', '#FCEEE4', '#2B2118', '#FCEEE4', '#7A6E5C', '#F7F1E7'],
  },
]

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]!
}

/** A palette's seven colours as named slots. */
export function tokens(palette: Palette): Tokens {
  const out = {} as Record<ColorSlot, string>
  SLOT_ORDER.forEach((slot, i) => {
    out[slot] = palette.colors[i]!
  })
  return out
}

/**
 * The tokens as custom properties.
 *
 * As with every other set here, the scheme stays in the cascade for the theme's own decorative CSS
 * and nothing a widget owns reads it. The menu itself does the same thing - one `theme_color`
 * lookup per slot, resolved once - which is why a palette change needs no reboot.
 */
export function paletteVariables(palette: Palette): Record<string, string> {
  const t = tokens(palette)
  return {
    '--nx-main': t.main,
    '--nx-accent': t.primaryAccent,
    '--nx-glyph': t.secondaryAccent,
    '--nx-list': t.listText,
    '--nx-list-selected': t.listTextSelected,
    '--nx-hint': t.hintText,
    '--nx-bg': t.background,
  }
}
