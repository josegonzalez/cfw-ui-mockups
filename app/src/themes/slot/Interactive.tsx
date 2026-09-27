import { useCallback, useState } from 'react'
import { DeviceFrame } from '../../device/DeviceFrame'
import { useChromeKeys } from '../../input/InputProvider'
import { SubsetPanel, type SubsetGroup } from '../../gallery/SubsetPanel'
import { Slot } from '.'
import { VIEWS, type HudKind } from './library'
import { SHELF_SELECTED } from './manifest'
import type { DeviceSlug } from '../../device/devices'

const HUDS: readonly (HudKind | 'none')[] = ['none', 'volume', 'brightness', 'blueLight', 'rewind']

export interface SlotSubsets {
  readonly view: string
  readonly hud: HudKind | 'none'
  readonly wallpaper: boolean
}

export const DEFAULT_SUBSETS: SlotSubsets = { view: 'shelf', hud: 'none', wallpaper: false }

function step<T>(values: readonly T[], current: T, by: number): T {
  const i = values.indexOf(current)
  return values[(i + by + values.length) % values.length]!
}

/**
 * Apply one mockup-only key.
 *
 * Thin, because slot has almost nothing to switch: no palette, no colour schemes, no layout
 * options. What is worth posing is which phase is up and whether a wallpaper is on the card.
 */
export function applyChromeAction(prev: SlotSubsets, action: string): SlotSubsets {
  const slugs = VIEWS.map((v) => v.slug)
  switch (action) {
    case 'prevView':
      return { ...prev, view: step(slugs, prev.view, -1) }
    case 'nextView':
      return { ...prev, view: step(slugs, prev.view, 1) }
    case 'prevSubsetA':
      return { ...prev, hud: step(HUDS, prev.hud, -1) }
    case 'nextSubsetA':
      return { ...prev, hud: step(HUDS, prev.hud, 1) }
    case 'toggleStyle':
      return { ...prev, wallpaper: !prev.wallpaper }
    default:
      return prev
  }
}

function ChromeKeys({ onAction }: { onAction: (action: string) => void }) {
  useChromeKeys(useCallback((action) => onAction(action), [onAction]))
  return null
}

export interface SlotInteractiveProps {
  readonly device: DeviceSlug
}

/**
 * The live build.
 *
 * `Q` and `W` are the shoulders, which is what slot binds to browse the shelf - and the spring is
 * the whole reason to press them: a single press eases in, and two quickly carry velocity into the
 * second so the row keeps moving. That is not reproducible from a still.
 *
 * Keys: `[` `]` phase, `,` `.` the HUD control, `\` wallpaper.
 */
export function SlotInteractive({ device }: SlotInteractiveProps) {
  const [subsets, setSubsets] = useState<SlotSubsets>(DEFAULT_SUBSETS)

  const onAction = useCallback(
    (action: string) => setSubsets((prev) => applyChromeAction(prev, action)),
    [],
  )

  const groups: SubsetGroup[] = [
    {
      title: 'Phase',
      keys: '[ ]',
      current: subsets.view,
      options: VIEWS.map((v) => ({ value: v.slug, label: v.label })),
      onSelect: (value) => setSubsets((p) => ({ ...p, view: value })),
    },
    {
      title: 'HUD',
      keys: ', .',
      current: subsets.hud,
      options: HUDS.map((h) => ({ value: h, label: h })),
      onSelect: (value) => setSubsets((p) => ({ ...p, hud: value as HudKind | 'none' })),
    },
    {
      title: 'Wallpaper',
      keys: '\\',
      current: subsets.wallpaper ? 'on' : 'off',
      options: [
        { value: 'off', label: 'None' },
        { value: 'on', label: 'bg.png' },
      ],
      onSelect: (value) => setSubsets((p) => ({ ...p, wallpaper: value === 'on' })),
    },
  ]

  return (
    <>
      <DeviceFrame device={device}>
        <ChromeKeys onAction={onAction} />
        <Slot
          key={`${subsets.view}|${subsets.wallpaper}`}
          view={subsets.view}
          selected={SHELF_SELECTED}
          hud={subsets.hud === 'none' ? null : subsets.hud}
          wallpaper={subsets.wallpaper}
        />
      </DeviceFrame>
      <SubsetPanel groups={groups} />
    </>
  )
}
