import { catalogueTotals } from '../../themes/catalogue'

/**
 * The hero's content, shared by every variant.
 *
 * Kept in one place so switching variants compares *presentation* rather than copy - if each
 * hero wrote its own words, picking one would be picking a sentence, not a design.
 */
export const HERO = {
  eyebrow: 'Handheld firmware UI',
  headline: {
    lead: 'The screens on your ',
    accent: 'handheld',
    tail: ', rebuilt pixel for pixel.',
  },
  /** A shorter form for variants where the full sentence would not fit the treatment. */
  headlineShort: {
    lead: 'Pixel ',
    accent: 'for',
    tail: ' pixel',
  },
  lede: "Mockups of the on-screen UI of custom firmware and launchers for SBC gaming handhelds - muOS, Batocera, ArkOS, Knulli and the themes that run on them. Each screen renders at its device's exact panel resolution inside a device frame, so what you see is the size it really is.",
  ledeShort:
    'Custom firmware and launcher UIs for SBC gaming handhelds, rendered at each device’s exact panel resolution.',
} as const

export interface BootLine {
  readonly label: string
  readonly value: string
  /** Rendered in the "ok" colour rather than as a plain value. */
  readonly ok?: boolean
}

/**
 * The boot log the device plays before its launcher appears.
 *
 * Every count comes from the catalogue rather than being written in. A boot log that contradicts
 * the page below it is worse than no boot log.
 */
export function bootLines(): readonly BootLine[] {
  const totals = catalogueTotals()
  return [
    { label: 'detecting panel', value: '640x480' },
    { label: 'loading themes', value: `${totals.themes} found` },
    { label: 'mounting widget kit', value: 'ok', ok: true },
    { label: 'resolving screens', value: `${totals.views} views` },
    { label: 'starting launcher', value: 'ok', ok: true },
  ]
}

export interface HeroStat {
  readonly value: string
  readonly label: string
}

export function heroStats(): readonly HeroStat[] {
  const totals = catalogueTotals()
  return [
    { value: String(totals.themes), label: 'Firmware UIs' },
    { value: String(totals.views), label: 'Distinct screens' },
    { value: String(totals.devices), label: 'Devices' },
    { value: '640x480', label: 'Most common panel' },
  ]
}
