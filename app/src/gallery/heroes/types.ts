/**
 * The hero treatments on offer.
 *
 * There was a fourth - a boot log rendered as a page element - until the log moved inside the
 * device's own panel, where it belongs. Nothing was lost: the sequence reads better on the
 * screen that would really print it.
 */
export type HeroVariant = 'device' | 'neon' | 'marquee'

export const HERO_VARIANTS: readonly HeroVariant[] = ['device', 'neon', 'marquee']

export const HERO_LABEL: Record<HeroVariant, string> = {
  device: 'Device',
  neon: 'Neon',
  marquee: 'Marquee',
}

export const HERO_NOTE: Record<HeroVariant, string> = {
  device: 'A real device, booting into its launcher. Shows the thing rather than describing it.',
  neon: 'Big type on a phosphor bloom. Loudest headline, least context.',
  marquee: 'Arcade cabinet marquee, centred and heavily scanlined. Most stylised.',
}

export const DEFAULT_HERO: HeroVariant = 'device'

export function isHeroVariant(value: string | null): value is HeroVariant {
  return value !== null && (HERO_VARIANTS as readonly string[]).includes(value)
}
