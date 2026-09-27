import { useCallback, useState } from 'react'
import { DeviceFrame } from '../../device/DeviceFrame'
import type { DeviceSlug } from '../../device/devices'
import { useChromeKeys } from '../../input/InputProvider'
import { SubsetPanel, type SubsetGroup } from '../../gallery/SubsetPanel'
import { SimpleOs } from '.'
import { VIEWS, type View } from './library'

export interface SimpleOsSubsets {
  readonly view: View
  readonly toast: boolean
}

/** The live build opens where the device does: on the boot splash. */
export const DEFAULT_SUBSETS: SimpleOsSubsets = { view: 'boot', toast: false }

function step<T>(values: readonly T[], current: T, by: number): T {
  const i = values.indexOf(current)
  return values[(i + by + values.length) % values.length]!
}

/**
 * Apply one mockup-only key.
 *
 * SimpleOS has no palettes and no layout options, so there is little to switch: which screen to
 * start from, and whether the unlock banner is up - the one screen a player cannot reach by
 * pressing buttons, because nothing in a mockup earns an achievement.
 */
export function applyChromeAction(prev: SimpleOsSubsets, action: string): SimpleOsSubsets {
  const slugs = VIEWS.map((v) => v.slug)
  switch (action) {
    case 'prevView':
      return { ...prev, view: step(slugs, prev.view, -1) }
    case 'nextView':
      return { ...prev, view: step(slugs, prev.view, 1) }
    case 'toggleStyle':
      return { ...prev, toast: !prev.toast }
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
 * The panel seeds the screen and then stands back: from there SimpleOS owns its own back stack,
 * so A on a tile plays it, MENU in the game opens the menu, and B walks back the way you came.
 *
 * Keys: `[` `]` starting screen, `\` the unlock banner.
 */
export function SimpleOsInteractive({ device }: { device: DeviceSlug }) {
  const [subsets, setSubsets] = useState<SimpleOsSubsets>(DEFAULT_SUBSETS)

  const onAction = useCallback(
    (action: string) => setSubsets((prev) => applyChromeAction(prev, action)),
    [],
  )

  const groups: SubsetGroup[] = [
    {
      title: 'Start from',
      keys: '[ ]',
      current: subsets.view,
      options: VIEWS.map((v) => ({ value: v.slug, label: v.label })),
      onSelect: (value) => setSubsets((p) => ({ ...p, view: value as View })),
    },
    {
      title: 'Achievement banner',
      keys: '\\',
      current: subsets.toast ? 'on' : 'off',
      options: [
        { value: 'off', label: 'Off' },
        { value: 'on', label: 'On' },
      ],
      onSelect: (value) => setSubsets((p) => ({ ...p, toast: value === 'on' })),
    },
  ]

  return (
    <>
      <DeviceFrame device={device}>
        <ChromeKeys onAction={onAction} />
        <SimpleOs key={subsets.view} view={subsets.view} toast={subsets.toast} />
      </DeviceFrame>
      <SubsetPanel groups={groups} />
    </>
  )
}
