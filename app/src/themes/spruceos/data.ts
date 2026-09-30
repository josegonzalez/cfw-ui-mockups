import type { DeviceSlug } from '../../device/devices'
import type { PanelRes } from './panel'

/**
 * Every row PyUI builds on the screens the port has, per device. Transcribed from the views PyUI
 * itself built while rendering the reference frames (`docs/themes/spruceos/reference/render/<device>/views.jsonl`,
 * written by the harness), and held to them by `spruceos.test.tsx`.
 */

/** What differs between the devices spruceOS runs on, as PyUI's device classes answer it. */
export interface Hardware {
  /** The `-device` name PyUI is started with (`mainui.py:63-117`). */
  readonly pyui: string
  readonly res: PanelRes
  /** `supports_wifi`: the top bar's Wi-Fi icon and the WiFi row. */
  readonly wifi: boolean
  /** `get_bluetooth_scanner`: the Bluetooth row. */
  readonly bluetooth: boolean
  /** `supports_volume`: the Volume row. */
  readonly volume: boolean
  /** `reboot_cmd`: whether the power prompt offers X = Reboot. */
  readonly reboot: boolean
  /** `supports_popup_menu`: a Mini draws a popup as a full list instead (`miyoo_mini_common.py:959-960`). */
  readonly popups: boolean
  /** The system config's starting backlight (0-10) and volume (0-20). */
  readonly backlight: number
  readonly volumeLevel: number
  /** The animation speed PyUI starts with: 2 on the Minis (`miyoo_mini_common.py:1015-1016`). */
  readonly animationSpeed: number
  readonly apps: readonly string[]
  /** Additional Settings' rows for this device's own config categories, after Proxy Settings. */
  readonly extraCategories: readonly string[]
  /** About this Device's rows. */
  readonly about: readonly string[]
  /**
   * Whether Recents and the Game Switcher find the fixture's save-state screenshots. The Pocket 1's
   * PyUI does not, and draws the box art; the cause is not traced (see the porting notes).
   */
  readonly stateShots: boolean
}

const APPS_BASE = [
  'A Firmware Update Is Available',
  'Activity Tracker',
  'Boxart Scraper',
  'Check for Updates',
  'EZ Updater',
  'File Management',
  'Game Nursery',
  'Gamelist.xml',
  'Random Game',
  'RetroArch',
  'Spruce Backup',
  'Spruce Restore',
  'Theme Garden',
]

/** PyUI sorts the apps by label (`menus/app/app_menu.py:103`); Python compares code points. */
const sortedApps = (extra: readonly string[]) => [...APPS_BASE, ...extra].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

const ABOUT_SHORT = ['IP Address', 'Mac Address', 'FW Version', 'spruce version', 'RetroArch version', 'SD Card usage']
const ABOUT_FULL = [
  'IP Address',
  'Mac Address',
  'FW Version',
  'spruce version',
  'RetroArch version',
  'PPSSPP version',
  'DSperate version',
  'SD Card usage',
]

const APPS_ANBERNIC = sortedApps([
  'Boot Logo',
  'E-Reader',
  'Gallery',
  'Moonlight',
  'PortMaster',
  'RetroArch32',
  'Songo#5',
])

const ANBERNIC = {
  wifi: true,
  bluetooth: false,
  volume: true,
  reboot: true,
  popups: true,
  backlight: 10,
  volumeLevel: 0,
  animationSpeed: 1,
  apps: APPS_ANBERNIC,
  extraCategories: [],
  about: ABOUT_FULL,
  stateShots: true,
} as const

