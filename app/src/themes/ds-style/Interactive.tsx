import { useCallback, useState } from 'react'
import { DeviceFrame } from '../../device/DeviceFrame'
import type { DeviceSlug } from '../../device/devices'
import { useChromeKeys } from '../../input/InputProvider'
import { SubsetPanel, type SubsetGroup } from '../../gallery/SubsetPanel'
import { DsStyle } from '.'
import { VIEW_NAMES, initialState } from './machine'
import { DS_STYLE_SCREENS } from './manifest'
import { THEMES } from './palette'

export interface DsSubsets {
  /** Which still the live build starts from. */
  readonly screen: string
  readonly colour: number
  readonly dark: boolean
  readonly view: number
  readonly lcd: boolean
}

/** A still's own preferences, after its events: what the panel shows when starting from it. */
function withScreen(slug: string): DsSubsets {
  const def = DS_STYLE_SCREENS.find((s) => s.slug === slug) ?? DS_STYLE_SCREENS[0]!
  const p = initialState(def.seed).prefs
  return { screen: def.slug, colour: p.colour, dark: p.dark, view: p.viewmode, lcd: p.lcd }
}

/**
 * The live build opens on Home at the source's defaults - Pale Blue, light, Horizontal, no grid -
 * which is the `home` still `settle.spec.ts` compares it with.
 */
export const DEFAULT_SUBSETS: DsSubsets = withScreen('home')

const step = (i: number, n: number, by: number) => (i + by + n) % n

/**
 * One mockup-only key. The colour, dark mode, view and LCD grid are all DS Style's own settings -
 * Settings changes them too; these only pick the start.
 */
export function applyChromeAction(prev: DsSubsets, action: string): DsSubsets {
  const slugs = DS_STYLE_SCREENS.map((s) => s.slug)
  const at = slugs.indexOf(prev.screen)
  switch (action) {
    case 'prevView':
      return withScreen(slugs[step(at, slugs.length, -1)]!)
    case 'nextView':
      return withScreen(slugs[step(at, slugs.length, 1)]!)
    case 'prevSubsetA':
      return { ...prev, colour: step(prev.colour, THEMES.length, -1) }
    case 'nextSubsetA':
      return { ...prev, colour: step(prev.colour, THEMES.length, 1) }
    case 'prevSubsetB':
      return { ...prev, view: step(prev.view, 4, -1) }
    case 'nextSubsetB':
      return { ...prev, view: step(prev.view, 4, 1) }
    case 'cycleSystem':
      return { ...prev, dark: !prev.dark }
    case 'cycleSecondary':
      return { ...prev, lcd: !prev.lcd }
    default:
      return prev
  }
}

function ChromeKeys({ onAction }: { onAction: (action: string) => void }) {
  useChromeKeys(useCallback((action) => onAction(action), [onAction]))
  return null
}

/** The live build. The panel seeds the launcher and then stands back. */
export function DsStyleInteractive({ device }: { device: DeviceSlug }) {
  const [subsets, setSubsets] = useState<DsSubsets>(DEFAULT_SUBSETS)
  const onAction = useCallback((action: string) => setSubsets((prev) => applyChromeAction(prev, action)), [])
  const def = DS_STYLE_SCREENS.find((s) => s.slug === subsets.screen) ?? DS_STYLE_SCREENS[0]!
  const onOff = [
    { value: 'off', label: 'Off' },
    { value: 'on', label: 'On' },
  ]

  const groups: SubsetGroup[] = [
    {
      title: 'Start from',
      keys: '[ ]',
      current: subsets.screen,
      options: DS_STYLE_SCREENS.map((s) => ({ value: s.slug, label: s.title })),
      onSelect: (value) => setSubsets(withScreen(value)),
    },
    {
      title: 'Colour',
      keys: ', .',
      current: String(subsets.colour),
      options: THEMES.map((t, i) => ({ value: String(i), label: t.name })),
      onSelect: (value) => setSubsets((p) => ({ ...p, colour: Number(value) })),
    },
    {
      title: 'View',
      keys: '- =',
      current: String(subsets.view),
      options: VIEW_NAMES.map((name, i) => ({ value: String(i), label: name })),
      onSelect: (value) => setSubsets((p) => ({ ...p, view: Number(value) })),
    },
    {
      title: 'Dark mode',
      keys: '/',
      current: subsets.dark ? 'on' : 'off',
      options: onOff,
      onSelect: (value) => setSubsets((p) => ({ ...p, dark: value === 'on' })),
    },
    {
      title: 'LCD grid',
      keys: "'",
      current: subsets.lcd ? 'on' : 'off',
      options: onOff,
      onSelect: (value) => setSubsets((p) => ({ ...p, lcd: value === 'on' })),
    },
  ]

  return (
    <>
      <DeviceFrame device={device}>
        <ChromeKeys onAction={onAction} />
        <DsStyle
          key={`${subsets.screen}:${subsets.colour}:${subsets.view}:${subsets.dark}:${subsets.lcd}`}
          {...def.seed}
          then={{ colour: subsets.colour, dark: subsets.dark, viewmode: subsets.view, lcd: subsets.lcd }}
        />
      </DeviceFrame>
      <SubsetPanel groups={groups} />
    </>
  )
}
