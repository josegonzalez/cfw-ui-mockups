import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import { VIEWS } from './library'

/**
 * One device.
 *
 * Every other set here renders on four handhelds because its firmware runs on four handhelds.
 * This one runs on a console with a single fixed output, so a second device would be a fiction.
 */
export const NEXTUI_DEVICES: readonly DeviceSlug[] = ['n64']

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
  },
  ...NEXTUI_SCREENS.map((s) => ({
    theme: 'nextui' as const,
    device,
    screen: s.slug,
    title: s.title,
    interactive: false,
  })),
])