export const HARDWARE: Readonly<Partial<Record<DeviceSlug, Hardware>>> = {
  'miyoo-a30': {
    pyui: 'MIYOO_A30',
    res: '640x480',
    wifi: true,
    bluetooth: false,
    volume: true,
    reboot: false,
    popups: true,
    backlight: 10,
    volumeLevel: 0,
    animationSpeed: 1,
    apps: sortedApps(['Boot Logo', 'E-Reader', 'PPSSPP', 'USB Storage Mode']),
    extraCategories: [],
    about: ABOUT_FULL,
    stateShots: true,
  },
  'miyoo-flip': {
    pyui: 'MIYOO_FLIP',
    res: '640x480',
    wifi: true,
    bluetooth: true,
    volume: true,
    reboot: true,
    popups: true,
    backlight: 10,
    volumeLevel: 0,
    animationSpeed: 1,
    apps: sortedApps([
      'Boot Logo',
      'E-Reader',
      'Gallery',
      'Moonlight',
      'PPSSPP',
      'PortMaster',
      'RetroArch32',
      'Songo#5',
      'USB Storage Mode',
    ]),
    extraCategories: ['Audio Settings'],
    about: ABOUT_FULL,
    stateShots: true,
  },
  'miyoo-mini': {
    pyui: 'MIYOO_MINI',
    res: '640x480',
    wifi: false,
    bluetooth: false,
    volume: false,
    reboot: false,
    popups: false,
    backlight: 10,
    volumeLevel: 0,
    animationSpeed: 2,
    apps: sortedApps([]),
    extraCategories: [],
    about: ABOUT_SHORT,
    stateShots: true,
  },
  'miyoo-mini-v4': {
    pyui: 'MIYOO_MINI_V4',
    res: '752x560',
    wifi: false,
    bluetooth: false,
    volume: false,
    reboot: true,
    popups: false,
    backlight: 10,
    volumeLevel: 0,
    animationSpeed: 2,
    apps: sortedApps([]),
    extraCategories: [],
    about: ABOUT_SHORT,
    stateShots: true,
  },
  'trimui-brick': {
    pyui: 'TRIMUI_BRICK',
    res: '1024x768',
    wifi: true,
    bluetooth: true,
    volume: true,
    reboot: true,
    popups: true,
    backlight: 10,
    volumeLevel: 0,
    animationSpeed: 1,
    apps: sortedApps([
      'Boot Logo',
      'E-Reader',
      'Gallery',
      'Moonlight',
      'PPSSPP',
      'PortMaster',
      'Songo#5',
      'USB Storage Mode',
    ]),
    extraCategories: ['RGB LED Settings'],
    about: ABOUT_FULL,
    stateShots: true,
  },
  'trimui-smart-pro': {
    pyui: 'TRIMUI_SMART_PRO',
    res: '1280x720',
    wifi: true,
    bluetooth: true,
    volume: true,
    reboot: true,
    popups: true,
    backlight: 10,
    volumeLevel: 0,
    animationSpeed: 1,
    apps: sortedApps([
      'Boot Logo',
      'E-Reader',
      'Gallery',
      'Moonlight',
      'PPSSPP',
      'PortMaster',
      'Songo#5',
      'USB Storage Mode',
    ]),
    extraCategories: ['RGB LED Settings'],
    about: ABOUT_FULL,
    stateShots: true,
  },
  rg35xx: { pyui: 'ANBERNIC_RGXX640480', res: '640x480', ...ANBERNIC },
  rg40xx: { pyui: 'ANBERNIC_RGXX640480', res: '640x480', ...ANBERNIC },
  rg34xx: { pyui: 'ANBERNIC_RGXX720480', res: '720x480', ...ANBERNIC },
  rg28xx: { pyui: 'ANBERNIC_RG28XX', res: '640x480', ...ANBERNIC, wifi: false },
  'rg-cubexx': { pyui: 'ANBERNIC_RGCUBEXX', res: '720x720', ...ANBERNIC },
  'miniloong-pocket1': {
    pyui: 'MINILOONG_POCKET1',
    res: '960x720',
    wifi: true,
    bluetooth: false,
    volume: true,
    reboot: true,
    popups: true,
    backlight: 7,
    volumeLevel: 10,
    animationSpeed: 1,
    apps: sortedApps([]),
    extraCategories: [],
    about: ABOUT_SHORT,
    stateShots: false,
  },
}

export function hardwareFor(device: DeviceSlug): Hardware {
  const hw = HARDWARE[device]
  if (!hw) throw new Error(`spruceOS does not run on ${device}`)
  return hw
}

