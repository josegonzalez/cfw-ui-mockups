import { useCallback, useState } from 'react'
import { DeviceFrame } from '../../device/DeviceFrame'
import type { DeviceSlug } from '../../device/devices'
import { useChromeKeys } from '../../input/InputProvider'
import { SubsetPanel, type SubsetGroup } from '../../gallery/SubsetPanel'
import { Tortos } from '.'
import { CARD_SETS, DIRECTIONS, type CardSet, type Direction } from './library'
import { TORTOS_SCREENS } from './manifest'

export interface TortosSubsets {
  /** Which still the live build starts from. */
  readonly screen: string
  readonly cards: CardSet
  readonly dir: Direction
}

/**
 * The live build opens on the systems row, in Fancy Pants, stood across the screen - the
 * `systems` still, which is the pair `settle.spec.ts` compares it with.
 */
export const DEFAULT_SUBSETS: TortosSubsets = { screen: 'systems', cards: 'fancy', dir: 'horizontal' }

function step<T>(values: readonly T[], current: T, by: number): T {
  const i = values.indexOf(current)
  return values[(i + by + values.length) % values.length]!
}

/** Start from another still: its own theme and direction come with it, until changed here. */
function withScreen(slug: string): TortosSubsets {
  const seed = TORTOS_SCREENS.find((s) => s.slug === slug)?.seed ?? {}
  return { screen: slug, cards: seed.cards ?? 'classic', dir: seed.dir ?? 'horizontal' }
}

/**
 * Apply one mockup-only key. UI Theme and UI Direction are the device's own settings and the
 * TortOS menu changes them too; these only pick where the live build starts.
 */
export function applyChromeAction(prev: TortosSubsets, action: string): TortosSubsets {
  const slugs = TORTOS_SCREENS.map((s) => s.slug)
  const cards = CARD_SETS.map((c) => c.id)
  const dirs = DIRECTIONS.map((d) => d.id)
  switch (action) {
    case 'prevView':
      return withScreen(step(slugs, prev.screen, -1))
    case 'nextView':
      return withScreen(step(slugs, prev.screen, 1))
    case 'prevSubsetA':
      return { ...prev, cards: step(cards, prev.cards, -1) }
    case 'nextSubsetA':
      return { ...prev, cards: step(cards, prev.cards, 1) }
    case 'prevSubsetB':
      return { ...prev, dir: step(dirs, prev.dir, -1) }
    case 'nextSubsetB':
      return { ...prev, dir: step(dirs, prev.dir, 1) }
    default:
      return prev
  }
}

function ChromeKeys({ onAction }: { onAction: (action: string) => void }) {
  useChromeKeys(useCallback((action) => onAction(action), [onAction]))
  return null
}

/**
 * The live build.
 *
 * The panel seeds the screen and then stands back: TortOS owns its own stack from there, so A on a
 * console opens its games, MENU opens the menu over the shelf, B goes back one screen and MENU out
 * of all of them, and SELECT opens Muse from anywhere but a running game.
 *
 * Keys: `[` `]` starting screen, `,` `.` UI Theme, `-` `=` UI Direction.
 */
export function TortosInteractive({ device }: { device: DeviceSlug }) {
  const [subsets, setSubsets] = useState<TortosSubsets>(DEFAULT_SUBSETS)
  const onAction = useCallback((action: string) => setSubsets((prev) => applyChromeAction(prev, action)), [])
  const def = TORTOS_SCREENS.find((s) => s.slug === subsets.screen) ?? TORTOS_SCREENS[0]!

  const groups: SubsetGroup[] = [
    {
      title: 'Start from',
      keys: '[ ]',
      current: subsets.screen,
      options: TORTOS_SCREENS.map((s) => ({ value: s.slug, label: s.title })),
      onSelect: (value) => setSubsets(withScreen(value)),
    },
    {
      title: 'UI Theme',
      keys: ', .',
      current: subsets.cards,
      options: CARD_SETS.map((c) => ({ value: c.id, label: c.name })),
      onSelect: (value) => setSubsets((p) => ({ ...p, cards: value as CardSet })),
    },
    {
      title: 'UI Direction',
      keys: '- =',
      current: subsets.dir,
      options: DIRECTIONS.map((d) => ({ value: d.id, label: d.name })),
      onSelect: (value) => setSubsets((p) => ({ ...p, dir: value as Direction })),
    },
  ]

  return (
    <>
      <DeviceFrame device={device}>
        <ChromeKeys onAction={onAction} />
        <Tortos key={`${subsets.screen}:${subsets.cards}:${subsets.dir}`} {...def.seed} cards={subsets.cards} dir={subsets.dir} />
      </DeviceFrame>
      <SubsetPanel groups={groups} />
    </>
  )
}
