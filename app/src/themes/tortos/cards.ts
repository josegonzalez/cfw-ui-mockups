import type { CardSet } from './library'

/**
 * The system card art, by set and card name.
 *
 * Resolved through `import.meta.glob` so a card named in `library.ts` with no file behind it is an
 * error rather than an empty frame. Plain Jane's are drawn cards, Fancy Pants' are photographs of
 * each console by Evan Amos, released into the public domain (`assets/cards/fancy/SOURCE.md`).
 */
const urls = import.meta.glob<string>('./assets/cards/*/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

/**
 * Each card's size and where its opaque pixels stop, as the launcher measures them when it decodes
 * one (`content_bottom`, `src/main.c:398`). Measured once by
 * `docs/themes/tortos/reference/measure-cards.mjs`; the drawn cards fill their canvas and the
 * console photographs mostly do too, which the set's reflection gap then answers for.
 */
const DIMS: Readonly<Record<CardSet, Readonly<Record<string, readonly [number, number, number]>>>> = {
  classic: Object.fromEntries(
    ['FAVORITES', 'GB', 'GBA', 'GBC', 'GENESIS', 'GG', 'MUSE', 'NES', 'NGP', 'NGPC', 'PCE', 'SMS', 'SNES'].map(
      (c) => [c, [640, 820, 1] as const],
    ),
  ),
  fancy: {
    FAVORITES: [384, 374, 1],
    GB: [384, 384, 0.9792],
    GBA: [369, 240, 1],
    GBC: [384, 384, 0.9792],
    GENESIS: [369, 204, 1],
    GG: [369, 223, 1],
    MUSE: [384, 384, 0.9792],
    NES: [369, 251, 1],
    NGP: [369, 261, 1],
    NGPC: [369, 266, 1],
    PCE: [369, 188, 1],
    SMS: [369, 180, 1],
    SNES: [369, 257, 1],
  },
}

export interface CardArt {
  readonly src: string
  readonly width: number
  readonly height: number
  readonly contentBottom: number
}

export function cardArt(set: CardSet, card: string): CardArt {
  const src = urls[`./assets/cards/${set}/${card}.png`]
  const dims = DIMS[set][card]
  if (!src || !dims) throw new Error(`TortOS card art not found: ${set}/${card}`)
  return { src, width: dims[0], height: dims[1], contentBottom: dims[2] }
}
