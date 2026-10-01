import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import { LIVE_TAGS, type ScreenTags } from '../taxonomy'
import { VIEWS } from './library'

/**
 * One device.
 *
 * Every other set here renders on four handhelds because its firmware runs on four handhelds.
 * This one runs on a console with a single fixed output, so a second device would be a fiction.
 */
export const NEXTUI_DEVICES: readonly DeviceSlug[] = ['n64']

/**
 * What each view is for and built from, keyed by view slug. The posed variants (title pills, a
 * palette) take their underlying view's tags.
 */
export const NEXTUI_VIEW_TAGS: Record<string, ScreenTags> = {
  browser: { types: ['game-list'], elements: ['list', 'artwork-panel', 'hint-bar'] },
  collections: { types: ['collection'], elements: ['list', 'hint-bar'] },
  'history-favorites': { types: ['collection'], elements: ['list', 'artwork-panel', 'hint-bar'] },
  'settings-editor': { types: ['settings'], elements: ['list', 'toggle', 'hint-bar'] },
  'menu-colors': { types: ['appearance'], elements: ['list', 'hint-bar'] },
  'palette-picker': { types: ['appearance'], elements: ['list', 'hint-bar'] },
  'color-editor': { types: ['appearance'], elements: ['hint-bar'] },
  'load-rom': { types: ['game-details'], elements: ['artwork-panel', 'hint-bar'] },
  'load-disk': { types: ['game-details'], elements: ['text-block', 'hint-bar'] },
  'load-emulator': { types: ['game-details'], elements: ['text-block', 'hint-bar'] },
  'file-info': { types: ['file-manager'], elements: ['text-block', 'hint-bar'] },
  'system-info': { types: ['about'], elements: ['text-block', 'hint-bar'] },
  'flashcart-info': { types: ['about'], elements: ['list', 'hint-bar'] },
  credits: { types: ['about'], elements: ['text-block', 'hint-bar'] },
  rtc: { types: ['date-time'], elements: ['text-block', 'hint-bar'] },
  'music-player': { types: ['media-player'], elements: ['progress-bar', 'hint-bar'] },
  'image-viewer': { types: ['media-player'], elements: ['artwork-panel', 'hint-bar'] },
  'text-viewer': { types: ['media-player'], elements: ['text-block', 'hint-bar'] },
  'extract-file': { types: ['file-manager'], elements: ['text-block', 'hint-bar'] },
  'datel-code-editor': { types: ['settings'], elements: ['list', 'toggle', 'hint-bar'] },
  'cpakfs-manager': { types: ['file-manager'], elements: ['list', 'hint-bar'] },
  'cpak-dump-info': { types: ['file-manager'], elements: ['text-block', 'hint-bar'] },
  'cpak-note-dump-info': { types: ['file-manager'], elements: ['text-block', 'hint-bar'] },
}

/** A posed screen: a view, and the palette and cursor position it is captured at. */
export interface NextUiScreenDef {
  readonly slug: string
  readonly title: string
  readonly view: string
  readonly palette?: string
  readonly titlePill?: boolean
  readonly selected?: number
}

/**
 * The statics.
 *
 * All twenty-three views at the stock palette, then five that pose something a single palette
 * cannot show: the title-pill treatment, a light palette, a dark one, and the picker mid-preview.
 * The palette is the theme's whole configurable surface, so a set of captures that only ever
 * shows `Default` would describe about a seventh of it.
 */
export const NEXTUI_SCREENS: readonly NextUiScreenDef[] = [
  ...VIEWS.map((v) => ({ slug: v.slug, title: v.label, view: v.slug })),
  {
    slug: 'title-pills',
    title: 'Title pills on',
    view: 'browser',
    titlePill: true,
    selected: 5,
  },
  {
    slug: 'palette-latte',
    title: 'Catppuccin Latte',
    view: 'browser',
    palette: 'Catppuccin_Latte',
    selected: 5,
  },
  {
    slug: 'palette-slate-cyan',
    title: 'Slate Cyan',
    view: 'settings-editor',
    palette: 'Slate_Cyan',
    selected: 2,
  },
  {
    slug: 'palette-minui',
    title: 'MinUI',
    view: 'browser',
    palette: 'MinUI',
    selected: 5,
  },
  {
    slug: 'palette-preview',
    title: 'Palette preview',
    view: 'palette-picker',
    selected: 9,
  },
]

export const NEXTUI_MANIFEST: readonly ScreenManifestEntry[] = NEXTUI_DEVICES.flatMap((device) => [
  {
    theme: 'nextui' as const,
    device,
    screen: 'interactive',
    title: 'Interactive',
    interactive: true,
    ...LIVE_TAGS,
  },
  ...NEXTUI_SCREENS.map((s) => ({
    theme: 'nextui' as const,
    device,
    screen: s.slug,
    title: s.title,
    interactive: false,
    ...NEXTUI_VIEW_TAGS[s.view]!,
  })),
])