/** Every app PyUI can list: its description and icon file (`App/*\/config.json`, `app_menu.py:40-72`). */
export const APPS: Readonly<Record<string, { readonly description: string; readonly icon: string }>> = {
  'A Firmware Update Is Available': { description: 'Run this to get the latest fixes', icon: 'firmwareupdate.png' },
  'Activity Tracker': { description: 'Track app usage', icon: 'rtc.png' },
  'Boot Logo': { description: 'Swap the boot logo at start up', icon: 'bootlogo.png' },
  'Boxart Scraper': { description: 'Scrape game boxart', icon: 'scraper.png' },
  'Check for Updates': { description: 'Download and install updates over Wi-Fi', icon: 'updater.png' },
  'E-Reader': { description: 'Read Ebooks on your device', icon: 'ereader.png' },
  'EZ Updater': { description: 'Update file found, install to update to spruce', icon: 'updater.png' },
  'File Management': { description: 'View and edit files on your SD card', icon: 'file.png' },
  Gallery: { description: 'Screenshots viewer', icon: 'gallery.png' },
  'Game Nursery': { description: 'Download free games directly to your device', icon: 'iconfresh.png' },
  'Gamelist.xml': { description: 'Clean up displayed rom names', icon: 'gamelist.png' },
  Moonlight: { description: 'Game Streaming (Exit: L+R gui, L+R+ST+SL stream)', icon: 'moonlight.png' },
  PPSSPP: { description: 'Configure PSP emulator', icon: 'ppsspp.png' },
  PortMaster: { description: 'PortMaster Menu', icon: 'portmaster.png' },
  'Random Game': { description: 'Launch a random game', icon: 'random.png' },
  RetroArch: { description: 'Core and game configuration', icon: 'retroarch.png' },
  RetroArch32: { description: '32-bit RetroArch frontend', icon: 'retroarch.png' },
  'Songo#5': { description: 'A music player', icon: 'songo.png' },
  'Spruce Backup': { description: 'Save your configs and settings', icon: 'backup.png' },
  'Spruce Restore': { description: 'Restore configs & settings from backup', icon: 'restore.png' },
  'Theme Garden': { description: 'Check out the latest themes for your device!', icon: 'themegallery.png' },
  'USB Storage Mode': { description: 'Transfer files over USB', icon: 'usb.png' },
}

/** Theme Settings (`menus/settings/theme/theme_settings_menu.py`): six pages and Screensaver. */
export const THEME_SETTINGS = [
  'Main Menu Theme Options',
  'System Select Theme Options',
  'Game Select Menu Theme Options',
  'Fonts',
  'Grid View Theme Options',
  'Top and Bottom Bar Options',
  'Screensaver',
]

/** Additional Settings (`extra_settings_menu.py:94-245`), before the device's own categories. */
export const ADDITIONAL_SETTINGS = [
  'Display Settings',
  'Animation Settings',
  'Time Settings',
  'Game System Select Settings',
  'Game Select Settings',
  'Game Switcher Settings',
  'Game Art Display Settings',
  'Controller Settings',
  'Language Settings',
  'Battery Settings',
  'System Settings',
  'Button Settings',
  'Emulator Settings',
  'Network Settings',
  'Proxy Settings',
]

/**
 * The config categories after Proxy Settings, in `spruce-config.json` order: RGB LED Settings sits
 * before RetroAchievements, Audio Settings after it.
 */
export function additionalSettings(hw: Hardware): string[] {
  const rows = [...ADDITIONAL_SETTINGS]
  if (hw.extraCategories.includes('RGB LED Settings')) rows.push('RGB LED Settings')
  rows.push('RetroAchievements Settings')
  if (hw.extraCategories.includes('Audio Settings')) rows.push('Audio Settings')
  return rows
}

