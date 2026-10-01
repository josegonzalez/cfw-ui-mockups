/**
 * The vocabulary screens are compared by.
 *
 * Two closed facets, after the Game UI Database: what a screen is *for* (its type) and what it
 * is *built from* (its elements). Closed rather than free-form, because the point is to line up
 * twelve firmwares' settings screens side by side, and that only works if they all said
 * "settings" rather than "options", "config" and "system menu".
 *
 * Plain data with no React, like the manifest, so the Playwright suite can read it. Every term
 * here must be used by at least one screen and documented in `docs/views.md`; a test holds both.
 */

export interface FacetTerm {
  readonly label: string
  readonly description: string
}

export const SCREEN_TYPES = {
  boot: { label: 'Boot', description: 'What draws before the menu does: splash, power-on, warnings' },
  home: { label: 'Home', description: 'The top-level menu the firmware returns to' },
  'system-list': { label: 'System list', description: 'Choosing a console or platform' },
  'game-list': { label: 'Game list', description: 'The games in one system, folder or view mode' },
  'game-details': { label: 'Game details', description: 'One game: metadata, synopsis, artwork' },
  collection: { label: 'Collection', description: 'Favourites, recents, history and other curated lists' },
  search: { label: 'Search', description: 'Finding a game or file by name or filter' },
  settings: { label: 'Settings', description: 'Where options are changed' },
  network: { label: 'Network', description: 'Wi-Fi, Bluetooth and online services' },
  'date-time': { label: 'Date and time', description: 'Setting the clock or calendar' },
  controls: { label: 'Controls', description: 'Button mapping and input settings' },
  appearance: { label: 'Appearance', description: 'Themes, palettes, colours and backgrounds' },
  achievements: { label: 'Achievements', description: 'Achievement lists, unlocks and accounts' },
  gameplay: { label: 'Gameplay', description: 'The game itself, with the firmware out of the way' },
  'in-game-menu': { label: 'In-game menu', description: 'The menu drawn over a running game' },
  'save-states': { label: 'Save states', description: 'Saving, loading and browsing save slots' },
  'game-switcher': { label: 'Game switcher', description: 'Jumping between recently played games' },
  'file-manager': { label: 'File manager', description: 'Files, memory cards and stored data' },
  'media-player': { label: 'Media player', description: 'Music, images and text outside a game' },
  loading: { label: 'Loading', description: 'Launching a game, scanning or working' },
  'empty-state': { label: 'Empty state', description: 'What shows when there is nothing to show' },
  setup: { label: 'Setup', description: 'First-run wizards and onboarding' },
  about: { label: 'About', description: 'System information, versions and credits' },
  help: { label: 'Help', description: 'Explanations of the firmware itself' },
  apps: { label: 'Apps', description: 'Tools, channels and programs that are not games' },
  messages: { label: 'Messages', description: 'Notes, letters and message boards' },
  overlay: { label: 'Overlay', description: 'A HUD drawn over another screen: volume, brightness' },
  power: { label: 'Power', description: 'Shutdown, sleep and battery' },
} as const satisfies Record<string, FacetTerm>

export type ScreenType = keyof typeof SCREEN_TYPES

export const UI_ELEMENTS = {
  list: { label: 'List', description: 'Rows of items in one column' },
  grid: { label: 'Grid', description: 'Items in rows and columns' },
  carousel: { label: 'Carousel', description: 'Items scrolling along one axis with the focus centred' },
  shelf: { label: 'Shelf', description: 'Physical-looking objects lined up to pick from' },
  tabs: { label: 'Tabs', description: 'Sibling pages switched with a strip of labels' },
  'popup-menu': { label: 'Popup menu', description: 'A short menu over the screen it acts on' },
  dialog: { label: 'Dialog', description: 'A question that blocks until it is answered' },
  toast: { label: 'Toast', description: 'A brief notice that goes away on its own' },
  keyboard: { label: 'Keyboard', description: 'On-screen text entry' },
  'hint-bar': { label: 'Hint bar', description: 'A legend of what each button does here' },
  'status-bar': { label: 'Status bar', description: 'Clock, battery or connectivity indicators' },
  slider: { label: 'Slider', description: 'A value picked along a track' },
  toggle: { label: 'Toggle', description: 'An on or off switch' },
  stepper: { label: 'Stepper', description: 'A value changed in place, one step left or right' },
  'progress-bar': { label: 'Progress bar', description: 'How far a task has got' },
  'artwork-panel': { label: 'Artwork panel', description: 'Box art, screenshots or video for the focus' },
  'page-indicator': { label: 'Page indicator', description: 'Dots or numbers showing the page' },
  'text-block': { label: 'Text block', description: 'Body copy or a readout of values to read' },
  logo: { label: 'Logo', description: 'A wordmark or emblem as the subject of the screen' },
} as const satisfies Record<string, FacetTerm>

export type UiElement = keyof typeof UI_ELEMENTS

/**
 * What a screen is tagged with. A screen's first type is its primary one.
 *
 * Every screen has a type. Elements may be empty: a game running with no firmware UI over it
 * draws nothing the vocabulary names, and tagging it with the nearest term would put it in a
 * comparison it does not belong in.
 */
export interface ScreenTags {
  readonly types: readonly ScreenType[]
  readonly elements: readonly UiElement[]
}

/**
 * The live build is every screen at once, so it is tagged with none of them - it would
 * otherwise appear in every comparison.
 */
export const LIVE_TAGS: ScreenTags = { types: [], elements: [] }

export type Facet = 'type' | 'element'

export function facetTerms(facet: Facet): Readonly<Record<string, FacetTerm>> {
  return facet === 'type' ? SCREEN_TYPES : UI_ELEMENTS
}
