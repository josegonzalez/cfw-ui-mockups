import { useCallback, useState } from 'react'
import { DeviceFrame } from '../../device/DeviceFrame'
import { useChromeKeys } from '../../input/InputProvider'
import { SubsetPanel, type SubsetGroup } from '../../gallery/SubsetPanel'
import { PlayStationX } from '.'
import { SECONDARY_COLORS, type ColorSet, type SecondaryColor } from './palette'
import { SYSTEMS } from './library'
import type { DeviceSlug } from '../../device/devices'
import type { PsxView } from './layout'

export const VIEWS: readonly PsxView[] = [
  'system',
  'ps4Style',
  'ps5Style',
  'detailed',
  'grid',
  'carousel',
  'fullGrid',
  'single',
  'mediaTester',
  'splash',
  'gamesplash',
]

export const VIEW_LABEL: Record<PsxView, string> = {
  system: 'System',
  ps4Style: 'PS4 Style',
  ps5Style: 'PS5 Style',
  detailed: 'Detailed',
  grid: 'Grid',
  carousel: 'Horizontal Carousel',
  fullGrid: 'Full Grid',
  single: 'Game by game',
  mediaTester: 'Media tester',
  splash: 'Boot splash',
  gamesplash: 'Game launch',
}

const COLORSETS: readonly ColorSet[] = ['blue', 'black']
const CAROUSEL_TYPES = ['PS5', 'PS4', 'PS3'] as const
const CAROUSEL_SIZES = ['big', 'medium', 'small'] as const
const TOP_INFOS = ['default', 'no-numbers', 'clean'] as const
const SYSTEM_IDS: readonly string[] = SYSTEMS.map((s) => s.theme)

function step<T>(values: readonly T[], current: T, by: number): T {
  const index = values.indexOf(current)
  return values[(index + by + values.length) % values.length]!
}

export interface PsxSubsets {
  readonly view: PsxView
  readonly system: string
  readonly colorset: ColorSet
  readonly secondary: SecondaryColor
  readonly carouselType: (typeof CAROUSEL_TYPES)[number]
  readonly carousel: (typeof CAROUSEL_SIZES)[number]
  readonly topInfo: (typeof TOP_INFOS)[number]
  readonly animate: boolean
}

export const DEFAULT_SUBSETS: PsxSubsets = {
  view: 'ps4Style',
  system: 'psx',
  colorset: 'blue',
  secondary: 'default',
  carouselType: 'PS4',
  carousel: 'medium',
  topInfo: 'default',
  animate: true,
}

/**
 * Apply one mockup-only subset key. Exported so a test can drive it without a keyboard.
 *
 * The original split these into three update classes - colour-only, geometry, and animations -
 * because a rebuild would have thrown away the cursor and every running animation. React makes
 * that distinction unnecessary: a colour change re-renders with the same component identity, so
 * the cursor and the storyboards survive on their own. The classes are gone; the behaviour they
 * were protecting is not.
 */
export function applyChromeAction(prev: PsxSubsets, action: string): PsxSubsets {
  switch (action) {
    case 'prevView':
      return { ...prev, view: step(VIEWS, prev.view, -1) }
    case 'nextView':
      return { ...prev, view: step(VIEWS, prev.view, 1) }
    case 'prevSubsetA':
      return { ...prev, carouselType: step(CAROUSEL_TYPES, prev.carouselType, -1) }
    case 'nextSubsetA':
      return { ...prev, carouselType: step(CAROUSEL_TYPES, prev.carouselType, 1) }
    case 'prevSubsetB':
      return { ...prev, carousel: step(CAROUSEL_SIZES, prev.carousel, -1) }
    case 'nextSubsetB':
      return { ...prev, carousel: step(CAROUSEL_SIZES, prev.carousel, 1) }
    case 'toggleStyle':
      return { ...prev, colorset: step(COLORSETS, prev.colorset, 1) }
    case 'cycleSystem':
      return { ...prev, system: step(SYSTEM_IDS, prev.system, 1) }
    case 'cycleSecondary':
      return { ...prev, secondary: step(SECONDARY_COLORS, prev.secondary, 1) }
    case 'toggleAnimations':
      return { ...prev, animate: !prev.animate }
    default:
      return prev
  }
}

function ChromeKeys({ onAction }: { onAction: (action: string) => void }) {
  useChromeKeys(useCallback((action) => onAction(action), [onAction]))
  return null
}

export interface PlayStationXInteractiveProps {
  readonly device: DeviceSlug
}

/**
 * The live build, with its eight subsets on the mockup's own keys and on a panel below.
 *
 * Keys, matching the original: `[` `]` view, `,` `.` carousel type, `\` colorset, `-` `=`
 * carousel size, `;` animations, `/` system, `'` accent. Top info has no key - it never had one
 * in the original either - and is cycled from the panel.
 */
export function PlayStationXInteractive({ device }: PlayStationXInteractiveProps) {
  const [subsets, setSubsets] = useState<PsxSubsets>(DEFAULT_SUBSETS)

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
      onSelect: (value) => setSubsets((prev) => ({ ...prev, view: value as PsxView })),
    },
    {
      title: 'System',
      keys: '/',
      current: subsets.system,
      options: SYSTEM_IDS.map((id) => ({ value: id, label: id })),
      onSelect: (value) => setSubsets((prev) => ({ ...prev, system: value })),
    },
    {
      title: 'Colorset',
      keys: '\\',
      current: subsets.colorset,
      options: COLORSETS.map((id) => ({ value: id, label: id })),
      onSelect: (value) => setSubsets((prev) => ({ ...prev, colorset: value as ColorSet })),
    },
    {
      title: 'Accent',
      keys: "'",
      current: subsets.secondary,
      options: SECONDARY_COLORS.map((id) => ({ value: id, label: id })),
      onSelect: (value) => setSubsets((prev) => ({ ...prev, secondary: value as SecondaryColor })),
    },
    {
      title: 'Carousel',
      keys: ', .',
      current: subsets.carouselType,
      options: CAROUSEL_TYPES.map((id) => ({ value: id, label: id })),
      onSelect: (value) =>
        setSubsets((prev) => ({ ...prev, carouselType: value as PsxSubsets['carouselType'] })),
    },
    {
      title: 'Size',
      keys: '- =',
      current: subsets.carousel,
      options: CAROUSEL_SIZES.map((id) => ({ value: id, label: id })),
      onSelect: (value) =>
        setSubsets((prev) => ({ ...prev, carousel: value as PsxSubsets['carousel'] })),
    },
    {
      title: 'Top info',
      current: subsets.topInfo,
      options: TOP_INFOS.map((id) => ({ value: id, label: id })),
      onSelect: (value) =>
        setSubsets((prev) => ({ ...prev, topInfo: value as PsxSubsets['topInfo'] })),
    },
    {
      title: 'Animations',
      keys: ';',
      current: subsets.animate ? 'on' : 'off',
      options: [
        { value: 'on', label: 'On' },
        { value: 'off', label: 'Off' },
      ],
      onSelect: (value) => setSubsets((prev) => ({ ...prev, animate: value === 'on' })),
    },
  ]

  const { animate, ...themeProps } = subsets

  return (
    <>
      <DeviceFrame device={device} animate={animate}>
        <ChromeKeys onAction={onAction} />
        <PlayStationX {...themeProps} />
      </DeviceFrame>
      <SubsetPanel groups={groups} />
    </>
  )
}