/** Tasks (`Saves/spruce/spruce-tasks.json` via `tasks_menu.py`), each with its description. */
export const TASKS: readonly (readonly [string, string])[] = [
  ['Download BoxArt', 'Scan entire library for missing boxart'],
  ['Optimize Boxart', 'Resize boxart and convert to QOI for faster loading'],
  ['Locked Down Modes', 'Simpler modes for new users or kids'],
  ['Forget all WiFi networks', 'disconnect and clear all saved networks'],
  ['Reset RetroArch hotkeys', 'reapply spruce default RA hotkey layout'],
  ['Reset RetroArch config', 'restore spruce default RA config for current device'],
  ['Reset DraStic config', 'restore spruce default DraStic config for current device'],
  ['Reset DSperate config', 'restore spruce default DSperate configs'],
  ['Reset PCSX ReARMED config', 'restore spruce default PSX standalone config'],
  ['Reset PPSSPP config', 'restore spruce default PPSSPP hotkeys and config'],
  ['Reset Flycast config', 'restore spruce default Flycast standalone config and pad map'],
  ['Reset mupen64plus config', 'restore spruce default N64 standalone config and pad table'],
  ['Reset YabaSanshiro config', 'restore spruce default Saturn standalone pad map (saves untouched)'],
  ['Reset ScummVM config', 'restore spruce default ScummVM config for current device; rescan games after'],
  ['Reset AdvanceMAME config', 'restore spruce default AdvanceMAME config for current device'],
  ['Reset PICO-8 config', 'restore spruce default PICO-8 config and controller table'],
  ['Reset BigPEmu config', 'restore spruce default Jaguar standalone config'],
  ['Reauthorize PPSSPP cheevos', 'update auth token for RetroAchievements'],
  ['Clean up macOS dotfiles', 'delete any junk files created by macOS'],
  ['Repair SD Card', 'reboot and attempt an fsck.fat on your card'],
  ['Bug report', 'collect logs and other info for bug reports'],
  ['Scan ScummVM games', 'create .scummvm files for games in Roms/SCUMMVM'],
  ['Clear all Recents', 'delete your recently played games list'],
  ['Clear all Favorites', 'delete your favorited games list'],
]

/**
 * About this Device's values. The address is the harness's pinned one; Mac Address and FW Version
 * read hardware PyUI cannot reach in a container, and the version rows run scripts that cannot run
 * there, so they come back "Unknown" and empty in the reference frames, and the port shows the same.
 */
export const ABOUT_VALUES: Readonly<Record<string, string>> = {
  'IP Address': '192.168.1.42',
  'Mac Address': 'Unknown',
  'FW Version': 'Unknown',
  'spruce version': '4.4.2',
  'RetroArch version': '',
  'PPSSPP version': '',
  'DSperate version': '',
  'SD Card usage': '',
}

/**
 * A game's configuration (`game_config_menu.py`): `menuOptions` from `Emu/<system>/config.json`.
 * SNES and PSX carry per-device core lists; the port uses each system's generic `Emulator` entry.
 */
export const CORES: Readonly<Record<string, { readonly options: readonly string[]; readonly selected: string }>> = {
  GB: { options: ['gambatte', 'mgba', 'tgbdual'], selected: 'gambatte' },
  GBA: { options: ['mgba', 'gpsp'], selected: 'gpsp' },
  FC: { options: ['fceumm', 'nestopia', 'quicknes'], selected: 'fceumm' },
  SFC: { options: ['chimerasnes', 'mednafen_supafaust', 'snes9x'], selected: 'mednafen_supafaust' },
  MD: { options: ['picodrive', 'genesis_plus_gx'], selected: 'picodrive' },
  PS: { options: ['pcsx_rearmed'], selected: 'pcsx_rearmed' },
}

export const CPU_MODES = ['Smart', 'Performance', 'Overclock']

/** The game configuration's rows after its two options (`game_config_menu.py`). */
export const GAME_CONFIG_ACTIONS = [
  'Toggle Settings as Game Specific Override',
  'Delete ROM',
  'Delete Box Art',
  'Add to GameSwitcher',
  'Add Favorite',
  'Add/Remove Collection',
  'Download BoxArt',
  'Select BoxArt Download',
  'Launch Random Game',
]
