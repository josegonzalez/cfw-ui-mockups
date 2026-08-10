/**
 * The hero treatments on offer.
 *
 * Four takes on the same content, so the choice is about which register the page opens in:
 * product, machine, hardware, or arcade.
 */
export type HeroVariant = 'neon' | 'boot' | 'device' | 'marquee'

export const HERO_VARIANTS: readonly HeroVariant[] = ['neon', 'boot', 'device', 'marquee']

export const HERO_LABEL: Record<HeroVariant, string> = {
  neon: 'Neon',
  boot: 'Boot log',
  device: 'Device',
  marquee: 'Marquee',
}

export const HERO_NOTE: Record<HeroVariant, string> = {
  neon: 'Big type on a phosphor bloom. Loudest headline, least context.',
  boot: 'Opens on a firmware boot sequence, then the headline. Most on-theme.',
  device: 'Leads with a real screen in a real bezel. Most product-like.',
  marquee: 'Arcade cabinet marquee, centred and heavily scanlined. Most stylised.',
}

export const DEFAULT_HERO: HeroVariant = 'neon'

export function isHeroVariant(value: string | null): value is HeroVariant {
  return value !== null && (HERO_VARIANTS as readonly string[]).includes(value)
}
