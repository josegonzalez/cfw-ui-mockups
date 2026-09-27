import { useCallback, useState } from 'react'
import { DeviceFrame } from '../../device/DeviceFrame'
import type { DeviceSlug } from '../../device/devices'
import { useChromeKeys } from '../../input/InputProvider'
import { SubsetPanel, type SubsetGroup } from '../../gallery/SubsetPanel'
import { NeoStation } from '.'
import { CARD_SIZES, type CardSize } from './library'
import { NEOSTATION_SCREENS, screensFor } from './manifest'
import { THEME_IDS, paletteOf, type ThemeId } from './palette'

export interface NeoSubsets {
  /** Which still the live build starts from. */
  readonly screen: string
  readonly theme: ThemeId
  readonly view: 'grid' | 'carousel'
  readonly size: CardSize
}

/**
 * The live build opens on the Systems grid in the dark theme at card size M - the source's own
 * defaults on a dark device, and the `systems` still, which `settle.spec.ts` compares it with.
 */
export const DEFAULT_SUBSETS: NeoSubsets = {
  screen: 'systems',
  theme: 'dark',
  view: 'grid',
  size: 'M',
}

const VIEWS = ['grid', 'carousel'] as const

function step<T>(values: readonly T[], current: T, by: number): T {
  const i = values.indexOf(current)
  return values[(i + by + values.length) % values.length]!
}

/** Start from another still, as that still is posed: its own theme, view and size, else the defaults. */
function withScreen(slug: string): NeoSubsets {
  const seed = NEOSTATION_SCREENS.find((s) => s.slug === slug)?.seed ?? {}
  return {
    screen: slug,
    theme: seed.theme ?? DEFAULT_SUBSETS.theme,
    view: seed.view ?? 'grid',
    size: seed.size ?? 'M',
  }
}

/**
 * Apply one mockup-only key. The colour theme, view mode and card size are all NeoStation's own
 * settings - Settings > Themes and the X dropdown change them too; these only pick the start.
 */
export function applyChromeAction(prev: NeoSubsets, action: string, device: DeviceSlug): NeoSubsets {
  const slugs = screensFor(device).map((s) => s.slug)
  switch (action) {
    case 'prevView':
      return withScreen(step(slugs, prev.screen, -1))
    case 'nextView':
      return withScreen(step(slugs, prev.screen, 1))
    case 'prevSubsetA':
      return { ...prev, theme: step(THEME_IDS, prev.theme, -1) }
    case 'nextSubsetA':
      return { ...prev, theme: step(THEME_IDS, prev.theme, 1) }
    case 'prevSubsetB':
      return { ...prev, view: step(VIEWS, prev.view, -1) }
    case 'nextSubsetB':
      return { ...prev, view: step(VIEWS, prev.view, 1) }
    case 'cycleSystem':
      return { ...prev, size: step(CARD_SIZES, prev.size, 1) }
    default:
      return prev
  }
}

function ChromeKeys({ onAction }: { onAction: (action: string) => void }) {
  useChromeKeys(useCallback((action) => onAction(action), [onAction]))
  return null
}

/**
 * The live build. The panel seeds the app and then stands back: NeoStation owns its own tabs,
 * routes and overlays from there.
 */
export function NeoStationInteractive({ device }: { device: DeviceSlug }) {
  const [subsets, setSubsets] = useState<NeoSubsets>(DEFAULT_SUBSETS)
  const onAction = useCallback(
    (action: string) => setSubsets((prev) => applyChromeAction(prev, action, device)),
    [device],
  )
  const def = NEOSTATION_SCREENS.find((s) => s.slug === subsets.screen) ?? NEOSTATION_SCREENS[0]!

  const groups: SubsetGroup[] = [
    {
      title: 'Start from',
      keys: '[ ]',
      current: subsets.screen,
      options: screensFor(device).map((s) => ({
        value: s.slug,
        label: s.title,
      })),
      onSelect: (value) => setSubsets(withScreen(value)),
    },
    {
      title: 'Colour theme',
      keys: ', .',
      current: subsets.theme,
      options: THEME_IDS.map((id) => ({
        value: id,
        label: paletteOf(id).name,
      })),
      onSelect: (value) => setSubsets((p) => ({ ...p, theme: value as ThemeId })),
    },
    {
      title: 'Systems view',
      keys: '- =',
      current: subsets.view,
      options: [
        { value: 'grid', label: 'Grid' },
        { value: 'carousel', label: 'Carousel' },
      ],
      onSelect: (value) => setSubsets((p) => ({ ...p, view: value as 'grid' | 'carousel' })),
    },
    {
      title: 'Card size',
      keys: '/',
      current: subsets.size,
      options: CARD_SIZES.map((s) => ({ value: s, label: s })),
      onSelect: (value) => setSubsets((p) => ({ ...p, size: value as CardSize })),
    },
  ]

  return (
    <>
      <DeviceFrame device={device}>
        <ChromeKeys onAction={onAction} />
        <NeoStation
          key={`${subsets.screen}:${subsets.theme}:${subsets.view}:${subsets.size}`}
          {...def.seed}
          theme={subsets.theme}
          view={subsets.view}
          size={subsets.size}
        />
      </DeviceFrame>
      <SubsetPanel groups={groups} />
    </>
  )
}
