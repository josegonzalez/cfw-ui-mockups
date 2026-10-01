import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import type { Seed } from './machine'

export const DREAMCAST_BIOS_DEVICES: readonly DeviceSlug[] = ['dreamcast']

export interface DreamcastScreenDef {
  readonly slug: string
  readonly title: string
  readonly seed: Seed
}

/**
 * The stills. Each is posed by pressing buttons from power-on, in `machine.ts`'s letters, with every
 * transition settled. `main` is where the live build starts, and its settle pair.
 */
export const DREAMCAST_BIOS_SCREENS: readonly DreamcastScreenDef[] = [
  { slug: 'main', title: 'Main menu', seed: {} },
  { slug: 'main-settings', title: 'Main menu, Settings', seed: { events: 'rd' } },
  { slug: 'boot', title: 'Power-on', seed: { boot: true } },
  { slug: 'boot-clock', title: 'First boot, clock', seed: { firstBoot: true } },
  { slug: 'no-disc', title: 'Play, no disc', seed: { events: 'a' } },
  { slug: 'settings', title: 'Settings', seed: { events: 'rda' } },
  { slug: 'settings-language', title: 'Settings, Language', seed: { events: 'rdaa' } },
  { slug: 'settings-clock', title: 'Settings, Date/Time', seed: { events: 'rdada' } },
  { slug: 'settings-sound', title: 'Settings, Sound', seed: { events: 'rdadda' } },
  { slug: 'settings-auto-start', title: 'Settings, Auto start', seed: { events: 'rdaddda' } },
  { slug: 'settings-card-clock', title: 'Settings, memory card clock', seed: { events: 'rdadddda' } },
  { slug: 'settings-cards-set', title: 'Settings, memory card clocks set', seed: { events: 'rdaddddaa' } },
  { slug: 'file-cards', title: 'File, memory cards', seed: { events: 'ra' } },
  { slug: 'file-list', title: 'File, saves', seed: { events: 'raa' } },
  { slug: 'file-menu', title: 'File, Copy/Delete', seed: { events: 'raaa' } },
  { slug: 'file-all-menu', title: 'File, all saves', seed: { events: 'raala' } },
  { slug: 'file-delete', title: 'File, delete', seed: { events: 'raaada' } },
  { slug: 'file-deleted', title: 'File, deleted', seed: { events: 'raaadaua' } },
  { slug: 'file-destination', title: 'File, copy destination', seed: { events: 'raaaa' } },
  { slug: 'music', title: 'Music', seed: { events: 'da' } },
  { slug: 'music-repeat', title: 'Music, repeat one', seed: { events: 'darra' } },
  { slug: 'music-disc', title: 'Music, with disc', seed: { disc: true, events: 'da' } },
  { slug: 'music-disc-playing', title: 'Music, with disc, playing', seed: { disc: true, events: 'daa' } },
]

export const DREAMCAST_BIOS_MANIFEST: readonly ScreenManifestEntry[] = DREAMCAST_BIOS_DEVICES.flatMap((device) => [
  { theme: 'dreamcast-bios' as const, device, screen: 'interactive', title: 'Interactive', interactive: true },
  ...DREAMCAST_BIOS_SCREENS.map((s) => ({
    theme: 'dreamcast-bios' as const,
    device,
    screen: s.slug,
    title: s.title,
    interactive: false,
  })),
])
