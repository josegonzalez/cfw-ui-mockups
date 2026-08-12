import folderIcon from './assets/icons/folder_icon.png'
import iconCheats from './assets/icons/icon_cheats.svg'
import iconExpansion from './assets/icons/icon_expansion.svg'
import iconGamepak from './assets/icons/icon_gamepak.svg'
import iconPatches from './assets/icons/icon_patches.svg'
import iconPlayers from './assets/icons/icon_players.svg'
import iconRegion from './assets/icons/icon_region.svg'
import iconRumble from './assets/icons/icon_rumble.svg'
import iconSave from './assets/icons/icon_save.svg'
import iconTpak from './assets/icons/icon_tpak.svg'

/**
 * The theme's sprites, taken from the menu's own `assets/images/`.
 *
 * All of them are pure white art tinted at draw time - `ui_components_nextui_tinted_sprite_draw`
 * modulates the texture by a primitive colour - which is why they can be reused across eighteen
 * palettes without a recolour. Here that is a CSS mask, which is the same operation.
 *
 * The pill caps, the button circle and the panel corner are deliberately absent: they are
 * quarter-round and half-round shapes the source blits because the RDP has no rounded-rectangle
 * primitive. A border radius says the same thing in one number.
 */
export const ICONS = {
  players: iconPlayers,
  save: iconSave,
  region: iconRegion,
  expansion: iconExpansion,
  rumble: iconRumble,
  tpak: iconTpak,
  cheats: iconCheats,
  patches: iconPatches,
  gamepak: iconGamepak,
  folder: folderIcon,
} as const

export type IconName = keyof typeof ICONS

/** Native sizes, because the source positions several of them by their own dimensions. */
export const ICON_SIZE: Record<IconName, { w: number; h: number }> = {
  players: { w: 24, h: 24 },
  save: { w: 24, h: 24 },
  region: { w: 24, h: 24 },
  expansion: { w: 24, h: 24 },
  rumble: { w: 24, h: 24 },
  tpak: { w: 24, h: 24 },
  cheats: { w: 24, h: 24 },
  patches: { w: 24, h: 24 },
  gamepak: { w: 72, h: 72 },
  folder: { w: 160, h: 128 },
}
