import { useCallback, useState } from 'react'
import { DeviceFrame } from '../../device/DeviceFrame'
import { useChromeKeys } from '../../input/InputProvider'
import { SubsetPanel, type SubsetGroup } from '../../gallery/SubsetPanel'
import { Elementerial, type ElementerialView } from '.'
import { SCHEME_IDS } from './palette'
import { SYSTEMS } from './library'
import type { DeviceSlug } from '../../device/devices'
import type { FontSize, GridDirection } from './layout'
import type { SchemeStyle } from './palette'

export const VIEWS: readonly ElementerialView[] = [
  'system',
  'basic',
  'detailed',
  'video',
  'grid',
  'boxes',
  'elementflix',
  'menu',
]

export const VIEW_LABEL: Record<ElementerialView, string> = {
  system: 'System',
  basic: 'Basic',
  detailed: 'Detailed',
  video: 'Video',
  grid: 'Grid',
  boxes: 'Boxes',
  elementflix: 'Elementflix',
  menu: 'Menu',
}

const FONT_SIZES: readonly FontSize[] = ['small', 'medium', 'large']
const SYSTEM_IDS: readonly string[] = SYSTEMS.map((s) => s.theme)

function step<T>(values: readonly T[], current: T, by: number): T {
  const index = values.indexOf(current)
  return values[(index + by + values.length) % values.length]!
}

export interface ElementerialSubsets {
  readonly view: ElementerialView
  readonly scheme: string
  readonly style: SchemeStyle
  readonly fontSize: FontSize
  readonly gridDirection: GridDirection
  readonly system: string
  /** The last view that was not the menu, which the menu draws over. */
  readonly behind: Exclude<ElementerialView, 'menu'>
}

export const DEFAULT_SUBSETS: ElementerialSubsets = {
  view: 'system',
  scheme: 'strawberry',
  style: 'dark',
  fontSize: 'medium',
  gridDirection: 'horizontal',
  system: 'gba',
  behind: 'system',
}

/** Move to a view, remembering what the menu would be drawn over. */
function toView(prev: ElementerialSubsets, view: ElementerialView): ElementerialSubsets {
  return { ...prev, view, ...(view === 'menu' ? {} : { behind: view }) }
}

/** Apply one mockup-only subset key. Exported so a test can drive it without a keyboard. */
export function applyChromeAction(
  prev: ElementerialSubsets,
  action: string,
): ElementerialSubsets {
  switch (action) {
    case 'prevView':
      return toView(prev, step(VIEWS, prev.view, -1))
    case 'nextView':
      return toView(prev, step(VIEWS, prev.view, 1))
    case 'prevSubsetA':
      return { ...prev, scheme: step(SCHEME_IDS, prev.scheme, -1) }
    case 'nextSubsetA':
      return { ...prev, scheme: step(SCHEME_IDS, prev.scheme, 1) }
    case 'prevSubsetB':
      return { ...prev, fontSize: step(FONT_SIZES, prev.fontSize, -1) }
    case 'nextSubsetB':
      return { ...prev, fontSize: step(FONT_SIZES, prev.fontSize, 1) }
    case 'toggleStyle':
      return { ...prev, style: prev.style === 'dark' ? 'light' : 'dark' }
    case 'cycleSystem':
      return { ...prev, system: step(SYSTEM_IDS, prev.system, 1) }
    case 'cycleSecondary':
      return {
        ...prev,
        gridDirection: prev.gridDirection === 'horizontal' ? 'vertical' : 'horizontal',
      }
    default:
      return prev
  }
}

/** Bridges the mockup-only keys to the subset state. Must sit inside the frame's input provider. */
function ChromeKeys({ onAction }: { onAction: (action: string) => void }) {
  useChromeKeys(useCallback((action) => onAction(action), [onAction]))
  return null
}

export interface ElementerialInteractiveProps {
  readonly device: DeviceSlug
}

/**
 * The live build, with its subsets on the mockup's own keys and on a panel below the device.
 *
 * The theme itself knows nothing about these. A firmware has no way to cycle its colour scheme
 * with a bracket key; that binding exists so the mockup can show fourteen schemes without
 * fourteen pages. Keeping the state out here rather than inside `Elementerial` is what keeps the
 * theme's own props the same set a static screen passes - which is what makes a static screen
 * the live build with motion settled, rather than a second implementation.
 *
 * Keys, matching the original: `[` `]` view, `,` `.` scheme, `\` dark/light, `-` `=` font size,
 * `/` system, `'` grid direction.
 */
export function ElementerialInteractive({ device }: ElementerialInteractiveProps) {
  const [subsets, setSubsets] = useState<ElementerialSubsets>(DEFAULT_SUBSETS)

  const onAction = useCallback(
    (action: string) => setSubsets((prev) => applyChromeAction(prev, action)),
    [],
  )

  const groups: SubsetGroup[] = [
    {
      title: 'View',
      keys: '[ ]',
      current: subsets.view,
      options: VIEWS.map((view) => ({ value: view, label: VIEW_LABEL[view] })),
      onSelect: (value) => setSubsets((prev) => toView(prev, value as ElementerialView)),
    },
    {
      title: 'Color Scheme',
      keys: ', .',
      current: subsets.scheme,
      options: SCHEME_IDS.map((id) => ({ value: id, label: id })),
      onSelect: (value) => setSubsets((prev) => ({ ...prev, scheme: value })),
    },
    {
      title: 'Style',
      keys: '\\',
      current: subsets.style,
      options: [
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' },
      ],
      onSelect: (value) => setSubsets((prev) => ({ ...prev, style: value as SchemeStyle })),
    },
    {
      title: 'Font size',
      keys: '- =',
      current: subsets.fontSize,
      options: FONT_SIZES.map((size) => ({ value: size, label: size })),
      onSelect: (value) => setSubsets((prev) => ({ ...prev, fontSize: value as FontSize })),
    },
    {
      title: 'Grid direction',
      keys: "'",
      current: subsets.gridDirection,
      options: [
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' },
      ],
      onSelect: (value) =>
        setSubsets((prev) => ({ ...prev, gridDirection: value as GridDirection })),
    },
    {
      title: 'System',
      keys: '/',
      current: subsets.system,
      options: SYSTEM_IDS.map((id) => ({ value: id, label: id })),
      onSelect: (value) => setSubsets((prev) => ({ ...prev, system: value })),
    },
  ]

  return (
    <>
      <DeviceFrame device={device}>
        <ChromeKeys onAction={onAction} />
        <Elementerial {...subsets} />
      </DeviceFrame>
      <SubsetPanel groups={groups} />
    </>
  )
}
